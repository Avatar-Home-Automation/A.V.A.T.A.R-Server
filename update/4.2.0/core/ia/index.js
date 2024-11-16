import { default as fs } from 'fs-extra';
import _ from 'underscore';
import * as path from 'node:path';
import pkg from 'ava-ia';
const { Ava } = pkg;
import intentspkg from 'intents'
const {lastAction, intentEnd} = intentspkg;
import actionspkg from 'actions'
const {backupAction, actionEnd} = actionspkg;

const ava = new Ava ({
  debug: false, 
});


export function intent () {

	// Find Intent & Actions linked to plugins
	getPluginIntent()
	.then(cache => getPluginIntents(cache))
	.then(cache => bubbleTree(cache))
	.then(async (cache) => {
		// Configure the intents
		for(var i = 0 ; i < cache.length ; i++){
			let mspluginIntent = await import("file:///"+cache[i].intent)
			let pluginIntent = mspluginIntent.default;
			var pluginAction;
			if ( cache[i].actions.length === 1) {
			    let mspluginAction = await import("file:///"+cache[i].actions[0])
				pluginAction = mspluginAction.default;
			} else {
				pluginAction = [];
				for (var a = 0; a < cache[i].actions.length; a++) {
				    let msPluginAction = await import("file:///"+cache[i].actions[a])
					pluginAction.push(msPluginAction.default);
				}
			}
			ava.intent(cache[i].module, pluginIntent, pluginAction);
		}
		// private intents - Do not touch
		ava
		 .intent('lastAction', lastAction, backupAction)
		 .intent('noIntent', intentEnd, actionEnd)  // Always at the end ! Check if a rule has been passed
	});

}


export function addPlugin(plugin) {
	addIntent(plugin)
	.then(async cache => {
		let mspluginIntent = await import("file:///"+cache[0].intent)
		let pluginIntent = mspluginIntent.default;
		let mspluginAction = await import("file:///"+cache[0].actions[0])
		let pluginAction = mspluginAction.default;
		
		ava
		.reject('lastAction')
		.reject('noIntent')
		.intent(cache[0].module, pluginIntent, pluginAction)
		.intent('lastAction', lastAction, backupAction)
		.intent('noIntent', intentEnd, actionEnd) 
	})
}


function addIntent(plugin) {

	return new Promise(function (resolve) {
		var err = false;
		var cache  = [];
		var folder = path.resolve(Avatar.Config.PLUGIN, plugin);
		var instance = {actions : []};

		fs.readdirSync(folder).forEach(file => {
			var folderPath = path.resolve(folder, file);
			// Directory
			if (!fs.statSync(folderPath).isDirectory()){
				if (file.toLowerCase().startsWith('intent.')) {

					if (!instance.intent) {
						instance.intent = folderPath;
						instance.module = plugin;
					} else {
						error(L.get(["ia.OneIntentFile", plugin]));
						err = true;
					}
				}

				if (file.toLowerCase().startsWith('action.') && !err){
					instance.actions.push(folderPath);
				}
			}
		})

		if (instance.intent && !err) {
			if (instance.actions && instance.actions.length > 0) {
				cache.push(instance);
			} else {
				error(L.get(["ia.noActionFile", plugin]));
			}
		}
		
		resolve(cache)
	})
}



export function listen (sentence, client, language, resolve, reject) {
	ava.listen(sentence, client, language)
	.then(state => {
		resolve(state)
	})
	.catch(err => reject(err))
}


