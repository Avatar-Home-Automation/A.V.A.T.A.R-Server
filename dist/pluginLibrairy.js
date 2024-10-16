import { shell } from 'electron';
import * as path from 'node:path';
import fs from 'fs-extra';
import { default as klawSync } from 'klaw-sync';
import _ from 'underscore';
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

let Config;

function createIntent(plugin, type, widget) {
    let intentFile;
    if (widget === false) {
        intentFile = type ? path.resolve (__dirname , 'lib/create_modules/rule/syntax_intent.js')
                    : path.resolve (__dirname , 'lib/create_modules/rule/terms_intent.js');
    } else {
        intentFile = path.resolve (__dirname , 'lib/create_modules/rule/widget_intent.js');
    }

    let intent = fs.readFileSync(intentFile, 'utf8');
    intent = intent.replace(/create_module/g, plugin);
    fs.writeFileSync (path.resolve (__dirname , 'core/plugins', plugin, 'intent.'+plugin+'.js'), intent, 'utf8');   
}
    
    
function createAction (plugin, type, widget) {
    let actionFile;
    if (widget === false) {
        actionFile = type ? path.resolve (__dirname , 'lib/create_modules/rule/syntax_action.js')
                            : path.resolve (__dirname , 'lib/create_modules/rule/terms_action.js');
    } else {
        actionFile = path.resolve (__dirname , 'lib/create_modules/rule/widget_action.js');
    }
    let action = fs.readFileSync(actionFile, 'utf8');
    action = action.replace(/create_module/g, plugin);
    fs.writeFileSync (path.resolve (__dirname , 'core/plugins', plugin, 'action.'+plugin+'.js'), action, 'utf8');
}


async function createProp(plugin, label, bySyntax, rules, cron, widget) {
    let fileName, room1, room2;
    if (widget === false) {
        fileName = rules === true ? bySyntax === true ? 'syntax' : 'terms' :'noaction';
        fileName += cron === true ? '_cron.prop' : '_nocron.prop';
    } else  {
        fileName = "widget";
        fileName += rules === true ? '_rules' : '_norules';
        fileName += cron === true ? '_cron.prop' : '_nocron.prop';
    }

    let prop = fs.readFileSync(path.resolve (__dirname ,'lib/create_modules/properties', fileName), 'utf8');
    prop = prop.replace(/create_module/g, plugin);
    prop = prop.replace(/label_module/g, ((label && label.length > 0) ? label : plugin));

    const fileProp = path.resolve (__dirname ,'core/plugins', plugin, plugin+'.prop')
    fs.writeFileSync (fileProp, prop, 'utf8');

    prop = fs.readJsonSync(fileProp, { throws: false });
    return prop ? fileProp : null;
}


