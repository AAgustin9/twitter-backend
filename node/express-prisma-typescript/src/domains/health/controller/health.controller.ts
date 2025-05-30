import { Request, Response, Router } from 'express'
import HttpStatus from 'http-status'
// express-async-errors is a module that handles async errors in express, don't forget import it in your new controllers
import 'express-async-errors'

export const healthRouter = Router()

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Use to check if the API is running
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: API is running
 */
healthRouter.get('/', (req: Request, res: Response) => {
  return res.status(HttpStatus.OK).send()
})
