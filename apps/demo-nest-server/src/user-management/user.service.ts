import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { User } from './user.entity';
import { UserExistsException } from './exceptions/user-exists.exception';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    private em: EntityManager,
    @InjectRepository(User)
    private repository: EntityRepository<User>,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    const { email, role, firstName, lastName } = createUserDto;
    const existingUser = await this.repository.findOne({ email });
    if (existingUser) throw new UserExistsException(email);
    const user = new User(email, role, firstName, lastName);
    await this.em.persistAndFlush(user);
  }
}
