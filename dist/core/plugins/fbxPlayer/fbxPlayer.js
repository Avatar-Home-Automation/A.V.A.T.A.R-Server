import * as path from "node:path";
import * as url from "url";
import * as freebox from "./lib/api-fbxPlayer.js";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

/**
 * Uncomment, remove imports, methods, and other relationships below if you want to use it or not.
 */

//import * as fbxPlayerLib from './lib/fbxPlayer.js';
//const fbxPlayerAPI = await fbxPlayerLib.init();

import * as widgetLib from "../../../widgetLibrairy.js";
const Widget = await widgetLib.init();

// devices table
let periphInfo = [];

const widgetFolder = path.resolve(__dirname, "assets/widget");
const widgetImgFolder = path.resolve(__dirname, "assets/images/widget");

/**
 * Saves widget positions when A.V.A.T.A.R closes (json files saved in ./asset/widget folder)
 @param {object} widgets - widgets of the plugin
 */
export async function onClose(widgets) {
  // Save widget positions
  if (Config.modules.fbxPlayer.widget.display === true) {
    await Widget.initVar(
      widgetFolder,
      widgetImgFolder,
      null,
      Config.modules.fbxPlayer
    );
    if (widgets) await Widget.saveWidgets(widgets);
  }

  // Do other stuff
}

/**
 * Executed at the loading of the plugin
 */
export async function init() {
  info("fbxPlayer:", "Initialisation du plugin fbxPlayer");

  // "api_token": "/uFYV+Sn/+0Rc+PnUQtRoqCytv0FoAnCofie0FD8RM6cIbGZO42ODGSUjnpJTrsT",
  // "app_id":"fr.fbxPlayer.avatar",
  // "api_domain": "km5v8tsb.fbxos.fr",
  // "app_name": "Avatar Player",
  // "app_version": "1.0.0",
  // "device_name": "Avatar",
  // "https_port": 5000

  const Freebox = new freebox.FreeboxRegister({
    app_token: Config.modules.fbxPlayer.authentification.app_token,
    api_domain: Config.modules.fbxPlayer.authentification.api_domain,
    app_id: Config.modules.fbxPlayer.authentification.app_id,
    app_name: Config.modules.fbxPlayer.authentification.app_name,
    api_version: Config.modules.fbxPlayer.authentification.api_version,
    device_name: Config.modules.fbxPlayer.authentification.device_name,
    https_port: Config.modules.fbxPlayer.authentification.https_port,
  });

  // Obtaining an app_token & everything you need
  // following the guide at https://dev.freebox.fr/sdk/os/login/
  if (!Config.modules.fbxPlayer.authentification.app_token) {
    await Freebox.register();
  } else {
    await fbxRequest("player");

    // const Freebox = new freebox.Freebox({
    // 	app_token: Config.modules.fbxPlayer.authentification.app_token,
    // 	api_domain: Config.modules.fbxPlayer.authentification.api_domain,
    // 	app_id: Config.modules.fbxPlayer.authentification.app_id,
    // 	app_name: Config.modules.fbxPlayer.authentification.app_name,
    // 	api_version: Config.modules.fbxPlayer.authentification.api_version,
    // 	device_name: Config.modules.fbxPlayer.authentification.device_name,
    // 	https_port: Config.modules.fbxPlayer.authentification.https_port,
    //   });

    //   await Freebox.login();

    //   const wifiConfigResponse = await Freebox.request({
    // 	method: 'GET',
    // 	url: 'wifi/config',
    // });

    // info(wifiConfigResponse.data);

    // await Freebox.logout();
  }
}

/**
 * Searchs for existing Widgets when initializing A.V.A.T.A.R
 * Executed upon loading the plugin
 @return {object} object - the list of existing widgets (json files) saved in ./asset/widget folder
 */
export async function getWidgetsOnLoad() {
  if (Config.modules.fbxPlayer.widget.display === true) {
    await Widget.initVar(
      widgetFolder,
      widgetImgFolder,
      null,
      Config.modules.fbxPlayer
    );
    let widgets = await Widget.getWidgets();
    return {
      plugin: "fbxPlayer",
      widgets: widgets,
      Config: Config.modules.fbxPlayer,
    };
  }
}

/**
 * Executed after all widgets are loaded in the A.V.A.T.A.R interface
 * for example, used to refresh information of a widget
 @return {none}
 */
export async function readyToShow() {
  // Do stuff
}

