const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  onInitApp: (callback) => ipcRenderer.on('initApp', callback),
  quitReorder: (arg) => ipcRenderer.invoke('quit-reorderPlugins', arg),
  getPlugins: (arg) => ipcRenderer.invoke('get-Plugins', arg),
  getMsg: (arg) => ipcRenderer.invoke('get-msg', arg),
  saveReorderPlugins: (arg) => ipcRenderer.invoke('save-Reorder-Plugins', arg)
})