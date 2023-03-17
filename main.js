// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, Menu, Tray } = require('electron')
const path = require('path')
const fs = require('fs')

// global parameters
let mainWindow
let tray
const dataPath = path.join(__dirname, 'data')
const focusFile = path.join(dataPath, 'focus.json')
const historyFile = path.join(dataPath, 'history.json')
const notesFile = path.join(dataPath, 'notes.txt')

// methods
function getToday() {
  var today = new Date()
  var day = String(today.getDate()).padStart(2, '0')
  var month = String(today.getMonth() + 1).padStart(2, '0') //January is 0!
  var year = today.getFullYear()

  return year + '-' + month + '-' + day
}

function getDefaultFocusData() {
  var defaultFocusData = { sessions: 0, seconds: 0 }
  defaultFocusData.date = getToday()
  return defaultFocusData
}

function createDataFiles() {
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath)
  }
  if (!fs.existsSync(focusFile)) {
    fs.writeFileSync(focusFile, JSON.stringify(getDefaultFocusData()))
  }
  if (!fs.existsSync(historyFile)) {
    fs.writeFileSync(historyFile, '[]')
  }
  if (!fs.existsSync(notesFile)) {
    fs.writeFileSync(notesFile, '')
  }
}

function checkFocusDataDate() {
  var focusData = fs.readFileSync(focusFile)
  focusData = JSON.parse(focusData)
  if (focusData.date !== getToday()) {
    fs.writeFileSync(focusFile, JSON.stringify(getDefaultFocusData()))
  }
}

// menu
Menu.setApplicationMenu(null)

// main window method
const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 400,
    minHeight: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  // and load the index.html of the app.
  mainWindow.loadFile('dist/index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  mainWindow.webContents.on('did-finish-load', () => {
    const focusData = fs.readFileSync(focusFile)
    const historyData = fs.readFileSync(historyFile)
    const notes = fs.readFileSync(notesFile, 'utf8')

    mainWindow.webContents.send('on-today-focus', JSON.parse(focusData))
    mainWindow.webContents.send('on-history-focus', JSON.parse(historyData))
    mainWindow.webContents.send('on-notes', notes)
  })
}

// tray method
const createTray = () => {
  tray = new Tray(path.join(__dirname, 'icons/circle.png'))
  tray.setIgnoreDoubleClickEvents(true)
  tray.on('click', () => {
    mainWindow.show()
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createDataFiles()
  checkFocusDataDate()
  createWindow()
  createTray()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMain.handle('save-focus', async (event, focusedSeconds) => {
  var focusData = fs.readFileSync(focusFile)
  var historyData = fs.readFileSync(historyFile)
  focusData = JSON.parse(focusData)
  historyData = JSON.parse(historyData)

  focusData.seconds = focusData.seconds + focusedSeconds
  focusData.sessions += 1

  const isToday = (el) => el.date === getToday()
  const todayIndex = historyData.findIndex(isToday)
  if (todayIndex !== -1) {
    historyData.splice(todayIndex, 1)
  }
  historyData.unshift(focusData)
  historyData = historyData.slice(0, 10)

  fs.writeFileSync(focusFile, JSON.stringify(focusData))
  fs.writeFileSync(historyFile, JSON.stringify(historyData))

  return { focus: focusData, history: historyData }
})

ipcMain.on('update-notes', (event, notes) => {
  fs.writeFileSync(notesFile, notes)
})

ipcMain.on('show-window', () => {
  mainWindow.show()
})

ipcMain.on('show-time', (event, time) => {
  tray.setTitle(time)
})
