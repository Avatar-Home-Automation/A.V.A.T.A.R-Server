
import { shell } from 'electron';
import _ from 'underscore';
import fs from 'fs-extra';
import { default as klawSync } from 'klaw-sync';
import * as path from 'node:path';
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

let folder;


function deleteEncrytPasswdWin() {
    let file = path.resolve(__dirname, 'lib/encrypt');
    shell.trashItem(file);
}


function saveEncrytPasswdWin(safeStorage, passwd) {
    if (safeStorage.isEncryptionAvailable()) {
        let encrypted = safeStorage.encryptString(passwd);
        encrypted = encrypted.toJSON();
        passwd = {password: encrypted.data};
        let file = path.resolve(__dirname, 'lib/encrypt/encrypt.json');
        fs.ensureDirSync(path.resolve(__dirname, 'lib/encrypt'));
        fs.writeJsonSync(file, passwd);
        return true;
    } 
}


function getPeriphRooms (infos) {
    return new Promise((resolve) => {
        let rooms = _.uniq(_.pluck(infos, 'room_name'));
        resolve(rooms);
    });
}


function classPeriphByRooms (rooms, infos) {
    return new Promise((resolve) => {
      let periphInfos = [];
      _.each(rooms, (room) => {
        getPeriphsByRoom (room, infos)
        .then(periphsByRoom => {
          let obj = new Object();
          obj[room] = periphsByRoom;
          periphInfos.push(obj);
        })
      })
      resolve(periphInfos);
    });
}


function getPeriphsByRoom (room,infos) {
    return new Promise((resolve) => {
        let periphsByRoom = _.where(infos, {'room_name': room});
        resolve(periphsByRoom);
    });
}


function getMacroIDByNotes(periph_id, value, periphInfos) {
    let notes;
    for(let room in periphInfos) {
      _.each(periphInfos[room], function(num){
        for (let i=0; i<num.length && !notes; i++) {
          if (num[i].periph_id === periph_id) {
            if (num[i].notes) {
              notes = num[i].notes;
              break;
            }
          }
        };
      });
    }
    if (notes) {
        notes = notes.split(',');
        let id;
        for(let i=0; i<notes.length && !id; i++) {
            if (notes[i] === value && notes[i+1]) {
              id = notes[i+1];
              break;
            }
        }
        return (id) ? id : null;
    } else
      return null;
}


function getSizing (value) {
    let sizing = false;
    if (value.indexOf(' ') != -1) {
      value = value.replace(/ /g,'\n');
      sizing = true;
    }
    return ({sizing: sizing, value: value});
}


function timeConvert (n) {
    if (n <= 60) {
      let sec = L.get(["functionLibrairy.getSecond", n]);
      return sec.replace('-','');
    }
    if (n <= 3600) return L.get(["functionLibrairy.getMinute", Math.round(n / 60)]);
    if (n <= 86400) return L.get(["functionLibrairy.getHour", Math.round((n / 60) / 60)]);
    if (n <= 2678400) return L.get(["functionLibrairy.getDay", Math.round(((n / 60) /60) / 24)]);
    return L.get(["functionLibrairy.getMonth", Math.round((((n / 60) /60)/ 24) / 31)]);
}


function getValues(json, item, value_text) {

    let type = json ? json.type : item.type

    if (type === 'list' || type === 'button') {
        
        let click_values = json ?  _.pluck(json.click_values, 'description') : _.pluck(item.click_values, 'description');
        let dblclick_values = json ? _.pluck(json.dblclick_values, 'description') : _.pluck(item.dblclick_values, 'description');
        
        if (dblclick_values.length > 0) click_values = _.union(click_values, dblclick_values);
        if (click_values.length === 0 && dblclick_values === 0) return ['Other']
       
        return  click_values

    } else if (type === 'float') {
        return  json ? [json.usage] : [value_text]
    } else {
        return json
    }
}


async function searchSamePeriphNames(periphInfos) {
    try {
        let rooms = [], count = periphInfos.length;

        _.each(periphInfos, (roomInfo) => {
            let name = _.keys(roomInfo)[0];
            let names = _.pluck(roomInfo[name], 'name');
            let uniq = _.uniq(names);
            if (names.length !== uniq.length) {
                if (rooms.length === 0)
                    rooms.push(name);
                else {
                    rooms.push(L.get("functionLibrairy.samePeriphName"));
                    rooms.push(name);
                }
            }

            if (!--count) return(rooms);
        })
    } catch (err) {
        return (L.get(["functionLibrairy.samePeriphName", err]))
    }
}


