const { contextBridge, ipcRenderer } = require('electron')

const API = {
  onHistoryFocus: (callback) =>
    ipcRenderer.on('on-history-focus', (event, args) => {
      callback(args)
    }),
  onNotes: (callback) =>
    ipcRenderer.on('on-notes', (event, args) => {
      callback(args)
    }),
  onTodayFocus: (callback) =>
    ipcRenderer.on('on-today-focus', (event, args) => {
      callback(args)
    }),
  saveFocus: (focusedSeconds) =>
    ipcRenderer.invoke('save-focus', focusedSeconds),
  showTime: (time) => ipcRenderer.send('show-time', time),
  showWindow: () => ipcRenderer.send('show-window'),
  updateNotes: (notes) => ipcRenderer.send('update-notes', notes),
}

contextBridge.exposeInMainWorld('api', API)
