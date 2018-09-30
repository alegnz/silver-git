const electron = require('electron');
const { app, BrowserWindow } = electron;

let mainWindow;

app.on('ready', _ => {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700
  });

  mainWindow.loadURL(`file://${__dirname}/main.html`);

  mainWindow.on('close', _=> {
    mainWindow = null;
  });
})