async function deleteImageSync (file) {
    if (fs.existsSync(file)) {
        shell.trashItem(file);
        const folder = path.dirname(file);
        let other = klawSync(folder, {nodir: true, depthLimit:0})
        if (other.length === 0 ) {
            shell.trashItem(folder);
        } 
        return true;
    } 
    return false;
}



async function saveImageSync (widget, images) {

    if (!images[0] || !images[0].type || (images.length === 1 && images[0].type === 'default')) return true;

    for(let i=0; i < images.length; i++) {
        if (images[i].type && images[i].type !== 'default') {
            let imgFolder = images[i].type === 'global'
            ? path.resolve(folder, widget.usage.replace(/ /g,'-'))
            : path.resolve(folder, widget.usage.replace(/ /g,'-'), widget.id);
            
            fs.ensureDirSync(imgFolder);
            let img = path.resolve(imgFolder, images[i].value.replace(/ /g,'-')+'.png');
            if (images[i].src !== img) { 
                shell.trashItem(img);
                fs.copySync(images[i].src, img);
            }
        }
    }
    return true;
}



function getImagesSync(usage, periph_id, values) {
    return new Promise((resolve) => {

        let filenames = [{files: [], default: path.resolve(folder, 'Default/default.png')}];
        try {
            let usage_folders = [];
            let widgets = klawSync(folder, {nofile: true, depthLimit:0});
            for (let i in widgets) {
                usage_folders.push(widgets[i].path.substring(widgets[i].path.lastIndexOf(path.sep)).replace(path.sep,''))
            }
            let folder_usage = _.find(usage_folders, function(num){
                return usage.toLowerCase().indexOf(num.toLowerCase().replace(/-/g,' ')) != -1 || usage.toLowerCase().indexOf(num.toLowerCase().replace(/\//g,' ')) != -1;
            });

            if (folder_usage) {
                folder_usage = path.resolve(folder, folder_usage.replace(/ /g,'-'));
                let folderID = path.resolve(folder_usage, periph_id);
                if (fs.existsSync(folderID)) {
                    let testfilenames = [];
                    let files = klawSync(folderID, {nodir: true, depthLimit: 0});
                    for (let i in files) {
                        let test = files[i].path.substring(files[i].path.lastIndexOf(path.sep)+1).replace('.png','');
                        if (_.contains(values, test.replace(/-/g,' '))) testfilenames.push({name: test, file: files[i].path});
                    }

                    if (testfilenames.length < values.length) {
                        let tosearch = [];
                        for (let i in testfilenames) {
                            tosearch.push(testfilenames[i].name);
                        }
                        let files = klawSync(folder_usage, {nodir: true, depthLimit: 0});
                        for (let i in files) {
                            let test = files[i].path.substring(files[i].path.lastIndexOf(path.sep)+1).replace('.png','');
                            if (tosearch.length > 0) {
                                if (!_.contains(tosearch, test)) filenames[0].files.push(files[i].path);
                            } else {
                                if (_.contains(values, test.replace(/-/g,' '))) filenames[0].files.push(files[i].path);
                            }
                        }
                        for (let i in testfilenames) {
                            filenames[0].files.push(testfilenames[i].file);
                        }
                        resolve (filenames);
                    } else {
                        for (let i in testfilenames) {
                            filenames[0].files.push(testfilenames[i].file);
                        }
                        resolve (filenames);
                    }

                } else {
                    let files = klawSync(folder_usage, {nodir: true, depthLimit: 0});
                    for (let i in files) {
                        let test = files[i].path.substring(files[i].path.lastIndexOf(path.sep)+1).replace('.png','');
                        if (_.contains(values, test.replace(/-/g,' '))) {
                            filenames[0].files.push(files[i].path);
                        }
                    }

                    resolve (filenames);
                }
            } else {
                resolve (filenames);
            }
        } catch (err) {
            resolve (false);
        }
    })
}




function getImageSync(usage, periph_id, value_text, json, item) {
    return new Promise((resolve, reject) => {
        try {
            if (!json && !item) return resolve(path.resolve(folder, 'Default/default.png'))

            let usage_folders = []
            let widgets = klawSync(folder, {nofile: true, depthLimit:0})
            for (let i in widgets) {
                usage_folders.push(widgets[i].path.substring(widgets[i].path.lastIndexOf(path.sep)).replace(path.sep,''))
            }

            let folder_usage = _.find(usage_folders, (num) => {
                return usage.toLowerCase().indexOf(num.toLowerCase().replace(/-/g,' ')) !== -1 || usage.toLowerCase().indexOf(num.toLowerCase().replace(/\//g,' ')) !== -1
            })

            let filenames = []
            if (folder_usage) {
                folder_usage = path.resolve(folder, folder_usage.replace(/ /g,'-'))
                let folderID = path.resolve(folder_usage, periph_id);

                if (fs.existsSync(folderID)) {
                    let values = getValues(json, item, value_text);

                    let testfilenames = []
                    let files = klawSync(folderID, {nodir: true, depthLimit: 0})
                    for (let i in files) {
                        let test = files[i].path.substring(files[i].path.lastIndexOf(path.sep)+1).replace('.png','')
                        if (_.contains(values, test.replace(/-/g,' '))) testfilenames.push({name: test, file: files[i].path})
                    }
                    if (testfilenames.length < values.length) {
                        let tosearch = [];
                        for (let i in testfilenames) {
                            tosearch.push(testfilenames[i].name)
                        }
        
                        let files = klawSync(folder_usage, {nodir: true, depthLimit: 0});
                        for (let i in files) {
                            let test = files[i].path.substring(files[i].path.lastIndexOf(path.sep)+1).replace('.png','')
                            if (tosearch.length > 0) {
                                if (!_.contains(tosearch, test)) filenames.push(files[i].path)
                            } else {
                                if (_.contains(values, test.replace(/-/g,' '))) filenames.push(files[i].path);
                            }
                        }
                        
                        for (let i in testfilenames) {
                            filenames.push(testfilenames[i].file);
                        }
            
                        let file = path.resolve(folder, 'Default/default.png')
                        for (let i in filenames) {
                            let test = filenames[i].substring(filenames[i].lastIndexOf(path.sep)).replace(path.sep,'').replace('.png','')
                            if (value_text === test.replace(/-/g,' ')) {
                                file = filenames[i];
                                break;
                            }
                        }
                        resolve(file)

                    } else {
                        let file = path.resolve(folder, 'Default/default.png');
                        if (testfilenames.length > 0) {
                            for (let i in testfilenames) {
                                let test = testfilenames[i].file.substring(testfilenames[i].file.lastIndexOf(path.sep)).replace(path.sep,'').replace('.png','')
                                if (value_text === test.replace(/-/g,' ')) {
                                    file = testfilenames[i].file;
                                    break;
                                }
                            }
                        } else {
                            let files = klawSync(folder_usage, {nodir: true, depthLimit: 0});
                            for (let i in files) {
                                let test = files[i].path.substring(files[i].path.lastIndexOf(path.sep)+1).replace('.png','');
                                if (value_text === test.replace(/-/g,' ')) {
                                    file = files[i].path;
                                    break;
                                }
                            }
                        }
                        resolve(file);
                    }
                } else {
                    let file = path.resolve(folder, 'Default/default.png')
                    let files = klawSync(folder_usage, {nodir: true, depthLimit: 0})
                    for (let i in files) {
                        let test = files[i].path.substring(files[i].path.lastIndexOf(path.sep)+1).replace('.png','');
                        if (value_text === test.replace(/-/g,' ')) {
                            file = files[i].path;
                            break;
                        }
                    }
                    resolve(file)
                }
            } else {
                resolve(path.resolve(folder, 'Default/default.png'))
            }
        } catch (err) {
            reject (L.get(["functionLibrairy.getImageError", periph_id,  err]))
        }
    })
}


async function initVar (img_folder) {
	folder = img_folder;
}


async function init () {
    return {
        'initVar': initVar,
        'timeConvert': timeConvert,
        'getImageSync': getImageSync,
        'getImagesSync': getImagesSync,
        'saveImageSync': saveImageSync,
        'deleteImageSync': deleteImageSync,
        'getSizing': getSizing,
        'getMacroIDByNotes': getMacroIDByNotes,
        'searchSamePeriphNames': searchSamePeriphNames,
        'getPeriphRooms': getPeriphRooms,
        'classPeriphByRooms': classPeriphByRooms,
        'saveEncrytPasswdWin': saveEncrytPasswdWin,
        'deleteEncrytPasswdWin': deleteEncrytPasswdWin
    }
  }
  
  export { init };
  