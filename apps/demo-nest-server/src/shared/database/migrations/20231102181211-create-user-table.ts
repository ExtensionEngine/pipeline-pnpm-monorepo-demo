import { Migration } from '@mikro-orm/migrations';

const TABLE_NAME = 'user';
const roles = ['admin', 'user'];

export class CreateUserTable extends Migration {
  async up(): Promise<void> {
    const knex = this.getKnex();
    const createUserTable = knex.schema.createTable(TABLE_NAME, table => {
      table.increments('id').primary();
      table.string('email').notNullable().unique();
      table.enum('role', roles);
      table.string('first_name').notNullable();
      table.string('last_name').notNullable();
      table
        .timestamp('created_at', { useTz: true })
        .notNullable()
        .defaultTo(knex.fn.now());
      table
        .timestamp('updated_at', { useTz: true })
        .notNullable()
        .defaultTo(knex.fn.now());
      table.timestamp('deleted_at', { useTz: true }).nullable();
    });
    this.addSql(createUserTable.toQuery());
  }

  async down(): Promise<void> {
    this.addSql(this.getKnex().schema.dropTable(TABLE_NAME).toQuery());
  }
}