function createJS(arg) {
    let fileName, methods = "";

    if (arg.methods.langpak === true) arg.methods.init = true

    if (arg.methods.addwidget === true) {
        fileName = arg.rules === true ? "widget.js" : "noaction.js";
        methods = fs.readFileSync(path.resolve (__dirname , 'lib/create_modules/js/methods/addwidget.js'), 'utf8');
        if (arg.methods.langpak === true) {
            const langpak = fs.readFileSync(path.resolve (__dirname , 'lib/create_modules/js/methods/langpak.js'), 'utf8');
            methods = methods.replace(/\/\/langpak/g, langpak);
            methods = methods.replace(/\/\/varlangpak/g, "//language pak\nlet Locale;");
        } else {
            methods = methods.replace(/\/\/langpak/g, "");
            methods = methods.replace(/\/\/varlangpak/g, "");
        }
    } else if (arg.methods.addwidget === false) {
        fileName = arg.rules === true ? "action.js" : "noaction.js";
        if (arg.methods.onclose === true) methods += fs.readFileSync(path.resolve (__dirname , 'lib/create_modules/js/methods/onclose.js'), 'utf8');
        if (arg.methods.init === true) {
            methods += fs.readFileSync(path.resolve (__dirname , 'lib/create_modules/js/methods/init.js'), 'utf8');
            if (arg.methods.langpak === true) {
                const langpak = fs.readFileSync(path.resolve (__dirname , 'lib/create_modules/js/methods/langpak.js'), 'utf8');
                methods = methods.replace(/\/\/langpak/g, langpak);
                methods = methods.replace(/\/\/varlangpak/g, "//language pak\nlet Locale;");
            } else {
                methods = methods.replace(/\/\/langpak/g, "");
                methods = methods.replace(/\/\/varlangpak/g, "");
            }
        } 
    }
    if (arg.methods.langpak === true) {
        const langPak = path.resolve (__dirname , 'core/plugins', arg.name, 'locales');
        fs.ensureDirSync(langPak);
        if (Config.language === 'fr') {
            fs.writeFileSync (path.resolve (langPak, Config.language+'.pak'), '{\n    "message": {\n        "test":"je teste la commande pour la pièce $$"\n    }\n}', 'utf8');
        } else {
            fs.writeFileSync (path.resolve (langPak, Config.language+'.pak'), '{\n    "message": {\n        "test":"i am testing the command for $$"\n    }\n}', 'utf8');
        }
    }

    if (arg.methods.cron === true) methods += fs.readFileSync(path.resolve (__dirname , 'lib/create_modules/js/methods/cron.js'), 'utf8');
    if (arg.methods.mute === true) methods += fs.readFileSync(path.resolve (__dirname , 'lib/create_modules/js/methods/mute.js'), 'utf8');
    if (arg.methods.unmute === true) methods += fs.readFileSync(path.resolve (__dirname , 'lib/create_modules/js/methods/unmute.js'), 'utf8');
    if (arg.methods.subspeak === true || arg.methods.subplay === true)
        methods += fs.readFileSync(path.resolve (__dirname , 'lib/create_modules/js/methods/unmuteClosure.js'), 'utf8');
    if (arg.methods.subspeak === true) methods += fs.readFileSync(path.resolve (__dirname , 'lib/create_modules/js/methods/subspeak.js'), 'utf8');
    if (arg.methods.subplay === true) methods += fs.readFileSync(path.resolve (__dirname , 'lib/create_modules/js/methods/subplay.js'), 'utf8');
    if (arg.methods.timeout === true) methods += fs.readFileSync(path.resolve (__dirname , 'lib/create_modules/js/methods/timeout.js'), 'utf8');
   
    let js = fs.readFileSync(path.resolve (__dirname , 'lib/create_modules/js' , fileName), 'utf8');

    if (arg.rules === true) {
        var privateMethod;
        if (arg.methods.langpak === true) {
            privateMethod = fs.readFileSync(path.resolve (__dirname , 'lib/create_modules/js/privatepak.js'), 'utf8');

            let getLangPak = fs.readFileSync(path.resolve (__dirname , 'lib/create_modules/js/getLangPak.js'), 'utf8');
            js = js.replace(/\/\/getlangpak/g, getLangPak);
        } else {
            privateMethod = fs.readFileSync(path.resolve (__dirname , 'lib/create_modules/js/privatenopak.js'), 'utf8');
            js = js.replace(/\/\/getlangpak/g, "");
        }

        js = js.replace(/\/\/privateMethod/g, privateMethod);

    } else {
        if (arg.methods.langpak === true) {
            let getLangPak = fs.readFileSync(path.resolve (__dirname , 'lib/create_modules/js/getLangPak.js'), 'utf8');
            js = js.replace(/\/\/getlangpak/g, getLangPak);
        } else {
            js = js.replace(/\/\/getlangpak/g, "");
        }
    }

    js = js.replace(/\/\/ exports.methods/g, methods);
    js = js.replace(/create_module/g, arg.name);
    
    fs.writeFileSync (path.resolve (__dirname , 'core/plugins', arg.name, arg.name+'.js'), js, 'utf8');
}


function addMarkuDownInfo(plugin, label, bySyntax, rules, cron, widget) {
    let fileName;
    if (widget === false) {
        fileName = rules === true ? bySyntax === true ? 'syntax' : 'terms' :'noaction';
        fileName += cron === true ? '_cron.md' : '_nocron.md';
    } else {
        fileName = "widget";
        fileName += rules === true ? '_rules' : '_norules';
        fileName += cron === true ? '_cron.md' : '_nocron.md';
    }
    let md = fs.readFileSync(path.resolve (__dirname , 'lib/create_modules/info', Config.language, fileName), 'utf8');
    md = md.replace(/label_module/g, ((label && label.length > 0) ? label : plugin));
  
    fs.ensureDirSync(path.resolve (__dirname , 'core/plugins', plugin, 'assets'))
    fs.writeFileSync (path.resolve (__dirname , 'core/plugins', plugin, 'assets/infos.md'), md, 'utf8');
}


function createDocumentation(arg) {
    fs.ensureDirSync(path.resolve (__dirname , 'core/plugins', arg.name, 'documentation'));
    const init = '{\n"static": '+(arg.serverHTML ? 'true':'false')+',\n"start": "'+arg.startPage+'"\n}';
    fs.writeFileSync (path.resolve (__dirname , 'core/plugins', arg.name, 'documentation/documentation.ini'), init, 'utf8');

    let html = fs.readFileSync(path.resolve (__dirname , 'lib/create_modules/html/index.html'), 'utf8');
    html = html.replace(/create_module/g, arg.name);
    fs.writeFileSync (path.resolve (__dirname , 'core/plugins', arg.name, 'documentation', arg.startPage), html, 'utf8');
}


