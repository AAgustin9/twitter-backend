import { CreatePostInputDTO, PostDTO } from '../dto'
import { PostRepository } from '../repository'
import { PostService } from '.'
import { validate } from 'class-validator'
import { ForbiddenException, NotFoundException } from '@utils'
import { CursorPagination } from '@types'

export class PostServiceImpl implements PostService {
  constructor (private readonly repository: PostRepository) {}

  async createPost (userId: string, data: CreatePostInputDTO): Promise<PostDTO> {
    await validate(data)
    return await this.repository.create(userId, data)
  }

  async deletePost (userId: string, postId: string): Promise<void> {
    const post = await this.repository.getById(postId, userId)
    if (!post) throw new NotFoundException('post')
    if (post.authorId !== userId) throw new ForbiddenException()
    await this.repository.delete(postId)
  }

  async getPost (userId: string, postId: string): Promise<PostDTO> {
    const post = await this.repository.getById(postId, userId)
    if (!post) throw new NotFoundException('post')
    return post
  }

  async getLatestPosts (userId: string, options: CursorPagination): Promise<PostDTO[]> {
    return await this.repository.getAllByDatePaginated(options, userId)
  }

  async getPostsByAuthor (userId: string, authorId: string): Promise<PostDTO[]> {
    // First check if the author exists and if they have a private account
    const authorInfo = await this.repository.getAuthorPrivacyInfo(authorId)
    if (!authorInfo) {
      throw new NotFoundException('user')
    }
    
    // If the author has a private account, check if the user follows them
    if (authorInfo.private) {
      const canAccess = await this.repository.canAccessAuthorPosts(userId, authorId)
      if (!canAccess) {
        throw new NotFoundException('user') // 404 to not reveal the existence of private accounts
      }
    }
    
    return await this.repository.getByAuthorId(authorId, userId)
  }
}
