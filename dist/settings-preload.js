const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  onInitApp: (callback) => ipcRenderer.on('initApp', callback),
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  openScreenSaverFile: () => ipcRenderer.invoke('dialog:openScreenSaverFile'),
  quitSettings: (arg) => ipcRenderer.invoke('quit-settings', arg),
  applyProperties: (arg) => ipcRenderer.invoke('apply-properties', arg),
  getMsg: (arg) => ipcRenderer.invoke('get-msg', arg)
})