function createWidgetImages(plugin) {
    const images = path.resolve (__dirname , 'lib/create_modules/widget/images');
    const pluginImages = path.resolve (__dirname , 'core/plugins', plugin, 'assets/images/widget')
    fs.copySync(images, pluginImages);
}


function createAPImodule(plugin) {
    let API = fs.readFileSync(path.resolve (__dirname , 'lib/create_modules/widget/API/API.js'), 'utf8');
    API = API.replace(/create_module/g, plugin);
    fs.ensureDirSync(path.resolve (__dirname , 'core/plugins', plugin, 'lib'));
    fs.writeFileSync (path.resolve (__dirname , 'core/plugins', plugin, 'lib', plugin+'.js'), API, 'utf8');
}
  

function createPackage(plugin) {
    let json = fs.readFileSync(path.resolve (__dirname , 'lib/create_modules/package/package.json'), 'utf8');
    json = json.replace(/create_module/g, plugin);
    fs.writeFileSync (path.resolve (__dirname , 'core/plugins', plugin, 'package.json'), json, 'utf8');
}

async function createNewPlugin (arg) {

    let pluginFolder = path.resolve (__dirname , 'core/plugins', arg.name);
    fs.ensureDirSync(pluginFolder);

    if (arg.rules === true && arg.methods.addwidget === false) {
        createIntent(arg.name, arg.bySyntax, false);
        createAction(arg.name, arg.bySyntax, false);
    } else if (arg.methods.addwidget === true) {
        if (arg.rules === true) {
            createIntent(arg.name, null, true);
            createAction(arg.name, null, true);
        }
        createWidgetImages(arg.name);
        createAPImodule(arg.name);
    }

    let propertyFile = await createProp(arg.name, arg.label, arg.bySyntax, arg.rules, arg.methods.cron, arg.methods.addwidget);
    if (!propertyFile) {
        shell.trashItem(pluginFolder);
        throw new Error (L.get("pluginLibrairy.noPropFile"));
    }
    createJS(arg);
    addImage(arg.name, arg.image);
    addMarkuDownInfo(arg.name, arg.label, arg.bySyntax, arg.rules, arg.methods.cron, arg.methods.addwidget);
    if (arg.documentation === true) createDocumentation(arg);
    createPackage(arg.name);
    Config = await Avatar.Config.refreshPluginProp(arg.name, propertyFile);
    await Avatar.Plugin.add(arg.name);
    if (arg.rules === true) Avatar.Ia.addPlugin(arg.name);
}


function addImage (plugin, image) {
    if (image !== 'by default') {
        let ext = path.extname(image)
        fs.ensureDirSync(path.resolve (__dirname , 'core/plugins', plugin, 'assets'))
        let newFile = path.resolve (__dirname, 'core/plugins', plugin, 'assets/images', plugin+ext)
        let file = path.resolve (__dirname, 'assets/html/tmp', image)
        fs.copySync(file, newFile)
    }
}


async function isPluginExist(plugin) {

    let folders = klawSync(path.resolve(__dirname, 'core/plugins'), {nofile: true, depthLimit: 0});
    for (let pluginFolder in folders) {
      let folder = folders[pluginFolder].path.substring(folders[pluginFolder].path.lastIndexOf(path.sep) + 1);
      if (folder.toLowerCase() === plugin.toLowerCase()) return true;
    }
    return false;

}


async function getPluginInfo (plugin) {
    let pluginFolder = path.resolve(__dirname, 'core/plugins', plugin)
    let properties = fs.readJsonSync(pluginFolder+'/'+plugin+'.prop', { throws: false });
    let name = (properties && properties.modules[plugin] && properties.modules[plugin].name) ? properties.modules[plugin].name : plugin;
    let image = (fs.existsSync(path.resolve(pluginFolder, 'assets/images', plugin+'.png')))
            ? path.resolve(path.resolve(pluginFolder, 'assets/images', plugin+'.png'))
            : path.resolve(__dirname, 'assets/images/icons/plugin.png');

    let disabled = L.get("pluginStudio.disabled");
    name = (properties && (properties.modules[plugin].active || properties.modules[plugin].active === undefined)) ? name : name + "\n("+disabled+")"

    return {
        id: plugin,
        name: name,
        image: image,
        config: properties.modules[plugin]
    }
}


