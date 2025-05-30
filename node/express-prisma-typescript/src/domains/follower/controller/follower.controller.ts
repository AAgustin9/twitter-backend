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
 * @swagger
 * /api/follower/follow/{user_id}:
 *   post:
 *     summary: Follow a user
 *     description: Follow a user by their ID
 *     tags: [Follower]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to follow
 *     responses:
 *       200:
 *         description: Successfully followed user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
followerRouter.post('/follow/:user_id', async (req: Request, res: Response) => {
  const { userId } = res.locals.context // Current logged-in user
  const { user_id: targetUserId } = req.params // User to follow

  await service.followUser(userId, targetUserId)

  return res.status(HttpStatus.OK).json({ message: 'Successfully followed user' })
})

/**
 * @swagger
 * /api/follower/unfollow/{user_id}:
 *   post:
 *     summary: Unfollow a user
 *     description: Unfollow a user by their ID
 *     tags: [Follower]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to unfollow
 *     responses:
 *       200:
 *         description: Successfully unfollowed user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found or not following
 */
followerRouter.post('/unfollow/:user_id', async (req: Request, res: Response) => {
  const { userId } = res.locals.context // Current logged-in user
  const { user_id: targetUserId } = req.params // User to unfollow

  await service.unfollowUser(userId, targetUserId)

  return res.status(HttpStatus.OK).json({ message: 'Successfully unfollowed user' })
})

