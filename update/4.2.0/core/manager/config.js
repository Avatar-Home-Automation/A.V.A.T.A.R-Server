import {default as extend } from 'extend';  
import { default as fs } from 'fs-extra';
import * as path from 'node:path';
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const ROOT   = path.normalize (__dirname+'/..');
const SERVER = path.resolve (ROOT, 'Avatar.prop');
const PLUGIN = path.resolve (ROOT, 'plugins');

var Config = { 'debug' : false };

async function load() {
  try {
    extend(true, Config, loadProperties());
    extend(true, Config, loadPlugins());
  }
  catch(ex) { 
    error(L.get(["config.errorLoadProperties", (ex ? ex : "unknow")]))
  }
  
}


async function resetPluginProperties (name) {

  if (!Avatar.Plugin || !Avatar.find) return;

  let script = Avatar.find(name);
  if (script && script._script.resetProperties)
    await script._script.resetProperties();

}

async function refreshPluginProp (name, prop) {
	try {
		delete Config['modules'][name];
		if (Config['cron'][name]) delete Config['cron'][name];

		let load   =  fs.readFileSync(prop,'utf8');
		let plugin = JSON.parse(load);

		appInfo(L.get(["config.reloadproperties", name]));
		extend(true, Config, plugin);

    await resetPluginProperties(name);

    return Config;
	} catch(ex){ error(L.get(["config.errorReloadproperties", prop.substring(prop.lastIndexOf(process.platform)+1), ex.message])); }
}


function loadPlugins (folder, json) {
  var json   = json   || {};
  var folder = folder || PLUGIN;
  if (!fs.existsSync(folder)) { return json };
  fs.readdirSync(folder).forEach((file) => {
    var pathFile = folder+'/'+file

    // Directory
    if (fs.statSync(pathFile).isDirectory()) {
      loadPlugins(pathFile, json)
      return json
    }

    // Ends with .prop
    if (file.endsWith('.prop')) {
      try {
        var load   =  fs.readFileSync(pathFile,'utf8');
        var plugin = JSON.parse(load);

		    if ((folder.substring(folder.lastIndexOf('/') + 1) != file.split('.')[0]) || !plugin.modules[file.split('.')[0]] || !folder.substring(folder.lastIndexOf('/') + 1))
		      	error(L.get(["config.errorProperty", file.split('.')[0]]));
		    else if (plugin.modules[file.split('.')[0]].active == undefined || plugin.modules[file.split('.')[0]].active)
						extend(true, json, plugin);
      } catch(ex){ error(L.get(["config.errorLoadProperty", prop.substring(prop.lastIndexOf(process.platform)+1), ex.message])) }
    }
  });
  return json;
}


function loadProperties () {
  let json = fs.readJsonSync(SERVER, { throws: false });
  if (!json) { 
    json = fs.readJsonSync(path.resolve(__dirname, '../../assets/config/default/Avatar.prop'), { throws: false });
  }
  if (!json) return {}; 

  json.cron    = {};
  json.modules = {};
  json.modules = retains(json.modules, Config.modules);
  json.cron    = retains(json.cron, Config.cron);

  return json;
}


function retains (source, target) {
  if (typeof source !== 'object') return source;

  var clean  = {};
  Object.keys(source).forEach(function(attr){
    if (attr == 'description' || attr == 'version'){ return false; };
    if (target[attr] === undefined
        && attr != 'x' && attr != 'y'
        && attr != 'w' && attr != 'h'
        && attr != 'c' && attr != 'disabled') { 
          return warn(L.get(["config.skipConfig", attr])); 
        }
    clean[attr] = retains(source[attr], target[attr]);
  })

  return clean;
}


function loadJSON(name) {
  let pathFile = PLUGIN+'/'+name+'/'+name+'.prop';
  if (!fs.existsSync(pathFile)){ return {}; };
  try {
    let json = fs.readFileSync(pathFile,'utf8');
    return JSON.parse(json);
  } catch(ex){ error(L.get(["config.errorCustomProperty", name+".prop", ex.message])) };
}


function save(file, cfg) {
  try {
    Config = cfg || Config;
    let json = JSON.stringify(Config, undefined, 2);

    json = json.replace(/\{/g,"{\n  ").replace(/\}/g,"\n  }").replace(/,/g,",\n  ");
    fs.writeFileSync(file, json, 'utf8');
    info(L.get("config.propertySaved"));
  } catch(ex) {
    error(L.get(["config.errorPropertySaved", ex.message]));
  }
}


async function initConfig () {
  // Load properties
  await load();
  // Expose properties to global
  global.Config = Config;
  Avatar.Config = {
		'load'   : load,
    'save'   : save,
    'loadJSON' : loadJSON,
    'getConfig': function() { return Config },
    'refreshPluginProp': refreshPluginProp,
    'Config' : Config,
    'PLUGIN' : PLUGIN,
    'ROOT'   : ROOT
	};
}

export { initConfig };
