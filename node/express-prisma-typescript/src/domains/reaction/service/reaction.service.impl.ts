import { ReactionDTO, ReactionType } from '../dto'
import { ReactionRepository } from '../repository'
import { ReactionService } from './reaction.service'

export class ReactionServiceImpl implements ReactionService {
  private repository: ReactionRepository

  constructor(repository: ReactionRepository) {
    this.repository = repository
  }

  async createReaction(userId: string, postId: string, type: ReactionType): Promise<ReactionDTO> {
    // Check if reaction already exists
    const existingReaction = await this.repository.findByUserAndPost(userId, postId, type)
    
    if (existingReaction) {
      throw new Error(`User has already ${type.toLowerCase()}d this post`)
    }

    const reaction = await this.repository.create(postId, userId, type)
    
    return {
      id: reaction.id,
      postId: reaction.postId,
      userId: reaction.userId,
      type: reaction.type as ReactionType,
      createdAt: reaction.createdAt,
      updatedAt: reaction.updatedAt,
    }
  }

  async deleteReaction(userId: string, postId: string, type: ReactionType): Promise<void> {
    // Check if reaction exists
    const existingReaction = await this.repository.findByUserAndPost(userId, postId, type)
    
    if (!existingReaction) {
      throw new Error(`User has not ${type.toLowerCase()}d this post`)
    }

    await this.repository.delete(postId, userId, type)
  }

  async getReactionsByPostId(postId: string): Promise<ReactionDTO[]> {
    const reactions = await this.repository.findByPostId(postId)
    
    return reactions.map(reaction => ({
      id: reaction.id,
      postId: reaction.postId,
      userId: reaction.userId,
      type: reaction.type as ReactionType,
      createdAt: reaction.createdAt,
      updatedAt: reaction.updatedAt,
    }))
  }

  async hasUserReacted(userId: string, postId: string, type: ReactionType): Promise<boolean> {
    const reaction = await this.repository.findByUserAndPost(userId, postId, type)
    return !!reaction
  }
  
  async getUserLikes(userId: string): Promise<ReactionDTO[]> {
    const reactions = await this.repository.findByUserIdAndType(userId, ReactionType.LIKE)
    
    return reactions.map(reaction => ({
      id: reaction.id,
      postId: reaction.postId,
      userId: reaction.userId,
      type: reaction.type as ReactionType,
      createdAt: reaction.createdAt,
      updatedAt: reaction.updatedAt,
      post: reaction.post,
    }))
  }
  
  async getUserRetweets(userId: string): Promise<ReactionDTO[]> {
    const reactions = await this.repository.findByUserIdAndType(userId, ReactionType.RETWEET)
    
    return reactions.map(reaction => ({
      id: reaction.id,
      postId: reaction.postId,
      userId: reaction.userId,
      type: reaction.type as ReactionType,
      createdAt: reaction.createdAt,
      updatedAt: reaction.updatedAt,
      post: reaction.post,
    }))
  }
} 