const Workspace = require('./git_workspace/workspace.js');

$(document).ready(() => {
  $('#btnSavePath').click(initializeRepository);

  $('#btnChangePath').click(changeRepoVisibility);

  $('#btn-stage-all').click(stageAllFiles);
  $('#btn-unstage-all').click(unstageAllFiles);

  $('#open-terminal').click(changeTerminalVisibility);
  $('#btnMinimizeTerminal').click(changeTerminalVisibility);
});

function initializeRepository() {
  let path = $('#txtPath').val();

  changeRepoVisibility();

  workspace = new Workspace(path);

  workspace.initialize().then(() => {
    createBranchSection();
    refreshView();
  });
}

function refreshView() {
  createFileLists();

  workspace.getDiffAll().then(result => createDiffContent(result));
}

function createBranchSection() {
  // Cleans branches
  $('#localBranches').empty();
  $('#remoteBranches').empty();
  $('#tags').empty();

  let currentBranch = workspace.getCurrentBranch();

  // Sets current branch name in footer
  $('#current-branch span').text(currentBranch);

  // Shows local branches
  workspace.getLocalBranches().forEach(branchName => {
    let className = branchName == currentBranch ? 'current-branch' : '';

    let html = '<li class="' + className + '"><i class="fas fa-code-branch"></i>' + branchName + '</li>';

    $('#localBranches').append(html);
  });

  // Shows remotes
  workspace.getRemotes().forEach(remote => {
    let html = '<li>' + remote.name + '<ul id="remote-' + remote.name + '"></ul></li>';
    $('#remoteBranches').append(html);

    // Shows remote branches
    remote.getBranches().forEach((branchName) => {
      $('#remote-' + remote.name).append('<li><i class="fas fa-code-branch"></i>' + branchName + '</li>');
    });
  });

  // Shows tags
  workspace.getTags().forEach(tagName => {
    $('#tags').append('<li>' + tagName + '</li>');
  });
}

function createFileLists() {
  $('#wip').empty();
  $('#staging').empty();

  workspace.getFiles().forEach(file => {
    if (file.hasChangedInIndex()) {
      createFileElement(file.getPath(), file.getIndexStatus().desc, $('#staging'));
    }

    if (file.hasChangedInWorkingDir()) {
      createFileElement(file.getPath(), file.getWorkingDirStatus().desc, $('#wip'));
    }
  });
}

function createDiffContent(diffString) {
  // Cleans diff section
  $('#diff .section-content').empty();

  // Replace symbols to avoid show text as html
  diffString = diffString.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  let lines = diffString.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (line.startsWith('index') || line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) {
      // Ignores de line
      continue;
    }

    // File name
    if (line.startsWith('diff --git')) {
      // Cuts begin part
      let fileName = line.slice(line.indexOf('a/'));

      // Cuts end part
      fileName = fileName.slice(2, fileName.indexOf(' '));

      $('#diff .section-content').append('<div class="file-name">' + fileName + '</div>');
    } else {

      // TODO put all diff-line inside a container for each file

      let classLine = ' class="diff-line';
      let firstCharacter = 0;

      if (line.startsWith('+')) {
        classLine += ' line-added';
        firstCharacter = 1;
      } else if (line.startsWith('-')) {
        classLine += ' line-deleted';
        firstCharacter = 1;
      }

      classLine += '"';

      let htmlLine = '<div' + classLine + '>' + line.slice(firstCharacter) + '</div>';

      $('#diff .section-content').append(htmlLine);
    }

  }
}

function createFileElement(filePath, status, container) {
  let statusClass = 'file ' + status;

  let buttonClass = 'btn btn-';
  let buttonText;
  if (container.prop('id') == 'wip') {
    buttonClass += 'success';
    buttonText = '+';
  } else {
    buttonClass += 'danger';
    buttonText = '-';
  }

  let fileName = $('<span></span>');
  let button = $('<a></a>');
  let fileContainer = $('<div></div>');

  fileName.text(filePath);
  button.text(buttonText);
  button.addClass(buttonClass);
  fileContainer.addClass(statusClass);

  fileContainer.append(fileName, button);

  fileContainer.click(fileSelected);

  if (container.prop('id') == 'wip') {
    button.click(stageFile);
  } else {
    button.click(unstageFile);
  }

  container.append(fileContainer);
}

function fileSelected() {
  let fileName = $(this).children('span')[0].innerText;

  let diffFunction;
  if ($(this).parent().prop('id') == 'staging') {
    diffFunction = workspace.getDiffIndex(fileName);
  } else {
    diffFunction = workspace.getDiffWorkingDir(fileName);
  }

  diffFunction.then(result => createDiffContent(result));
}

function stageFile(aux) {
  let fileName = $(this).prev().text();

  workspace.stageFile(fileName)
    .then(() => refreshView());

  // Stops event propagation
  return false;
}

function unstageFile() {
  let fileName = $(this).prev().text();

  workspace.unstageFile(fileName)
    .then(() => refreshView());

  // Stops event propagation
  return false;
}

function stageAllFiles() {
  workspace.stageAllFiles()
    .then(() => refreshView());
}

function unstageAllFiles() {
  workspace.unstageAllFiles()
    .then(() => refreshView());
}

function changeRepoVisibility() {
  if ($('#txtPath').attr('disabled')) {
    $('#txtPath').removeAttr('disabled')
  } else {
    $('#txtPath').attr('disabled', 'disabled');
  }

  // Changes buttons' visibility
  $('#btnChangePath').toggleClass('hidden');
  $('#btnSavePath').toggleClass('hidden');
}

function changeTerminalVisibility() {
  $('#terminal').toggleClass('hidden');
}