async function getPlugins () {

    let plugins = [];
    let folders = klawSync(path.resolve(__dirname, 'core/plugins'), {nofile: true, depthLimit: 0});
    let count = folders.length;
    if (count === 0) return plugins;

    for (let plugin in folders) {
        let folder = folders[plugin].path.substring(folders[plugin].path.lastIndexOf(path.sep) + 1);
        let properties = fs.readJsonSync(folders[plugin].path+'/'+folder+'.prop', { throws: false });
        let exist = (properties) ? true : false
        let name = (properties && properties.modules[folder] && properties.modules[folder].name) ? properties.modules[folder].name : folder;

        let image = (fs.existsSync(path.resolve(__dirname, 'core/plugins', folder, 'assets/images', folder+'.png')))
            ? path.resolve(__dirname, 'core/plugins', folder, 'assets/images', folder+'.png')
            : path.resolve(__dirname, 'assets/images/icons/plugin.png');

        var mdInfos;
        if (fs.existsSync(path.resolve(__dirname, 'core/plugins', folder, 'assets/infos_'+Config.language+'.md'))) {
            mdInfos = fs.readFileSync(path.resolve(__dirname, 'core/plugins', folder, 'assets/infos_'+Config.language+'.md'), 'utf8');
        } else if (fs.existsSync(path.resolve(__dirname, 'core/plugins', folder, 'assets/infos.md'))) {
            mdInfos = fs.readFileSync(path.resolve(__dirname, 'core/plugins', folder, 'assets/infos.md'), 'utf8');
        } else {
            let msg = L.get("pluginStudio.noDescription")
            fs.ensureDirSync(path.resolve(__dirname, 'core/plugins', folder, 'assets'));
            fs.writeFileSync(path.resolve(__dirname, 'core/plugins', folder, 'assets/infos.md'), "# "+name+"\n\n"+msg, 'utf8');
            mdInfos = fs.readFileSync(path.resolve(__dirname, 'core/plugins', folder, 'assets/infos.md'), 'utf8');
        }

        let disabled = L.get("pluginStudio.disabled")
        if (exist) {
            name = (properties && (properties.modules[folder].active || properties.modules[folder].active === undefined)) ? name : name + "\n("+disabled+")";
            plugins.push({fullPath: folders[plugin].path+'/'+folder+'.prop', id: folder , name: name, image: image, properties: properties, md: mdInfos});
        }
        if (!--count) return plugins;
    }
}


async function activePlugin (plugin, state) {

    let propertyFile = path.resolve (__dirname , 'core/plugins', plugin, plugin+'.prop')
    let property = fs.readJsonSync(propertyFile, { throws: false })
    property.modules[plugin].active = state
    fs.writeJsonSync(propertyFile, property)

    if (!Config.modules[plugin] && state === true) {
        Config = await Avatar.Config.refreshPluginProp(plugin, propertyFile)
        Avatar.Plugin.add(plugin)
    } else if (Config.modules[plugin] && state === false) {
      Avatar.Plugin.removeCache(plugin)
    }

}


async function reloadPlugin (plugin) {

    const propertyFile = path.resolve (__dirname , 'core/plugins', plugin, plugin+'.prop')
    const property = fs.readJsonSync(propertyFile, { throws: false })
    if (!_.isEqual(Config.modules[plugin], property.modules[plugin]) || (property.cron && !_.isEqual(Config.cron[plugin], property.cron[plugin]))) {
      Config = await Avatar.Config.refreshPluginProp(plugin, propertyFile);
    }

    return Config;

}


function reorderPlugins (plugins) {
    return new Promise(async (resolve) => {

        if (plugins.length === 0) resolve(false)

        let folder = path.resolve (__dirname , 'core/plugins')
        let count = plugins.length
        for (let i in plugins) {
            let pluginPropsFile = path.resolve(folder, plugins[i][0], plugins[i][0]+'.prop')
            let pluginProps = fs.readJsonSync(pluginPropsFile, { throws: false })
            if (plugins[i][1] !== "default") {
                pluginProps.modules[plugins[i][0]].nlpPosition = plugins[i][1]
            } else {
                if (pluginProps.modules[plugins[i][0]].nlpPosition !== undefined) {
                    Reflect.deleteProperty(pluginProps.modules[plugins[i][0]], 'nlpPosition')
                }
            }
            pluginProps.modules[plugins[i][0]].active = plugins[i][2]
            fs.writeJsonSync(pluginPropsFile, pluginProps)
            if (!--count) resolve(true)
        }
    })
}


