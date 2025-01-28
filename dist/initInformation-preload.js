const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    onMessage: (callback) => ipcRenderer.on('set-init-message', callback),
    onTitle: (callback) => ipcRenderer.on('set-init-title', callback)
})