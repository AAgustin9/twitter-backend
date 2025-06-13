import { ArrayMaxSize, IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator'
import { ExtendedUserDTO } from '@domains/user/dto'

export class CreatePostInputDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
    content!: string

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
    images?: string[]
    
  @IsOptional()
  @IsUUID()
    parentId?: string
}

export class PostDTO {
  constructor (post: PostDTO) {
    this.id = post.id
    this.authorId = post.authorId
    this.content = post.content
    this.images = post.images
    this.parentId = post.parentId
    this.createdAt = post.createdAt
  }

  id: string
  authorId: string
  content: string
  images: string[]
  parentId?: string | null
  createdAt: Date
}

export class ExtendedPostDTO extends PostDTO {
  constructor (post: any) {
    super(post)
    this.author = post.author
    this.qtyComments = post.qtyComments
    this.qtyLikes = post.qtyLikes
    this.qtyRetweets = post.qtyRetweets
    this.parent = post.parent
    this.comments = post.comments
  }

  author!: ExtendedUserDTO
  qtyComments!: number
  qtyLikes!: number
  qtyRetweets!: number
  parent?: ExtendedPostDTO
  comments?: ExtendedPostDTO[]
}

export class CreateCommentInputDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
    content!: string

  @IsOptional()
  @MaxLength(4)
    images?: string[]
    
  @IsUUID()
  @IsNotEmpty()
    parentId!: string
}
