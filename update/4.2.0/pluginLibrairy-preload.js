const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    onRepos: (callback) => ipcRenderer.on('set-repos', callback),
    onPluginInstalled: (callback) => ipcRenderer.on('plugin-installed', callback),
    closeInitPluginLibrairy: (arg) => ipcRenderer.invoke('closeInitPluginLibrairy', arg),
    initPluginInstallation: (arg) => ipcRenderer.invoke('initPluginInstallation', arg),
    pluginLibrairyParameters: (arg) => ipcRenderer.invoke('pluginLibrairyParameters', arg),
    quitPluginLibrairy: (arg) => ipcRenderer.invoke('quitPluginLibrairy', arg),
    getMsg: (arg) => ipcRenderer.invoke('get-msg', arg)
})