async function refreshConfigRules(plugin, room, periph, rules) {

	let propertyFile = path.resolve (__dirname, 'core/plugins', plugin, plugin+'.prop');
	let properties = fs.readJsonSync(propertyFile, { throws: false });

	if (!rules || rules.rules.length === 0) {
		return properties.modules[plugin];
	}

	switch (periph.value_type) {
		case 'list':
		case 'float':
		case 'string':
			if (rules.common === '') {
				// ruleAuto
				if (!properties.modules[plugin].ruleAuto) {
					properties.modules[plugin].ruleAuto = {};
				} else {
					let keys =_.keys(properties.modules[plugin].ruleAuto);
					let even = _.find(keys, function(num){ return num === periph.name;});
					if (even) {
						properties.modules[plugin].ruleAuto = _.omit(properties.modules[plugin].ruleAuto, periph.name);
					}
				}
				properties.modules[plugin].ruleAuto[periph.name] = [];
				// end ruleAuto
				// intent command
				if (!properties.modules[plugin].rules) properties.modules[plugin].rules = {};
				let keys =_.keys(properties.modules[plugin].rules);

				for (let i in rules.rules) {
					let even = _.find(keys, function(num){ return num === rules.rules[i].command;});
					if (even) {
						properties.modules[plugin].rules = _.omit(properties.modules[plugin].rules, rules.rules[i].command);
					}
					// add rules in rules section
					properties.modules[plugin].rules[rules.rules[i].command] = rules.rules[i].rules;
					// add command in ruleAuto section
					properties.modules[plugin].ruleAuto[periph.name].push({
						command: rules.rules[i].command,
						value: rules.rules[i].value,
						description: rules.rules[i].description
					})
				}
				// end intent command
				// client
				if (!properties.modules[plugin].clients) properties.modules[plugin].clients = {};
				keys =_.keys(properties.modules[plugin].clients);	
				let even = _.find(keys, function(num){ return num === room;});
				if (!even) {
					properties.modules[plugin].clients[room] = {};
				} else {
					keys =_.keys(properties.modules[plugin].clients[room]);
					even = _.find(keys, function(num){ return num === periph.name;});
				}
				if (!even) {
					properties.modules[plugin].clients[room][periph.name] = periph.periph_id;
				}
				// end client
			} else {
				if (!properties.modules[plugin].intents) properties.modules[plugin].intents = {single: 'rules'};
				// intents
				let exist = _.findKey(properties.modules[plugin].intents, num => { 
					return _.find(num, elem => { return elem === periph.name; })
				});

				if (exist && exist !== rules.common) {
					properties.modules[plugin].intents[exist] = _.reject(properties.modules[plugin].intents[exist], function(num) { 
						return num === periph.name; 
					});
				}
				
				let keys =_.keys(properties.modules[plugin].intents);
				let even = _.find(keys, function(num){ return num === rules.common;});
				if (!even) {
					properties.modules[plugin].intents[rules.common] = [periph.name];
				} else {
					let even = _.find(properties.modules[plugin].intents[rules.common], function(num){ return num === periph.name;});
					if (!even)
						properties.modules[plugin].intents[rules.common].push(periph.name);
				}
				// end intents
				// ruleGroups
				if (!properties.modules[plugin].ruleGroups) properties.modules[plugin].ruleGroups = {};
				keys =_.keys(properties.modules[plugin].ruleGroups);
				even = _.find(keys, function(num){ return num === rules.common;});
				if (even) {
					properties.modules[plugin].ruleGroups = _.omit(properties.modules[plugin].ruleGroups, rules.common) ;
				}

				properties.modules[plugin].ruleGroups[rules.common] = {};
				properties.modules[plugin].ruleGroups[rules.common].command = rules.rules[0].command;
				for (let i in rules.rules) {
					properties.modules[plugin].ruleGroups[rules.common][rules.rules[i].value] = rules.rules[i].rules;
				}
				// end ruleGroups
				// client
				if (!properties.modules[plugin].clients) properties.modules[plugin].clients = {};
				keys =_.keys(properties.modules[plugin].clients);	
				even = _.find(keys, function(num){ return num === room;});
				if (!even) {
					properties.modules[plugin].clients[room] = {};
				} else {
					keys =_.keys(properties.modules[plugin].clients[room]);
					even = _.find(keys, function(num){ return num === periph.name;});
				}

				if (!even) {
					properties.modules[plugin].clients[room][periph.name] = periph.periph_id;
				}
				// end client
			}

			// saving file, update properties
			fs.writeJsonSync(propertyFile, properties);
			Config = await Avatar.Config.refreshPluginProp (plugin, propertyFile, true);
		default: 
			return properties.modules[plugin];
	}
}


