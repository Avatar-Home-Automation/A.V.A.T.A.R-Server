import * as path from 'node:path';
import pkg from 'fs-extra';
const {readJsonSync} = pkg;
import { shell } from 'electron';
import * as url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const iconPath = path.resolve(__dirname, "assets/images/icons");
var node;

async function setMenus () {

  const menus = {
    Server : 
      [
        {
          label : L.get("serverMenu.plugins"),
          icon  : iconPath+'/plugins.png',
          submenu : [
            {
                label: L.get("serverMenu.pluginStudio"),
                icon: iconPath+'/pluginStudio.png',
                click: async () => {Avatar.Interface.pluginStudio()}
            },
            {
                label: L.get("serverMenu.libraryPlugin"),
                icon: iconPath+'/minimize.png',
                click: async () => {Avatar.Interface.setPluginLibrairy()}
            },
            {
                label: L.get("serverMenu.reorderPlugins"),
                icon: iconPath+'/control.png',
                click: async () => {Avatar.Interface.reorderPlugins()}
            },
            {type: 'separator'},
            {
              label: L.get("pluginWidgets.wintitle"),
              icon: iconPath+'/widget.png',
              click: async () => {Avatar.Interface.widgetStudio()}
            },
            {
              label: L.get("scenario.wintitle"),
              icon: iconPath+'/scenario16.png',
              click: async () => {Avatar.Interface.scenarioStudio()}
            },
            {type: 'separator'},
            {
              label: L.get("backupRestore.wintitle"),
              icon: iconPath+'/backuprestore.png',
              click: async () => {Avatar.Interface.backupRestore()}
            },
            {type: 'separator'},
            {
                label: L.get("serverMenu.vsCode"),
                icon: iconPath+'/vscode.png',
                click: async () => {Avatar.Interface.vsCode()}
            }
          ]
        },
        {type: 'separator'},
        {
            label: L.get("serverMenu.settings"),
            icon: iconPath+'/settings.png',
            click: async () => {Avatar.Interface.settings()}
        },
        {type: 'separator'},
        {
          label : L.get("serverMenu.window"),
          icon  : iconPath+'/window.png',
          submenu : 
            [
              {
                  label: L.get("serverMenu.toggleWindow"),
                  icon: iconPath+'/fullscreen.png',
                  click: async () => {Avatar.Interface.fullscreen()}
              },
              {
                  label: L.get("serverMenu.minimize"),
                  icon: iconPath+'/minimize.png',
                  click: async () => {Avatar.Interface.minimizeScreen()}
              }
            ]
        },
        {
          label: L.get("serverMenu.documentation"),
          icon: iconPath+'/help.png',
          click: async () =>  Avatar.Interface.documentation()
        },
        {type: 'separator'},
        {
          label: L.get("infos.menu"),
          icon: iconPath+'/info.png',
          click: async () => {Avatar.Interface.information()}
        },
        {type: 'separator'},
        {
          label : L.get("serverMenu.restart"),
          icon: iconPath+'/restart.png',
          submenu : [
            {
              label: L.get("serverMenu.restartServer"),
              icon: iconPath+'/restart.png',
              click: async () => {Avatar.Interface.appReload()}
            },
            {
              label: L.get("serverMenu.restartClient"),
              icon: iconPath+'/restart-clients.png',
              click: async () => {Avatar.Interface.reloadAppClients(false, true)}
            },
            {
              label: L.get("serverMenu.restartServerClient"),
              icon: iconPath+'/restart-all.png',
              click: async () => {Avatar.Interface.reloadAppClients(true, true)}
            }
          ]
        },
        {
          label: L.get("serverMenu.quit"),
          icon: iconPath+'/close.png',
          submenu : [
            {
              label: L.get("serverMenu.quitServer"),
              icon: iconPath+'/close.png',
              click: async () => {Avatar.Interface.appExit()}
            },
            {
              label: L.get("serverMenu.quitClient"),
              icon: iconPath+'/close-clients.png',
              click: async () => {Avatar.Interface.exitAppClients(false, true)}
            },
            {
              label: L.get("serverMenu.quitServerClient"),
              icon: iconPath+'/close-all.png',
              click: async () => {Avatar.Interface.exitAppClients(true, true)}
            }
          ]
        },
        {
          label: L.get("serverMenu.shutdown"),
          icon: iconPath+'/shutdown.png',
          submenu : [
            {
              label: L.get("serverMenu.shutdownServer"),
              icon: iconPath+'/shutdown.png',
              click: async () => {Avatar.Interface.shutdown(true, false)}
            },
            {
              label: L.get("serverMenu.shutdownClient"),
              icon: iconPath+'/shutdown-clients.png',
              click: async () => {Avatar.Interface.shutdown(false, true)}
            },
            {
              label: L.get("serverMenu.shutdownServerClient"),
              icon: iconPath+'/shutdown-all.png',
              click: async () => {Avatar.Interface.shutdown(true, true)}
            }
          ]
        }
      ],
      classic : [
          {
              label: L.get("clientMenu.listening"),
              icon: iconPath+'/unmute.png',
              click: async () => {Avatar.Interface.actionOnClient('unmute', node.name, true)}
          },
          {
              label: L.get("clientMenu.desactiveListening"),
              icon: iconPath+'/mute.png',
              click: async () => {Avatar.Interface.actionOnClient('mute', node.name, false)}
          },
          {type: 'separator'},
          {
              label: L.get("clientMenu.startListening"),
              icon: iconPath+'/start_micro.png',
              click: async () => {Avatar.Interface.actionOnClient('listen', node.name)}
          },
          {
              label: L.get("clientMenu.stopListening"),
              icon: iconPath+'/stop_micro.png',
              click: async () => {Avatar.Interface.actionOnClient('stop_listen', node.name)}
          },
          {type: 'separator'},
          {
              label: L.get("clientMenu.info"),
              icon: iconPath+'/info.png',
              click: async () => {Avatar.Interface.clientInfo(node.name)}
          },
          {type: 'separator'},
          {
              label: L.get("clientMenu.settings"),
              icon: iconPath+'/settings.png',
              click: async () => {Avatar.Interface.clientSettings(node)}
          },
          {type: 'separator'},
          {
              label: L.get("clientMenu.restart"),
              icon: iconPath+'/restart.png',
              click: async () => {Avatar.Interface.actionOnClient('restart', node.name)}
          },
          {
              label: L.get("clientMenu.quit"),
              icon: iconPath+'/close.png',
              click: async () => {Avatar.Interface.actionOnClient('quit', node.name)}
          },
          {
              label: L.get("clientMenu.shutdown"),
              icon: iconPath+'/shutdown.png',
              click: async () => {Avatar.Interface.actionOnClient('shutdown', node.name)}
          }
        ],
        Default : [
          {
            label: L.get("otherMenu.settings"),
            icon: iconPath+'/settings.png',
            click: async () => {Avatar.Interface.clientSettings(node)}
          }
        ],
        Mobile : [
          {
            label: L.get("otherMenu.settings"),
            icon: iconPath+'/settings.png',
            click: async () => {Avatar.Interface.clientSettings(node)}
          },
          {type: 'separator'},
          {
              label: L.get("clientMenu.info"),
              icon: iconPath+'/info.png',
              click: async () => {Avatar.Interface.clientInfo(node.name)}
          }
        ]
  }

  return menus;
}

async function getMenu (id, type, name) {
  let selected;
  let menus = await setMenus();

  node = {name: name, id: id, type: type};
  for (var menu in menus) {
    if (name !== 'Mobile' && menu === id) {
      selected = menus[menu];
      break;
    }
  }

  if (!selected && type) {
    for (var menu in menus) {
      if (menu === type) {
        selected = menus[menu];
        break;
      }
    }
  }
 
  return !selected ? (Avatar.Socket.isMobile(name) ? menus.Mobile : menus.Default) : selected;
}

export { getMenu }; 
