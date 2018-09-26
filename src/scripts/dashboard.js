const git = require('simple-git');

$(document).ready(() => {
  $('#btnSavePath').click(initializeRepository);

  $('#btnChangePath').click(changeRepoVisibility);
});

function initializeRepository() {
  let path = $('#txtPath').val();

  changeRepoVisibility();

  // Cleans branches
  $('#localBranches').empty();
  $('#remoteBranches').empty();
  $('#tags').empty();

  // Shows local and remote branches
  git(path).branch((error, branchSummary) => {
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
    } else {
      console.log('An error ocurred');
      console.log(error);
    }
  });

  // Shows tags
  git(path).tags((error, tagList) => {
    if (!error) {
      tagList.all.forEach((tagName) => {
        $('#tags').append('<li>' + tagName + '</li>');
      });
    }
  });

  git(path).status((error, statusSummary) => {
    console.log('status');
    console.log(statusSummary);

    if (!error) {
      // Cleans wip and staging areas
      $('#wip').empty();
      $('#staging').empty();

      statusSummary.files.forEach((fileStatusSummary) => {
        console.log(fileStatusSummary);

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
