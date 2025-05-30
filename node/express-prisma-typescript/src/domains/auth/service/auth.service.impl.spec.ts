import { AuthServiceImpl } from './auth.service.impl';
import { UserRepository } from '@domains/user/repository';
import * as utils from '@utils';
import { SignupInputDTO, LoginInputDTO } from '../dto';
import { ConflictException, NotFoundException, UnauthorizedException } from '@utils/errors';

jest.mock('@utils', () => {
  const actualUtils = jest.requireActual('@utils');
  return {
    ...actualUtils,
    encryptPassword: jest.fn().mockResolvedValue('encryptedPassword'),
    checkPassword: jest.fn().mockResolvedValue(true),
    generateAccessToken: jest.fn().mockReturnValue('accessToken'),
  };
});

describe('AuthServiceImpl', () => {
  let repository: jest.Mocked<UserRepository>;
  let service: AuthServiceImpl;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      delete: jest.fn(),
      getRecommendedUsersPaginated: jest.fn(),
      getById: jest.fn(),
      getByEmailOrUsername: jest.fn(),
      updateProfileImage: jest.fn(),
      searchUsersByUsername: jest.fn()
    } as unknown as jest.Mocked<UserRepository>;
    service = new AuthServiceImpl(repository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('signup', () => {
    it('should sign up successfully', async () => {
      const data: SignupInputDTO = { email: 'a@b.com', username: 'user', password: 'pass' };
      repository.getByEmailOrUsername.mockResolvedValue(null);
      repository.create.mockResolvedValue({ id: '1', email: data.email, username: data.username } as any);
      const result = await service.signup(data);
      expect(utils.encryptPassword).toHaveBeenCalledWith(data.password);
      expect(repository.create).toHaveBeenCalledWith({ ...data, password: 'encryptedPassword' });
      expect(utils.generateAccessToken).toHaveBeenCalledWith({ userId: '1' });
      expect(result).toEqual({ token: 'accessToken' });
    });

    it('should throw ConflictException if user exists', async () => {
      const data: SignupInputDTO = { email: 'a@b.com', username: 'user', password: 'pass' };
      repository.getByEmailOrUsername.mockResolvedValue({} as any);
      await expect(service.signup(data)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const data: LoginInputDTO = { email: 'a@b.com', password: 'pass' };
      const user = { id: '1', password: 'hashed' } as any;
      repository.getByEmailOrUsername.mockResolvedValue(user);
      (utils.checkPassword as jest.Mock).mockResolvedValue(true);
      const result = await service.login(data);
      expect(repository.getByEmailOrUsername).toHaveBeenCalledWith(data.email, data.username);
      expect(utils.checkPassword).toHaveBeenCalledWith(data.password, user.password);
      expect(utils.generateAccessToken).toHaveBeenCalledWith({ userId: user.id });
      expect(result).toEqual({ token: 'accessToken' });
    });

    it('should throw NotFoundException if user not found', async () => {
      const data: LoginInputDTO = { email: 'a@b.com', password: 'pass' };
      repository.getByEmailOrUsername.mockResolvedValue(null);
      await expect(service.login(data)).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if password incorrect', async () => {
      const data: LoginInputDTO = { email: 'a@b.com', password: 'pass' };
      const user = { id: '1', password: 'hashed' } as any;
      repository.getByEmailOrUsername.mockResolvedValue(user);
      (utils.checkPassword as jest.Mock).mockResolvedValue(false);
      await expect(service.login(data)).rejects.toThrow(UnauthorizedException);
    });
  });
}); 