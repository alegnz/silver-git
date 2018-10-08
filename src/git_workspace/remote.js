class Remote {
  constructor(name) {
    this.name = name;
    this.branches = [];
  }

  getName() {
    return this.name;
  }

  addBranch(branch) {
    this.branches.push(branch);
  }

  getBranches() {
    return this.branches;
  }
}

module.exports = Remote;