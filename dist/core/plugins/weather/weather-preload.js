const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    onInitWeather: (callback) => ipcRenderer.on('onInit-weather', (_event, value) => callback(value)),
    getMsg: (value) => ipcRenderer.invoke('weather-msg', value),
    quit: () => ipcRenderer.send('weather-quit')
})