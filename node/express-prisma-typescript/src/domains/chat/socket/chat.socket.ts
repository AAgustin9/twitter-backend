import { Server, Socket } from 'socket.io'
import { Server as HttpServer } from 'http'
import jwt from 'jsonwebtoken'
import { ChatService } from '../service/chat.service'
import { EncryptionService } from '../../../utils/encryption'
import { Constants } from '@utils'

interface AuthenticatedSocket extends Socket {
  userId: string
}

interface ServerToClientEvents {
  error: (error: { message: string }) => void
  chat_history: (history: any[]) => void
  new_message: (message: any) => void
}

interface ClientToServerEvents {
  start_chat: (receiverId: string) => void
  send_message: (data: { receiverId: string; content: string }) => void
}

export class ChatSocket {
  private io: Server<ClientToServerEvents, ServerToClientEvents>

  constructor(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    })

    this.setupMiddleware()
    this.setupEventHandlers()
  }

  private setupMiddleware() {
    this.io.use(async (socket: Socket, next) => {
      try {
        const token = socket.handshake.auth.token
        if (!token) {
          throw new Error('Authentication error')
        }

        const decoded = jwt.verify(token, Constants.TOKEN_SECRET) as { userId: string }
        ;(socket as AuthenticatedSocket).userId = decoded.userId

        next()
      } catch (error) {
        next(new Error('Authentication error'))
      }
    })
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      // Cast to AuthenticatedSocket to access userId
      const authSocket = socket as AuthenticatedSocket;
      console.log(`User connected: ${authSocket.userId}`);

      // Join a private room for the user
      authSocket.join(authSocket.userId);

      authSocket.on('start_chat', async (receiverId: string) => {
        try {
          const canChat = await ChatService.canUsersChat(authSocket.userId, receiverId);
          if (!canChat) {
            authSocket.emit('error', { message: 'Users must follow each other to chat' });
            return;
          }

          const chatHistory = await ChatService.getChatHistory(authSocket.userId, receiverId);
          authSocket.emit('chat_history', chatHistory);
        } catch (error) {
          authSocket.emit('error', { message: 'Failed to start chat' });
        }
      });

      authSocket.on('send_message', async ({ receiverId, content }: { receiverId: string; content: string }) => {
        try {
          // Check if users can chat
          const canChat = await ChatService.canUsersChat(authSocket.userId, receiverId);
          if (!canChat) {
            authSocket.emit('error', { message: 'Users must follow each other to chat' });
            return;
          }

          // Get receiver's public key
          const receiverPublicKey = await ChatService.getUserPublicKey(receiverId);
          if (!receiverPublicKey) {
            authSocket.emit('error', { message: 'Receiver has no public key' });
            return;
          }

          // Encrypt message with receiver's public key
          const encryptedContent = EncryptionService.encryptMessage(content, receiverPublicKey);

          // Store the encrypted message
          const message = await ChatService.storeMessage(authSocket.userId, receiverId, encryptedContent);

          // Send to both sender and receiver
          this.io.to(authSocket.userId).emit('new_message', message);
          this.io.to(receiverId).emit('new_message', message);
        } catch (error) {
          authSocket.emit('error', { message: 'Failed to send message' });
        }
      });

      authSocket.on('disconnect', () => {
        console.log(`User disconnected: ${authSocket.userId}`);
      });
    });
  }
} 