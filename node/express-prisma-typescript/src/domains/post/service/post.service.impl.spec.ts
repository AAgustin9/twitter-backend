import { PostServiceImpl } from './post.service.impl';
import { PostRepository } from '../repository';
import * as classValidator from 'class-validator';
import * as utils from '@utils';
import { CreatePostInputDTO, PostDTO, ExtendedPostDTO } from '../dto';
import { NotFoundException, ForbiddenException } from '@utils/errors';

jest.mock('class-validator', () => ({
  validate: jest.fn().mockResolvedValue([])
}));

jest.mock('@utils', () => {
  const actual = jest.requireActual('@utils');
  return {
    ...actual,
    generatePresignedUploadUrl: jest.fn().mockResolvedValue({ url: 'uploadUrl' }),
    getPublicImageUrl: jest.fn().mockReturnValue('imageUrl'),
    generateS3Key: jest.fn().mockReturnValue('key')
  };
});

describe('PostServiceImpl', () => {
  let repository: jest.Mocked<PostRepository>;
  let service: PostServiceImpl;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      getById: jest.fn(),
      delete: jest.fn(),
      getPostsWithoutComments: jest.fn(),
      getAuthorPrivacyInfo: jest.fn(),
      canAccessAuthorPosts: jest.fn(),
      getByAuthorId: jest.fn(),
      createComment: jest.fn(),
      getCommentsByPostId: jest.fn(),
      getCommentsByUserId: jest.fn(),
      getCommentsByPostIdPaginated: jest.fn()
    } as unknown as jest.Mocked<PostRepository>;
    service = new PostServiceImpl(repository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createPost', () => {
    it('should create a post', async () => {
      const input: CreatePostInputDTO = { content: 'hello' };
      const postDto: PostDTO = { id: '1', authorId: 'u1', content: 'hello', images: [], createdAt: new Date() };
      (repository.create as jest.Mock).mockResolvedValue(postDto);
      const result = await service.createPost('u1', input);
      expect(classValidator.validate).toHaveBeenCalledWith(input);
      expect(repository.create).toHaveBeenCalledWith('u1', input);
      expect(result).toEqual(postDto);
    });
  });

  describe('deletePost', () => {
    it('should throw NotFoundException if post not found', async () => {
      (repository.getById as jest.Mock).mockResolvedValue(null);
      await expect(service.deletePost('u1', 'p1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not author', async () => {
      (repository.getById as jest.Mock).mockResolvedValue({ id: 'p1', authorId: 'other', content: '', images: [], createdAt: new Date() });
      await expect(service.deletePost('u1', 'p1')).rejects.toThrow(ForbiddenException);
    });

    it('should delete post if author matches', async () => {
      (repository.getById as jest.Mock).mockResolvedValue({ id: 'p1', authorId: 'u1', content: '', images: [], createdAt: new Date() });
      await service.deletePost('u1', 'p1');
      expect(repository.delete).toHaveBeenCalledWith('p1');
    });
  });

  describe('getLatestPosts', () => {
    it('should return latest posts', async () => {
      const posts: ExtendedPostDTO[] = [];
      (repository.getPostsWithoutComments as jest.Mock).mockResolvedValue(posts);
      const result = await service.getLatestPosts('u1', { limit: 10 });
      expect(repository.getPostsWithoutComments).toHaveBeenCalledWith({ limit: 10 }, 'u1');
      expect(result).toBe(posts);
    });
  });

  describe('getPostImageUploadUrl', () => {
    it('should return urls and key', async () => {
      const result = await service.getPostImageUploadUrl('u1', 'image/png');
      expect(utils.generateS3Key).toHaveBeenCalledWith(utils.ImageType.POST, 'u1');
      expect(utils.generatePresignedUploadUrl).toHaveBeenCalledWith('key', 'image/png');
      expect(utils.getPublicImageUrl).toHaveBeenCalledWith('key');
      expect(result).toEqual({ uploadUrl: 'uploadUrl', imageUrl: 'imageUrl', key: 'key' });
    });
  });
}); 