import { Request, Response, Router } from 'express'
import HttpStatus from 'http-status'
// express-async-errors is a module that handles async errors in express, don't forget import it in your new controllers
import 'express-async-errors'

import { db } from '@utils'

import { PostRepositoryImpl } from '../repository'
import { PostService, PostServiceImpl } from '../service'

export const commentRouter = Router()

// Use dependency injection
const service: PostService = new PostServiceImpl(new PostRepositoryImpl(db))

/**
 * @swagger
 * /api/comment/{postId}:
 *   get:
 *     summary: Get comments for a post with pagination
 *     description: Returns comments for a specific post with cursor-based pagination, sorted by reactions
 *     tags: [Comment]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post to get comments for
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of comments to return
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *         description: Get comments before this cursor (pagination)
 *       - in: query
 *         name: after
 *         schema:
 *           type: string
 *         description: Get comments after this cursor (pagination)
 *     responses:
 *       200:
 *         description: List of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   content:
 *                     type: string
 *                   authorId:
 *                     type: string
 *                   parentId:
 *                     type: string
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   author:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       username:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                   qtyComments:
 *                     type: integer
 *                   qtyLikes:
 *                     type: integer
 *                   qtyRetweets:
 *                     type: integer
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 */
commentRouter.get('/:postId', async (req: Request, res: Response) => {
  const { userId } = res.locals.context
  const { postId } = req.params
  const { limit, before, after } = req.query as Record<string, string>

  const comments = await service.getCommentsByPostIdPaginated(userId, postId, { 
    limit: limit ? Number(limit) : undefined, 
    before, 
    after 
  })

  return res.status(HttpStatus.OK).json(comments)
}) 