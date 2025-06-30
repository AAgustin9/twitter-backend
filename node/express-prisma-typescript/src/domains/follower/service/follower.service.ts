import { FollowerRepository } from '../repository'
import { User } from '@prisma/client'

export interface FollowerService {
  followUser(userId: string, targetUserId: string): Promise<void>
  unfollowUser(userId: string, targetUserId: string): Promise<void>
  isFollowing(userId: string, targetUserId: string): Promise<boolean>
  getFollowing(userId: string): Promise<User[]>
}

export class FollowerServiceImpl implements FollowerService {
  constructor(private repository: FollowerRepository) {}

  async followUser(userId: string, targetUserId: string): Promise<void> {
    return this.repository.createFollow(userId, targetUserId)
  }

  async unfollowUser(userId: string, targetUserId: string): Promise<void> {
    return this.repository.deleteFollow(userId, targetUserId)
  }

  async isFollowing(userId: string, targetUserId: string): Promise<boolean> {
    return this.repository.isFollowing(userId, targetUserId)
  }

  async getFollowing(userId: string): Promise<User[]> {
    return this.repository.findFollowing(userId)
  }
} 