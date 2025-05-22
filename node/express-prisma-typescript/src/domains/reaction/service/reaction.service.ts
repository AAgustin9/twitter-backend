import { ReactionDTO, ReactionType } from '../dto'

export interface ReactionService {
  createReaction: (userId: string, postId: string, type: ReactionType) => Promise<ReactionDTO>
  deleteReaction: (userId: string, postId: string, type: ReactionType) => Promise<void>
  getReactionsByPostId: (postId: string) => Promise<ReactionDTO[]>
  hasUserReacted: (userId: string, postId: string, type: ReactionType) => Promise<boolean>
} 