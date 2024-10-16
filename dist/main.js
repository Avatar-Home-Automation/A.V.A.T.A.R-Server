import {app, dialog, BrowserWindow, safeStorage, globalShortcut, ipcMain, Menu, shell } from 'electron';
import fs from 'fs-extra';
import * as path from 'node:path';
import 'babel-polyfill';
import _ from 'underscore';
import { exec } from 'node:child_process';
import { CronJob } from 'cron';
import moment from 'moment';
import got from 'got';
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

await import ('file:///'+path.resolve(__dirname, 'message.js'));
import { getMenu } from './contextualMenus.js';
import * as avatar from './avatar.js';  
import * as githubLib from './githubRepos.js';
import * as lang from './languages.js';

// windows
let mainWindow;
let settingsWindow;
let clientSettingsWindow;
let pluginStudioWindow;
let pluginLibrairyWindow;
let loginWindow;
let initPluginLibrairy;
let pluginInstallationWindow;
let pluginLibrairyParametersWindow;
let reorderPluginsWindow;
let pluginWidgetsWindow;
let encryptWindow;
let backupRestoreWindow;
let translateWindow;
let tranfertPluginWindow;

// Property files
let appProperties;
let interfaceProperties;
let appPropertiesOld;
let interfacePropertiesOld;
let nodesProperties = [];

// internal
let BCP47;
let fullScreen;
let loginSaved;
let github;

await setProperties();

// Localisation language
let language;
let preferredLanguage;
// Global
global.L = new Language();

async function setProperties() {
  appProperties = fs.readJsonSync(path.resolve(__dirname, 'core/Avatar.prop'), { throws: false });
  if (!appProperties) {
    appProperties = fs.readJsonSync(path.resolve(__dirname, 'assets/config/default/Avatar.prop'), { throws: false });
  }
  appPropertiesOld = appProperties;

  interfaceProperties = fs.readJsonSync(path.resolve(__dirname, 'assets/config/interface.prop'), { throws: false });
  if (!interfaceProperties) {
    interfaceProperties = fs.readJsonSync(path.resolve(__dirname, 'assets/config/default/interface.prop'), { throws: false });
  }
  interfacePropertiesOld = interfaceProperties;

  BCP47 = fs.readJsonSync(path.resolve(__dirname, 'locales/BCP47.loc'), { throws: false });

  const folder = path.resolve(__dirname, 'assets/config/nodes');
  if (fs.existsSync(folder)) {
    fs.readdirSync(folder).forEach((file) => {
      if (file.endsWith('.json')) {
        const fullFilePath = folder+'/'+file;
        const nodeJSON = fs.readJsonSync(fullFilePath, { throws: false });
        const node = file.replace('.json', '');
        nodesProperties.push(_.object([node], [{"properties": nodeJSON }]));
      }
    })
  }
}


