import { Router } from 'express'
import { withAuth } from '@utils'

import { userRouter } from '@domains/user'
import { postRouter } from '@domains/post'
import { authRouter } from '@domains/auth'
import { healthRouter } from '@domains/health'
import { reactionRouter } from '@domains/reaction'
import { followerRouter } from '@domains/follower'
import { commentRouter } from '@domains/post/controller/comment.controller'
import chatRouter from '@domains/chat/router'

export const router = Router()

router.use('/health', healthRouter)
router.use('/auth', authRouter)
router.use('/user', withAuth, userRouter)
router.use('/post', withAuth, postRouter)
router.use('/comment', withAuth, commentRouter)
router.use('/reaction', withAuth, reactionRouter)
router.use('/follower', withAuth, followerRouter)
router.use('/chat', chatRouter)
