import { Request, Response, Router } from 'express'
import HttpStatus from 'http-status'
// express-async-errors is a module that handles async errors in express, don't forget import it in your new controllers
import 'express-async-errors'
import { IsNotEmpty, IsString, Matches } from 'class-validator'

import { db, BodyValidation } from '@utils'

import { UserRepositoryImpl } from '../repository'
import { UserService, UserServiceImpl } from '../service'
import { FollowerRepositoryImpl } from '@domains/follower/repository'
import { FollowerServiceImpl } from '@domains/follower/service'

export const userRouter = Router()

// Use dependency injection
const service: UserService = new UserServiceImpl(
  new UserRepositoryImpl(db),
  new FollowerServiceImpl(new FollowerRepositoryImpl(db))
)

// Type definitions for request bodies
class ProfileImageUploadRequestDTO {
  @IsNotEmpty()
  @IsString()
  @Matches(/^image\/(jpeg|png|gif|webp)$/, { message: 'Content type must be a valid image format' })
  contentType!: string
}

class ProfileImageUpdateRequestDTO {
  @IsNotEmpty()
  @IsString()
  imageKey!: string
}

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Get user recommendations
 *     description: Returns a list of recommended users to follow
 *     tags: [User]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of users to return
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *         description: Number of users to skip
 *     responses:
 *       200:
 *         description: List of recommended users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   username:
 *                     type: string
 *                   name:
 *                     type: string
 *                   profileImageUrl:
 *                     type: string
 *       401:
 *         description: Unauthorized
 */
userRouter.get('/', async (req: Request, res: Response) => {
  const { userId } = res.locals.context
  const { limit, skip } = req.query as Record<string, string>

  const users = await service.getUserRecommendations(userId, { limit: Number(limit), skip: Number(skip) })

  return res.status(HttpStatus.OK).json(users)
})

/**
 * @swagger
 * /api/user/me:
 *   get:
 *     summary: Get current user profile
 *     description: Returns the profile of the currently authenticated user
 *     tags: [User]
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 name:
 *                   type: string
 *                 profileImageUrl:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
userRouter.get('/me', async (req: Request, res: Response) => {
  const { userId } = res.locals.context

  const user = await service.getUser(userId, userId)

  return res.status(HttpStatus.OK).json(user)
})

/**
 * @swagger
 * /api/user/by_username/{username}:
 *   get:
 *     summary: Search users by username
 *     description: Returns a list of users whose usernames contain the provided search term
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username search term (partial match, case-insensitive)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of users to return
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *         description: Number of users to skip for pagination
 *     responses:
 *       200:
 *         description: List of users matching the search term
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   username:
 *                     type: string
 *                   name:
 *                     type: string
 *                   profileImageUrl:
 *                     type: string
 *       401:
 *         description: Unauthorized
 */
userRouter.get('/by_username/:username', async (req: Request, res: Response) => {
  const { userId } = res.locals.context
  const { username } = req.params
  const { limit, skip } = req.query as Record<string, string>

  const users = await service.searchUsersByUsername(username, { 
    limit: limit ? Number(limit) : undefined, 
    skip: skip ? Number(skip) : undefined 
  }, userId)

  return res.status(HttpStatus.OK).json(users)
})

/**
 * @swagger
 * /api/user/{userId}:
 *   get:
 *     summary: Get user profile by ID
 *     description: Returns the profile of a specific user
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to get
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 name:
 *                   type: string
 *                 profileImageUrl:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
userRouter.get('/:userId', async (req: Request, res: Response) => {
  const { userId: viewerId } = res.locals.context
  const { userId: targetUserId } = req.params

  const user = await service.getUser(targetUserId, viewerId)

  return res.status(HttpStatus.OK).json(user)
})

/**
 * @swagger
 * /api/user:
 *   delete:
 *     summary: Delete current user account
 *     description: Permanently deletes the current user's account
 *     tags: [User]
 *     responses:
 *       200:
 *         description: User account deleted successfully
 *       401:
 *         description: Unauthorized
 */
userRouter.delete('/', async (req: Request, res: Response) => {
  const { userId } = res.locals.context

  await service.deleteUser(userId)

  return res.status(HttpStatus.OK)
})

/**
 * @swagger
 * /api/user/profile-image/upload-url:
 *   post:
 *     summary: Get pre-signed URL for profile image upload
 *     description: Generates a pre-signed URL for direct upload to S3
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentType
 *             properties:
 *               contentType:
 *                 type: string
 *                 description: MIME type of the image (e.g., image/jpeg, image/png)
 *     responses:
 *       200:
 *         description: Pre-signed URL for uploading
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uploadUrl:
 *                   type: string
 *                   description: Pre-signed URL for uploading the image
 *                 profileImageUrl:
 *                   type: string
 *                   description: URL where the image will be accessible after upload
 *                 key:
 *                   type: string
 *                   description: S3 key for the image (used for updating user profile)
 *       400:
 *         description: Invalid content type
 *       401:
 *         description: Unauthorized
 */
userRouter.post('/profile-image/upload-url', BodyValidation(ProfileImageUploadRequestDTO), async (req: Request, res: Response) => {
  const { userId } = res.locals.context
  const { contentType } = req.body

  // Validate content type
  if (!contentType.match(/^image\/(jpeg|png|gif|webp)$/)) {
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid content type. Must be a supported image format.' })
  }

  const { uploadUrl, profileImageUrl } = await service.getProfileImageUploadUrl(userId, contentType)

  // Extract key from the URL
  const key = profileImageUrl.split('.s3.amazonaws.com/')[1]

  return res.status(HttpStatus.OK).json({
    uploadUrl,
    profileImageUrl,
    key
  })
})

/**
 * @swagger
 * /api/user/profile-image:
 *   patch:
 *     summary: Update user profile image
 *     description: Updates the user's profile image using an S3 key
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageKey
 *             properties:
 *               imageKey:
 *                 type: string
 *                 description: S3 key of the uploaded image
 *     responses:
 *       200:
 *         description: Updated user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 name:
 *                   type: string
 *                 profileImageUrl:
 *                   type: string
 *       400:
 *         description: Invalid image key
 *       401:
 *         description: Unauthorized
 */
userRouter.patch('/profile-image', BodyValidation(ProfileImageUpdateRequestDTO), async (req: Request, res: Response) => {
  const { userId } = res.locals.context
  const { imageKey } = req.body

  const updatedUser = await service.updateProfileImage(userId, imageKey)

  return res.status(HttpStatus.OK).json(updatedUser)
})
