export class AdminBanException extends Error {
  constructor() {
    super('Cannot ban admin user');
    this.name = this.constructor.name;
  }
}