/**
 * Requested only if a widget type is 'button' 
 * returns the new button image state to display 
 * 
 @param {object} arg - button parameters
 @return {string} 
 */
export async function getNewButtonState(arg) {
  return;
}

/**
 * Mandatory do not remove !
 * Returns existing widgets
 @return {object} 
 */
export async function getPeriphInfo() {
  return periphInfo;
}

/**
 * Action performed by clicking on a widget image
 @param {object} even - button parameters
 */
export async function widgetAction(even) {
  if (even.type !== "button") {
    // Action for 'List of values' and 'float value' types
    await Widget.initVar(
      widgetFolder,
      widgetImgFolder,
      null,
      Config.modules.fbxPlayer
    );
    return await Widget.widgetAction(even, periphInfo);
  } else {
    // Action for 'button' type

    // Do stuff
    infoConsole(even.value);
  }
}

/**
 * This function is the startup function of the plugin
 * by vocal rule: runs if an intention and an action are found or
 * directly by a request from other plugin, http request...
 * @param {object} data - the object sends from the action.js file of the plugin
 * @param {string=} data.client - the A.V.A.T.A.R client which sent the sentence
 * @param {string=} data.toClient - the A.V.A.T.A.R client where the rule is to be executed
 * @param {string=} data.rawSentence - the sentence not translated in english (speech language)
 * @param {string=} data.sentence - the sentence translated in english
 * @param {string=} data.language - the short code of the speech language (eg. 'en' or 'fr'...)
 * @param {string=} data.rule - the function defined in the intent file of the plugin
 * @param {Array=} data.tags - tags of the sentence translated in english
 * @param {Array=} data.tokens - tokens of the sentence translated in english
 * @param {object=} data.relations - relation found between object an action of the sentence translated in english
 * @param {object=} data.action - the function defined in the action file of the plugin
 * @param {function} callback - callback function if requested from other plugin
 * @return {function} callback - required - returns callback function
 */
export async function action(data, callback) {
  try {
    // Table of actions
    const tblActions = {
      // test (see rules table in the property file)
      test: () => test(data.client),
    };

    // Writes info console
    info("test:", data.action.command, L.get("plugin.from"), data.client);

    // Calls the function that should be run
    tblActions[data.action.command]();
  } catch (err) {
    if (data.client) Avatar.Speech.end(data.client);
    if (err.message) error(err.message);
  }

  // Returns callback
  callback();
}

/**
 * tests the action
 * @private
 * @param {String} client - the A.V.A.T.A.R client which sent the sentence
 */
const test = (client) => {
  const lang = {
    fr: `J'exécute l'action pour la pièce ${client}`,
    en: `I run the action for ${client}`,
  };

  const tts = lang[Config.language] ? lang[Config.language] : lang["en"];
  Avatar.speak(tts, client);
};

async function fbxRequest(req, cmd) {
  let ConfigResponse;

  const Freebox = new freebox.Freebox({
    app_token: Config.modules.fbxPlayer.authentification.app_token,
    api_domain: Config.modules.fbxPlayer.authentification.api_domain,
    app_id: Config.modules.fbxPlayer.authentification.app_id,
    app_name: Config.modules.fbxPlayer.authentification.app_name,
    api_version: Config.modules.fbxPlayer.authentification.api_version,
    device_name: Config.modules.fbxPlayer.authentification.device_name,
    https_port: Config.modules.fbxPlayer.authentification.https_port,
  });

  await Freebox.login();

  switch (req) {
    case "wifi":
      ConfigResponse = await Freebox.request({
        method: "GET",
        url: "wifi/config",
      });
	  console.info('\u001B[32m%s\u001B[0m', JSON.stringify(ConfigResponse.data));
      await Freebox.logout();
      break;
	  case "system":
		ConfigResponse = await Freebox.request({
		  method: "GET",
		  url: "system",
		});
		console.info('\u001B[32m%s\u001B[0m', JSON.stringify(ConfigResponse.data));
		await Freebox.logout();
		break;
    case "player":
		if(!cmd){
      ConfigResponse = await Freebox.request({
        method: "GET",
        url: "player",
      });
		}else{
			ConfigResponse = await Freebox.request({
				method: "GET",
				url: "player",
			  });
		}
     console.info('\u001B[32m%s\u001B[0m', JSON.stringify(ConfigResponse.data));
      await Freebox.logout();
      break;
    default:
      break;
  }
}
