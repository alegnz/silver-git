class Stash {
  constructor(index, message) {
    this.index = index;
    this.message = message;
    this.files = [];
  }

  getIndex() {
    return this.index;
  }

  getMessage() {
    return this.message;
  }

  addFile(file) {
    this.files.push(file);
  }

  getFiles() {
    return this.files;
  }

  getName() {
    return 'stash@{' + this.index + '}';
  }
}

module.exports = Stash;