const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    onInitApp: (callback) => ipcRenderer.on('initApp', callback),
    getGithubConnexion: (arg) => ipcRenderer.invoke('get-github-connexion', arg),
    saveGithubLogin: (arg) => ipcRenderer.invoke('save-github-login', arg),
    closeGithubLogin: (arg) => ipcRenderer.invoke('close-github-login', arg),
    errorRemenberGithubLogin: (arg) => ipcRenderer.invoke('error-remenber-github-login', arg),
    getMsg: (arg) => ipcRenderer.invoke('get-msg', arg)
})