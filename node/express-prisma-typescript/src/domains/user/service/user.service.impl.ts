import { ImageType, getPublicImageUrl, generatePresignedUploadUrl, generateS3Key } from '@utils'
import { NotFoundException } from '@utils/errors'
import { OffsetPagination } from 'types'
import { UserDTO, UserViewDTO } from '../dto'
import { UserRepository } from '../repository'
import { UserService } from './user.service'
import { FollowerService } from '@domains/follower/service'

export class UserServiceImpl implements UserService {
  constructor (
    private readonly repository: UserRepository,
    private readonly followerService: FollowerService
  ) {}

  async getUser (userId: string, viewerId?: string): Promise<UserViewDTO> {
    const user = await this.repository.getById(userId)
    if (!user) throw new NotFoundException('user')
    
    // If viewerId is provided, check if they follow this user
    let isFollowing = false
    if (viewerId && viewerId !== userId) {
      isFollowing = await this.followerService.isFollowing(viewerId, userId)
    }
    
    const userView = new UserViewDTO({
      ...user,
      isFollowing
    })
    return userView
  }

  async getUserRecommendations (userId: string, options: OffsetPagination): Promise<UserViewDTO[]> {
    // TODO: make this return only users followed by users the original user follows
    const users = await this.repository.getRecommendedUsersPaginated(options)
    
    // Get follow status for each user
    const usersWithFollowStatus = await Promise.all(
      users.map(async (user) => {
        const isFollowing = await this.followerService.isFollowing(userId, user.id)
        return new UserViewDTO({
          ...user,
          isFollowing
        })
      })
    )
    
    return usersWithFollowStatus
  }

  async searchUsersByUsername(username: string, options: OffsetPagination, viewerId?: string): Promise<UserViewDTO[]> {
    const users = await this.repository.searchUsersByUsername(username, options)
    
    // Get follow status for each user if viewerId is provided
    if (viewerId) {
      const usersWithFollowStatus = await Promise.all(
        users.map(async (user) => {
          const isFollowing = viewerId !== user.id ? 
            await this.followerService.isFollowing(viewerId, user.id) : 
            false
          return new UserViewDTO({
            ...user,
            isFollowing
          })
        })
      )
      return usersWithFollowStatus
    }
    
    return users.map(user => new UserViewDTO(user))
  }

  async deleteUser (userId: string): Promise<void> {
    await this.repository.delete(userId)
  }
  
  async getProfileImageUploadUrl(userId: string, contentType: string): Promise<{ uploadUrl: string, profileImageUrl: string }> {
    // Generate a unique key for the image
    const key = generateS3Key(ImageType.PROFILE, userId)
    
    // Get a pre-signed URL for uploading
    const { url: uploadUrl } = await generatePresignedUploadUrl(key, contentType)
    
    // Return both the upload URL and the future public URL
    return {
      uploadUrl,
      profileImageUrl: getPublicImageUrl(key)
    }
  }
  
  async updateProfileImage(userId: string, imageKey: string): Promise<UserViewDTO> {
    const user = await this.repository.updateProfileImage(userId, imageKey)
    return new UserViewDTO(user)
  }
}
