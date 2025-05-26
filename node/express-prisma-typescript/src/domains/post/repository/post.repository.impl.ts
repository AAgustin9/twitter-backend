import { PrismaClient, User, Prisma } from '@prisma/client'

import { CursorPagination } from '@types'

import { PostRepository } from '.'
import { CreatePostInputDTO, PostDTO, ExtendedPostDTO } from '../dto'
import { ExtendedUserDTO } from '@domains/user/dto'

export class PostRepositoryImpl implements PostRepository {
  constructor (private readonly db: PrismaClient) {}

  async create (userId: string, data: CreatePostInputDTO): Promise<PostDTO> {
    const post = await this.db.post.create({
      data: {
        authorId: userId,
        content: data.content,
        images: data.images || [],
        parentId: data.parentId || null
      }
    })
    return new PostDTO(post)
  }

  async getAllByDatePaginated (options: CursorPagination, userId: string): Promise<PostDTO[]> {
    // Get public posts or posts from users that userId follows
    const posts = await this.db.post.findMany({
      where: {
        OR: [
          {
            author: {
              private: false
            }
          },
          {
            author: {
              followers: {
                some: {
                  followerId: userId
                }
              }
            }
          }
        ]
      },
      cursor: options.after ? { id: options.after } : (options.before) ? { id: options.before } : undefined,
      skip: options.after ?? options.before ? 1 : undefined,
      take: options.limit ? (options.before ? -options.limit : options.limit) : undefined,
      orderBy: [
        {
          createdAt: 'desc'
        },
        {
          id: 'asc'
        }
      ]
    })
    return posts.map((post: any) => new PostDTO(post))
  }

  async getPostsWithoutComments(options: CursorPagination, userId: string): Promise<ExtendedPostDTO[]> {
    const posts = await this.db.post.findMany({
      where: {
        parentId: null,
        OR: [
          { author: { private: false } },
          {
            author: {
              followers: {
                some: { followerId: userId }
              }
            }
          }
        ]
      },
      include: {
        author: true,
        comments: {
          include: { author: true }
        },
        parent: {
          include: { author: true }
        },
        reactions: true
      },
      cursor: options.after ? { id: options.after } : options.before ? { id: options.before } : undefined,
      skip: options.after || options.before ? 1 : undefined,
      take: options.limit ? (options.before ? -options.limit : options.limit) : undefined,
      orderBy: [
        { createdAt: 'desc' },
        { id: 'asc' }
      ]
    })
    
    return posts.map((post: any) => {
      const qtyLikes = post.reactions.filter((r: any) => r.type === 'LIKE').length
      const qtyRetweets = post.reactions.filter((r: any) => r.type === 'RETWEET').length
    
      return new ExtendedPostDTO({
        ...post,
        qtyComments: post.comments.length,
        qtyLikes,
        qtyRetweets,
        comments: post.comments,
        parent: post.parent,
        author: post.author
      })
    })
  }
  

  async delete (postId: string): Promise<void> {
    await this.db.post.delete({
      where: {
        id: postId
      }
    })
  }

  async getById (postId: string, userId?: string): Promise<PostDTO | null> {
    const post = await this.db.post.findUnique({
      where: {
        id: postId
      },
      include: {
        author: {
          select: {
            private: true
          }
        }
      }
    })
    if (!post) return null
    
    const postDTO = new PostDTO(post)
    
    // If userId is provided, check if they can view the post
    if (userId && post.author.private) {
      const canView = await this.canViewPost(postDTO, userId)
      if (!canView) return null
    }
    
    return postDTO
  }

  async getByAuthorId (authorId: string, userId?: string): Promise<ExtendedPostDTO[]> {
    // Get the author info to check privacy
    const author = await this.db.user.findUnique({
      where: {
        id: authorId
      },
      select: {
        private: true
      }
    })
    
    // If author doesn't exist, return empty array
    if (!author) return []
    
    // If author is not private, or no userId provided, get posts with extended data
    const query = {
      where: {
        authorId,
        deletedAt: null
      },
      include: {
        author: true,
        comments: {
          include: { author: true }
        },
        reactions: true
      },
      orderBy: [
        { createdAt: Prisma.SortOrder.desc },
        { id: Prisma.SortOrder.asc }
      ]
    }

    // If author is private and userId is provided, check if they can access
    if (author.private && userId) {
      const isFollowing = await this.db.follow.findFirst({
        where: {
          followerId: userId,
          followedId: authorId
        }
      })
      
      // If not following, return empty array
      if (!isFollowing) return []
    }
    
    // Get posts with extended data
    const posts = await this.db.post.findMany(query)
    
    // Map to ExtendedPostDTO with reaction counts
    return posts.map((post: any) => {
      const qtyLikes = post.reactions.filter((r: any) => r.type === 'LIKE').length
      const qtyRetweets = post.reactions.filter((r: any) => r.type === 'RETWEET').length
    
      return new ExtendedPostDTO({
        ...post,
        qtyComments: post.comments.length,
        qtyLikes,
        qtyRetweets,
        comments: post.comments,
        author: post.author
      })
    })
  }

