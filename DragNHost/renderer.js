'use strict';

const Remote = require('electron').remote;
const Fs = require('fs');
const ServerMaker = require('http-server');
const HTTPStatus = require('http-status');
const Shell = require('electron').shell;
window.$ = window.jQuery = require('jquery');
const Blast = require('blast-text');
const Velocity = require('velocity-animate');

const STATE = {
  path: null
, serverInstance: null
, port: 8000
, dragReferenceCounter: 0
};
const HOST = 'localhost';

require('electron').webFrame.setZoomLevelLimits(1, 1); // Prevent pinch to zoom in window

function blurOnReturn (e) {
  if (e.which === 13) { this.blur(); }
}

function openSelectionInBrowser (e) {
  Shell.openExternal(this.textContent);
  e.preventDefault();
}

function ignoreEvent (e) {
  e.preventDefault();
  e.stopPropagation();
}

function handleDragStart (e) {
  STATE.dragReferenceCounter++;
  if (STATE.dragReferenceCounter == 1) {
    Velocity(actionCircle, { scaleX: 1.05, scaleY: 1.05 }, { duration: 500, loop: true/*complete: complete, easing: [ 300, 8 ]*/ });
  }
  actionCircle.classList.add('dragging');
  ignoreEvent(e);
}

function handleDragStop (e) {
  STATE.dragReferenceCounter--;
  if (STATE.dragReferenceCounter === 0) {
    Velocity(actionCircle, 'stop');
    Velocity(actionCircle, { scaleX: 1, scaleY: 1 }, { duration: 200 });
    actionCircle.classList.remove('dragging');
  }
  ignoreEvent(e);
}

function logFn (req, res, error) {
  // const date = new Date().toUTCString();
  const logElem = document.createElement("div");
  if (error) {
    logElem.classList.add('log-message-error');
    logElem.textContent = [/*date,*/ req.method, req.url, error.status.toString(), error.message].join(' ');
  } else { // Success
    logElem.classList.add('log-message');
    logElem.textContent = [/*date,*/ req.method, req.url /*, req.headers['user-agent']*/].join(' ');
  }
  // jsHostingLog.appendChild(logElem);
  jsHostingLog.insertBefore(logElem, jsHostingLog.firstChild);
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
  STATE.serverInstance = ServerMaker.createServer({root: folderPath, cache:-1, logFn: logFn, cors: true});
  STATE.serverInstance.listen(STATE.port, HOST, function () {
    pathElem.textContent = folderPath;
    addClasses(readyUIs, 'hidden');
    removeClasses(hostingUIs, 'hidden');
  });
}

const actionCircle = document.getElementsByClassName('js-action-circle')[0];
const readyUIs = document.getElementsByClassName('js-ready-ui');
const hostingUIs = document.getElementsByClassName('js-hosting-ui');
const browseButton = document.getElementsByClassName('js-browse')[0];
const stopButton = document.getElementsByClassName('js-stop-hosting')[0];
const pathElem = document.getElementsByClassName('js-path')[0];
const jsPortSelector = document.getElementsByClassName('js-port-selector')[0];
const jsURLReadout = document.getElementsByClassName('js-url-readout')[0];
const jsHostingLog = document.getElementsByClassName('js-hosting-log')[0];
const ellipsis = document.getElementsByClassName('js-ellipsis')[0];


// $('.js-ellipsis').blast({ delimiter: "character" }).velocity({color: '#F00'}, 1000);

jsPortSelector.addEventListener('keydown', blurOnReturn);

jsPortSelector.addEventListener('blur', function (e) {
  var validated = parseInt(this.value, 10);
  if (validated < 1025 || isNaN(validated)) {
    validated = 8000;
  } else if (validated > 65535) {
    validated = 65535;
  }
  this.value = validated;
  STATE.port = validated;
  jsURLReadout.textContent = 'http://'+HOST+':'+validated;
});

jsURLReadout.addEventListener('click', openSelectionInBrowser);

stopButton.addEventListener('click', function (e) {
  if (STATE.serverInstance !== null) {
    STATE.serverInstance.close();
    STATE.serverInstance = null;
  }
  removeClasses(readyUIs, 'hidden');
  addClasses(hostingUIs, 'hidden');
}, false);


window.addEventListener("dragover", ignoreEvent, false);
window.addEventListener("dragstart", handleDragStart, false);
window.addEventListener("dragend", handleDragStop, false);
document.addEventListener("dragleave", handleDragStop, false);
document.addEventListener("dragenter", handleDragStart, false);
document.addEventListener("dragexit", handleDragStop, false);
window.addEventListener("drop", function(e) {
  handleDragStop(e);
  var length = e.dataTransfer.files.length;
  if (length !== 1) { return; }
  var file = e.dataTransfer.files[0];
  var filePath = file.path;
  var isDirectory = Fs.lstatSync(filePath).isDirectory();
  if (isDirectory) {
    startHosting(filePath);
  }
}, false);

browseButton.addEventListener('click', function (e) {
  Remote.dialog.showOpenDialog( Remote.getCurrentWindow()
                              , { properties: [ 'openDirectory' ] }
                              , function (picked) {
    if (picked !== undefined) { startHosting(picked[0]); }
  });
});