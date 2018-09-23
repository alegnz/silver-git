const git = require('simple-git');

$(document).ready(() => {
  $('#btnSavePath').click(initializeRepository);

  $('#btnChangePath').click(changeRepoVisibility);
});

function initializeRepository() {
  let path = $('#txtPath').val();

  changeRepoVisibility();

  console.log('path: ' + path);

  // Cleans branches
  $('#localBranches').empty();
  $('#remoteBranches').empty();
  $('#tags').empty();

  // Shows local and remote branches
  git(path).branch((error, branchSummary) => {
    if (!error) {
      console.log(branchSummary);

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
          let html = '<li' + (branchName == branchSummary.current ? ' class="currentBranch"' : '') + '>'
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
