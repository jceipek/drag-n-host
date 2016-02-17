'use strict';

const remote = require('electron').remote;
const fs = require('fs');
const serverMaker = require('http-server');
const shell = require('electron').shell;
window.$ = window.jQuery = require('jquery');
const blast = require('blast-text');
const velocity = require('velocity-animate');

const STATE = {
  path: null
, serverInstance: null
, port: 8000
, dragReferenceCounter: 0
};
const HOST = 'localhost';

const dropzone = document.getElementsByClassName('drop-zone')[0];
const dropUIs = document.getElementsByClassName('js-drop-ui');
const hostingUIs = document.getElementsByClassName('js-hosting-ui');
const browseButton = document.getElementsByClassName('js-browse')[0];
const stopButton = document.getElementsByClassName('js-stop-hosting')[0];
const pathElem = document.getElementsByClassName('js-path')[0];
const jsPortSelector = document.getElementsByClassName('js-port-selector')[0];
const jsURLReadout = document.getElementsByClassName('js-url-readout')[0];
const ellipsis = document.getElementsByClassName('js-ellipsis')[0];

require('electron').webFrame.setZoomLevelLimits(1, 1)


$('.js-ellipsis').blast({ delimiter: "character" }).velocity({color: '#F00'}, 1000);


jsURLReadout.addEventListener('click', function (e) {
  e.preventDefault();
  shell.openExternal(this.textContent);
});

jsPortSelector.addEventListener('keydown', function (e) {
  if (e.which === 13) {
    jsPortSelector.blur();
  }
});

jsPortSelector.addEventListener('blur', function (e) {
  var validated = parseInt(this.value, 10);
  if (validated < 1025) {
    validated = 8000;
  } else if (validated > 65535) {
    validated = 65535;
  }
  this.value = validated;
  STATE.port = validated;
  jsURLReadout.textContent = 'http://'+HOST+':'+validated;
});

browseButton.addEventListener('click', function (e) {
  remote.dialog.showOpenDialog(remote.getCurrentWindow(), { properties: [ 'openFile', 'openDirectory' ]}, function (picked) {
    if (picked !== undefined) {
      startHosting(picked[0]);
    }
  });
});

stopButton.addEventListener('click', function (e) {
  if (STATE.serverInstance !== null) {
    STATE.serverInstance.close();
    STATE.serverInstance = null;
  }
  removeClasses(dropUIs, 'hidden');
  addClasses(hostingUIs, 'hidden');
}, false);

function ignoreEvent (e) {
  e.preventDefault();
  e.stopPropagation();
}

function handleDragStart (e) {
  STATE.dragReferenceCounter++;
  dropzone.classList.add('dragging');
  ignoreEvent(e);
}

function handleDragStop (e) {
  STATE.dragReferenceCounter--;
  if (STATE.dragReferenceCounter === 0) {
    dropzone.classList.remove('dragging');
  }
  ignoreEvent(e);
}

window.addEventListener("dragover", ignoreEvent, false);

window.addEventListener("dragstart", handleDragStart, false);
window.addEventListener("dragend", handleDragStop, false);

document.addEventListener("dragleave", handleDragStop, false);

document.addEventListener("dragenter", handleDragStart, false);
document.addEventListener("dragexit", handleDragStop, false);


window.addEventListener("drop", function(e) {
  var length = e.dataTransfer.files.length;
  if (length !== 1) { return; }
  var file = e.dataTransfer.files[0];
  var filePath = file.path;
  var isDirectory = fs.lstatSync(filePath).isDirectory();
  if (isDirectory) {
    startHosting(filePath);
  }
  handleDragStop(e);
}, false);

function logFn (a,b,c) {
  console.log(a,b,c);
}

function removeClasses (elems, classname) {
  for (var i = elems.length - 1; i >= 0; i--) {
    elems[i].classList.remove(classname);
  }
}

function addClasses (elems, classname) {
  for (var i = elems.length - 1; i >= 0; i--) {
    elems[i].classList.add(classname);
  }
}

function startHosting (folderPath) {
  if (STATE.serverInstance !== null) { return; }
  console.log(folderPath);
  STATE.serverInstance = serverMaker.createServer({root: folderPath, cache:-1, logFn: logFn, cors: true});
  STATE.serverInstance.listen(STATE.port, HOST, function () {
    pathElem.textContent = folderPath;
    addClasses(dropUIs, 'hidden');
    removeClasses(hostingUIs, 'hidden');
  });
}