// AVATAR Main window
function createWindow () {

  if (mainWindow) return mainWindow.show();

  fs.readJson(path.resolve(__dirname, 'assets/config/nodes/Main.json'), (err, mainStyle) => {

      var style = {
        show: false,
        width: 800,
        height: 600,
        fullscreen: false,
        webPreferences: {
          preload: path.normalize(path.resolve(__dirname, 'main-preload.js')),
          nodeIntegration: false,
          contextIsolation: true
        },
        icon: path.normalize(path.resolve(__dirname, 'assets/images/Avatar.png'))
      };

      if (err || !mainStyle) {
        shell.trashItem(path.resolve(__dirname, 'assets', 'config', 'nodes'));
      } else {
        style.fullscreen = fullScreen = mainStyle.fullscreen;
        style.width = mainStyle.width;
        style.height = mainStyle.height;
      }
      style.title = L.get("init.name") + ' ' + appProperties.version;

      mainWindow = new BrowserWindow(style);
      mainWindow.loadFile(path.resolve(__dirname, 'assets/html/index.html'));

      // loggers
      global.logger = (type, msg) => {mainWindow.webContents.send('update-logger', type+'@@@'+msg)};
      global.loggerConsole = (msg) => {mainWindow.webContents.send('update-loggerConsole', msg)};

      mainWindow.setMenu(null);

      globalShortcut.register('F11', () => {
        if (settingsWindow) settingsWindow.webContents.openDevTools();
        if (pluginStudioWindow) pluginStudioWindow.webContents.openDevTools();
        if (clientSettingsWindow) clientSettingsWindow.webContents.openDevTools();
        if (pluginWidgetsWindow) pluginWidgetsWindow.webContents.openDevTools();
        if (reorderPluginsWindow) reorderPluginsWindow.webContents.openDevTools();
        if (pluginLibrairyWindow) pluginLibrairyWindow.webContents.openDevTools();
        if (encryptWindow) encryptWindow.webContents.openDevTools();
        if (loginWindow) loginWindow.webContents.openDevTools();
        if (pluginLibrairyParametersWindow) pluginLibrairyParametersWindow.webContents.openDevTools();
        if (backupRestoreWindow) backupRestoreWindow.webContents.openDevTools();
        if (translateWindow) translateWindow.webContents.openDevTools();
        if (tranfertPluginWindow) tranfertPluginWindow.webContents.openDevTools();
        mainWindow.webContents.openDevTools();
      });

      mainWindow.once('ready-to-show', async () => {
        await mainWindow.webContents.send('initApp', {interface: interfaceProperties, nodes: nodesProperties});
        await appInit();
        await mainWindow.webContents.send('initWidgets');
        mainWindow.show();

        // Global Interface
        Avatar.Interface.documentation = () => documentation();
        Avatar.Interface.addClientNode = (node) => mainWindow.webContents.send('addClientNode', node);
        Avatar.Interface.removeClientNode = (node) => mainWindow.webContents.send('removeClientNode', node);
        Avatar.Interface.appReload = async () => mainWindow.webContents.send('to-appReload');
        Avatar.Interface.appExit = async () => mainWindow.webContents.send('to-appExit');
        Avatar.Interface.fullscreen = async () => {fullScreen = !fullScreen; mainWindow.setFullScreen(fullScreen)}
        Avatar.Interface.settings = async () => settings();
        Avatar.Interface.clientSettings = async (arg) => clientSettings(arg);
        Avatar.Interface.pluginStudio = async () => pluginStudio();
        Avatar.Interface.tooltipSpeak = async (arg) => mainWindow.webContents.send('tooltip-Speak', arg);
        Avatar.Interface.minimizeScreen = async () => mainWindow.minimize();
        Avatar.Interface.reloadAppClients = async (server, clients) => appClientsAction(server, clients, 'restart', 'to-appReload');
        Avatar.Interface.exitAppClients = async (server, clients) => appClientsAction(server, clients, 'quit', 'to-appExit');
        Avatar.Interface.actionOnClient = async (action, client, set) => actionOnClient(action, client, set);
        Avatar.Interface.clientInfo = async (client) => clientInfo(client);
        Avatar.Interface.shutdown = async (server, clients) => shutdown(server, clients);
        Avatar.Interface.setPluginLibrairy = async () => setPluginLibrairy();
        Avatar.Interface.vsCode = async () => showVsCode();
        Avatar.Interface.reorderPlugins = async () => reorderPlugins();
        Avatar.Interface.widgetStudio = async () => widgetStudio();
        Avatar.Interface.refreshWidgetInfo = async (arg) => {
          try { mainWindow.webContents.send('newPluginWidgetInfo', arg); } catch (err) {};
        }
        Avatar.Interface.backupRestore = async () => backupRestore();
        Avatar.Interface.showRestartBox = async (arg) => mainWindow.webContents.send('showRestartBox', arg);
        Avatar.Interface.mainWindow = () => {return mainWindow};
        Avatar.Interface.dialog = () => {return dialog};
        Avatar.Interface.BrowserWindow = (param, htmlfile, isMenu) => {
          const win = new BrowserWindow(param);
          win.loadFile(htmlfile);
          if (!isMenu) win.removeMenu();
          return Promise.resolve(win);
        };
        Avatar.Interface.ipcMain = () => {return ipcMain};
        Avatar.Interface.Menu = () => {return Menu};
        Avatar.Interface.shell = () => {return shell};
        Avatar.Interface.ipcMain = () => {return ipcMain};
        Avatar.Interface.globalShortcut = () => {return globalShortcut};
        
        autoRestart();
        screenSaver();
        checkUpdate();
      });

      mainWindow.on('closed', () => {
        fs.removeSync(path.resolve(__dirname, 'tmp/download'));
      })

      ipcMain.handle('get-msg', async (event, arg) => {return L.get(arg)});
      ipcMain.handle('show-Menu' , async (event, arg) => {return showMenu(arg)});
      ipcMain.handle('show-StudioEditorMenu' , async (event, arg) => {showStudioEditorMenu(event, arg)});
      ipcMain.handle('show-PluginMenu' , async (event, arg) => {showPluginMenu(event, arg.id, arg.name)});
      ipcMain.handle('quitStudio', (event, arg) => {
        pluginStudioWindow.destroy();
        if (arg === true) mainWindow.webContents.send('properties-changed');
      })
      ipcMain.handle('quit-backupRestore', (event, arg) => {
        backupRestoreWindow.destroy();
        if (arg === true) mainWindow.webContents.send('properties-changed');
      });
      ipcMain.handle('quit-translate', () => translateWindow.destroy());
      ipcMain.handle('translate', async (event, arg) => {return translateSentence(arg)});
      ipcMain.handle('applyBackupRestore', async (event, arg) => {return await applyBackupRestore(arg)});
      ipcMain.handle('getVirtualClients', async (event, arg) => { return Avatar.getVirtualClients(arg)});
      ipcMain.handle('getPluginWidgets', async (event, arg) => {return await Avatar.pluginLibrairy.getPluginWidgets()});
      ipcMain.handle('readyToShow', async (event) => {return await Avatar.pluginLibrairy.readyToShow()});
      ipcMain.handle('get-Plugins', async (event, arg) => { return await Avatar.pluginLibrairy.getPlugins()});
      ipcMain.handle('isCloseApp', async () => { return await isCloseApp()});
      ipcMain.handle('closeApp', async (event, arg) => {closeApp(arg, true)});
      ipcMain.handle('reloadApp', async (event, arg) => {closeApp(arg, false)});
      ipcMain.handle('dialog:openBackupFolder', handleBackupFolderOpen);
      ipcMain.handle('dialog:openFile', handleFileOpen);
      ipcMain.handle('dialog:openScreenSaverFile', handleScreenSaverFileOpen);
      ipcMain.handle('dialog:openImageFile', handleImageFileOpen);
      ipcMain.handle('dialog:openImageRoomFile', handleImageRoomFileOpen);
      ipcMain.handle('getWidgetImage', async (event, arg) => { return await Avatar.pluginLibrairy.getWidgetImage(arg) });
      ipcMain.handle('getWidgetImages', async (event, arg) => { return await Avatar.pluginLibrairy.getWidgetImages(arg) });
      ipcMain.handle('getPersonalWidgetImage', getPersonalWidgetImage);
      ipcMain.handle('deleteWidgetImage', async (event, arg) => {return await Avatar.pluginLibrairy.deleteWidgetImage(arg)});
      ipcMain.handle('deleteWidget', async (event, arg) => {return await deleteWidget(arg)});
      ipcMain.handle('saveWidget', async (event, arg) => {return await saveWidget(arg)});
      ipcMain.handle('show-vsCode', async (event, arg) => {showVsCode()});
      ipcMain.handle('createNewPlugin', async (event, arg) => {return await Avatar.pluginLibrairy.createNewPlugin(arg)});
      ipcMain.handle('isPluginExist', async (event, arg) => {return await Avatar.pluginLibrairy.isPluginExist(arg)});
      ipcMain.handle('pluginWidgetAction', async (event, arg) => { return await Avatar.pluginLibrairy.pluginWidgetAction(arg)});
      ipcMain.handle('refreshPluginWidgetInfo', async (event, arg) => {return await Avatar.pluginLibrairy.refreshPluginWidgetInfo(arg)});
      ipcMain.handle('getNewValuePluginWidgetById', async (event, arg) => {return await Avatar.pluginLibrairy.getNewValuePluginWidgetById(arg)});
      ipcMain.handle('getPeriphValues', async (event, arg) => {return await Avatar.pluginLibrairy.getPeriphValues(arg)});
      ipcMain.handle('encryptString', async (event, arg) => {return await Avatar.encrypt(arg)});
      ipcMain.handle('decryptString', async (event, arg) => {return await Avatar.decrypt(arg)});
      ipcMain.handle('saveEncrytPasswdWin', async (event, arg) => {return await Avatar.APIFunctions.saveEncrytPasswdWin(safeStorage, arg)});
      ipcMain.handle('deleteEncrytPasswdWin', async () => {return await Avatar.APIFunctions.deleteEncrytPasswdWin()});
      ipcMain.handle('exitPluginWidgets', () => pluginWidgetsWindow.destroy());
      ipcMain.handle('get-github-connexion', async (event, arg) => {
        let result = await github.testConnexion(arg); 
        return result ? true : false
      })
      ipcMain.handle('error-remenber-github-login', async (event, arg) => {
        let options = {
            type: 'question',
            title: L.get("loginPluginLibrairy.cryptoTitle"),
            message: L.get("loginPluginLibrairy.cryptoError"),
            detail: L.get("loginPluginLibrairy.cryptoErrorDetail"),
            buttons: [L.get("loginPluginLibrairy.cryptoErrorYes"), L.get("loginPluginLibrairy.cryptoErrorNo")]
        };

        let answer = dialog.showMessageBoxSync(loginWindow, options);
        return answer === 0 ? true : false; 
      })                                                              
      ipcMain.handle('save-github-login', async (event, arg) => {return await github.savelogin(safeStorage, arg)});
      ipcMain.handle('close-github-login', (event, arg) => {loginSaved = arg; loginWindow.destroy()});
      ipcMain.handle('closeInitPluginLibrairy', () => initPluginLibrairy.destroy());
      ipcMain.handle('initPluginInstallation', async (event, arg) => initPluginInstallation(arg));
      ipcMain.handle('quitPluginLibrairy', (event, arg) => {
        pluginLibrairyWindow.destroy(); 
        if (arg === true) mainWindow.webContents.send('properties-changed')
      })
      ipcMain.handle('quitPluginInstallation', () => pluginInstallationWindow.destroy());
      ipcMain.handle('quitPluginLibrairyParameters', () => pluginLibrairyParametersWindow.destroy());
      ipcMain.handle('quit-encrypt', () => encryptWindow.destroy());
      ipcMain.on('quit-transfert', () => tranfertPluginWindow.destroy());
      ipcMain.handle('quit-reorderPlugins', (event, arg) => {
        reorderPluginsWindow.destroy();
        if (arg === true) mainWindow.webContents.send('properties-changed');
      })
      ipcMain.handle('transfert-Plugin', async (event, arg) => {return await tranfertPlugin(arg)});
      ipcMain.handle('pluginLibrairyParameters', async () => pluginLibrairyParameters());
      ipcMain.handle('save-Reorder-Plugins', async (event, arg) => {return await Avatar.pluginLibrairy.reorderPlugins(arg)});
      ipcMain.handle('applyPluginLibrairyParameters', async (event, arg) => {return await github.applyParameters(arg)});
      ipcMain.handle('save-plugin-property-file', async (event, arg) => {
        if (!_.isEqual(arg.property, arg.editor)) {
          let options = {
               type: 'question',
               title: L.get("pluginLibrairy.saveWinTitle"),
               message: L.get(["pluginLibrairy.saveWinMsg", arg.id]),
               detail: L.get("pluginLibrairy.saveWinDetail"),
               buttons: [L.get("pluginLibrairy.saveWin"), L.get("pluginLibrairy.noSaveWin"), L.get("pluginLibrairy.cancelButton")]
           };

          let answer = dialog.showMessageBoxSync(settingsWindow, options);
          if (answer === 0) fs.writeJsonSync(arg.fullPath, arg.editor);
          return answer;
        } else
          return 1;
      })
      ipcMain.handle('quit-settings', (event, arg) => {
        (arg === true) ? settingsWindow.destroy() : clientSettingsWindow.destroy();
        if (!_.isEqual(appProperties, appPropertiesOld) || !_.isEqual(interfaceProperties, interfacePropertiesOld)) {
          mainWindow.webContents.send('properties-changed');
        }
      })
      ipcMain.handle('apply-properties', async (event, arg) => {
        switch (arg.reason) {
          case 'test':
            if (arg.interface) {
              switch (process.platform) {
                case 'linux':  
                case 'darwin':  
                  if (arg.interface.screen.background && !path.isAbsolute(arg.interface.screen.background))
                    arg.interface.screen.background = '/'+arg.interface.screen.background
                  break
              } 
              return mainWindow.webContents.send('update-properties', arg);
            }
            if (arg.imageNode) return saveImageNode(arg);
            break;
          case 'save':
            if (arg.imageNode) {
              if (arg.app) appProperties = arg.app;
              if (arg.app && !_.isEqual(appProperties, appPropertiesOld)) {
                fs.writeJsonSync(path.resolve(__dirname, 'core/Avatar.prop'), appProperties);
              }
              if (arg.imageNode.image !== 'noChange') {
                saveImageNode(arg);
              } else {
                clientSettingsWindow.webContents.send('client-settings-saved');
              }
            } else {
                saveProperties(arg); 
            }
        }
      })
      ipcMain.handle('info', async (event, arg) => {
        switch (arg) {
          case 'version':
              return appProperties.version;
        }
      })
   })
}


