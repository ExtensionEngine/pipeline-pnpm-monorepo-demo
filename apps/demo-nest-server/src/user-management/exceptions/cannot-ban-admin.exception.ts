export class CannotBanAdminException extends Error {
  constructor() {
    super('Cannot ban admin user');
    this.name = this.constructor.name;
  }
}
