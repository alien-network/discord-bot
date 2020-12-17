export default class Command {
    constructor(name, description, usage) {
      this.name = name;
      this.description = description;
      this.usage = usage;
    }

    execute() {
      throw new Error('Execute not implemented');
    }
  }