const GitStatus = {
  UNMODIFIED: {
    desc: 'unmodified',
    git: ' '
  },
  UNTRACKED: {
    desc: 'untracked',
    git: '?'
  },
  MODIFIED: {
    desc: 'modified',
    git: 'M'
  },
  ADDED: {
    desc: 'added',
    git: 'A'
  },
  DELETED: {
    desc: 'deleted',
    git: 'D'
  },
  RENAMED: {
    desc: 'renamed',
    git: 'R'
  },
  COPIED: {
    desc: 'copied',
    git: 'C'
  },
  UPDATED_UNMERGED: {
    desc: 'updated-unmerged',
    git: 'U'
  },

  getByGitTag: function(gitLabel) {
    for (prop in this) {
      if (!(GitStatus[prop] instanceof Function) && GitStatus[prop].git == gitLabel) {
        return GitStatus[prop];
      }
    }

    console.error('There is no status with ' + gitLabel + ' label!');
    return null;
  }
};

module.exports = GitStatus;