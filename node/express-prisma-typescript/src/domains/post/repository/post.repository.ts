import { CursorPagination } from '@types'
import { CreatePostInputDTO, PostDTO, ExtendedPostDTO } from '../dto'

export interface PostRepository {
  create: (userId: string, data: CreatePostInputDTO) => Promise<PostDTO>
  getAllByDatePaginated: (options: CursorPagination, userId: string) => Promise<PostDTO[]>
  delete: (postId: string) => Promise<void>
  getById: (postId: string, userId?: string) => Promise<PostDTO | null>
  getByAuthorId: (authorId: string, userId?: string) => Promise<ExtendedPostDTO[]>
  canViewPost: (post: PostDTO, userId: string) => Promise<boolean>
  getAuthorPrivacyInfo: (authorId: string) => Promise<{ private: boolean } | null>
  canAccessAuthorPosts: (userId: string, authorId: string) => Promise<boolean>
  
  // Comment methods
  createComment: (userId: string, parentId: string, data: CreatePostInputDTO) => Promise<PostDTO>
  getCommentsByPostId: (postId: string, userId?: string) => Promise<PostDTO[]>
  getCommentsByPostIdPaginated: (postId: string, options: CursorPagination, userId?: string) => Promise<ExtendedPostDTO[]>
  getPostsWithoutComments: (options: CursorPagination, userId: string) => Promise<ExtendedPostDTO[]>
  getCommentsByUserId: (userId: string, viewerId?: string) => Promise<PostDTO[]>
}
