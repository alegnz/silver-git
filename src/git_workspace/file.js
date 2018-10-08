const GitStatus = require('./gitStatus');

class File {
  // TODO setear las propiedades necesarias para armar las lists de wip y staging

  constructor(path, indexStatus, workingDirStatus) {
    this.path = path;
    this.indexStatus = indexStatus;
    this.workingDirStatus = workingDirStatus;
  }

  getPath() {
    return this.path;
  }

  getIndexStatus() {
    return this.indexStatus;
  }

  getWorkingDirStatus() {
    return this.workingDirStatus;
  }

  hasChangedInWorkingDir() {
    return this.workingDirStatus !== null &&
      this.workingDirStatus !== GitStatus.UNMODIFIED;
  }

  hasChangedInIndex() {
    return this.indexStatus !== null &&
      this.indexStatus !== GitStatus.UNMODIFIED &&
      this.indexStatus !== GitStatus.UNTRACKED;
  }
}

module.exports = File;