const { app, BrowserWindow, ipcMain, webContents } = require('electron');
const requests = require("request");
const { HOST, TOKEN } = require('./config');

if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  // This opens dev tool
  // mainWindow.webContents.openDevTools();
  ipcMain.on("getProblem", () => {
    requests.get(`${HOST}/problem`, {
      headers: {
        "Procon-Token": TOKEN
      }
    }, (err, res, body) => {
      mainWindow.webContents.send("responseProblem", {status: res.statusCode, body});
    });
  });

  ipcMain.on("submitAnswer", (e, data) => {
    requests.post(`${HOST}/answer`, {
      headers: {
        "Procon-Token": TOKEN,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    }, (err, res, body) => {
      mainWindow.webContents.send("responseAnswer", {status: res.statusCode, body});
    });
  });
};


app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});


// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