function documentation() {
    shell.openExternal(Config.docs);
}



function screenSaver () {

  if (appProperties.screenSaver.active === true) {
    const script = process.platform === 'win32'
    ? path.join(__dirname, "lib", "screensaver", "win32", "screensaver.vbs").concat(" \"" + appProperties.screenSaver.exec + "\"")
    : path.join(__dirname, "lib", "screensaver", process.platform, "screensaver.sh").concat(" \"" + appProperties.screenSaver.exec + "\"");

    setTimeout(() => {    
      exec(script, (err, stdout, stderr) => {
        if (err) {
          error(L.get(["avatar.noScreenSaver", err]));
        }
      })
    }, appProperties.screenSaver.timeout);
  }

}


function autoRestart() {
	if (appProperties.restart > 0) {
		const hour = Math.round(24/appProperties.restart);
		const delay = appProperties.mnToRestart + " */" + hour + " * * *";
		appInfo(L.get(['avatar.autoRestart', hour, appProperties.mnToRestart]));
		new CronJob(delay, async () => {
			app.relaunch();
      app.exit();
		}, null, true);
	}
}


function saveProperties(arg) {
  
  appProperties = arg.app;

  switch (process.platform) {
    case 'linux':  
    case 'darwin':  
      if (arg.interface.screen.background && !path.isAbsolute(arg.interface.screen.background))
        arg.interface.screen.background = '/'+arg.interface.screen.background
      break
  } 

  interfaceProperties = arg.interface;
  if (!_.isEqual(appProperties, appPropertiesOld)) {
	  fs.writeJsonSync(path.resolve(__dirname, 'core/Avatar.prop'), appProperties);
  }
  if (interfaceProperties.screen.background !== interfacePropertiesOld.screen.background) {
    saveBackgroundImage(interfaceProperties.screen.background);
    const file = path.basename(interfaceProperties.screen.background);
    interfaceProperties.screen.background = path.resolve (__dirname, 'assets/images/background', file);
  }

  if (!_.isEqual(interfaceProperties, interfacePropertiesOld)) {
    fs.writeJsonSync(path.resolve(__dirname, 'assets/config/interface.prop'), interfaceProperties);
  }
}


function actionOnClient (action, client, set) {
  const socketClient = Avatar.Socket.getClientSocket(client);
  if (socketClient) {
    switch(action) {
      case 'mute':
      case 'unmute':
        socketClient.emit('listenOnOff', set);
        info((set === true ? L.get(["avatar.unMute", client]) : L.get(["avatar.mute", client])));
        break;
      case 'listen':
        socketClient.emit('start_listen');
        info(L.get(["avatar.listening", client]));
        break;
      case 'stop_listen':
        socketClient.emit('stop_listen', client, true);
        info(L.get(["avatar.stopListening", client]));
        break;
      case 'restart':
        socketClient.emit('restart');
        info(L.get(["avatar.restart", client]));
        break
      case 'quit':
        socketClient.emit('quit');
        info(L.get(["avatar.deconnectClient", client]));
        break
      case 'shutdown':
        socketClient.emit('shutdown');
        info(L.get(["avatar.shutdownClient", client]));
        break
    }
  }
}


function shutdown (server, clients) {

  if (clients) {
    info(L.get("avatar.shutdownAllClients"));
    const tblclients = Avatar.Socket.getClients();
    _.map(tblclients, element => {
      element.Obj.emit('shutdown');
    })
  }

  if (server) {
    setTimeout(() => {
      const ext = process.platform === 'win32' ? ".bat" : ".sh"
      const cmd = path.resolve (__dirname, "lib", "shutdown", process.platform, "shutdownOS" + ext)
      exec(cmd, (err, stdout, stderr) => {
        if (err) error(L.get("avatar.shutdownServerError"), stderr)
      })
    }, 2000);
  }

}


function appClientsAction (server, clients, clientAction, appAction) {
  if (clients) {
    if (clientAction === 'restart') info(L.get("avatar.restartAllClients"));
    const tblclients = Avatar.Socket.getClients();
    _.map(tblclients, element => {
      element.Obj.emit(clientAction);
    });
  }

  if (server) {
      mainWindow.webContents.send(appAction);
  }
}


function saveBackgroundImage(image) {
  const file = path.basename(image);
  const imagePath = path.resolve (__dirname, 'assets/images/background', file);
  if (!fs.existsSync(imagePath)) fs.copySync(image, imagePath);
}


function saveImageNode(arg) {
  if (arg.reason !== 'test') {
    const ext = path.extname(arg.imageNode.image);
    const newFile = path.resolve (__dirname, 'assets/images/rooms', arg.imageNode.client+ext);
    const file = path.resolve (arg.imageNode.image);
  
    fs.copySync(file, newFile);
    clientSettingsWindow.webContents.send('client-settings-saved');
  }
  
  mainWindow.webContents.send('set-Node-Background', {client: arg.imageNode.client, file: arg.imageNode.image});

}


async function deletePlugin (event, plugin) {

  const pluginFolder = path.resolve(__dirname, 'core/plugins', plugin);
  const options = {
       type: 'question',
       title: L.get("pluginStudio.winDeleteTitle"),
       message: L.get(["pluginStudio.winDeleteMsg", plugin]),
       detail: L.get(["pluginStudio.winDeleteDetail", pluginFolder]),
       buttons: [L.get("pluginStudio.winDeleteOk"), L.get("pluginStudio.winDeleteCancel")]
   };

  const answer = dialog.showMessageBoxSync(settingsWindow, options);
  if (answer === 0) {
    if (Avatar.Plugin.exists(plugin)) Avatar.Plugin.removeCache(plugin);
    shell.trashItem(pluginFolder);
    event.sender.send('delete-Plugin', plugin);
  }

}



