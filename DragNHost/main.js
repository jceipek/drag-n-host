'use strict';

const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const dialog = electron.dialog;
const openAboutWindow = require('about-window').default;
const join = require('path').join;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 500, height: 400});

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function () {

  const Menu = require('menu');

  const appName = "Drag N' Host";//app.getName();
  const aboutMenu = { label: 'About'
                    , click: function() {
                        openAboutWindow({ icon_path: join(__dirname, 'icon.png')
                                        , copyright: "Crafted by Julian Ceipek"
                                        , bug_report_url: 'https://github.com/jceipek/drag-n-host/issues'
                                        })
                      }
                    };

  const helpMenu = { label: 'Help'
                   , role: 'help'
                   , submenu: [ { label: 'Usage'
                                , click: function() { require('shell').openExternal('https://github.com/jceipek/drag-n-host') }
                                }
                              ]
                   };

  if (process.platform == 'darwin') {
    aboutMenu.label = 'About ' + appName;
  } else {
    helpMenu.submenu.push(aboutMenu);
  }

  var template = [
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo'
        , accelerator: 'CmdOrCtrl+Z'
        , role: 'undo'
        }
      , { label: 'Redo'
        , accelerator: 'Shift+CmdOrCtrl+Z'
        , role: 'redo'
        }
      , { type: 'separator' }
      , { label: 'Cut'
        , accelerator: 'CmdOrCtrl+X'
        , role: 'cut'
        }
      , { label: 'Copy'
        , accelerator: 'CmdOrCtrl+C'
        , role: 'copy'
        }
      , { label: 'Paste'
        , accelerator: 'CmdOrCtrl+V'
        , role: 'paste'
        }
      , { label: 'Select All'
        , accelerator: 'CmdOrCtrl+A'
        , role: 'selectall'
        },
      ]
    }
  , {
      label: 'View',
      submenu: [
        { label: 'Toggle Full Screen'
        , accelerator: (function() {
            if (process.platform == 'darwin')
              return 'Ctrl+Command+F';
            else
              return 'F11';
          })()
        , click: function(item, focusedWindow) {
            if (focusedWindow)
              focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
          }
        },
      ]
    }
  , { label: 'Window'
      , role: 'window'
      , submenu: [
        { label: 'Minimize'
        , accelerator: 'CmdOrCtrl+M'
        , role: 'minimize'
        }
      , { label: 'Close'
        , accelerator: 'CmdOrCtrl+W'
        , role: 'close'
        }
      ]
    }
  , helpMenu
  ];

  if (process.platform == 'darwin') {
    template.unshift({
      label: appName,
      submenu: [ aboutMenu
               , { type: 'separator' }
               , { label: 'Services'
                 , role: 'services'
                 , submenu: []
                 }
               , { type: 'separator' }
               , { label: 'Hide ' + appName
                 , accelerator: 'Command+H'
                 , role: 'hide'
                 }
               , { label: 'Hide Others'
                 , accelerator: 'Command+Shift+H'
                 , role: 'hideothers:'
                 }
               , { label: 'Show All'
                 , role: 'unhide:'
                 }
               , { type: 'separator' }
               , { label: 'Quit'
                 , accelerator: 'Command+Q'
                 , click: function() { app.quit(); }
                 }
               ]
    });
    // Window menu.
    template[3].submenu.push(
      { type: 'separator' }
    , { label: 'Bring All to Front'
      , role: 'front'
      }
    );
  }

  var menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  createWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});