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

/**
 * @swagger
 * /api/reaction/{postId}:
 *   post:
 *     summary: Create a reaction
 *     description: Create a reaction (like or retweet) on a post
 *     tags: [Reaction]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post to react to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [LIKE, RETWEET]
 *                 description: Type of reaction
 *     responses:
 *       201:
 *         description: Reaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 postId:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 type:
 *                   type: string
 *                   enum: [LIKE, RETWEET]
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 */
reactionRouter.post('/:postId', BodyValidation(CreateReactionInputDTO), async (req: Request, res: Response) => {
  const { userId } = res.locals.context
  const { postId } = req.params
  const { type } = req.body

  const reaction = await service.createReaction(userId, postId, type)

  return res.status(HttpStatus.CREATED).json(reaction)
})

/**
 * @swagger
 * /api/reaction/{postId}:
 *   delete:
 *     summary: Delete a reaction
 *     description: Remove a reaction (like or retweet) from a post
 *     tags: [Reaction]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post to remove reaction from
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [LIKE, RETWEET]
 *         description: Type of reaction to remove
 *     responses:
 *       200:
 *         description: Reaction deleted successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Reaction not found
 */
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

/**
 * @swagger
 * /api/reaction/{postId}:
 *   get:
 *     summary: Get reactions for a post
 *     description: Get all reactions for a specific post
 *     tags: [Reaction]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post to get reactions for
 *     responses:
 *       200:
 *         description: List of reactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   postId:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   type:
 *                     type: string
 *                     enum: [LIKE, RETWEET]
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 */
reactionRouter.get('/:postId', async (req: Request, res: Response) => {
  const { postId } = req.params

  const reactions = await service.getReactionsByPostId(postId)

  return res.status(HttpStatus.OK).json(reactions)
})

/**
 * @swagger
 * /api/reaction/user/{userId}/likes:
 *   get:
 *     summary: Get user likes
 *     description: Get all posts liked by a specific user
 *     tags: [Reaction]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to get likes for
 *     responses:
 *       200:
 *         description: List of liked posts with reaction data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   postId:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   type:
 *                     type: string
 *                     enum: [LIKE]
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   post:
 *                     type: object
 *       401:
 *         description: Unauthorized
 */
reactionRouter.get('/user/:userId/likes', async (req: Request, res: Response) => {
  const { userId } = req.params

  const likes = await service.getUserLikes(userId)

  return res.status(HttpStatus.OK).json(likes)
})

/**
 * @swagger
 * /api/reaction/user/{userId}/retweets:
 *   get:
 *     summary: Get user retweets
 *     description: Get all posts retweeted by a specific user
 *     tags: [Reaction]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to get retweets for
 *     responses:
 *       200:
 *         description: List of retweeted posts with reaction data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   postId:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   type:
 *                     type: string
 *                     enum: [RETWEET]
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   post:
 *                     type: object
 *       401:
 *         description: Unauthorized
 */
reactionRouter.get('/user/:userId/retweets', async (req: Request, res: Response) => {
  const { userId } = req.params

  const retweets = await service.getUserRetweets(userId)

  return res.status(HttpStatus.OK).json(retweets)
}) 