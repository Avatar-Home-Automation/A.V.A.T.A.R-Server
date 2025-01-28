const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onInitApp: (callback) => ipcRenderer.on('initApp', callback)
})