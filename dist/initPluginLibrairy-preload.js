const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    onMessage: (callback) => ipcRenderer.on('set-message', callback),
    onTitle: (callback) => ipcRenderer.on('set-title', callback)
})