  async canViewPost(post: PostDTO, userId: string): Promise<boolean> {
    if (post.authorId === userId) return true
    
    const author = await this.db.user.findUnique({
      where: {
        id: post.authorId
      },
      select: {
        private: true
      }
    })
    
    if (!author) return false
    if (!author.private) return true
    
    // If author is private, check if user follows them
    const isFollowing = await this.db.follow.findFirst({
      where: {
        followerId: userId,
        followedId: post.authorId
      }
    })
    
    return isFollowing !== null
  }

  async getAuthorPrivacyInfo(authorId: string): Promise<{ private: boolean } | null> {
    const author = await this.db.user.findUnique({
      where: {
        id: authorId
      },
      select: {
        private: true
      }
    })
    
    return author
  }

  async canAccessAuthorPosts(userId: string, authorId: string): Promise<boolean> {
    // User can always access their own posts
    if (userId === authorId) return true
    
    // Check if the user follows the author
    const isFollowing = await this.db.follow.findFirst({
      where: {
        followerId: userId,
        followedId: authorId
      }
    })
    
    return isFollowing !== null
  }
  
  // Comment methods
  async createComment(userId: string, parentId: string, data: CreatePostInputDTO): Promise<PostDTO> {
    // First check if the parent post exists
    const parentPost = await this.getById(parentId, userId)
    if (!parentPost) {
      throw new Error('Parent post not found or not accessible')
    }
    
    // Create the comment
    const comment = await this.db.post.create({
      data: {
        authorId: userId,
        parentId: parentId,
        content: data.content,
        images: data.images || []
      }
    })
    
    return new PostDTO(comment)
  }
  
  async getCommentsByPostId(postId: string, userId?: string): Promise<PostDTO[]> {
    // First check if the parent post exists and is accessible
    const parentPost = await this.getById(postId, userId)
    if (!parentPost) {
      return []
    }
    
    // Get all comments for the post
    const comments = await this.db.post.findMany({
      where: {
        parentId: postId
      },
      orderBy: {
        createdAt: 'asc' // Show oldest comments first
      }
    })
    
    return comments.map(comment => new PostDTO(comment))
  }
  
  async getCommentsByUserId(userId: string, viewerId?: string): Promise<PostDTO[]> {
    // Get all comments made by the user
    const comments = await this.db.post.findMany({
      where: {
        authorId: userId,
        parentId: { not: null }, // Only get posts that are comments (have a parentId)
        deletedAt: null
      },
      include: {
        parent: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                name: true,
                private: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc' // Show newest comments first
      }
    })
    
    // Filter out comments on private posts if viewer can't access them
    const filteredComments = await Promise.all(
      comments.map(async (comment) => {
        // If parent post has a private author and viewer is provided
        if (comment.parent?.author.private && viewerId) {
          // Check if viewer can access the post
          const canView = await this.canViewPost(new PostDTO(comment.parent), viewerId)
          if (!canView) return null
        }
        return comment
      })
    )
    
    // Filter out null values and map to DTOs
    return filteredComments
      .filter(comment => comment !== null)
      .map(comment => new PostDTO(comment!))
  }

  async getCommentsByPostIdPaginated(postId: string, options: CursorPagination, userId?: string): Promise<ExtendedPostDTO[]> {
    // First check if the parent post exists and is accessible
    const parentPost = await this.getById(postId, userId)
    if (!parentPost) {
      return []
    }

    // Get comments with their authors and reaction counts, sorted by total reactions
    const comments = await this.db.post.findMany({
      where: {
        parentId: postId,
        deletedAt: null
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            password: true,
            private: true,
            profileImageKey: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true
          }
        },
        reactions: {
          where: {
            deletedAt: null
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            reactions: true,
            comments: true
          }
        }
      },
      cursor: options.after ? { id: options.after } : (options.before) ? { id: options.before } : undefined,
      skip: options.after ?? options.before ? 1 : undefined,
      take: options.limit ? (options.before ? -options.limit : options.limit) : undefined,
      orderBy: [
        {
          reactions: {
            _count: 'desc'
          }
        },
        {
          createdAt: 'desc'
        },
        {
          id: 'asc'
        }
      ]
    })

    // Map to ExtendedPostDTO
    return comments.map((comment: any) => {
      const authorDTO = new ExtendedUserDTO(comment.author)
      
      // Count reactions by type
      const likes = comment.reactions.filter((r: any) => r.type === 'LIKE').length
      const retweets = comment.reactions.filter((r: any) => r.type === 'RETWEET').length
      
      const extendedPost = new ExtendedPostDTO({
        id: comment.id,
        authorId: comment.authorId,
        content: comment.content,
        images: comment.images,
        parentId: comment.parentId,
        createdAt: comment.createdAt,
        author: authorDTO,
        qtyComments: comment._count.comments,
        qtyLikes: likes,
        qtyRetweets: retweets,
        parent: undefined,
        comments: undefined
      })
      
      return extendedPost
    })
  }
}
