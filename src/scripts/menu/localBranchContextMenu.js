const Workspace = require('../../git_workspace/workspace.js');

const {
  remote
} = require('electron');
const {
  Menu,
  MenuItem
} = remote;

class LocalBranchContextMenu {
  setWorkspace(workspace) {
    this.workspace = workspace;
  }

  show(branchName) {
    let menu = Menu.buildFromTemplate(this._createBranchTemplate(branchName));

    menu.popup({
      window: remote.getCurrentWindow()
    });
  }

  _createBranchTemplate(branchName) {
    return [{
        id: 'pullBranch',
        label: 'Pull',
        click() {
          workspace.pullBranch()
        }
      },
      {
        id: 'pushBranch',
        label: 'Push',
        click() {
          workspace.pushBranch()
        }
      },
      {
        type: 'separator'
      },
      {
        id: 'createBranch',
        label: 'Create branch',
        click() {
          workspace.createBranch()
        }
      },
      {
        id: 'createTag',
        label: 'Create tag',
        click() {
          workspace.createTag()
        }
      },
      {
        type: 'separator'
      },
      {
        id: 'deleteBranch',
        label: 'Delete ' + branchName,
        click() {
          workspace.deleteBranch()
        }
      },
      {
        id: 'renameBranch',
        label: 'Rename ' + branchName,
        click() {
          workspace.renameBranch()
        }
      }
    ];
  }
}

module.exports = LocalBranchContextMenu;