function showPluginMenu (event, plugin, name) {

  let state = (Config.modules[plugin] && ((Config.modules[plugin].active && Config.modules[plugin].active === true) || Config.modules[plugin].active === undefined)) ? true : false

  let pluginMenu = [
    {
        label: state === true ? L.get("pluginStudioMenu.disableLabel") : L.get("pluginStudioMenu.activeLabel"),
        icon: state === true ? path.resolve(__dirname, 'assets/images/icons/desactivate.png') : path.resolve(__dirname, 'assets/images/icons/activate.png'),
        click: () => {
          state = (Config.modules[plugin] && (Config.modules[plugin].active || Config.modules[plugin].active === undefined)) ? false : true
          Avatar.pluginLibrairy.activePlugin(plugin, state)
          event.sender.send('active-Plugin', {plugin: plugin, name: name, state: state})
        }
    },
    {type: 'separator'}
  ];

  pluginMenu.push(
    {
        label: L.get("pluginStudioMenu.delete"),
        icon: path.resolve(__dirname, 'assets/images/icons/close.png'),
        click: () => deletePlugin(event, plugin)
    }
  )

  pluginMenu.push(
    {
        label: L.get("pluginStudioMenu.transfert"),
        icon: path.resolve(__dirname, 'assets/images/icons/transfert.png'),
        click: () => showTranfertPlugin(plugin)
    }
  )

  if (fs.existsSync(path.resolve(__dirname, 'core/plugins', plugin, 'documentation'))) {
    if (fs.existsSync(path.resolve(__dirname, 'core/plugins', plugin, 'documentation', 'documentation.ini'))) {
      let docProps = fs.readJsonSync(path.resolve (__dirname, 'core/plugins', plugin , 'documentation/documentation.ini'), { throws: false });
      if (docProps && docProps.start) {
          pluginMenu.push(
            {type: 'separator'},
            {
                label: L.get("pluginStudioMenu.documentation"),
                icon: path.resolve(__dirname, 'assets/images/icons/help.png'),
                click: () => {
                  if (docProps.static) {
                    Avatar.static.set(path.resolve(__dirname, 'core/plugins', plugin, 'documentation'), () => {
                      shell.openExternal('http://localhost:'+appProperties.http.port+'/' + docProps.start);
                    });
                  } else {
                      shell.openExternal('file://'+path.resolve(__dirname, 'core/plugins', plugin, 'documentation')+'/'+docProps.start);
                  }
                }
            }
          )
        } else {
          event.sender.send('documentation-error', L.get("pluginStudioMenu.startError"))
        }
    } else {
      event.sender.send('documentation-error',  L.get("pluginStudioMenu.fileError"))
    }
  }

  const menu = Menu.buildFromTemplate(pluginMenu);
  menu.popup({window: pluginStudioWindow});

}



function showStudioEditorMenu(event, arg) {
  const template = [
    {
        label: L.get("pluginStudioMenu.save"),
        icon: path.resolve(__dirname, 'assets/images/icons/save.png'),
        click: () => {
          let propfile = fs.readJsonSync (arg.fullPath, { throws: false });
          let saved;
          if (propfile && !_.isEqual(propfile, arg.property)) {
            fs.writeJsonSync(arg.fullPath, arg.property);
            saved = true;
          }
          event.sender.send('property-Saved', {property: arg.property, saved: saved})
        }
    },
    {
        label: L.get("pluginStudioMenu.reload"),
          icon: path.resolve(__dirname, 'assets/images/icons/restart.png'),
          click: async () => {
            Config = await Avatar.pluginLibrairy.reloadPlugin(arg.plugin);
            event.sender.send('refresh-Plugin', arg.plugin);
          }
    },
    {type: 'separator'},
    {
        label: L.get("encrypt.wintitle"),
        icon: path.resolve(__dirname, 'assets/images/icons/encrypt.png'),
        click: () => {
          encrypt();
        }
    },
    {type: 'separator'},
    {
        label: L.get("pluginStudioMenu.translate"),
        icon: path.resolve(__dirname, 'assets/images/icons/translate.png'),
        click: () => {
          translate();
        }
    }
  ];

  try {
    const menu = Menu.buildFromTemplate(template);
    menu.popup({ window: pluginStudioWindow});
  } catch(err) {
    error(L.get("mainInterface.errorMenu"), err);
  }
}


const tranfertPlugin = args => {
  return new Promise((resolve) => {
    try {
      Avatar.tranfertPlugin(args.plugin, args.client, () => {
        if (args.restart === true) {
          const socketClient = Avatar.Socket.getClientSocket(args.client);
          socketClient.emit('restart');
        }
        resolve (true);
      }, args.backup);
    } catch (err) {
      resolve (err);
    }
  })
}


const showTranfertPlugin = async (plugin) => {

  if (tranfertPluginWindow) return tranfertPluginWindow.show();

  const style = {
    parent: pluginStudioWindow,
    frame: true,
    movable: true,
    resizable: true,
    minimizable: false,
    alwaysOnTop: false,
    show: false,
    width: 360,
    height: 230,
    icon: path.resolve(__dirname, 'assets/images/icons/transfert.png'),
    webPreferences: {
      preload: path.resolve(__dirname, 'transfert-preload.js')
    },
    title: L.get("transfert.wintitle")
  }

  let plugins = await Avatar.pluginLibrairy.getPlugins();
  plugins = _.pluck(plugins, 'name');
  
  let clients = await Avatar.Socket.getClients();
  clients = _.reject(clients, num => { return num.is_mobile === true});
  clients = _.pluck(clients, 'name');

  tranfertPluginWindow = new BrowserWindow(style);
  tranfertPluginWindow.loadFile('./assets/html/transfert.html');
  tranfertPluginWindow.setMenu(null);
  
  tranfertPluginWindow.once('ready-to-show', () => {
    tranfertPluginWindow.show();
    tranfertPluginWindow.webContents.send('initApp', plugin, clients);
  })

  tranfertPluginWindow.on('closed', () => {
    tranfertPluginWindow = null;
  })  

}


const translate = async () => {

  if (translateWindow) return translateWindow.show();

  const style = {
    parent: pluginStudioWindow,
    frame: true,
    movable: true,
    resizable: true,
    minimizable: false,
    alwaysOnTop: false,
    show: false,
    width: 530,
    height: 260,
    icon: path.resolve(__dirname, 'assets/images/icons/translate.png'),
    webPreferences: {
      preload: path.resolve(__dirname, 'translate-preload.js')
    },
    title: L.get("translate.wintitle")
  }

  translateWindow = new BrowserWindow(style);
  translateWindow.loadFile('./assets/html/translate.html');
  translateWindow.setMenu(null);
  
  translateWindow.once('ready-to-show', () => {
    translateWindow.show();
    const languages = lang.getValues();
    translateWindow.webContents.send('initApp', lang.get(preferredLanguage), languages);
  })

  translateWindow.on('closed', () => {
    translateWindow = null;
  })  

}


const translateSentence = async (arg) => {

  const language = await lang.getCode(arg.language);
  if (language === false) return false;

  if (language === 'en') return arg.sentence;

  let url = 'https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=' + language + '&tl=en&q=' + encodeURIComponent(arg.sentence)
  return got.post(url)
  .then(res => {
    const result = JSON.parse(res.body);
    return  (typeof result[0] === 'string' ? result[0].toLowerCase() : result[0][0].toLowerCase());
  })
  .catch(err => {
      error('translate error:', err);
      return false;
  });

}


