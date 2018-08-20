const Emitter = require('events').EventEmitter;
const util = require('util');
const path = require('path');
const View = require('./view');

let App = function() {
  this.on('view-selected', viewName => {
    let view = new View(viewName);
    this.emit('rendered', view.toHtml);
  })
}

util.inherits(App, Emitter);

module.exports = new App();
