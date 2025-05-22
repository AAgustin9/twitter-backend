import { ReactionType } from '../dto'

export interface ReactionRepository {
  create: (postId: string, userId: string, type: ReactionType) => Promise<any>
  delete: (postId: string, userId: string, type: ReactionType) => Promise<any>
  findByPostId: (postId: string) => Promise<any[]>
  findByUserAndPost: (userId: string, postId: string, type: ReactionType) => Promise<any | null>
  findByUserIdAndType: (userId: string, type: ReactionType) => Promise<any[]>
} 