async function removeConfigRules(plugin, room, periph, rules, properties, propertyFile) {

	if (!rules || rules.rules.length === 0) {
		return properties.modules[plugin]
	}

	switch (periph.value_type) {
		case 'list':
		case 'float':
		case 'string':
			if (rules.common === '') {
				// ruleAuto
				if (!properties.modules[plugin].ruleAuto) {
					properties.modules[plugin].ruleAuto = {};
				} else {
					let keys =_.keys(properties.modules[plugin].ruleAuto);
					let even = _.find(keys, function(num){ return num === periph.name;});
					if (even) {
						properties.modules[plugin].ruleAuto = _.omit(properties.modules[plugin].ruleAuto, periph.name);
					}
				}		
				// end ruleAuto
				// intent command
				if (!properties.modules[plugin].rules) properties.modules[plugin].rules = {};
				let keys =_.keys(properties.modules[plugin].rules);

				for (let i in rules.rules) {
					let even = _.find(keys, function(num){ return num === rules.rules[i].command;});
					if (even) {
						properties.modules[plugin].rules = _.omit(properties.modules[plugin].rules, rules.rules[i].command);
					}
				}
				// end intent command
				// client
				if (!properties.modules[plugin].clients) properties.modules[plugin].clients = {};
				keys =_.keys(properties.modules[plugin].clients);	
				let even = _.find(keys, function(num){ return num === room;});
				if (!even) {
					properties.modules[plugin].clients[room] = {}
				} else {
					keys =_.keys(properties.modules[plugin].clients[room]);
					even = _.find(keys, function(num){ return num === periph.name;});
				}
				if (even) {
					properties.modules[plugin].clients[room] = _.omit(properties.modules[plugin].clients[room], periph.name);
				}
				// end client
			} else {
				if (!properties.modules[plugin].intents) properties.modules[plugin].intents = {single: 'rules'};
				// intents
				let exist = _.findKey(properties.modules[plugin].intents, function(num){ 
					return _.find(num, function(elem){ return elem === periph.name; })
				});

				if (exist && exist !== rules.common) {
					properties.modules[plugin].intents[exist] = _.reject(properties.modules[plugin].intents[exist], function(num) { 
						return num === periph.name; 
					});
				}
				// intents
				// ruleGroups
				if (!properties.modules[plugin].ruleGroups) properties.modules[plugin].ruleGroups = {};
				let keys =_.keys(properties.modules[plugin].ruleGroups);
				let even = _.find(keys, function(num){ return num === rules.common;});
				if (even) {
					properties.modules[plugin].ruleGroups = _.omit(properties.modules[plugin].ruleGroups, rules.common) 
				}
				// end ruleGroups
				// client
				if (!properties.modules[plugin].clients) properties.modules[plugin].clients = {};
				keys =_.keys(properties.modules[plugin].clients);	
				even = _.find(keys, function(num){ return num === room;});
				if (!even) {
					properties.modules[plugin].clients[room] = {}
				} else {
					keys =_.keys(properties.modules[plugin].clients[room]);
					even = _.find(keys, function(num){ return num === periph.name;});
				}
				if (even) {
					properties.modules[plugin].clients[room] = _.omit(properties.modules[plugin].clients[room], periph.name);
				}
				// end client
			}
			// saving file, update properties
			fs.writeJsonSync(propertyFile, properties)
			Config = await Avatar.Config.refreshPluginProp (plugin, propertyFile, true)
		default: 
			return properties.modules[plugin]
	}
}


async function readyToShow () {
    let pluginList = await Avatar.Plugin.getList();
    let count = pluginList.length; 
    if (count === 0) return;
    for (let i in pluginList) {
      if (pluginList[i]._script.readyToShow) await pluginList[i]._script.readyToShow();
      if (!--count) return;
    }
}


async function getPluginWidgets () {
      let pluginList = await Avatar.Plugin.getList();
      let pluginWidgets = [], count = pluginList.length; 
      if (count === 0) return pluginWidgets;
      for (let i in pluginList) {
        if (pluginList[i]._script.getWidgetsOnLoad) {
            let widgets = await pluginList[i]._script.getWidgetsOnLoad();
            if (widgets) pluginWidgets.push(widgets);
            if (!--count) return pluginWidgets;
        } else if (!--count) {
            return pluginWidgets;
        }
      }
}


async function refreshPluginWidgetInfo (arg) {
    let script = Avatar.find(arg.plugin);
    if (script && script._script.refreshWidgetInfo)
        return await script._script.refreshWidgetInfo(arg); 
    
    let APIfolder = fs.existsSync(path.resolve(__dirname, 'core/plugins', arg.plugin, 'lib', arg.plugin+'.js'))
    ? path.resolve(__dirname, 'core/plugins', arg.plugin, 'lib', arg.plugin+'.js') : null;  

    await Avatar.Widget.initVar(path.resolve(__dirname, 'core/plugins', arg.plugin, 'assets/widget'), path.resolve(__dirname, 'core/plugins', arg.plugin, 'assets/images/widget'), APIfolder, Config.modules[arg.plugin]);
    return await Avatar.Widget.refreshWidgetInfo(arg);
}


async function getNewValuePluginWidgetById (arg) {
    let script = Avatar.find(arg.plugin);
    if (script && script._script.getNewValueWidgetById)
        return await script._script.getNewValueWidgetById(arg);

    if (fs.existsSync(path.resolve(__dirname, 'core/plugins', arg.plugin, 'lib', arg.plugin+'.js'))) {
        let api = path.resolve(__dirname, 'core/plugins', arg.plugin, 'lib', arg.plugin+'.js');
        let APIPlugin = await import ('file:///'+api);
        let API = await APIPlugin.init();
        await API.initVar(Config.modules[arg.plugin]);
        let info = await API.getPeriphCaract(arg.periphId);
        let value = _.reject(arg.currentValue, (num) => {
            return num.description === info.last_value_text;
        })
        return value
    } else {
        return arg.currentValue;
    }
}


