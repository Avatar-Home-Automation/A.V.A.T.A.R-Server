const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    onGithubParams: (callback) => ipcRenderer.on('set-github-params', callback),
    quitPluginLibrairyParameters: (arg) => ipcRenderer.invoke('quitPluginLibrairyParameters', arg),
    applyProperties: (arg) => ipcRenderer.invoke('applyPluginLibrairyParameters', arg),
    getMsg: (arg) => ipcRenderer.invoke('get-msg', arg)
})