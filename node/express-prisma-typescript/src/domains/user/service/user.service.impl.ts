import { ImageType, getPublicImageUrl, generatePresignedUploadUrl, generateS3Key } from '@utils'
import { NotFoundException } from '@utils/errors'
import { OffsetPagination } from 'types'
import { UserDTO } from '../dto'
import { UserRepository } from '../repository'
import { UserService } from './user.service'

export class UserServiceImpl implements UserService {
  constructor (private readonly repository: UserRepository) {}

  async getUser (userId: any): Promise<UserDTO> {
    const user = await this.repository.getById(userId)
    if (!user) throw new NotFoundException('user')
    return user
  }

  async getUserRecommendations (userId: any, options: OffsetPagination): Promise<UserDTO[]> {
    // TODO: make this return only users followed by users the original user follows
    return await this.repository.getRecommendedUsersPaginated(options)
  }

  async deleteUser (userId: any): Promise<void> {
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
  
  async updateProfileImage(userId: string, imageKey: string): Promise<UserDTO> {
    // Ensure user exists
    const user = await this.repository.getById(userId)
    if (!user) throw new NotFoundException('user')
    
    // Update the user's profile image
    return await this.repository.updateProfileImage(userId, imageKey)
  }
}
