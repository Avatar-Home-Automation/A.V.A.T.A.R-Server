const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  onInitApp: (callback) => ipcRenderer.on('initApp', callback),
  quitSettings: (arg) => ipcRenderer.invoke('quit-settings', arg),
  applyProperties: (arg) => ipcRenderer.invoke('apply-properties', arg),
  openImageFile: () => ipcRenderer.invoke('dialog:openImageRoomFile'),
  getMsg: (arg) => ipcRenderer.invoke('get-msg', arg),
  clientSettingsSaved: (callback) => ipcRenderer.on('client-settings-saved', callback)
})