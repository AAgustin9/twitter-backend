import { CreateCommentInputDTO, CreatePostInputDTO, PostDTO, ExtendedPostDTO } from '../dto'
import { PostRepository } from '../repository'
import { PostService } from '.'
import { validate } from 'class-validator'
import { ForbiddenException, NotFoundException } from '@utils'
import { CursorPagination } from '@types'
import { ImageType, generatePresignedUploadUrl, generateS3Key, getPublicImageUrl } from '@utils'

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

  async getPost (userId: string, postId: string): Promise<ExtendedPostDTO> {
    const post = await this.repository.getById(postId, userId)
    if (!post) throw new NotFoundException('post')
    return post
  }

  async getLatestPosts (userId: string, options: CursorPagination): Promise<ExtendedPostDTO[]> {
    return await this.repository.getPostsWithoutComments(options, userId)
  }

  async getPostsByAuthor (userId: string, authorId: string): Promise<ExtendedPostDTO[]> {
    const authorInfo = await this.repository.getAuthorPrivacyInfo(authorId)
    if (!authorInfo) {
      throw new NotFoundException('user')
    }
    
    if (authorInfo.private) {
      const canAccess = await this.repository.canAccessAuthorPosts(userId, authorId)
      if (!canAccess) {
        throw new NotFoundException('user')
      }
    }
    
    return await this.repository.getByAuthorId(authorId, userId)
  }
  
  async getFollowingPosts(
    userId: string,
    options: CursorPagination
  ): Promise<ExtendedPostDTO[]> {
    return await this.repository.getPostsFromFollowing(options, userId)
  }


  // Comment methods
  async createComment(userId: string, data: CreateCommentInputDTO): Promise<PostDTO> {
    await validate(data)
    
    // Check if parent post exists and is accessible
    const parentPost = await this.repository.getById(data.parentId, userId)
    if (!parentPost) throw new NotFoundException('post')
    
    return await this.repository.createComment(userId, data.parentId, data)
  }
  
  async getComments(userId: string, postId: string): Promise<PostDTO[]> {
    // Check if parent post exists and is accessible
    const parentPost = await this.repository.getById(postId, userId)
    if (!parentPost) throw new NotFoundException('post')
    
    return await this.repository.getCommentsByPostId(postId, userId)
  }
  
  async getUserComments(viewerId: string, authorId: string): Promise<PostDTO[]> {
    // First check if the author exists and if they have a private account
    const authorInfo = await this.repository.getAuthorPrivacyInfo(authorId)
    if (!authorInfo) {
      throw new NotFoundException('user')
    }
    
    // If the author has a private account, check if the viewer follows them
    if (authorInfo.private && viewerId !== authorId) {
      const canAccess = await this.repository.canAccessAuthorPosts(viewerId, authorId)
      if (!canAccess) {
        throw new NotFoundException('user')
      }
    }
    
    return await this.repository.getCommentsByUserId(authorId, viewerId)
  }
  
  // Image upload method
  async getPostImageUploadUrl(userId: string, contentType: string): Promise<{ uploadUrl: string, imageUrl: string, key: string }> {
    // Generate a unique key for the image
    const key = generateS3Key(ImageType.POST, userId)
    
    // Get a pre-signed URL for uploading
    const { url: uploadUrl } = await generatePresignedUploadUrl(key, contentType)
    
    // Return both the upload URL and the future public URL
    return {
      uploadUrl,
      imageUrl: getPublicImageUrl(key),
      key
    }
  }

  async getCommentsByPostIdPaginated(userId: string, postId: string, options: CursorPagination): Promise<ExtendedPostDTO[]> {
    return await this.repository.getCommentsByPostIdPaginated(postId, options, userId)
  }
}