async function pluginWidgetAction (arg) {
    let script = Avatar.find(arg.plugin);
    return await script._script.widgetAction(arg);
}


function onPluginClose (arg) {
    return new Promise(async (resolve) => {
        let pluginList = await Avatar.Plugin.getList();
        let count = pluginList.length;
        if (count === 0) return resolve();
    
        for (let i in pluginList) {
            if (pluginList[i]._script.onClose) {
                try {
                    let script = Avatar.find(pluginList[i].name);
                    await script._script.onClose((arg[pluginList[i].name] ? arg[pluginList[i].name] : null));
                    if (!--count) resolve();
                } catch (err) {
                    resolve (err);
                }
            } else if (!--count) {
                resolve();
            }
        }
    })
}


async function getCreatePluginWidgets() {
    let pluginList = await Avatar.Plugin.getList();
    let pluginPeriphsInfo = {}, count = pluginList.length;
    if (count === 0) return {periphs: [], plugins: []};

    let plugins = await getPlugins();

    for (let i in pluginList) {
        if (pluginList[i]._script.createWidgets) {
            let script = Avatar.find(pluginList[i].name);
            let info = await script._script.createWidgets()
            let infoPlugin = await getPluginInfo(pluginList[i].name)
            pluginPeriphsInfo[pluginList[i].name] = {
                periphs: info.periphs,
                sameNames: info.sameNames,
                widgets: info.widgets,
                name: infoPlugin.name,
                image: infoPlugin.image,
                config: infoPlugin.config
            }
            if (!--count) return {periphs: pluginPeriphsInfo, plugins: plugins};
        } else if (pluginList[i]._script.getPeriphInfo) {
            let script = Avatar.find(pluginList[i].name);
            let periphInfo = await script._script.getPeriphInfo();
            let sameNames = await Avatar.APIFunctions.searchSamePeriphNames(periphInfo);
            
            let APIfolder = fs.existsSync(path.resolve(__dirname, 'core/plugins', pluginList[i].name, 'lib', pluginList[i].name+'.js'))
            ? path.resolve(__dirname, 'core/plugins', pluginList[i].name, 'lib', pluginList[i].name+'.js') : null;
      
            await Avatar.Widget.initVar(path.resolve(__dirname, 'core/plugins', pluginList[i].name, 'assets/widget'), path.resolve(__dirname, 'core/plugins', pluginList[i].name, 'assets/images/widget'), APIfolder, Config.modules[pluginList[i].name]);
            let widgets = await Avatar.Widget.getWidgets()
       
            let infoPlugin = await getPluginInfo(pluginList[i].name)
            pluginPeriphsInfo[pluginList[i].name] = {
                periphs: periphInfo,
                sameNames: sameNames,
                widgets: widgets,
                name: infoPlugin.name,
                image: infoPlugin.image,
                config: infoPlugin.config
            }
            if (!--count) return {periphs: pluginPeriphsInfo, plugins: plugins};
        } else if (!--count) {
            return {periphs: pluginPeriphsInfo, plugins: plugins};
        }
    }
}


async function getPeriphValues (arg) {
    let script = Avatar.find(arg.plugin);
    if (script && script._script.getPeriphValues)
        return await script._script.getPeriphValues(arg.id, arg.type);

    if (arg.type !== 'button') {
        let api = path.resolve(__dirname, 'core/plugins', arg.plugin, 'lib', arg.plugin+'.js');
        let APIPlugin = await import ('file:///'+api);
        let API = await APIPlugin.init();
        await API.initVar(Config.modules[arg.plugin]);
        return await API.getPeriphValues(arg.id);
    } else 
        return {periph_id: arg.id};

}


async function getWidgetImage (arg) {
    let script = Avatar.find(arg.plugin);
    if (script && script._script.getWidgetImage) return await script._script.getWidgetImage(arg.infos);

    await Avatar.APIFunctions.initVar(path.resolve(__dirname, 'core/plugins', arg.plugin, 'assets/images/widget'));
    return await Avatar.APIFunctions.getImageSync(arg.infos.usage, arg.infos.periph_id, arg.infos.value, arg.infos.values);
}


async function getWidgetImages (arg) {
    let script =  Avatar.find(arg.plugin);
    if (script && script._script.getWidgetImages) return await script._script.getWidgetImages(arg.infos);

    await Avatar.APIFunctions.initVar(path.resolve(__dirname, 'core/plugins', arg.plugin, 'assets/images/widget'));
    return await Avatar.APIFunctions.getImagesSync(arg.infos.usage, arg.infos.periph_id, arg.infos.values);
}


