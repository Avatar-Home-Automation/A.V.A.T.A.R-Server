const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  onInitApp: (callback) => ipcRenderer.on('initApp', callback),
  quitInformation: (arg) => ipcRenderer.invoke('quit-information', arg),
  getMsg: (arg) => ipcRenderer.invoke('get-msg', arg),
  showAvatarGithub: (arg) => ipcRenderer.invoke('showAvatarGithub', arg),
  changeLog: () => ipcRenderer.invoke('changeLog'),
  getInfoPackage: (arg) => ipcRenderer.invoke('getInfoPackage', arg),
  showInfoWindow: (arg) => ipcRenderer.invoke('showInfoWindow', arg),
  destroyInitInfo: (arg) => ipcRenderer.invoke('destroyInitInfo', arg)
})