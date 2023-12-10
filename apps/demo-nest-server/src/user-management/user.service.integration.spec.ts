import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { DatabaseModule } from 'shared/database/database.module';
import { ConfigModule } from '@nestjs/config';
import databaseConfig from 'config/database.config';
import { Role, User } from './user.entity';
import { UserExistsException } from './exceptions/user-exists.exception';

describe('UserService', () => {
  let module: TestingModule;
  let em: EntityManager;
  let service: UserService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ load: [databaseConfig] }),
        DatabaseModule.forRoot({
          allowGlobalContext: true,
          debug: false,
        }),
        MikroOrmModule.forFeature([User]),
      ],
      controllers: [],
      providers: [UserService],
    }).compile();
    em = module.get(EntityManager);
    service = module.get(UserService);
    const orm = module.get(MikroORM);
    const generator = orm.getSchemaGenerator();
    await generator.clearDatabase();
  });

  afterEach(async () => {
    await module.close();
  });

  it('createUser should create a new user', async () => {
    const dto = {
      email: 'test@example.org',
      role: Role.USER,
      firstName: 'first',
      lastName: 'last',
    };

    await service.createUser(dto);

    const dbUser = await em.fork().findOne(User, { email: dto.email });

    expect(dbUser).toHaveProperty('id');
    expect(dbUser).toMatchObject(dto);
  });

  it('createUser should thrown an error if user already exists', async () => {
    const dto = {
      email: 'test@example.org',
      role: Role.USER,
      firstName: 'first',
      lastName: 'last',
    };
    await service.createUser(dto);

    expect(service.createUser(dto)).rejects.toThrow(UserExistsException);
  });
});
