import { CreateCommentInputDTO, CreatePostInputDTO, PostDTO, ExtendedPostDTO } from '../dto'
import { CursorPagination } from '@types'

export interface PostService {
  createPost: (userId: string, body: CreatePostInputDTO) => Promise<PostDTO>
  deletePost: (userId: string, postId: string) => Promise<void>
  getPost: (userId: string, postId: string) => Promise<ExtendedPostDTO>
  getLatestPosts: (userId: string, options: { limit?: number, before?: string, after?: string }) => Promise<ExtendedPostDTO[]>
  getPostsByAuthor: (userId: any, authorId: string) => Promise<ExtendedPostDTO[]>
  
  // Comment methods
  createComment: (userId: string, body: CreateCommentInputDTO) => Promise<PostDTO>
  getComments: (userId: string, postId: string) => Promise<PostDTO[]>
  getCommentsByPostIdPaginated: (userId: string, postId: string, options: CursorPagination) => Promise<ExtendedPostDTO[]>
  getUserComments: (userId: string, authorId: string) => Promise<PostDTO[]>
  
  // Image upload method
  getPostImageUploadUrl: (userId: string, contentType: string) => Promise<{ uploadUrl: string, imageUrl: string, key: string }>
}
