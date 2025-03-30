const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    onInitApp: (callback) => ipcRenderer.on('initApp', callback),
    onMessage: (callback) => ipcRenderer.on('set-message', callback),
    onTitle: (callback) => ipcRenderer.on('set-title', callback)
})
