import { CannotBanAdminException } from './exceptions/cannot-ban-admin.exception';
import { Role, User } from './user.entity';

describe('UserEntity', () => {
  it('user should be active when created', () => {
    const user = new User('test@example.org', Role.USER, 'test', 'test');

    expect(user.isActive()).toBe(true);
  });

  it('user should be inactive when banned', () => {
    const user = new User('test@example.org', Role.USER, 'test', 'test');
    const now = new Date();

    user.ban(now);

    expect(user.isActive()).toBe(false);
  });

  it('banning an admin should throw an error', () => {
    const user = new User('test@example.org', Role.ADMIN, 'test', 'test');
    const now = new Date();

    expect(() => user.ban(now)).toThrow(CannotBanAdminException);
  });
});