function getPluginIntent () {
	var cache  = [];
	return new Promise(function (resolve) {

		var keys = Object.keys(Config['modules']);

		for(var i = 0 ; i < keys.length ; i++){
			var key = keys[i];

			if (Config.modules[key].active === undefined || (Config.modules[key].active != undefined && Config.modules[key].active === true)) {

					var err = false;
					var folder = path.resolve(Avatar.Config.PLUGIN, key);
					var instance = {actions : []};
					fs.readdirSync(folder).forEach(file => {
						var folderPath = path.resolve(folder, file);
						// Directory
						if (!fs.statSync(folderPath).isDirectory()){
							if (file.toLowerCase().startsWith('intent.')){
								if (!instance.intent) {
									instance.intent = folderPath;
									instance.module = key;
									if (Config.modules[key].nlpPosition && typeof Config.modules[key].nlpPosition === 'number') {
										instance.pos = Config.modules[key].nlpPosition;
									}
								} else {
									error(L.get(["ia.OneIntentFile", key]));
									err = true;
								}
							}

							if (file.toLowerCase().startsWith('action.') && !err){
							  instance.actions.push(folderPath);
							}
						}

					  });

					  if (instance.intent && !err) {
							if (instance.actions && instance.actions.length > 0) {
								cache.push(instance);
							} else {
								error(L.get(["ia.noActionFile", key]));
							}
					  }

					instance = null;
		 	}
		}

		resolve(cache);
	});
}



function getPluginIntents (cache) {

	return new Promise(function (resolve) {

		var keys = Object.keys(Config['modules']);

		for(var i = 0 ; i < keys.length ; i++){
				var key = keys[i];

				if (Config.modules[key].active == undefined || (Config.modules[key].active != undefined && Config.modules[key].active == true)) {

					var folder = Avatar.Config.PLUGIN+'/'+key;

					fs.readdirSync(folder).forEach(function(file){
						var instance = {actions : []};
						var err = false;
						var path = folder+'/'+file;

						// Directory
						if (!fs.statSync(path).isDirectory()){
							if (file.toLowerCase().startsWith('intents.')){

								var posPoint = file.toLowerCase().indexOf('.',9);
								var	intentName = file.toLowerCase().substring(8,posPoint);
								for(var a=0; cache && a < cache.length; a++) {
									if (cache[a].intent.toLowerCase().indexOf(('intents.'+intentName).toLowerCase()) != -1) {
										error(L.get(["ia.OneIntentFileName", intentName, key]));
										err=true;
										break;
									}
								}

								if (!err) {
									instance.intent = path;
									instance.module = key;
									if (Config.modules[key].nlpPosition) {
										if (typeof Config.modules[key].nlpPosition === 'number')
											instance.pos = Config.modules[key].nlpPosition;
										else if (typeof Config.modules[key].nlpPosition === 'object') {
											for (var rule in Config.modules[key].nlpPosition) {
												  if (rule.toLowerCase() == intentName.toLowerCase()) {
													    instance.pos = Config.modules[key].nlpPosition[rule];
												        break;
												  }
											}
										}
									}

									fs.readdirSync(folder).forEach(function(nextFile){
										var nextPath = folder+'/'+nextFile;
										if (!fs.statSync(nextPath).isDirectory()){
											if (nextFile.toLowerCase().startsWith(('actions.'+intentName).toLowerCase())) {
												  instance.actions.push(nextPath);
											}
										}
									});
								}
							}
						}

						 if (instance.intent && !err) {
							if (instance.actions && instance.actions.length > 0) {
								cache.push(instance);
							} else {
								error(L.get(["ia.noActionFile", key]));
							}
						  }
						  instance = null;
					 });
				}
		}

		resolve(cache);
	});
}


function bubbleTree (cache) {

	return new Promise(function (resolve) {

		for(var i = 0 ; i < cache.length ; i++){
			for(var a = 1 ; a < cache.length ; a++){
				var tmp = {};
				if(cache[a].pos && cache[a].pos == i + 1 && cache[a].module != cache[i].module) {
					if (cache[a].pos && cache[i].pos && cache[a].pos == cache[i].pos && a != i) {
						if (Config.verbose) infoOrange(L.get(["ia.samePositionModule", cache[a].module, cache[i].module]));
						continue;
					}

					if (cache[a].pos && cache[i].pos && cache[a].pos == cache[i].pos && a == i) {
						continue;
					}

					if (Config.verbose) infoOrange(L.get(["ia.ChangePositionModule", cache[a].module, (a+1), cache[a].pos]));

					tmp = cache[i];
					cache[i] = cache[a];
					cache[a] = tmp;
				}
			}
		}

		resolve(cache);
	});
}
