import { Router } from 'express'
import { ChatController } from './controller/chat.controller'
import { withAuth } from '@utils'

const router = Router()

router.post('/keys', withAuth, ChatController.generateKeys)
router.post('/history/:userId', withAuth, ChatController.getChatHistory)

export default router 