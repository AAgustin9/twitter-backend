import express from 'express'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { createServer } from 'http'

import { Constants, NodeEnv, Logger, setupSwagger } from '@utils'
import { router } from '@router'
import { ErrorHandling } from '@utils/errors'
import { ChatSocket } from './domains/chat/socket/chat.socket'

const app = express()
const server = createServer(app)

// Initialize Socket.IO for chat
new ChatSocket(server)

// Set up request logger
if (Constants.NODE_ENV === NodeEnv.DEV) {
  app.use(morgan('tiny')) // Log requests only in development environments
}

// Set up request parsers
app.use(express.json()) // Parses application/json payloads request bodies
app.use(express.urlencoded({ extended: false })) // Parse application/x-www-form-urlencoded request bodies
app.use(cookieParser()) // Parse cookies

// Set up CORS
app.use(
  cors({
    origin: Constants.CORS_WHITELIST
  })
)

// Setup Swagger documentation
setupSwagger(app)

app.use('/api', router)

app.use(ErrorHandling)

server.listen(Constants.PORT, () => {
  Logger.info(`Server listening on port ${Constants.PORT}`)
  Logger.info(`API documentation available at http://localhost:${Constants.PORT}/api-docs`)
})
