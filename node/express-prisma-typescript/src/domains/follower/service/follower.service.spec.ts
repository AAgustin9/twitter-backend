import { FollowerServiceImpl } from './follower.service';
import { FollowerRepository } from '../repository';

describe('FollowerServiceImpl', () => {
  let repository: jest.Mocked<FollowerRepository>;
  let service: FollowerServiceImpl;

  beforeEach(() => {
    repository = {
      createFollow: jest.fn(),
      deleteFollow: jest.fn(),
      isFollowing: jest.fn()
    } as unknown as jest.Mocked<FollowerRepository>;
    service = new FollowerServiceImpl(repository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should follow a user', async () => {
    await service.followUser('user1', 'user2');
    expect(repository.createFollow).toHaveBeenCalledWith('user1', 'user2');
  });

  it('should unfollow a user', async () => {
    await service.unfollowUser('user1', 'user2');
    expect(repository.deleteFollow).toHaveBeenCalledWith('user1', 'user2');
  });

  it('should return following status', async () => {
    repository.isFollowing.mockResolvedValue(true);
    const result = await service.isFollowing('user1', 'user2');
    expect(repository.isFollowing).toHaveBeenCalledWith('user1', 'user2');
    expect(result).toBe(true);
  });
}); 