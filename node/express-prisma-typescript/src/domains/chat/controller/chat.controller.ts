import { Request, Response } from 'express'
import { ChatService } from '../service/chat.service'
import { EncryptionService } from '../../../utils/encryption'

export class ChatController {
  /**
   * Generate and store encryption keys for a user
   */
  static async generateKeys(req: Request, res: Response) {
    try {
      const { userId } = res.locals.context
      const password = req.body.password

      if (!userId || !password) {
        return res.status(400).json({ message: 'Missing required fields' })
      }

      // Check if keys already exist
      const storedEncryptedPrivateKey = await ChatService.getUserPrivateKey(userId)
      const storedPublicKey = await ChatService.getUserPublicKey(userId)
      if (storedEncryptedPrivateKey && storedPublicKey) {
        try {
          const privateKey = EncryptionService.decryptPrivateKey(storedEncryptedPrivateKey, password)
          return res.status(200).json({ publicKey: storedPublicKey, privateKey })
        } catch (err) {
          return res.status(400).json({ message: 'Invalid password' })
        }
      }

      // Generate new key pair
      const { publicKey, privateKey } = EncryptionService.generateKeyPair()

      // Encrypt private key with user's password
      const encryptedPrivateKey = EncryptionService.encryptPrivateKey(privateKey, password)

      // Store keys in database
      await ChatService.storeUserKeys(userId, publicKey, encryptedPrivateKey)

      // Return keypair to client for decryption
      return res.status(200).json({ publicKey, privateKey })
    } catch (error) {
      console.error('Failed to generate keys:', error)
      return res.status(500).json({ message: 'Failed to generate encryption keys' })
    }
  }

  /**
   * Get chat history with another user
   */
  static async getChatHistory(req: Request, res: Response) {
    try {
      const { userId } = res.locals.context
      const otherUserId = req.params.userId
      const password = req.body.password

      if (!userId || !otherUserId || !password) {
        return res.status(400).json({ message: 'Missing required fields' })
      }

      // Check if users can chat
      const canChat = await ChatService.canUsersChat(userId, otherUserId)
      if (!canChat) {
        return res.status(403).json({ message: 'Users must follow each other to chat' })
      }

      // Get chat history
      const messages = await ChatService.getChatHistory(userId, otherUserId)

      // Get user's encrypted private key
      const encryptedPrivateKey = await ChatService.getUserPrivateKey(userId)
      if (!encryptedPrivateKey) {
        return res.status(400).json({ message: 'No private key found' })
      }

      // Decrypt private key
      const privateKey = EncryptionService.decryptPrivateKey(encryptedPrivateKey, password)

      // Decrypt messages where user is the receiver
      const decryptedMessages = messages.map(message => ({
        ...message,
        content: message.receiverId === userId
          ? EncryptionService.decryptMessage(message.content, privateKey)
          : message.content
      }))

      return res.status(200).json(decryptedMessages)
    } catch (error) {
      console.error('Failed to get chat history:', error)
      return res.status(500).json({ message: 'Failed to get chat history' })
    }
  }
} 