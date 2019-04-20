const electron = require('electron');
const { app, BrowserWindow, protocol } = electron;
const URL = require('url');
const path = require('path');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;


function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({ width: 800, height: 600 });

    win.setMenu(null);

    const PROTOCOL = 'file';

    electron.protocol.interceptFileProtocol(PROTOCOL, (request, callback) => {
        // // Strip protocol
        let url = request.url.substr(PROTOCOL.length + 1);

        // Build complete path for node require function
        url = path.join(__dirname, url);

        // Replace backslashes by forward slashes (windows)
        url = url.replace(/\\/g, '/');
        url = path.normalize(url).split('?')[0];

        console.log(url);
        callback({ path: url });
    });

    // and load the index.html of the app.

    win.loadURL(URL.format({
        pathname: 'index.html',
        slashes: true,
        protocol: PROTOCOL + ':',
    }));

    // Open the DevTools.
    // win.webContents.openDevTools();

    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow()
    }
});