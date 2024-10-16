import { shell } from 'electron';
import fs from 'fs-extra';
import * as path from 'node:path';
import { default as klawSync } from 'klaw-sync';
import moment from 'moment';
import _ from 'underscore';
// Plugin API
var API, widgetPath;


async function widgetAction(arg, periphInfos) {
    switch (arg.type) {
        case 'macro':
            let macro_id = await Avatar.APIFunctions.getMacroIDByNotes(arg.id, arg.value, periphInfos);
            if (macro_id) return await API.macro(macro_id);
            break;
        default:   
            return await API.set(arg.id, arg.value)   
    }
}


 function refreshWidgetInfo(arg) {
    return new Promise(async (resolve) => {
        let item = {
            type: arg.type,
            click_values: arg.click,
            dblclick_values: arg.dblclick
        }

        let info = {};
        if (arg.type !== 'button') {
            setTimeout(async () => {
                let current_values = await API.getPeriphCaract(arg.periphId);
                let diff = moment().diff(current_values.last_value_change.replace(' ','T'), 'seconds');
                info.value = current_values.last_value_text ? current_values.last_value_text : current_values.last_value;
                info.status = Avatar.APIFunctions.timeConvert(diff);
                info.unit = current_values.unit ? current_values.unit : "";
                info.last_value = current_values.last_value ? current_values.last_value : "";  
                info.iswrap = Avatar.APIFunctions.getSizing (info.value);
                info.last_value_change = current_values.last_value_change;

                if (item.type === 'list') {
                    info.img =  await Avatar.APIFunctions.getImageSync(arg.usage, arg.periphId, info.value, null, item);
                } else if (item.type === 'float' || item.type === 'string') {
                    info.img = await Avatar.APIFunctions.getImageSync(arg.usage, arg.periphId, arg.usage, null, item);
                } else {
                    info.img = await Avatar.APIFunctions.getImageSync(arg.usage, arg.periphId, arg.value, null, item);
                }
                resolve (info);
            }, 2000)
        } else {
            let script = Avatar.find(arg.plugin);
            if (script && script._script.getNewButtonState) arg.value = await script._script.getNewButtonState(arg); 
            info.img = await Avatar.APIFunctions.getImageSync(arg.usage, arg.periphId, arg.value, null, item);
            resolve (info);
        }
    })
}


async function deleteWidget(widget) {
    if (!widget) return false;
    shell.trashItem(path.resolve (widgetPath, widget+'.json'));
    return true;   
}


async function saveWidget(widget) {
    if (!widget) return false;
    fs.ensureDirSync(widgetPath);
    fs.writeJsonSync(widgetPath+'/'+widget.id+'.json', widget);
    return true;   
}


async function saveWidgets(widgets) {

    let count = widgets.length;
    if (count === 0) return;
    
    fs.ensureDirSync(widgetPath);
    for (let i in widgets) {
        let widgetFile = path.resolve (widgetPath, widgets[i].id+'.json');   
        let widgetJson = fs.readJsonSync (widgetFile, { throws: false })
        if (widgetJson !== null) {
            if (widgets[i].style.title) {
                if (!widgetJson.style.title) widgetJson.style.title = {};
                widgetJson.style.title.pos.x = widgets[i].style.title.pos.x;
                widgetJson.style.title.pos.y = widgets[i].style.title.pos.y;
            }
            if (widgets[i].style.value) {
                if (!widgetJson.style.value) widgetJson.style.value = {};
                widgetJson.style.value.pos.x = widgets[i].style.value.pos.x;
                widgetJson.style.value.pos.y = widgets[i].style.value.pos.y;
            }
            if (widgets[i].style.status) {
                if (!widgetJson.style.status) widgetJson.style.status = {};
                widgetJson.style.status.pos.x = widgets[i].style.status.pos.x;
                widgetJson.style.status.pos.y = widgets[i].style.status.pos.y;
            }
            
            widgetJson.style.image.pos.x = widgets[i].style.image.pos.x;
            widgetJson.style.image.pos.y = widgets[i].style.image.pos.y;
            
            fs.writeJsonSync(widgetFile, widgetJson)
            if (!--count) return;
        } else {
            if (!--count) return;
        }
    }
        
}


