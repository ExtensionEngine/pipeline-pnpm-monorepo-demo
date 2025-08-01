import type { EntityManager } from '@mikro-orm/core';
import { faker } from '@faker-js/faker/locale/en';
import { Seeder } from '@mikro-orm/seeder';

export class UserSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const admin = await em.insert('user', {
      email: 'admin@example.org',
      role: 'admin',
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
    });
    const users = [...Array(10)].map((_, index) => {
      const email = index > 0 ? `user${index}@example.org` : 'user@example.org';
      return em.insert('user', {
        email,
        role: 'user',
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
      });
    });

    await Promise.all(users);
  }
}
