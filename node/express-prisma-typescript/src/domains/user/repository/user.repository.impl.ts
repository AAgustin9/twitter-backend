import { SignupInputDTO } from '@domains/auth/dto'
import { PrismaClient, User } from '@prisma/client'
import { OffsetPagination } from '@types'
import { getPublicImageUrl } from '@utils'
import { ExtendedUserDTO, UserDTO } from '../dto'
import { UserRepository } from './user.repository'

// Define a type that includes our custom profileImageKey field
type UserWithProfileImage = User & {
  profileImageKey?: string | null;
}

export class UserRepositoryImpl implements UserRepository {
  constructor (private readonly db: PrismaClient) {}

  async create (data: SignupInputDTO): Promise<UserDTO> {
    const user = await this.db.user.create({
      data
    }) as UserWithProfileImage
    
    // Create UserDTO with the profile image URL
    const userDTO = new UserDTO(user)
    userDTO.profileImageUrl = user.profileImageKey ? getPublicImageUrl(user.profileImageKey) : null
    return userDTO
  }

  async getById (userId: any): Promise<UserDTO | null> {
    const user = await this.db.user.findUnique({
      where: {
        id: userId
      }
    }) as UserWithProfileImage | null
    
    if (!user) return null
    
    // Create UserDTO with the profile image URL
    const userDTO = new UserDTO(user)
    userDTO.profileImageUrl = user.profileImageKey ? getPublicImageUrl(user.profileImageKey) : null
    return userDTO
  }

  async delete (userId: any): Promise<void> {
    await this.db.user.delete({
      where: {
        id: userId
      }
    })
  }

  async getRecommendedUsersPaginated (options: OffsetPagination): Promise<UserDTO[]> {
    const users = await this.db.user.findMany({
      take: options.limit ? options.limit : undefined,
      skip: options.skip ? options.skip : undefined,
      orderBy: [
        {
          id: 'asc'
        }
      ]
    }) as UserWithProfileImage[]
    
    // Map to UserDTO with profile image URLs
    return users.map(user => {
      const userDTO = new UserDTO(user)
      userDTO.profileImageUrl = user.profileImageKey ? getPublicImageUrl(user.profileImageKey) : null
      return userDTO
    })
  }

  async getByEmailOrUsername (email?: string, username?: string): Promise<ExtendedUserDTO | null> {
    const user = await this.db.user.findFirst({
      where: {
        OR: [
          {
            email
          },
          {
            username
          }
        ]
      }
    }) as UserWithProfileImage | null
    
    if (!user) return null
    
    // Create ExtendedUserDTO with the profile image URL
    const extendedUserDTO = new ExtendedUserDTO(user)
    extendedUserDTO.profileImageUrl = user.profileImageKey ? getPublicImageUrl(user.profileImageKey) : null
    return extendedUserDTO
  }
  
  async updateProfileImage(userId: string, profileImageKey: string): Promise<UserDTO> {
    // Use any type to work around the type checking for now
    const updateData: any = { profileImageKey };
    
    const user = await this.db.user.update({
      where: {
        id: userId
      },
      data: updateData
    }) as UserWithProfileImage
    
    // Create UserDTO with the profile image URL
    const userDTO = new UserDTO(user)
    userDTO.profileImageUrl = getPublicImageUrl(profileImageKey)
    return userDTO
  }
}
