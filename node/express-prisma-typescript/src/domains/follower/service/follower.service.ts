import { FollowerRepository } from '../repository'

export interface FollowerService {
  followUser(userId: string, targetUserId: string): Promise<void>
  unfollowUser(userId: string, targetUserId: string): Promise<void>
  isFollowing(userId: string, targetUserId: string): Promise<boolean>
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
} 