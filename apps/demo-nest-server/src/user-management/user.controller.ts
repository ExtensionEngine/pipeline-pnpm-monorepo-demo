import { Body, ConflictException, Controller, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';
import { UserExistsException } from './exceptions/user-exists.exception';

@Controller('users')
export class UserController {
  constructor(private readonly userAppService: UserService) {}

  @Post()
  createUser(@Body() dto: CreateUserDto) {
    return this.userAppService.createUser(dto).catch(err => {
      if (err instanceof UserExistsException) {
        throw new ConflictException(err.message);
      }
      throw err;
    });
  }
}