const encrypt = () => {

  if (encryptWindow) return encryptWindow.show();

  const style = {
    parent: pluginStudioWindow,
    frame: true,
    movable: true,
    resizable: false,
    minimizable: false,
    alwaysOnTop: false,
    show: false,
    width: 430,
    height: 300,
    icon: path.resolve(__dirname, 'assets/images/icons/encrypt.png'),
    webPreferences: {
      preload: path.resolve(__dirname, 'encrypt-preload.js')
    },
    title: L.get("encrypt.wintitle")
  }

  encryptWindow = new BrowserWindow(style);
  encryptWindow.loadFile('./assets/html/encrypt.html');
  encryptWindow.setMenu(null);
  
  encryptWindow.once('ready-to-show', () => {
    encryptWindow.show();
    let passwdFile = path.resolve(__dirname, "lib/encrypt/encrypt.json");
    let passwd = null;
    if (fs.existsSync(passwdFile)) {
       let encrypted = fs.readJsonSync (passwdFile, { throws: false });
       try {
        passwd = Avatar.decrypt(encrypted.password);
       } catch (err) {
          error ('Error:', err && err.length > 0 ? err : L.get("encrypt.passwdError"));
          shell.trashItem(passwdFile);
          passwd = null;
       }
    }
    encryptWindow.webContents.send('initApp', passwd);
  })

  encryptWindow.on('closed', () => {
    encryptWindow = null;
  })  
}


async function showMenu(arg) {

  const template = await getMenu(arg.id, arg.type, arg.name);
  try {
    const menu = Menu.buildFromTemplate(template);
    menu.popup({x: Math.round(arg.pos.x), y: Math.round(arg.pos.y)});
  } catch(err) {
    error(L.get("mainInterface.errorMenu"), err);
  }

}


function showVsCode() {
  shell.openExternal('https://vscode.dev');
}


function clientInfo (client) {

  const clientInfos = Avatar.Socket.getClient(client);
  const infos = {
    id: clientInfos.id,
    name: clientInfos.name,
    ip: clientInfos.ip,
    loopback: clientInfos.loopback,
    language: clientInfos.language,
    serverSpeak: clientInfos.server_speak,
    loopMode: clientInfos.loop_mode,
    mobile: clientInfos.is_mobile
  }

  mainWindow.webContents.send('setInfoClient', {client: client, infos: infos})

}

async function setPluginLibrairy () {

  if (pluginLibrairyWindow) return pluginLibrairyWindow.show()
  if (initPluginLibrairy) return  initPluginLibrairy.show()
  if (loginWindow) return  loginWindow.show()

  let login;

  if (!loginSaved) {
    try {
      login = await github.getlogin(safeStorage);
    } catch (err) {
      error ('Error:', err && err.length > 0 ? err : L.get("github.passwdError"));
      login = null;
    }
  } else {
     login = loginSaved;
     loginSaved = null;
  }

  if (login) {
    const style = {
      parent: mainWindow,
      frame: false,
      movable: true,
      resizable: false,
      minimizable: false,
      alwaysOnTop: false,
      show: false,
      width: 450,
      height: 140,
      webPreferences: {
        preload: path.resolve(__dirname, 'initPluginLibrairy-preload.js')
      }
    };
  
    initPluginLibrairy = new BrowserWindow(style);
    initPluginLibrairy.loadFile('./assets/html/initPluginLibrairy.html');
    initPluginLibrairy.once('ready-to-show', () => {
      initPluginLibrairy.show();
      getGithubRepos (login, initPluginLibrairy);
      loginSaved = null;
    })

    initPluginLibrairy.on('closed', () => {
      initPluginLibrairy = null;
    })

  } else {
    const style = {
      parent: mainWindow,
      frame: false,
      movable: true,
      resizable: false,
      minimizable: false,
      alwaysOnTop: false,
      show: false,
      width: 300,
      height: 300,
      icon: path.resolve(__dirname, 'assets/images/Avatar.png'),
      webPreferences: {
        preload: path.resolve(__dirname, 'loginPluginLibrairy-preload.js')
      }
    };

    loginWindow = new BrowserWindow(style);
    loginWindow.loadFile('./assets/html/loginPluginLibrairy.html');
    loginWindow.once('ready-to-show', () => {
        loginWindow.show();
        loginWindow.webContents.send('initApp', true);
    })
  
    loginWindow.on('closed', () => {
      loginWindow = null;
      if (loginSaved) setPluginLibrairy();
    })  
  
  }
  
}


async function getGithubRepos (login, win) {

  const result = await github.testConnexion(login);
  if (!result) {
    pluginInstallationError(win, L.get("pluginLibrairy.wintitle"), L.get("pluginLibrairy.connexionError"));
    shell.trashItem(path.resolve (__dirname, 'lib/github/github.json'));
    return setPluginLibrairy();
  }

  win.webContents.send('set-title', L.get("pluginLibrairy.updateLibrary"));

  win.webContents.send('set-message', L.get("pluginLibrairy.searchProject"));
  const client = await github.getConnexion(login);

  win.webContents.send('set-message', L.get("pluginLibrairy.searchContributors"));
  const contributors = await github.getContributors(login, client, win);
  
  win.webContents.send('set-message', L.get("pluginLibrairy.searchContributorProjects"));
  let repos = await github.getContributorsRepos (client, contributors, 0, []);

  win.webContents.send('set-message', L.get("pluginLibrairy.searchProjectInformation"));
  repos = await github.getContributorsInfoRepos (client, repos, win);

  showPluginLibrairy(win, repos);

}



function showPluginLibrairy (win, repos) {

  if (pluginLibrairyWindow) return pluginLibrairyWindow.show()
   
  const style = {
    parent: mainWindow,
    frame: true,
    resizable: true,
    show: false,
    width: 830,
    maxWidth: 1000,
    height: 580,
    maximizable: false,
    minimizable: true,
    icon: path.resolve(__dirname, 'assets/images/Avatar.png'),
    webPreferences: {
      preload: path.resolve(__dirname, 'pluginLibrairy-preload.js')
    },
    title: L.get("pluginLibrairy.wintitle")
  };

  pluginLibrairyWindow = new BrowserWindow(style);
  pluginLibrairyWindow.loadFile(path.resolve(__dirname, 'assets/html/pluginLibrairy.html'));
  pluginLibrairyWindow.setMenu(null);
  
  pluginLibrairyWindow.once('ready-to-show', () => {
    win.webContents.send('set-message', L.get("pluginLibrairy.showProjects"));
    pluginLibrairyWindow.show();
    if (initPluginLibrairy) initPluginLibrairy.setParentWindow(pluginLibrairyWindow);
    pluginLibrairyWindow.webContents.send('set-repos', repos);
  })

  pluginLibrairyWindow.on('closed', () => {
    pluginLibrairyWindow = null;
  })

}



function initPluginInstallation(plugin) {

  const title = plugin.exists === true ? L.get("pluginLibrairy.pluginUpdate") : L.get("pluginLibrairy.pluginInstallation")
  const message = plugin.exists === true ? L.get(["pluginLibrairy.askPluginUpdate", plugin.real_name]) : L.get(["pluginLibrairy.askPluginInstallation", plugin.real_name])
  const detail = plugin.exists === true ? L.get(["pluginLibrairy.pluginUpdateDetail", plugin.real_name, plugin.real_name]) : ""
  const buttons = plugin.exists === true ? [L.get("pluginLibrairy.pluginUpdateButton"), L.get("pluginLibrairy.cancelButton")] : [L.get("pluginLibrairy.installButton"), L.get("pluginLibrairy.cancelButton")]
  
  const options = {
       type: 'question',
       title: title,
       message: message,
       detail: detail,
       buttons: buttons
  }

  const answer = dialog.showMessageBoxSync(pluginLibrairyWindow, options)
  if (answer === 0) {
    showPluginInstallationWindow(plugin);
  }

}


