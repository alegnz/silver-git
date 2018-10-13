const simpleGit = require('simple-git/promise')();

const Remote = require('./remote');
const File = require('./file');
const GitStatus = require('./gitStatus');

class Workspace {

  constructor(path) {
    // TODO check if it's a git repo
    if (path != '') {
      this.path = path;
      simpleGit.cwd(this.path);
    }

    this.currentBranch;
    this.localBranches = [];
    this.tags = [];
    this.stashes = [];

    this.remotes = new Map();
    this.files = new Map();
  }

  async initialize() {
    await this._initializeBranches();
    await this._initializeTags();
    await this._initializeFiles();
    await this._initializeStashes();
  }

  async _initializeBranches() {
    this.localBranches = [];
    this.remotes.clear();

    // Gets branches
    let branchSummary = null;
    try {
      branchSummary = await simpleGit.branch();
    } catch (err) {
      console.error(err);
      return;
    }

    branchSummary.all.forEach(name => {
      if (name.startsWith("remotes/")) {
        // Remote branches
        let [, remoteName, branchName] = name.split('/');

        // If that remote does'n exists yet, it creates it and add it to the map
        let remote = this.remotes.get(remoteName);
        if (!remote) {
          remote = new Remote(remoteName);
          this.remotes.set(remoteName, remote);
        }

        remote.addBranch(branchName);
      } else {
        // Local branches
        this.localBranches.push(name);

        if (name == branchSummary.current) {
          this.currentBranch = name;
        }
      }
    });
  }

  async _initializeTags() {
    this.tags = [];

    // Gets tags
    let tagList = null;
    try {
      tagList = await simpleGit.tags();
    } catch (err) {
      console.error(err);
      return;
    }

    tagList.all.forEach(tagName => this.tags.push(tagName));
  }

  async _initializeFiles() {
    this.files.clear();

    let statusSummary = null;
    try {
      statusSummary = await simpleGit.status();
    } catch (err) {
      console.error(err);
      return;
    }

    statusSummary.files.forEach(fileStatusSummary => {
      let indexStatus = GitStatus.getByGitTag(fileStatusSummary.index);
      let workingDirStatus = GitStatus.getByGitTag(fileStatusSummary.working_dir);

      let file = new File(fileStatusSummary.path, indexStatus, workingDirStatus);

      this.files.set(file.getPath(), file);
    });
  }

  async _initializeStashes() {
    this.stashes = [];

    let listLogSummary = null;
    try {
      listLogSummary = await simpleGit.stashList();
    } catch (err) {
      console.error(err);
      return;
    }

    listLogSummary.all.forEach(listLogLine => this.stashes.push(listLogLine.message));
  }

  getCurrentBranch() {
    return this.currentBranch;
  }

  getLocalBranches() {
    return this.localBranches;
  }

  getRemotes() {
    return this.remotes;
  }

  getTags() {
    return this.tags;
  }

  getFiles() {
    return this.files;
  }

  getStashes() {
    return this.stashes;
  }

  async getDiffAll() {
    // TODO add lines for untracked files
    return await this._getDiff();
  }

  async getDiffIndex(filePath) {
    return await this._getDiff(filePath, true);
  }

  async getDiffWorkingDir(filePath) {
    return await this._getDiff(filePath);
  }

  async _getDiff(filePath, cached) {
    let diffParams = [];

    // Shows diff in index
    if (cached) {
      diffParams.push('--cached');
    }

    // If it receives a filePath, shows only that file
    if (filePath) {
      diffParams.push(filePath);
    }

    let diffText = '';
    try {
      diffText = await simpleGit.diff(diffParams);
    } catch (err) {
      console.error(err);
    }

    return diffText;
  }

  async stageFile(filePath) {
    // Stages the file
    await simpleGit.add(filePath);

    // Refreshes files
    await this._initializeFiles();
  }

  async stageAllFiles() {
    let fileNames = [];

    // Sets list of files to be added
    this.files.forEach(file => fileNames.push(file.getPath()));

    // Adds files
    try {
      await simpleGit.add(fileNames);
    } catch (err) {
      console.error(err);
    }

    // Refreshes files
    await this._initializeFiles();
  }

  async unstageFile(filePath) {
    // Unstages the file
    try {
      await simpleGit.reset(['HEAD', filePath]);
    } catch (err) {
      console.error(err);
    }

    // Refreshes files
    await this._initializeFiles();
  }

  async unstageAllFiles() {
    // Unstages files
    try {
      await simpleGit.reset(['HEAD']);
    } catch (err) {
      console.error(err);
    }

    // Refreshes files
    await this._initializeFiles();
  }
}

module.exports = Workspace;