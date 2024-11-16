const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  onInitApp: (callback) => ipcRenderer.on('initApp', callback),
  quitTransfert: (arg) => ipcRenderer.send('quit-transfert', arg),
  getMsg: (arg) => ipcRenderer.invoke('get-msg', arg),
  transfertPlugin: (arg) => ipcRenderer.invoke('transfert-Plugin', arg),
})