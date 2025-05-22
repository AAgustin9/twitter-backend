import { IsEnum } from 'class-validator'

export enum ReactionType {
  LIKE = 'LIKE',
  RETWEET = 'RETWEET'
}

export class CreateReactionInputDTO {
  @IsEnum(ReactionType)
  type!: ReactionType
}

export class ReactionDTO {
  id!: string
  postId!: string
  userId!: string
  type!: ReactionType
  createdAt!: Date
  updatedAt!: Date
} 