import { Request, Response, Router } from 'express'
import HttpStatus from 'http-status'
// express-async-errors is a module that handles async errors in express
import 'express-async-errors'

import { db } from '@utils'

import { FollowerRepositoryImpl } from '../repository'
import { FollowerService, FollowerServiceImpl } from '../service'

export const followerRouter = Router()

// Use dependency injection
const service: FollowerService = new FollowerServiceImpl(new FollowerRepositoryImpl(db))

/**
 * Follow a user
 * POST /api/follower/follow/:user_id
 */
followerRouter.post('/follow/:user_id', async (req: Request, res: Response) => {
  const { userId } = res.locals.context // Current logged-in user
  const { user_id: targetUserId } = req.params // User to follow

  await service.followUser(userId, targetUserId)

  return res.status(HttpStatus.OK).json({ message: 'Successfully followed user' })
})

/**
 * Unfollow a user
 * POST /api/follower/unfollow/:user_id
 */
followerRouter.post('/unfollow/:user_id', async (req: Request, res: Response) => {
  const { userId } = res.locals.context // Current logged-in user
  const { user_id: targetUserId } = req.params // User to unfollow

  await service.unfollowUser(userId, targetUserId)

  return res.status(HttpStatus.OK).json({ message: 'Successfully unfollowed user' })
})

