import { ReactionServiceImpl } from './reaction.service.impl';
import { ReactionRepository } from '../repository';
import { ReactionType } from '../dto';

describe('ReactionServiceImpl', () => {
  let repository: jest.Mocked<ReactionRepository>;
  let service: ReactionServiceImpl;
  const userId = 'u1';
  const postId = 'p1';

  beforeEach(() => {
    repository = {
      findByUserAndPost: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findByPostId: jest.fn(),
      findByUserIdAndType: jest.fn()
    } as unknown as jest.Mocked<ReactionRepository>;
    service = new ReactionServiceImpl(repository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createReaction', () => {
    it('should throw error if reaction exists', async () => {
      (repository.findByUserAndPost as jest.Mock).mockResolvedValue({} as any);
      await expect(service.createReaction(userId, postId, ReactionType.LIKE)).rejects.toThrow(`User has already liked this post`);
    });

    it('should create and return ReactionDTO', async () => {
      (repository.findByUserAndPost as jest.Mock).mockResolvedValue(null);
      const reaction = { id: 'r1', postId, userId, type: 'LIKE', createdAt: new Date(), updatedAt: new Date() } as any;
      (repository.create as jest.Mock).mockResolvedValue(reaction);
      const result = await service.createReaction(userId, postId, ReactionType.LIKE);
      expect(repository.create).toHaveBeenCalledWith(postId, userId, ReactionType.LIKE);
      expect(result).toEqual({
        id: 'r1',
        postId,
        userId,
        type: ReactionType.LIKE,
        createdAt: reaction.createdAt,
        updatedAt: reaction.updatedAt
      });
    });
  });

  describe('deleteReaction', () => {
    it('should throw error if no reaction exists', async () => {
      (repository.findByUserAndPost as jest.Mock).mockResolvedValue(null);
      await expect(service.deleteReaction(userId, postId, ReactionType.RETWEET)).rejects.toThrow(`User has not retweeted this post`);
    });

    it('should delete reaction if exists', async () => {
      (repository.findByUserAndPost as jest.Mock).mockResolvedValue({} as any);
      await service.deleteReaction(userId, postId, ReactionType.RETWEET);
      expect(repository.delete).toHaveBeenCalledWith(postId, userId, ReactionType.RETWEET);
    });
  });

  describe('getReactionsByPostId', () => {
    it('should return mapped ReactionDTOs', async () => {
      const reactions = [{ id: 'r1', postId, userId, type: 'LIKE', createdAt: new Date(), updatedAt: new Date() } as any];
      (repository.findByPostId as jest.Mock).mockResolvedValue(reactions);
      const result = await service.getReactionsByPostId(postId);
      expect(repository.findByPostId).toHaveBeenCalledWith(postId);
      expect(result).toEqual([{
        id: 'r1',
        postId,
        userId,
        type: ReactionType.LIKE,
        createdAt: reactions[0].createdAt,
        updatedAt: reactions[0].updatedAt
      }]);
    });
  });

  describe('hasUserReacted', () => {
    it('should return true if reaction exists', async () => {
      (repository.findByUserAndPost as jest.Mock).mockResolvedValue({} as any);
      const result = await service.hasUserReacted(userId, postId, ReactionType.LIKE);
      expect(result).toBe(true);
    });

    it('should return false if no reaction', async () => {
      (repository.findByUserAndPost as jest.Mock).mockResolvedValue(null);
      const result = await service.hasUserReacted(userId, postId, ReactionType.LIKE);
      expect(result).toBe(false);
    });
  });
}); 