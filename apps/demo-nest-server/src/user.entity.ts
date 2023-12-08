import { Entity, Enum, Property, Unique } from '@mikro-orm/core';
import { BaseEntity } from 'shared/database/base.entity';

export const Role = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

@Entity()
export class User extends BaseEntity {
  @Unique()
  @Property()
  email: string;

  @Enum(() => Role)
  role: Role;

  @Property()
  firstName: string;

  @Property()
  lastName: string;

  constructor(email: string, role: Role, firstName: string, lastName: string) {
    super();
    this.email = email;
    this.role = role;
    this.firstName = firstName;
    this.lastName = lastName;
  }
}