async function deleteWidgetImage(arg) {
    let script = Avatar.find(arg.plugin);
    if (script && script._script.deleteWidgetImage) return await script._script.deleteWidgetImage(arg.file);

    await Avatar.APIFunctions.initVar(path.resolve(__dirname, 'core/plugins', arg.plugin, 'assets/images/widget'));
    return await Avatar.APIFunctions.deleteImageSync(arg.file);
}


async function saveWidget(arg) {

    let script = Avatar.find(arg.plugin);
    if (script && script._script.saveWidget) 
        return await script._script.saveWidget(arg.room, arg.periph, arg.widget, arg.rules, arg.images)


    await Avatar.APIFunctions.initVar(path.resolve(__dirname, 'core/plugins', arg.plugin, 'assets/images/widget'));
    let APIfolder = fs.existsSync(path.resolve(__dirname, 'core/plugins', arg.plugin, 'lib', arg.plugin+'.js'))
            ? path.resolve(__dirname, 'core/plugins', arg.plugin, 'lib', arg.plugin+'.js') : null;
            
    await Avatar.Widget.initVar(path.resolve(__dirname, 'core/plugins', arg.plugin, 'assets/widget'), path.resolve(__dirname, 'core/plugins', arg.plugin, 'assets/images/widget'), APIfolder, Config.modules[arg.plugin]);
    let result = await Avatar.Widget.saveWidget(arg.widget);
    if (!result) return false;
    result = await Avatar.APIFunctions.saveImageSync(arg.widget, arg.images);
    if (!result) return false;
    return await refreshConfigRules(arg.plugin, arg.room, arg.periph, arg.rules);
}


async function deleteWidget (arg) {
    let script = Avatar.find(arg.plugin);
    if (script && script._script.deleteWidget) 
        return await script._script.deleteWidget(arg.choice, arg.room, arg.periph, arg.widget, arg.rules);

    let APIfolder = fs.existsSync(path.resolve(__dirname, 'core/plugins', arg.plugin, 'lib', arg.plugin+'.js'))
    ? path.resolve(__dirname, 'core/plugins', arg.plugin, 'lib', arg.plugin+'.js') : null;
    await Avatar.Widget.initVar(path.resolve(__dirname, 'core/plugins', arg.plugin, 'assets/widget'), path.resolve(__dirname, 'core/plugins', arg.plugin, 'assets/images/widget'), APIfolder, Config.modules[arg.plugin]);
    let result = await Avatar.Widget.deleteWidget(arg.widget.id)
    if (!result) return false;

    let propertyFile = path.resolve (__dirname, 'core/plugins', arg.plugin, arg.plugin+'.prop');
	let properties = fs.readJsonSync(propertyFile, { throws: false });
    return  (arg.choice === 0) 
    ? await removeConfigRules(arg.plugin, arg.room, arg.periph, arg.rules, properties, propertyFile)
    : properties.modules[arg.plugin]

}


async function getWidgetInfos (arg) {
    let script = Avatar.find(arg.plugin);
    if (script && script._script.getWidgetInfos) 
        return await script._script.getWidgetInfos(arg.widget);

    let APIfolder = fs.existsSync(path.resolve(__dirname, 'core/plugins', arg.plugin, 'lib', arg.plugin+'.js'))
        ? path.resolve(__dirname, 'core/plugins', arg.plugin, 'lib', arg.plugin+".js") : null;

    await Avatar.Widget.initVar(path.resolve(__dirname, 'core/plugins', arg.plugin, 'assets/widget'), path.resolve(__dirname, 'core/plugins', arg.plugin, 'assets/images/widget'), APIfolder, Config.modules[arg.plugin]);
    return await Avatar.Widget.getWidgetInfos(arg.widget);
}

async function initVar (config) {
    Config = config;
}


async function init () {
    return {
        'initVar': initVar,
        'createNewPlugin': createNewPlugin,
        'isPluginExist': isPluginExist,
        'getPlugins': getPlugins,
        'activePlugin': activePlugin,
        'reloadPlugin': reloadPlugin,
        'reorderPlugins': reorderPlugins,
        'getPluginWidgets': getPluginWidgets,
        'refreshPluginWidgetInfo': refreshPluginWidgetInfo,
        'getNewValuePluginWidgetById': getNewValuePluginWidgetById,
        'pluginWidgetAction': pluginWidgetAction,
        'onPluginClose': onPluginClose,
        'getCreatePluginWidgets': getCreatePluginWidgets,
        'getPluginInfo': getPluginInfo,
        'getPeriphValues': getPeriphValues,
        'getWidgetImage': getWidgetImage,
        'getWidgetImages': getWidgetImages,
        'deleteWidgetImage': deleteWidgetImage,
        'saveWidget': saveWidget,
        'deleteWidget': deleteWidget,
        'getWidgetInfos': getWidgetInfos,
        'readyToShow': readyToShow
    }
}


export { init };