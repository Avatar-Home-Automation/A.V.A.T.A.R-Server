const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  onInitApp: (callback) => ipcRenderer.on('initApp', callback),
  quitEncrypt: (arg) => ipcRenderer.invoke('quit-encrypt', arg),
  encryptString: (arg) => ipcRenderer.invoke('encryptString', arg),
  decryptString: (arg) => ipcRenderer.invoke('decryptString', arg),
  saveEncrytPasswdWin: (arg) => ipcRenderer.invoke('saveEncrytPasswdWin', arg),
  deleteEncrytPasswdWin: (arg) => ipcRenderer.invoke('deleteEncrytPasswdWin', arg),
  getMsg: (arg) => ipcRenderer.invoke('get-msg', arg)
})