function pluginLibrairyParameters() {

  if (pluginLibrairyParametersWindow) return pluginLibrairyParametersWindow.show()

  const style = {
    parent: pluginLibrairyWindow,
    movable: true,
    resizable: false,
    alwaysOnTop: false,
    show: false,
    width: 450,
    height: 235,
    webPreferences: {
      preload: path.resolve(__dirname, 'pluginLibrairyParameters-preload.js')
    },
    title: L.get("pluginLibrairy.contributorParams")
  }

  pluginLibrairyParametersWindow = new BrowserWindow(style);
  pluginLibrairyParametersWindow.loadFile('./assets/html/pluginLibrairyParameters.html');
  pluginLibrairyParametersWindow.setMenu(null);
  pluginLibrairyParametersWindow.once('ready-to-show', async () => {
    pluginLibrairyParametersWindow.show();
    const contributors = await github.getSelectedContributors();
    const isRemember = await github.isRememberMe();
    pluginLibrairyParametersWindow.webContents.send('set-github-params', {contributors: contributors, isRemember: isRemember});
  })

  pluginLibrairyParametersWindow.on('closed', () => {
    pluginLibrairyParametersWindow = null;
  })
}


function showPluginInstallationWindow(plugin) {

  const style = {
    parent: pluginLibrairyWindow,
    frame: false,
    movable: true,
    resizable: false,
    minimizable: false,
    alwaysOnTop: false,
    show: false,
    width: 450,
    height: 140,
    webPreferences: {
      preload: path.resolve(__dirname, 'pluginInstallation-preload.js')
    }
  };

  pluginInstallationWindow = new BrowserWindow(style);
  pluginInstallationWindow.loadFile('./assets/html/pluginInstallation.html');
  pluginInstallationWindow.once('ready-to-show', () => {
    pluginInstallationWindow.show();
    pluginInstallation(pluginInstallationWindow, plugin);
  })

  pluginInstallationWindow.on('closed', () => {
    pluginInstallationWindow = null;
  })

}


function pluginInstallationError (win, title, message) {
  const options = {
    type: 'error',
    title: title,
    message: message
  }
  dialog.showMessageBoxSync(win, options);
  win.destroy();
}


async function pluginInstallation (win, plugin) {

  win.webContents.send('set-title', plugin.exists === true ? [L.get(["pluginLibrairy.setUpdate", plugin.real_name]), L.get("pluginLibrairy.installDone")] : [L.get(["pluginLibrairy.setInstall", plugin.real_name]), L.get("pluginLibrairy.installDone")]);
  
  win.webContents.send('set-message', L.get("pluginLibrairy.downloadPlugin"));
  let result = await github.downloadArchive(win, plugin);
  if (!result) {
    return pluginInstallationError(win, L.get("pluginLibrairy.download"), L.get(["pluginLibrairy.downloadError", plugin.real_name]));
  }

  win.webContents.send('set-message', L.get("pluginLibrairy.unzipPlugin"));
  result = await github.unzipArchive(plugin);
  if (!result) {
    return pluginInstallationError(win, L.get("pluginLibrairy.unzip"), L.get(["pluginLibrairy.unzipError", plugin.real_name]));
  }

  if (plugin.exists === true) {
    win.webContents.send('set-message', L.get("pluginLibrairy.savePlugin"));
    result = await github.saveExistingPlugin(plugin);
    if (!result) {
      return pluginInstallationError(win, L.get("pluginLibrairy.save"), L.get(["pluginLibrairy.saveError", plugin.real_name]));
    }
  }

  win.webContents.send('set-message', L.get("pluginLibrairy.installPlugin"));
  result = await github.installPlugin(plugin);
  if (!result) {
    return pluginInstallationError(win, L.get("pluginLibrairy.install"), L.get(["pluginLibrairy.installError", plugin.real_name]));
  }

  win.webContents.send('set-message', L.get("pluginLibrairy.deleteFile"));
  shell.trashItem(path.resolve (__dirname, 'tmp/download', plugin.real_name));

  win.webContents.send('set-message', L.get("pluginLibrairy.pluginInstalled"));
  win.webContents.send('installation-done', true);
  pluginLibrairyWindow.webContents.send('plugin-installed', plugin);
    
}



function pluginStudio() {

  if (pluginStudioWindow) return pluginStudioWindow.show();

  const style = {
    parent: mainWindow,
    frame: true,
    resizable: true,
    show: false,
    width: 790,
    height: 650,
    maximizable: true,
    icon: path.resolve(__dirname, 'assets/images/Avatar.png'),
    webPreferences: {
      preload: path.resolve(__dirname, 'pluginStudio-preload.js')
    },
    title: L.get("pluginStudio.wintitle")
  };

  pluginStudioWindow = new BrowserWindow(style);
  pluginStudioWindow.loadFile(path.resolve(__dirname, 'assets/html/pluginStudio.html'));
  pluginStudioWindow.setMenu(null);
  pluginStudioWindow.once('ready-to-show', () => {
    pluginStudioWindow.show();
    pluginStudioWindow.webContents.send('initApp', {interface: interfaceProperties, nodes: nodesProperties})
  })

  pluginStudioWindow.on('closed', () => {
    pluginStudioWindow = null;
  })
}


function settings() {

  if (settingsWindow) return settingsWindow.show();

  const style = {
    parent: mainWindow,
    frame: true,
    resizable: true,
    show: false,
    width: 500,
    height: 560,
    maximizable: true,
    icon: path.resolve(__dirname, 'assets/images/icons/settings.png'),
    webPreferences: {
      preload: path.resolve(__dirname, 'settings-preload.js')
    },
    title: L.get("settings.wintitle")
  };

  settingsWindow = new BrowserWindow(style);
  settingsWindow.loadFile(path.resolve(__dirname, 'assets/html/settings.html'));
  settingsWindow.setMenu(null);
  settingsWindow.once('ready-to-show', () => {
    setTimeout(() => {
      settingsWindow.webContents.send('initApp', {interface: interfaceProperties, properties: appProperties, BCP47: BCP47, platform: process.platform})
      settingsWindow.show();
    },300)
  })

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  })
}


function clientSettings(node) {

  if (clientSettingsWindow) return clientSettingsWindow.show()
  let title;
  if (node.type === 'classic') {
    title = L.get("clientSettings.wintitle").replace(' $$','').replace('$$','').replace('$$ ','')
  } else {
     title = node.type === 'virtual' ? L.get("clientSettings.wintitle", L.get("clientSettings.virtualType")) : L.get("clientSettings.wintitle", L.get("clientSettings.mobileType"))
  }

  const style = {
    parent: mainWindow,
    frame: true,
    resizable: true,
    show: false,
    width: 515,
    height: 440,
    maximizable: true,
    icon: path.resolve(__dirname, 'assets/images/Avatar.png'),
    webPreferences: {
      preload: path.resolve(__dirname, 'clientSettings-preload.js')
    },
    title: title
  };

  clientSettingsWindow = new BrowserWindow(style);
  clientSettingsWindow.loadFile(path.resolve(__dirname, 'assets/html/clientSettings.html'));
  clientSettingsWindow.setMenu(null);

  clientSettingsWindow.once('ready-to-show', () => {
    clientSettingsWindow.show();
    clientSettingsWindow.webContents.send('initApp', {properties: appProperties, node: node, sep: path.sep})
  })

  clientSettingsWindow.on('closed', () => {
    clientSettingsWindow = null;
  })
}


function backupRestore () {
  if (backupRestoreWindow) return backupRestoreWindow.show();

  const style = {
    parent: mainWindow,
    frame: true,
    resizable: true,
    show: false,
    width: 470,
    height: 350,
    maximizable: false,
    icon: path.resolve(__dirname, 'assets/images/icons/backuprestore.png'),
    webPreferences: {
      preload: path.resolve(__dirname, 'backupRestore-preload.js')
    },
    title: L.get("backupRestore.wintitle")
  };

  backupRestoreWindow = new BrowserWindow(style);
  backupRestoreWindow.loadFile(path.resolve(__dirname, 'assets/html/backupRestore.html'));
  backupRestoreWindow.setMenu(null);
  
  backupRestoreWindow.once('ready-to-show', () => {
    backupRestoreWindow.show();
    backupRestoreWindow.webContents.send('initApp', {properties: appProperties})
  })

  backupRestoreWindow.on('closed', () => {
    backupRestoreWindow = null;
  })
}


