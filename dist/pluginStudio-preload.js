const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onInitApp: (callback) => ipcRenderer.on('initApp', callback),
  propertySaved: (callback) => ipcRenderer.on('property-Saved', callback),
  activePlugin: (callback) => ipcRenderer.on('active-Plugin', callback),
  refreshPlugin: (callback) => ipcRenderer.on('refresh-Plugin', callback),
  returnDeletePlugin: (callback) => ipcRenderer.on('delete-Plugin', callback),
  documentationError: (callback) => ipcRenderer.on('documentation-error', callback),
  getAudit: (arg) => ipcRenderer.on('getAudit', arg),
  getFixResult: (arg) => ipcRenderer.on('getFixResult', arg),
  getUpdatePackageResult: (arg) => ipcRenderer.on('getUpdatePackageResult', arg),
  auditLabel: (arg) => ipcRenderer.on('auditLabel', arg),
  auditPlugin: () => ipcRenderer.invoke('auditPlugin'),
  pluginVulnerabilityFix: (arg) => ipcRenderer.invoke('pluginVulnerabilityFix', arg),
  pluginUpdatePackage: (arg) => ipcRenderer.invoke('pluginUpdatePackage', arg),
  getMsg: (arg) => ipcRenderer.invoke('get-msg', arg),
  getInfoPackage: (arg) => ipcRenderer.invoke('getInfoPackage', arg),
  getPlugins: (arg) => ipcRenderer.invoke('get-Plugins', arg),
  savePluginPropertyFile: (arg) => ipcRenderer.invoke('save-plugin-property-file', arg),
  showStudioEditorMenu: (arg) => ipcRenderer.invoke('show-StudioEditorMenu', arg),
  showPluginMenu: (arg) => ipcRenderer.invoke('show-PluginMenu', arg),
  showVsCode: (arg) => ipcRenderer.invoke('show-vsCode'),
  openImageFile: () => ipcRenderer.invoke('dialog:openImageFile'),
  createNewPlugin: (arg) => ipcRenderer.invoke('createNewPlugin', arg),
  isPluginExist: (arg) => ipcRenderer.invoke('isPluginExist', arg),
  quitStudio: (arg) => ipcRenderer.invoke('quitStudio', arg)
})

