import { OffsetPagination } from '@types'
import { UserDTO, UserViewDTO } from '../dto'

export interface UserService {
  deleteUser: (userId: any) => Promise<void>
  getUser: (userId: any) => Promise<UserViewDTO>
  getUserRecommendations: (userId: any, options: OffsetPagination) => Promise<UserViewDTO[]>
  
  // Image operations
  getProfileImageUploadUrl: (userId: string, contentType: string) => Promise<{ uploadUrl: string, profileImageUrl: string }>
  updateProfileImage: (userId: string, imageKey: string) => Promise<UserViewDTO>
}