async function applyBackupRestore(arg) {

  try {

    const folder = path.resolve(arg.folder, moment().format("DDMMYYYY-HHmm"));
    const location = {
      property: path.resolve(__dirname, 'core/Avatar.prop'),
      interface: path.resolve(__dirname, 'assets/config/interface.prop'),
      node: path.resolve(__dirname, 'assets/config/nodes'),
      github: path.resolve(__dirname, 'lib/github'),
      plugin: path.resolve(__dirname, 'core/plugins')
    }

    switch (arg.index) {
      case 0: 
        if (arg.reason === 'backup') {
          fs.copySync(location.property, folder + '/core/Avatar.prop')
        } else if (arg.reason === 'restore') {
          if (fs.existsSync(arg.folder + '/core/Avatar.prop'))
            fs.copySync(arg.folder + '/core/Avatar.prop', location.property);
          else 
            return false;
        } else if (arg.reason === 'default') { 
          shell.trashItem(path.resolve(location.property));
        }
        return true;
      case 1: 
        if (arg.reason === 'backup') {
          fs.copySync(location.interface, folder + '/assets/config/interface.prop')
        } else if (arg.reason === 'restore') {
          if (fs.existsSync(arg.folder + '/assets/config/interface.prop'))
            fs.copySync(arg.folder + '/assets/config/interface.prop', location.interface);
          else 
            return false;
        } else if (arg.reason === 'default') { 
          shell.trashItem(path.resolve(location.interface));
        }
        return true;
      case 2: 
        if (arg.reason === 'backup') {
            fs.copySync(location.node, folder + '/assets/config/nodes');
        } else if (arg.reason === 'restore') {
          if (fs.existsSync(arg.folder + '/assets/config/nodes'))
            fs.copySync(arg.folder + '/assets/config/nodes', location.node);
          else 
            return false;
        } else if (arg.reason === 'default') { 
          shell.trashItem(path.resolve(location.node));
        }
        return true;
      case 3: 
        if (arg.reason === 'backup') {
            fs.copySync(location.github, folder + '/lib/github');
        } else if (arg.reason === 'restore') {
          if (fs.existsSync(arg.folder + '/lib/github'))
            fs.copySync(arg.folder + '/lib/github', location.github);
          else 
              return false;
        } else if (arg.reason === 'default') { 
          shell.trashItem(path.resolve(location.github));
        }
        return true;
      case 4: 
        if (arg.reason === 'backup') {
          fs.copySync(location.plugin, folder + '/core/plugins');
        } else if (arg.reason === 'restore') {
          if (fs.existsSync(arg.folder + '/core/plugins'))
            fs.copySync(arg.folder + '/core/plugins', location.plugin);
          else 
              return false;
        } 
        return true;
    }
    
  } catch (err) {
    return err;
  }
}



function reorderPlugins () {

  if (reorderPluginsWindow) return reorderPluginsWindow.show();

  const style = {
    parent: mainWindow,
    frame: true,
    resizable: true,
    show: false,
    minWidth: 785,
    width: 785,
    minHeight: 450,
    height: 450,
    maximizable: true,
    icon: path.resolve(__dirname, 'assets/images/Avatar.png'),
    webPreferences: {
      preload: path.resolve(__dirname, 'reorderPlugins-preload.js')
    },
    title: L.get("reorderPlugins.wintitle")
  };

  reorderPluginsWindow = new BrowserWindow(style);
  reorderPluginsWindow.loadFile(path.resolve(__dirname, 'assets/html/reorderPlugins.html'));
  reorderPluginsWindow.setMenu(null);
  
  reorderPluginsWindow.once('ready-to-show', () => {
    reorderPluginsWindow.show();
    reorderPluginsWindow.webContents.send('initApp', {properties: appProperties})
  })

  reorderPluginsWindow.on('closed', () => {
    reorderPluginsWindow = null;
  })
}


function widgetStudio() {

  if (pluginWidgetsWindow) return pluginWidgetsWindow.show();

  const style = {
    parent: mainWindow,
    frame: true,
    resizable: true,
    show: false,
    width: 900,
    height: 600,
    maximizable: true,
    icon: path.resolve(__dirname, 'assets/images/Avatar.png'),
    webPreferences: {
      preload: path.resolve(__dirname, 'pluginWidgets-preload.js')
    },
    title: L.get("pluginWidgets.wintitle")
  };

  pluginWidgetsWindow = new BrowserWindow(style);
  pluginWidgetsWindow.loadFile(path.resolve(__dirname, 'assets/html/pluginWidgets.html'));
  pluginWidgetsWindow.setMenu(null);
  
  pluginWidgetsWindow.once('ready-to-show', async () => {
    pluginWidgetsWindow.show();
    try {
      await Avatar.pluginLibrairy.initVar(Config);
      const result = await Avatar.pluginLibrairy.getCreatePluginWidgets();
      pluginWidgetsWindow.webContents.send('initApp', result ? {periphs: result.periphs, plugins: result.plugins, appsep: path.sep, dirname: __dirname} : false);
    } catch (err) {
      error (L.get(["pluginWidgets.widgetInfoError", (err || 'unknow error')]));
    }
  })

  pluginWidgetsWindow.on('closed', () => {
    pluginWidgetsWindow = null;
  })

}


async function deleteWidget (arg) {
  let options;
  if (arg.type !== 'button') {
    options = {
       type: 'question',
       title: L.get("pluginWidgets.deleteWidget"),
       message: L.get(["pluginWidgets.deleteWidgetMsg", arg.widget.title]),
       detail: L.get("pluginWidgets.deleteWidgetDetail"),
       buttons: [L.get("pluginWidgets.deleteWidgetAll"), L.get("pluginWidgets.deleteWidgetOnly"), L.get("pluginWidgets.deleteWidgetCancel")]
   };
  } else {
    options = {
      type: 'question',
      title: L.get("pluginWidgets.deleteWidget"),
      message: L.get(["pluginWidgets.deleteWidgetMsg", arg.widget.title]),
      buttons: [L.get("pluginWidgets.deleteWidgetButton"), L.get("pluginWidgets.deleteWidgetCancel")]
    };
  }

  const result = dialog.showMessageBoxSync(pluginWidgetsWindow, options);
  if (result === 2) return 0; 
  mainWindow.webContents.send('deleteWidget', arg.widget);
  arg.choice = arg.type !== 'button' ? result : 1;
  const json = await Avatar.pluginLibrairy.deleteWidget(arg);
  await Avatar.pluginLibrairy.initVar(Config);
  return json;
}


async function getNewImageSync (arg) {
  
  if (arg.images.length === 1 && arg.images[0].type === 'default') return;
  let src, imgFolder, file;
  let folder = path.resolve(__dirname, 'core/plugins', arg.plugin, 'assets/images/widget')

  let images = []
  for(let i=0; i < arg.images.length; i++) {
      if (arg.images[i].type && arg.images[i].type !== 'default') {
          imgFolder = arg.images[i].type === 'global'
          ? path.resolve(folder, arg.widget.usage.replace(/ /g,'-'))
          : path.resolve(folder, arg.widget.usage.replace(/ /g,'-'), arg.widget.id);
          
          file = arg.images[i].value.replace(/ /g,'-')+'.png'
          src = path.resolve(imgFolder, file);

          images.push({value: arg.images[i].value, path: imgFolder, src: src, file: file})
      }
  }
  return images;
}



async function saveWidget(arg) {
  const result = await Avatar.pluginLibrairy.saveWidget(arg);
  if (!result) return false;
  await Avatar.pluginLibrairy.initVar(Config);
  const infos = await Avatar.pluginLibrairy.getWidgetInfos({plugin: arg.plugin, widget: arg.widget});
  if (!infos) return false;
  const elemWidget = {plugin: arg.plugin, widget: infos, config: result};
  const images = await getNewImageSync(arg);
  mainWindow.webContents.send('createWidget', elemWidget);
  return {config: result, images: images};
}



