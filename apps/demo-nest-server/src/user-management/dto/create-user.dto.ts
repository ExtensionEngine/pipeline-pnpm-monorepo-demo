import { Role } from '../user.entity';

export class CreateUserDto {
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
}
