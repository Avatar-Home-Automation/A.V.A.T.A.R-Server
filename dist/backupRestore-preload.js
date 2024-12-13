const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  onInitApp: (callback) => ipcRenderer.on('initApp', callback),
  quit: (arg) => ipcRenderer.invoke('quit-backupRestore', arg),
  openBackupFolder: () => ipcRenderer.invoke('dialog:openBackupFolder'),
  applyBackupRestore: (arg) => ipcRenderer.invoke('applyBackupRestore', arg),
  getMsg: (arg) => ipcRenderer.invoke('get-msg', arg)
})