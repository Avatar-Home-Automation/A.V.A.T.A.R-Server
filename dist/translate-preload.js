const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  onInitApp: (callback) => ipcRenderer.on('initApp', callback),
  quitTranslate: (arg) => ipcRenderer.invoke('quit-translate', arg),
  getMsg: (arg) => ipcRenderer.invoke('get-msg', arg),
  translate: (arg) => ipcRenderer.invoke('translate', arg)
})