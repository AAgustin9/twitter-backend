import { PrismaClient } from '@prisma/client'
import { ReactionType } from '../dto'
import { ReactionRepository } from './reaction.repository'

export class ReactionRepositoryImpl implements ReactionRepository {
  private db: PrismaClient

  constructor(db: PrismaClient) {
    this.db = db
  }

  async create(postId: string, userId: string, type: ReactionType) {
    return this.db.reaction.create({
      data: {
        postId,
        userId,
        type,
      },
    })
  }

  async delete(postId: string, userId: string, type: ReactionType) {
    return this.db.reaction.deleteMany({
      where: {
        postId,
        userId,
        type,
      },
    })
  }

  async findByPostId(postId: string) {
    return this.db.reaction.findMany({
      where: {
        postId,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    })
  }

  async findByUserAndPost(userId: string, postId: string, type: ReactionType) {
    return this.db.reaction.findFirst({
      where: {
        userId,
        postId,
        type,
        deletedAt: null,
      },
    })
  }

  async findByUserIdAndType(userId: string, type: ReactionType) {
    return this.db.reaction.findMany({
      where: {
        userId,
        type,
        deletedAt: null,
      },
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }
} 