async function handleImageRoomFileOpen() {
  const options = {
    title: L.get("avatar.selectImage"),
    defaultPath: path.resolve (__dirname, 'assets', 'images', 'rooms'),
    filters: [{ name : 'Images', extensions: ['png']}],
    properties: ['openFile']
  };

  const { canceled, filePaths } = await dialog.showOpenDialog(settingsWindow, options)
  if (!canceled) return filePaths[0];
}



async function handleImageFileOpen() {
  const options = {
    title: L.get("avatar.selectImage"),
    defaultPath: path.resolve (__dirname),
    filters: [{ name : 'Images', extensions: ['png']}],
    properties: ['openFile']
  };

  let { canceled, filePaths } = await dialog.showOpenDialog(settingsWindow, options);
  if (!canceled) {
    const filename = filePaths[0].substring(filePaths[0].lastIndexOf(path.sep) + 1);
    const tpmdir = path.normalize(path.resolve(__dirname, 'assets', 'html', 'tmp'));
    fs.ensureDirSync(tpmdir);
    fs.copySync(filePaths[0], path.resolve(tpmdir, filename));
    filePaths[0] = path.normalize(path.resolve(tpmdir, filename));
    return { fullPath : filePaths[0], fileName: filename};
  }
}


async function handleScreenSaverFileOpen () {
  const options = {
    title: L.get("settings.screensavertitle"),
    defaultPath: path.resolve (__dirname),
    filters: [],
    properties: ['openFile', 'noResolveAliases']
  };

  const { canceled, filePaths } = await dialog.showOpenDialog(settingsWindow, options);

  if (!canceled) {
    return filePaths[0];
  }
}


async function getPersonalWidgetImage () {

  const options = {
    title: L.get("pluginWidgets.widgetState"),
    defaultPath: path.resolve (__dirname),
    filters: [
      {
        name: 'Images',
        extensions: ['png']
      }
    ],
    properties: ['openFile']
  };

  const { canceled, filePaths } = await dialog.showOpenDialog(pluginWidgetsWindow, options);
  if (!canceled) {
    let filename = path.basename(filePaths[0]);
    let options = {
      type: "question",
      title: L.get("pluginWidgets.savingType"),
      buttons: [L.get("pluginWidgets.globalType"), L.get("pluginWidgets.personalType"), L.get("pluginWidgets.cancelType")],
      detail: L.get("pluginWidgets.detailType")
    };
    let answer = dialog.showMessageBoxSync(pluginWidgetsWindow, options);
    return {fullPath : filePaths[0], path: path.dirname(filePaths[0]), fileName: filename, answer: answer};
  }
}



async function handleFileOpen () {

  const options = {
    title: L.get("settings.backgroundtitle"),
    defaultPath: path.resolve (__dirname, 'assets/images/background'),
    filters: [
      {
        name: 'Images',
        extensions: ['jpg']
      }
    ],
    properties: ['openFile']
  };

  const { canceled, filePaths } = await dialog.showOpenDialog(settingsWindow, options);
  if (!canceled) return filePaths[0];
}


async function handleBackupFolderOpen() {

  const options = {
    defaultPath: path.parse(__dirname).root,
    properties: ['openDirectory']
  };

  const { canceled, filePaths } = await dialog.showOpenDialog(backupRestoreWindow, options);
  if (!canceled) return filePaths[0];

}


function appInit () {
  return new Promise(async (resolve) => {
    await avatar.init(preferredLanguage, safeStorage);
    await Avatar.pluginLibrairy.initVar(Config);
    github = await githubLib.init();
    resolve();
  })
}


async function isCloseApp() {

  const options = (Avatar.Socket.getClients()) ? {
      type: 'question',
      title: L.get("mainInterface.quit"),
      message: L.get("mainInterface.quitAsk"),
      detail: L.get("mainInterface.quitAskClient"),
      buttons: [L.get("mainInterface.buttonYes"), L.get("mainInterface.buttonNo")]
  } :
  {
       type: 'question',
       title: L.get("mainInterface.quit"),
       message: L.get("mainInterface.quitAsk"),
       buttons: [L.get("mainInterface.buttonYes"), L.get("mainInterface.buttonNo")]
   };

   const response = dialog.showMessageBoxSync(mainWindow, options);
   return response;
}



async function closeApp(arg, flag) {
  const value = await Avatar.pluginLibrairy.onPluginClose(arg.widgets);
  if (value !== undefined) console.log('Close App error:', value);

  fs.ensureDirSync(path.resolve(__dirname, 'assets/config/nodes'));
  let file;
  for (let prop in arg.nodes) {
    file = path.resolve(__dirname, 'assets/config/nodes/'+arg.nodes[prop].node+'.json');
    fs.writeJsonSync(file, arg.nodes[prop].json);
  }

  file = path.resolve(__dirname, 'assets/config/nodes/Main.json');
  const style = {
    "width": arg.main.width,
    "height": arg.main.height,
    "fullscreen": fullScreen
  }

  fs.writeJsonSync(file, style);
  
  if (flag) {
    mainWindow.destroy();
  } else {
    app.relaunch();
    app.exit();
  } 
}


const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  // Quelqu'un a essayé d'exécuter une seconde instance, fermeture de la seconde instance.
  app.quit()
} else  {
  app.on('second-instance', (event, commandLine, workingDirectory, additionalData) => {
    // Quelqu'un a essayé d'exécuter une seconde instance, focus à la fenêtre.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {

    createWindow();

    app.on('activate', function () {

      if (mainWindow === null) createWindow();
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    })

  })


  app.on('window-all-closed',() => {
    if (process.platform !== 'darwin') app.quit();
  })

  app.on('will-quit', () => {
      globalShortcut.unregisterAll();
  })
}


function Language() {
    var __construct = function() {
      preferredLanguage = appProperties.language;
      if (preferredLanguage && fs.existsSync(path.resolve(__dirname, 'locales/'+preferredLanguage+'.loc'))) {
        language = fs.readJsonSync(path.resolve(__dirname, 'locales/'+preferredLanguage+'.loc'), { throws: appProperties.verbose });
      } else 
        warn (`Unable to find the ${appProperties.language} language pak. Search for a default 'English' language pak...`)
      if (!language) language = fs.readJsonSync(path.resolve(__dirname, 'locales/en.loc'), { throws: appProperties.verbose });
      if (!language) error ('No language pak found !');
    }()
    this.get = function() {
      let tblarg = [], str;
      if (typeof arguments[0] === "object") {
        for (var i = 1; i < arguments[0].length; i++) {
          tblarg.push(arguments[0][i])
        }
        str = arguments[0][0]
      } else {
        str = arguments[0]
        for (var i = 1; i < arguments.length; i++) {
          tblarg.push(arguments[i])
        }
      }
      var retStr = eval('eval(language).'+str);
      if (typeof retStr !== 'undefined') {
        return setLParameters(retStr, tblarg)
      } else
        return 'Label not defined: '+str
    }
}


function setLParameters(str, arg) {
  let words = str.split(' '), a = 0;
  for (var i = 0; i < words.length && arg.length > 0; i++) {
    if (words[i].indexOf('$$') !== -1 && arg[a]) {
      words[i] = words[i].replace('$$', arg[a])
      a += 1
    }
  }
  return words.join(' ');
}


const checkUpdate = async () => {
  if (Config.checkUpdate === true) {
    let result = await github.checkUpdate(mainWindow);
    if (result === true) {
      await mainWindow.webContents.send('newVersion');
    }
  }
}


process.on('uncaughtException', err => {
  error('Caught exception: '+ err.stack)
})



