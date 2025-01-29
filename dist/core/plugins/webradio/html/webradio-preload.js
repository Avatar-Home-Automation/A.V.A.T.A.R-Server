const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    onInitWebRadio: (callback) => ipcRenderer.on('onInit-webradio', (_event, value) => callback(value)),
    reloadWebRadio: () => ipcRenderer.invoke('webradio-reload'),
    getList:() => ipcRenderer.invoke('webradio-liste'),
    getConfig:() => ipcRenderer.invoke('webradio-config'),
    searchRadio:(value) => ipcRenderer.invoke('webradio-search', value),
    searchTop:() => ipcRenderer.invoke('webradio-top'),
    getSelected: (value) => ipcRenderer.invoke('webradio-selected', value),
    getMsg: (value) => ipcRenderer.invoke('webradio-msg', value),
    setPosition: () => ipcRenderer.send('webradio-position'),
    quit: () => ipcRenderer.send('webradio-quit')
})