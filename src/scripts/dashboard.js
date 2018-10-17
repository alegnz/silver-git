const Workspace = require('./git_workspace/workspace.js');

$(document).ready(() => {
  $('#btnSavePath').click(initializeRepository);

  $('#btnChangePath').click(changeRepoVisibility);

  $('#branches .accordion-header').click(changeBranchListVisibility);

  // Header buttons
  $('#btn-stage-all').click(stageAllFiles);
  $('#btn-unstage-all').click(unstageAllFiles);
  $('#btn-stash').click(stashWorkingDirectory);

  $('#txtCommitTitle').keyup(refreshCommitButton);
  $('#btnCommit').click(commit);

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

function changeRepoVisibility() {
  if ($('#txtPath').attr('disabled')) {
    $('#txtPath').removeAttr('disabled');

    $('#localBranches').addClass('collapsed');
    $('#remoteBranches').addClass('collapsed');
    $('#tags').addClass('collapsed');
  } else {
    $('#txtPath').attr('disabled', 'disabled');
  }

  // Changes buttons' visibility
  $('#btnChangePath').toggleClass('hidden');
  $('#btnSavePath').toggleClass('hidden');
}

function changeBranchListVisibility() {
  $(this).toggleClass('collapsed');
}

function refreshView() {
  createFileLists();
  createStashList();
  refreshCommitButton();

  workspace.getDiffAll().then(result => createDiffContent(result, true));
}

function refreshCommitButton() {
  let btnDisabled = !(workspace.hasFilesInStagingArea() && $('#txtCommitTitle').val().trim() != '');

  if (btnDisabled) {
    $('#btnCommit').addClass('disabled');
  } else {
    $('#btnCommit').removeClass('disabled');
  }
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
    createBranchElement(branchName, $('#localBranches'), currentBranch);
  });

  // Shows remotes
  workspace.getRemotes().forEach(remote => {
    let html =
      '<div class="accordion-header hoverable">' +
      '<i class="fas fa-caret-down""></i>' +
      '<i class="fas fa-caret-right"></i>' +
      remote.name +
      '</div> ' +
      '<ul id="remote-' + remote.name + '" class="accordion-body"></ul>';

    $('#remoteBranches').append(html);

    // Shows remote branches
    remote.getBranches().forEach(branchName =>
      createBranchElement(branchName, $('#remote-' + remote.name))
    );
  });

  // Adds click event to local branch name parts
  $('#localBranches .accordion-header').click(changeBranchListVisibility);

  // Adds click event to accordion-header remote name elements
  $('#remoteBranches .accordion-header').click(changeBranchListVisibility);

  // Shows tags
  workspace.getTags().forEach(tagName => {
    $('#tags').append('<li class="hoverable">' + tagName + '</li>');
  });

  // Expands accordion sections
  $('#branches .section-content>.accordion-header').removeClass('collapsed');
}

function createBranchElement(branchName, parentElement, currentBranch) {
  createBranchPartElement(branchName, branchName, parentElement, currentBranch);
}

function createBranchPartElement(tail, branchName, parentElement, currentBranch) {
  let branchSections = tail.split('/');

  // End of the name
  if (branchSections.length == 1) {
    let className = 'hoverable' + (branchName == currentBranch ? ' current-branch' : '');

    // let liElement = $('<li><i class="fas fa-code-branch"></i>' + branchSections[0] + '</li>');
    let liElement = $('<li class="' + className + '"><i class="fas fa-code-branch"></i>' + tail + '</li>');
    parentElement.append(liElement);

    addPaddingToBranchElement(liElement);
  } else {
    // If there is more than 1 part, add the first part to the tree (if it doesn't exists yet)
    let branchBody = $('#branch-body-' + branchSections[0]);
    if (!branchBody.length) {
      let branchHeader = $('<li class="branch-header accordion-header hoverable">' +
        '<i class="fas fa-caret-down""></i>' +
        '<i class="fas fa-caret-right"></i>' +
        branchSections[0] +
        '<ul class="accordion-body"></ul>' +
        '</li>');

      branchBody = $('<ul id="branch-body-' + branchSections[0] + '" class="accordion-body"></ul>');

      parentElement.append(branchHeader);
      parentElement.append(branchBody);

      addPaddingToBranchElement(branchHeader);
    }

    // Keep going with the rest of the name
    createBranchPartElement(branchSections.slice(1).join('/'), branchName, branchBody, currentBranch);
  }
}

function addPaddingToBranchElement(liElement) {
  if (liElement.parent().prev().hasClass('branch-header')) {
    let previousPadding = Number(liElement.parent().prev().css('padding-left').slice(0, -2));
    let currentPadding = previousPadding + 20 + 'px';

    liElement.css('padding-left', currentPadding);
  }
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

function createStashList() {
  $('#stash .section-content').empty();

  workspace.getStashes().forEach(stashMessage => {
    let html = '<div class="hoverable">' +
      '<i class="fas fa-archive"></i>' +
      stashMessage +
      '</div>';

    $('#stash .section-content').append(html);
  })
}

function createDiffContent(diffString, workingDirectory) {
  // Cleans diff section
  $('#diff .section-content').empty();

  // If there is no lines, the working directory is clean
  if (workingDirectory && diffString.length == 0) {
    let htmlNoContent = '<div class="no-content"><div>Working directory clean</div></div>';

    $('#diff .section-content').append(htmlNoContent);
    return;
  }

  // Replace symbols to avoid show text as html
  diffString = diffString.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  let lines = diffString.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (line.startsWith('index') || line.startsWith('+++') || line.startsWith('---')) {
      // Ignores de line
      continue;
    }

    let htmlLine;

    // File name
    if (line.startsWith('diff --git')) {
      // Cuts begin part
      let fileName = line.slice(line.indexOf('a/'));

      // Cuts end part
      fileName = fileName.slice(2, fileName.indexOf(' '));

      htmlLine = '<div class="file-name">' + fileName + '</div>';
    } else if (line.startsWith('@@')) {
      htmlLine = '<div class="chunk-header">' + line + '</div>';
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

      htmlLine = '<div' + classLine + '>' + line.slice(firstCharacter) + '</div>';
    }

    $('#diff .section-content').append(htmlLine);
  }
}

function createFileElement(filePath, status, container) {
  let statusClass = 'file hoverable ' + status;

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
  if ($(this).hasClass('selected')) {
    // If the file was selected, unselect it and shows all files in diff section
    $(this).removeClass('selected');
    diffFunction = workspace.getDiffAll();
  } else {
    // If the file wasn't selected, unselect other files and shows only the selected file
    $('.file').removeClass('selected');
    $(this).addClass('selected');

    if ($(this).parent().prop('id') == 'staging') {
      diffFunction = workspace.getDiffIndex(fileName);
    } else {
      diffFunction = workspace.getDiffWorkingDir(fileName);
    }
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

function stashWorkingDirectory() {
  // Uses commit title content as stash message
  let message = $('#txtCommitTitle').val();

  workspace.stash(message)
    .then(() => refreshView());
}

function commit() {
  if ($('#btnCommit').hasClass('disabled')) {
    return;
  }

  workspace.commit($('#txtCommitTitle').val(), $('#txtCommitMessage').val())
    .then(() => refreshView());

  // Cleans commit textboxes
  $('#txtCommitTitle').val('');
  $('#txtCommitMessage').val('');
}

function changeTerminalVisibility() {
  $('#terminal').toggleClass('hidden');
}