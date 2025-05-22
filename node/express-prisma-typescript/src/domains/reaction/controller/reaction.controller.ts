import { Request, Response, Router } from 'express'
import HttpStatus from 'http-status'
import 'express-async-errors'

import { db, BodyValidation } from '@utils'

import { ReactionRepositoryImpl } from '../repository'
import { ReactionService, ReactionServiceImpl } from '../service'
import { CreateReactionInputDTO, ReactionType } from '../dto'

export const reactionRouter = Router()

// Use dependency injection
const service: ReactionService = new ReactionServiceImpl(new ReactionRepositoryImpl(db))

// POST /api/reaction/:postId - Create a reaction (like or retweet)
reactionRouter.post('/:postId', BodyValidation(CreateReactionInputDTO), async (req: Request, res: Response) => {
  const { userId } = res.locals.context
  const { postId } = req.params
  const { type } = req.body

  const reaction = await service.createReaction(userId, postId, type)

  return res.status(HttpStatus.CREATED).json(reaction)
})

// DELETE /api/reaction/:postId - Delete a reaction
reactionRouter.delete('/:postId', async (req: Request, res: Response) => {
  const { userId } = res.locals.context
  const { postId } = req.params
  const { type } = req.query as { type: ReactionType }

  if (!type || !Object.values(ReactionType).includes(type)) {
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Valid reaction type required as query parameter' })
  }

  await service.deleteReaction(userId, postId, type)

  return res.status(HttpStatus.OK).send(`Deleted ${type.toLowerCase()} reaction from post ${postId}`)
})

// GET /api/reaction/:postId - Get all reactions for a post
reactionRouter.get('/:postId', async (req: Request, res: Response) => {
  const { postId } = req.params

  const reactions = await service.getReactionsByPostId(postId)

  return res.status(HttpStatus.OK).json(reactions)
}) 