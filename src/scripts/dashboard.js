const git = require('simple-git')();

$(document).ready(() => {
  $('#btnSavePath').click(initializeRepository);

  $('#btnChangePath').click(changeRepoVisibility);

  $('#open-terminal').click(changeTerminalVisibility);
  $('#btnMinimizeTerminal').click(changeTerminalVisibility);
});

function initializeRepository() {
  let path = $('#txtPath').val();

  // TODO check if it's a git repo
  if (path != '') {
    git.cwd(path);
  }

  changeRepoVisibility();

  createBranchSection();

  createFileLists();

  createDiffSection();
}

function createBranchSection() {
  // Cleans branches
  $('#localBranches').empty();
  $('#remoteBranches').empty();
  $('#tags').empty();

  // Shows local and remote branches
  git.branch((error, branchSummary) => {
    if (!error) {
      branchSummary.all.forEach((branchName) => {
        if (branchName.startsWith("remotes/")) {
          let parts = branchName.split('/');

          let remoteName = parts[1];

          // If there isn't a remote element with that name yet, it creates one
          if ($('#remote-' + remoteName).length == 0) {
            let html = '<li>' + remoteName + '<ul id="remote-' + remoteName + '"></ul></li>';

            $('#remoteBranches').append(html);
          }

          // Removes "remotes" string and remote name
          parts.splice(0, 2);

          let remoteBranchName = parts.join('/');
          $('#remote-' + remoteName).append('<li><i class="fas fa-code-branch"></i>' + remoteBranchName + '</li>')
        } else {
          let html = '<li' + (branchName == branchSummary.current ? ' class="current-branch"' : '') + '>'
              + '<i class="fas fa-code-branch"></i>' + branchName + '</li>';

          $('#localBranches').append(html);
        }
      });

      // Sets current branch name in footer
      console.log(branchSummary.current);
      $('#current-branch span').text(branchSummary.current);
    } else {
      console.log('An error ocurred');
      console.log(error);
    }
  });

  // Shows tags
  git.tags((error, tagList) => {
    if (!error) {
      tagList.all.forEach((tagName) => {
        $('#tags').append('<li>' + tagName + '</li>');
      });
    }
  });
}

function createFileLists() {
  git.status((error, statusSummary) => {

    if (!error) {
      // Cleans wip and staging areas
      $('#wip').empty();
      $('#staging').empty();

      statusSummary.files.forEach((fileStatusSummary) => {
        if (fileStatusSummary.working_dir != ' ') {
          createFileElement(fileStatusSummary.path, fileStatusSummary.working_dir, $('#wip'));
        }

        if (fileStatusSummary.index != ' ' && fileStatusSummary.index != '?') {
          createFileElement(fileStatusSummary.path, fileStatusSummary.index, $('#staging'));
        }
      });
    } else {
      console.log('An error ocurred');
    }
  });
}

function createDiffSection() {
  git.diff((error, result) => {
    if (!error) {
      // Cleans diff section
      $('#diff .section-content').empty();

      result = result.replace(/</g, '&lt;').replace(/>/g, '&gt;');

      let lines = result.split('\n');

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
    } else {
      console.log('An error ocurred');
    }
  });
}

function createFileElement(filePath, status, container) {
  let statusClass;
  if (status == '?') {
    statusClass = 'file untracked';
  } else if (status == 'M') {
    statusClass = 'file modified';
  } else if (status == 'A') {
    statusClass = 'file added';
  } else if (status == 'D') {
    statusClass = 'file deleted';
  } else if (status = 'R') {
    statusClass = 'file renamed';
  } else if (status == 'C') {
    statusClass = 'file copied';
  } else if (status = 'U') {
    statusClass = 'file updated-unmerged';
  }

  let htmlPath = '<p class="' + statusClass + '">' + filePath + '</p>';

  container.append(htmlPath);
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
