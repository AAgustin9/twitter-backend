import { OffsetPagination } from '@types'
import { UserDTO } from '../dto'

export interface UserService {
  deleteUser: (userId: any) => Promise<void>
  getUser: (userId: any) => Promise<UserDTO>
  getUserRecommendations: (userId: any, options: OffsetPagination) => Promise<UserDTO[]>
  
  // Image operations
  getProfileImageUploadUrl: (userId: string, contentType: string) => Promise<{ uploadUrl: string, profileImageUrl: string }>
  updateProfileImage: (userId: string, imageKey: string) => Promise<UserDTO>
}
