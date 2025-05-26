import { OffsetPagination } from '@types'
import { UserDTO, UserViewDTO } from '../dto'

export interface UserService {
  deleteUser: (userId: string) => Promise<void>
  getUser: (userId: string, viewerId?: string) => Promise<UserViewDTO>
  getUserRecommendations: (userId: string, options: OffsetPagination) => Promise<UserViewDTO[]>
  searchUsersByUsername: (username: string, options: OffsetPagination, viewerId?: string) => Promise<UserViewDTO[]>
  
  // Image operations
  getProfileImageUploadUrl: (userId: string, contentType: string) => Promise<{ uploadUrl: string, profileImageUrl: string }>
  updateProfileImage: (userId: string, imageKey: string) => Promise<UserViewDTO>
}
