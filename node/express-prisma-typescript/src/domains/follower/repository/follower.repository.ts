import { PrismaClient } from '@prisma/client'
import { User } from '@prisma/client'

export interface FollowerRepository {
  createFollow(followerId: string, followedId: string): Promise<void>
  deleteFollow(followerId: string, followedId: string): Promise<void>
  isFollowing(followerId: string, followedId: string): Promise<boolean>
  findFollowing(followerId: string): Promise<User[]>
}

export class FollowerRepositoryImpl implements FollowerRepository {
  constructor(private db: PrismaClient) {}

  async createFollow(followerId: string, followedId: string): Promise<void> {
    await this.db.follow.create({
      data: {
        followerId,
        followedId
      }
    })
  }

  async deleteFollow(followerId: string, followedId: string): Promise<void> {
    await this.db.follow.deleteMany({
      where: {
        followerId,
        followedId
      }
    })
  }

  async isFollowing(followerId: string, followedId: string): Promise<boolean> {
    const follow = await this.db.follow.findFirst({
      where: {
        followerId,
        followedId
      }
    })
    return follow !== null
  }

  async findFollowing(followerId: string): Promise<User[]> {
    const records = await this.db.follow.findMany({
      where: { followerId },
      include: { followed: true }
    })
    return records.map(r => r.followed)
  }
} 