import _ from 'underscore';
import fs from 'fs-extra';
import * as path from 'node:path';
import { default as klawSync } from 'klaw-sync';
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

class PluginLanguage {
    constructor(plugin, locale, pak) {
      this.plugin = plugin;
      this.locale = locale;
      this.pak = pak;
      PluginLanguages.add = this;
    };
    get = function () {
        let tblarg = [], str;
        if (typeof arguments[0] === "object") {
          for (var i = 1; i < arguments[0].length; i++) {
            tblarg.push(arguments[0][i]);
          }
          str = arguments[0][0];
        } else {
          str = arguments[0];
          for (var i = 1; i < arguments.length; i++) {
            tblarg.push(arguments[i]);
          }
        }
        var retStr = eval('eval(this.pak).'+str);
        if (typeof retStr !== 'undefined') {
          return setLParameters(retStr, tblarg);
        } else
          return 'Label not defined: '+str;
    }
}


const PluginLanguages = {
    list: [],
    get all() {return this.list;},
    /**
     * @param {this} obj
     */
    set add(obj) {this.list.push (obj);},
    getPaksByPlugin: plugin => {
        let pakList = [];
        _.find(PluginLanguages.all, elem => {
            if (elem.plugin === plugin) pakList.push(elem)
        });
        return pakList;
    },
    getPak: (plugin, locale) =>{
        for (let i in PluginLanguages.all) {
          if (PluginLanguages.all[i].plugin === plugin && PluginLanguages.all[i].locale === locale)
            return PluginLanguages.all[i]
        }
    }
}


function setLParameters(str, arg) {
    let words = str.split(' '), a = 0;
    for (var i = 0; i < words.length && arg.length > 0; i++) {
      if (words[i].indexOf('$$') !== -1 && arg[a]) {
        words[i] = words[i].replace('$$', arg[a]);
        a += 1;
      }
    }
    return words.join(' ');
}


async function addPak(plugin, locale, pak) {
    return new PluginLanguage (plugin, locale, pak);
}


async function getPaksByPlugin(plugin) {
    return PluginLanguages.getPaksByPlugin(plugin);
}


async function getPak(plugin, locale) {
    return PluginLanguages.getPak(plugin, locale);
}


async function getLanguagePak (plugin, lang) {
	let pak;
	if (fs.existsSync(path.resolve(__dirname, '..', 'plugins', plugin, 'locales', lang+'.pak')))
		pak = fs.readJsonSync(path.resolve(__dirname, '..', 'plugins', plugin, 'locales', lang+'.pak'), { throws: false });
	else 
		warn (`Unable to find the ${lang} language pack. Search for default 'English' language pack...`)

	if (!pak) pak = fs.readJsonSync(path.resolve(__dirname, '..', 'plugins', plugin, 'locales', 'en.pak'), { throws: false });
	if (!pak) error (`Plugin ${plugin}: No language pack found !`);
	return pak;
}


async function addPluginPak (plugin) {

  return new Promise(async resolve => {

    const folder = path.resolve(__dirname, '..', 'plugins', plugin, 'locales');

    if (!fs.existsSync(path.resolve(folder))) {
      warn (`${plugin}: Unable to find the folder language pack`)
      return resolve()
    }

    let langpak = klawSync(folder, {nodir: true, depthLimit: 0});
    let count = langpak.length
    if (count === 0) return resolve(false)

    for (let i=0; i < langpak.length; i++) {
      const fileName = langpak[i].path
      const ext = path.extname(fileName)
      if (ext === '.pak') {
        const lang = path.basename(fileName, ext);
        const pak = fs.readJsonSync(fileName, { throws: false });
        await addPak(plugin, lang, pak);
      }

      if (!--count) resolve (true)
    }
  })
}


async function initPluginLanguage() {
    Avatar.lang = {
        addPak: addPak,
        addPluginPak: addPluginPak,
        getPaksByPlugin: getPaksByPlugin,
        getPak: getPak,
        getLanguagePak: getLanguagePak
    }
}


export { initPluginLanguage };