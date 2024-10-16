const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onInitApp: (callback) => ipcRenderer.on('initApp', callback),
  exit: (arg) => ipcRenderer.invoke('exitPluginWidgets', arg),
  getWidgetImage: (arg) => ipcRenderer.invoke('getWidgetImage', arg),
  getWidgetImages: (arg) => ipcRenderer.invoke('getWidgetImages', arg),
  getPersonalWidgetImage: () => ipcRenderer.invoke('getPersonalWidgetImage'),
  deleteWidgetImage: (arg) => ipcRenderer.invoke('deleteWidgetImage', arg),
  saveWidget: (arg) => ipcRenderer.invoke('saveWidget', arg),
  deleteWidget: (arg) => ipcRenderer.invoke('deleteWidget', arg),
  getMsg: (arg) => ipcRenderer.invoke('get-msg', arg),
  getPeriphValues: (arg) => ipcRenderer.invoke('getPeriphValues', arg)
})