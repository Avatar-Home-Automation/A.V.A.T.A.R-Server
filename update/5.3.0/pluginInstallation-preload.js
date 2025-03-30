const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    onMessage: (callback) => ipcRenderer.on('set-message', callback),
    onTitle: (callback) => ipcRenderer.on('set-title', callback),
    onInstallationDone: (callback) => ipcRenderer.on('installation-done', callback),
    quitPluginInstallation: (arg) => ipcRenderer.invoke('quitPluginInstallation', arg),
    onInitApp: (callback) => ipcRenderer.on('initApp', callback),
})
