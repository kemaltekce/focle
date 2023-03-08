const { contextBridge, ipcRenderer } = require('electron')

const API = {
  onTodayFocus: (callback) =>
    ipcRenderer.on('on-today-focus', (event, args) => {
      callback(args)
    }),
  onHistoryFocus: (callback) =>
    ipcRenderer.on('on-history-focus', (event, args) => {
      callback(args)
    }),
  saveFocus: (focusedSeconds) =>
    ipcRenderer.invoke('save-focus', focusedSeconds),
}

contextBridge.exposeInMainWorld('api', API)
