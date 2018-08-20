const fs = require('fs');
const path = require('path');
const pug = require('pug');

let View = function(viewName) {
  let templatePath = path.join(__dirname, '../view', viewName + '.pug');
  let template = pug.compileFile(templatePath);

  this.toHtml = function(data) {
    return template(data);
  };
};

module.exports = View;
