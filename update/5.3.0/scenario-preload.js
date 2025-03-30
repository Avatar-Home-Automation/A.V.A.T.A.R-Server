const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    onInitScenario: (callback) => ipcRenderer.on('init-scenario', (_event, infos, interface) => callback(infos, interface)),
    validateCron: (arg) => ipcRenderer.invoke('validateCronExpression', arg),
    testTask: (arg) => ipcRenderer.invoke('scenario-testTask', arg),
    testSpeak: (arg) => ipcRenderer.invoke('scenario-testSpeak', arg),
    createScenario: (arg) => ipcRenderer.invoke('scenario-create', arg),
    removeScenario: (arg) => ipcRenderer.invoke('scenario-remove', arg),
    confirmRefresh: (arg) => ipcRenderer.invoke('scenario-confirmRefresh', arg),
    getJobInfo: (arg) => ipcRenderer.invoke('scenario-getJobInfo', arg),
    startCronJob: (arg) => ipcRenderer.invoke('scenario-startCronJob', arg),
    stopCronJob: (arg) => ipcRenderer.invoke('scenario-stopCronJob', arg),
    restartCronJob: (arg) => ipcRenderer.invoke('scenario-restartCronJob', arg),
    quitScenario: (arg) => ipcRenderer.invoke('scenario-quit', arg),
    getMsg: (arg) => ipcRenderer.invoke('get-msg', arg),
    translate: (arg) => ipcRenderer.invoke('translate-scenario', arg)
});