import { default as fs } from 'fs-extra';
import {default as extend } from 'extend';  
import {default as decache } from 'decache';  
import { EventEmitter } from 'node:events';
import * as path from 'node:path';

const TYPE_MODULES  = 'modules';
const TYPE_CRON     = 'cron';

class MyEmitter extends EventEmitter {};
const ee = new MyEmitter();
var cache = {};
function getCache(){ return cache };

class Plugin {
  constructor(options) {
    extend(false, this, options);
    // Link configuration
    this.config = Config[TYPE_MODULES][this.name];
    this.cron = Config[TYPE_CRON][this.name];

    // Check {plugin}.js
    var script = path.resolve(Avatar.Config.PLUGIN, this.name, this.name+'.js');
    if (fs.existsSync(script)) {
      this.script = script;
    }
  }
  isDisabled() {
    if (!this.script) return true
    return this.config.disabled
  }
  getInstance(uncache) {
      return new Promise(async (resolve) => {
        // Dispose
        if (Config.debug || uncache) {
          if (this._script && this._script.dispose) { 
            this._script.dispose(Avatar)
          } 
          decache(this.script);
        }
    
        // import module
        this._script = await import("file:///"+this.script);
          
        // Initialise
        if (!this.initialized && this._script.init) { 
          this.initialized = true;
          appInfo(L.get(["plugin.initModule", this.name])); 
          await this._script.init();
        }

        // subclass Play function
        if (!this.subclassPlay_initialized && this._script.subclassPlay) {
          this.subclassPlay_initialized = true;
          appInfo(L.get(["plugin.initSubclassPlay", this.name])); 
          await this._script.subclassPlay()
        }

        // subclass Speak function
        if (!this.subclassSpeak_initialized && this._script.subclassSpeak) {
          this.subclassSpeak_initialized = true;
          appInfo(L.get(["plugin.initSubclassSpeak", this.name])); 
          await this._script.subclassSpeak();
        }
        
        resolve (this._script);
      })
      .catch(ex => {
          warn(L.get(["plugin.loadingPlugin", this.name]), ex.message, ex.stack);
      })
  }
}


function removeCache(name) {
  var moduleName = find (name);
  if (moduleName) {
    decache(moduleName.script);
    appInfo(L.get(["plugin.removed", name]));
    if (Config[TYPE_MODULES][name]) delete Config[TYPE_MODULES][name];
    if (Config[TYPE_CRON][name]) delete Config[TYPE_CRON][name];
  } else {
    error(L.get(["plugin.notExist", name]));
  }
}


async function add(name) { 

  appInfo(L.get(["plugin.add", name]));
  
  cache[name] = new Plugin ({'name' : name });
  cache[name]._script = await cache[name].getInstance();

  var keys = Object.keys(Config[TYPE_CRON]);
  for(var i = 0 ; i < keys.length ; i++) {
    var key = keys[i];
    if (cache[key]) continue;
    cache[key] = new Plugin ({'name' : key });
    cache[key]._script = await cache[key].getInstance();
  }

}


function refresh() {
  return new Promise(async (resolve) => {
    cache = {};

    // Find config
    var keys = Object.keys(Config[TYPE_MODULES]);
    // Build a list of plugins
    for(var i = 0 ; i < keys.length ; i++) {
      var key = keys[i];
      cache[key] = new Plugin ({'name' : key });
      cache[key]._script = await cache[key].getInstance();
    }

    keys = Object.keys(Config[TYPE_CRON])
    for(var i = 0 ; i < keys.length ; i++) {
      var key = keys[i];
      if (cache[key]) continue;
      cache[key] = new Plugin ({'name' : key });
      cache[key]._script = await cache[key].getInstance();
    }

    resolve();
  })
}


async function getList(clean) {

    if (clean){ await refresh(); }

    var keys = Object.keys(cache)
    keys = keys.sort(function(k1, k2) {
      var conf1 = cache[k1].config;
      var conf2 = cache[k2].config;

      if (!conf1.y) return  1;
      if (!conf2.y) return -1;

      if (conf1.y < conf2.y) return  -1;
      if (conf1.y > conf2.y) return   1;
      return conf1.x < conf2.x ? -1 : 1;
    })

    var list = [];
    for(var i = 0 ; i < keys.length ; i++) {
      var key = keys[i];
      var plugin = cache[key];
      // Skip disabled plugin
      if (plugin.isDisabled()){ continue };
      list.push(plugin);
    }
    return list;
}


function find (name) {
  return cache[name];
}


function exists(name) {
  var plugin = find(name)
  return plugin ? true : false;
}


async function remove(name, callback) {
  var plugin = find(name);
  if (!plugin){ 
    if (callback) callback(); 
    return;
  };
  // Remove from filesystem
  let pathFile = Avatar.ConfigManager.PLUGIN+'/'+name;
  appInfo(L.get(["plugin.removePlugin", name]));
  if (fs.existsSync(pathFile)){ fs.removeSync(pathFile) }
  // Remove in memory
  await refresh();
  if (callback) callback();
}


function listen(event, callback) {
  if (callback) {
    ee.on(event, callback);
  } else {
    error(L.get("plugin.listenError"));
  }
}


function trigger(event, data) {
  ee.emit(event, data);
}


function socket(io) {
  io.on('connection', async (socket) => {
    socket.on('disconnect')
    for(var name in cache){
      let plugin = await cache[name].getInstance()
      if (plugin.socket) plugin.socket(io, socket)
    }
  })
}

async function initPlugin () {
  Avatar.find = find;
  Avatar.exists = exists;
  Avatar.trigger = trigger;
  Avatar.listen = listen;
  await refresh();
  Avatar.Plugin = {
    'getCache'      : getCache,
    'getList'       : getList,
    'find'          : find,
    'exists'        : exists,
    'remove'        : remove,
    'add'           : add,
    'removeCache'   : removeCache,
    'socket'        : socket,
    'trigger'       : trigger,
    'listen'        : listen
  }
}

export { initPlugin };
