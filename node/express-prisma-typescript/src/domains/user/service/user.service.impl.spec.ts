import { UserServiceImpl } from './user.service.impl';
import { UserRepository } from '../repository';
import { FollowerService } from '@domains/follower/service';
import { NotFoundException } from '@utils/errors';
import * as utils from '@utils';
import { UserViewDTO } from '../dto';

jest.mock('@utils', () => {
  const actual = jest.requireActual('@utils');
  return {
    ...actual,
    generatePresignedUploadUrl: jest.fn().mockResolvedValue({ url: 'uploadUrl' }),
    getPublicImageUrl: jest.fn().mockReturnValue('profileUrl'),
    generateS3Key: jest.fn().mockReturnValue('key')
  };
});

describe('UserServiceImpl', () => {
  let userRepo: jest.Mocked<UserRepository>;
  let followerService: jest.Mocked<FollowerService>;
  let service: UserServiceImpl;

  beforeEach(() => {
    userRepo = {
      getById: jest.fn(),
      getRecommendedUsersPaginated: jest.fn(),
      searchUsersByUsername: jest.fn(),
      delete: jest.fn(),
      updateProfileImage: jest.fn()
    } as unknown as jest.Mocked<UserRepository>;
    followerService = {
      isFollowing: jest.fn()
    } as unknown as jest.Mocked<FollowerService>;
    service = new UserServiceImpl(userRepo, followerService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getUser', () => {
    it('should throw NotFoundException if user not found', async () => {
      (userRepo.getById as jest.Mock).mockResolvedValue(null);
      await expect(service.getUser('u1')).rejects.toThrow(NotFoundException);
    });

    it('should return user view without viewerId', async () => {
      const user = { id: 'u1', username: 'user', email: 'e', profileImageUrl: '', private: false } as any;
      (userRepo.getById as jest.Mock).mockResolvedValue(user);
      const result = await service.getUser('u1');
      expect(followerService.isFollowing).not.toHaveBeenCalled();
      expect(result).toBeInstanceOf(UserViewDTO);
      expect(result.id).toBe('u1');
      expect(result.isFollowing).toBe(false);
    });

    it('should return user view with isFollowing when viewerId provided', async () => {
      const user = { id: 'u1', username: 'user', email: 'e', profileImageUrl: '', private: false } as any;
      (userRepo.getById as jest.Mock).mockResolvedValue(user);
      (followerService.isFollowing as jest.Mock).mockResolvedValue(true);
      const result = await service.getUser('u1', 'viewer1');
      expect(followerService.isFollowing).toHaveBeenCalledWith('viewer1', 'u1');
      expect(result.isFollowing).toBe(true);
    });
  });

  describe('getProfileImageUploadUrl', () => {
    it('should return uploadUrl and profileImageUrl', async () => {
      const result = await service.getProfileImageUploadUrl('u1', 'image/png');
      expect(utils.generateS3Key).toHaveBeenCalledWith(utils.ImageType.PROFILE, 'u1');
      expect(utils.generatePresignedUploadUrl).toHaveBeenCalledWith('key', 'image/png');
      expect(utils.getPublicImageUrl).toHaveBeenCalledWith('key');
      expect(result).toEqual({ uploadUrl: 'uploadUrl', profileImageUrl: 'profileUrl' });
    });
  });

  describe('updateProfileImage', () => {
    it('should update and return UserViewDTO', async () => {
      const updatedUser = { id: 'u1', username: 'user', email: 'e', profileImageUrl: 'key', private: false } as any;
      (userRepo.updateProfileImage as jest.Mock).mockResolvedValue(updatedUser);
      const result = await service.updateProfileImage('u1', 'key');
      expect(userRepo.updateProfileImage).toHaveBeenCalledWith('u1', 'key');
      expect(result).toBeInstanceOf(UserViewDTO);
      expect(result.profileImageUrl).toBe('key');
    });
  });
}); 