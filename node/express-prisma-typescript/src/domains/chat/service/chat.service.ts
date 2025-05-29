import { PrismaClient, Message, User } from '@prisma/client'
import { EncryptionService } from '../../../utils/encryption'

const prisma = new PrismaClient()

export class ChatService {
  /**
   * Check if two users can chat (they follow each other)
   */
  static async canUsersChat(userId1: string, userId2: string): Promise<boolean> {
    const follows = await prisma.follow.findMany({
      where: {
        AND: [
          {
            OR: [
              { followerId: userId1, followedId: userId2 },
              { followerId: userId2, followedId: userId1 }
            ]
          },
          { deletedAt: null }
        ]
      }
    })

    return follows.length === 2 // Both users follow each other
  }

  /**
   * Get chat history between two users
   */
  static async getChatHistory(userId1: string, userId2: string): Promise<Message[]> {
    return prisma.message.findMany({
      where: {
        AND: [
          {
            OR: [
              { AND: [{ senderId: userId1 }, { receiverId: userId2 }] },
              { AND: [{ senderId: userId2 }, { receiverId: userId1 }] }
            ]
          },
          { deletedAt: null }
        ]
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
  }

  /**
   * Store an encrypted message
   */
  static async storeMessage(
    senderId: string,
    receiverId: string,
    encryptedContent: string
  ): Promise<Message> {
    return prisma.message.create({
      data: {
        senderId,
        receiverId,
        content: encryptedContent
      }
    })
  }

  /**
   * Get user's public key
   */
  static async getUserPublicKey(userId: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { publicKey: true }
    })
    return user?.publicKey || null
  }

  /**
   * Get user's encrypted private key
   */
  static async getUserPrivateKey(userId: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { privateKey: true }
    })
    return user?.privateKey || null
  }

  /**
   * Store user's encryption keys
   */
  static async storeUserKeys(userId: string, publicKey: string, encryptedPrivateKey: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        publicKey,
        privateKey: encryptedPrivateKey
      }
    })
  }
} 