function getWidgetInfos(widget) {
    return new Promise(async (resolve) => {
        if (widget.type !== 'button') {
            let current_values = await API.getPeriphCaract(widget.id);
            let diff = moment().diff(current_values.last_value_change.replace(' ','T'), 'seconds')
            widget.value = current_values.last_value_text ? current_values.last_value_text : current_values.last_value
            widget.isWrap = Avatar.APIFunctions.getSizing (widget.value)
            widget.status = Avatar.APIFunctions.timeConvert(diff)
            widget.unit = current_values.unit ? current_values.unit : ""
            widget.last_value = current_values.last_value ? current_values.last_value : ""
            widget.last_value_change = current_values.last_value_change 
        }

        if (widget.type === 'list' && widget.click_values.length == 0 && widget.dblclick_values.length == 0) {
            let list = await API.getPeriphValues(widget.id)
            widget.click_values = list.values
            widget.click_values_added = true
        } 

        let file;
        if (widget.type === 'list') {
            file = await Avatar.APIFunctions.getImageSync(widget.usage, widget.id, widget.value, widget)
        }  else if (widget.type === 'float' || widget.type === 'string') {
            file = await Avatar.APIFunctions.getImageSync(widget.usage, widget.id, widget.usage, widget)
        } else {
            file = await Avatar.APIFunctions.getImageSync(widget.usage, widget.id, widget.last_value, widget)
        }
        widget.style.image.path = file
        if (widget.click_values_added) widget.click_values = []
    
        resolve(widget)
    })
}



function getWidgets() {

    return new Promise(async (resolve, reject) => {
        try {
            let widgetsList = []
            
            if (fs.existsSync(widgetPath)) {

                let widgets = klawSync(widgetPath, {nodir: true, depthLimit: 0})
                if (widgets.length === 0) resolve (widgetsList)
                let count = widgets.length

                for (let i=0; i < widgets.length; i++) {
                    let widgetJson = fs.readJsonSync (widgets[i].path, { throws: false })
                    if (widgetJson !== null && widgetJson.id) {
                        if (widgetJson.type !== 'button') {
                            let current_values = await API.getPeriphCaract(widgetJson.id);
                            if (current_values && (current_values.last_value_change || current_values.last_value)) {
                                let diff = moment().diff(current_values.last_value_change.replace(' ','T'), 'seconds')
                                widgetJson.value = current_values.last_value_text ? current_values.last_value_text : current_values.last_value
                                widgetJson.isWrap = Avatar.APIFunctions.getSizing (widgetJson.value)
                                widgetJson.status = Avatar.APIFunctions.timeConvert(diff)
                                widgetJson.unit = current_values.unit ? current_values.unit : ""
                                widgetJson.last_value = current_values.last_value ? current_values.last_value : ""
                                widgetJson.last_value_change = current_values.last_value_change 
                            } else {
                                widgetJson.value = ""
                                widgetJson.isWrap = {}
                                widgetJson.status = ""
                                widgetJson.unit = ""
                                widgetJson.last_value = ""
                                widgetJson.last_value_change = ""
                           }
                        }

                        if (widgetJson.type === 'list' && widgetJson.click_values.length == 0 && widgetJson.dblclick_values.length == 0) {
                            let list = await API.getPeriphValues(widgetJson.id)
                            widgetJson.click_values = list.values
                            widgetJson.click_values_added = true
                        } 

                        let file;
                        if (widgetJson.type === 'list') {
                            file = await Avatar.APIFunctions.getImageSync(widgetJson.usage, widgetJson.id, widgetJson.value, widgetJson)
                        }  else if (widgetJson.type === 'float' || widgetJson.type === 'string') {
                            file = await Avatar.APIFunctions.getImageSync(widgetJson.usage, widgetJson.id, widgetJson.usage, widgetJson)
                        } else {
                            file = await Avatar.APIFunctions.getImageSync(widgetJson.usage, widgetJson.id, widgetJson.last_value, widgetJson)
                        }
                        widgetJson.style.image.path = file

                        if (widgetJson.click_values_added) widgetJson.click_values = []
                    
                        widgetsList.push(widgetJson)

                        if (!--count) resolve (widgetsList)
                        
                    } else {
                        if (!--count) resolve (widgetsList)
                    }
                }
            } else {
                resolve(widgetsList)
            }
        } catch (err) {
            reject (err || "Loading Widgets error");
        }
    })
}



async function initVar (widget_folder, img_Folder, api, config) {
    widgetPath = widget_folder;

    await Avatar.APIFunctions.initVar(img_Folder);
    if (api !== null) {
        let APIPlugin = await import ('file:///'+api);
        API = await APIPlugin.init();
        await API.initVar(config);
    }
}


async function init() {
    return {
        'initVar': initVar,
        'getWidgets': getWidgets,
        'getWidgetInfos': getWidgetInfos,
        'saveWidgets': saveWidgets,
        'saveWidget': saveWidget,
        'deleteWidget': deleteWidget,
        'refreshWidgetInfo': refreshWidgetInfo,
        'widgetAction': widgetAction
    }
}
  
  export { init };



