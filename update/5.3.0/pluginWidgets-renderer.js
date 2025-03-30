let cyAddPlugin;
let cyPlugins;
let selected;
let periphParams;
let plugins;
let pathSeparator;
let __dirname;
let periphValues = [];
let circularMenu = [];
let tbl_images = [];
let tbl_rules = [];
let value_type;


window.onbeforeunload = async (e) => {
  e.returnValue = false;
  window.electronAPI.exit(true)
}

document.getElementById("exit").addEventListener("click", async (event) => {
  window.dispatchEvent(new Event ('beforeunload'))
})


function outputsize() {
  let newWidth = $("#div-body").width()-$("#div-jstree").width()+5
  $('#div-box').width(newWidth); 
  $('#div-no-periph').width(newWidth); 
   
  document.getElementById("div-box").style.left = $("#div-jstree").width()+10+"px"
  document.getElementById("div-no-periph").style.left = $("#div-jstree").width()+10+"px"
  document.getElementById("manage-buttons").style.left = ($("#div-jstree").width()+($('#div-box').width() / 2)-($('#manage-buttons').width() / 2)) + "px"
} 

new ResizeObserver(outputsize).observe(document.getElementById("div-jstree"))


document.getElementById('periph').addEventListener('click', () => {
  setBoxTab ('periph')
})

document.getElementById('setting').addEventListener('click', () => {
  setBoxTab ('setting')

  if ((document.getElementById('div-button-action').style.display === "block" 
  && document.getElementById("circular-menus").childNodes.length > 0) 
  || (document.getElementById('div-value-list').style.display === "block"
  && document.getElementById("dblclick-value-list").childNodes.length > 0)) {
      document.getElementById('circular-card').style.display = "block"
  } else {
      document.getElementById('circular-card').style.display = "none"
  }

})


document.getElementById('delete_widget').addEventListener('click', async () => {

  let selected_node = $('#jstree').jstree(true).get_selected(true)[0];
  let periph = await getPeriphById (selected_node.original.id, selected_node.parents[0], periphParams[selected_node.original.plugin].periphs);
  let widgetvalues = await isAlreadyExist (periphParams[selected_node.original.plugin].widgets, selected_node.original.id)
  let rules;
  switch (periph.value_type) {
    case 'list':
    case 'float':
    case 'string':
      periph = {
        value_type: periph.value_type,
        name: periph.name,
        periph_id: periph.periph_id
      }

      let commonRule = await getCommonRules();
      rules = {
        common: commonRule,
        rules: tbl_rules
      }
      break;
    case 'button':
      periph = {
        value_type: 'button'
      }
  }
  try {
    const config = await window.electronAPI.deleteWidget({type: periph.value_type, plugin: selected_node.original.plugin, room: selected_node.parent, periph: periph, widget: widgetvalues, rules: rules})
    if (!config) return;

    periphParams[selected_node.original.plugin].widgets = periphParams[selected_node.original.plugin].widgets.filter(widget => widget.id !== widgetvalues.id)
    periphParams[selected_node.original.plugin].config = config;

    tbl_rules = tbl_images = []
    setDiv('div-box')
    setBoxTab('periph') 
    periph = await getPeriphById (selected_node.original.id, selected_node.parent, periphParams[selected_node.original.plugin].periphs)
    setWidgetTabPeriph(selected_node.original.plugin, periph, periphParams[selected_node.original.plugin].config)
  
    notification (await Lget ("pluginWidgets", "widgetDeleted", widgetvalues.title));
  } catch (err) {
     notification (await Lget ("pluginWidgets", "deleteWidgetError", widgetvalues.title, err), true);
  }
})



document.getElementById('create_widget').addEventListener('click', async () => {
  let widgetInfos = await getPeriphInformation()
  if (!widgetInfos) return;

  let selected_node = $('#jstree').jstree(true).get_selected(true)[0];
  let periph = await getPeriphById (selected_node.original.id, selected_node.parent, periphParams[selected_node.original.plugin].periphs)
  let widgetvalues = await isAlreadyExist (periphParams[selected_node.original.plugin].widgets, selected_node.original.id);
  const periphValueType = periph.value_type;

  periph = {
    value_type: periphValueType,
    name: periph.name,
    periph_id: periph.periph_id
  }

  let commonRule = await getCommonRules();
  let rules = {
    common: commonRule,
    rules: tbl_rules
  }
   
  let infos = {plugin: selected_node.original.plugin, room: selected_node.parent, periph: periph, widget: widgetInfos, rules: rules, images: tbl_images};
  try {

    const result = await window.electronAPI.saveWidget(infos);
    if (!result.config) return notification (await Lget ("pluginWidgets", "saveWidgetError", widgetvalues.title), true);
    
    periphParams[selected_node.original.plugin].widgets = periphParams[selected_node.original.plugin].widgets.filter(widget => widget.id !== widgetInfos.id);
    periphParams[selected_node.original.plugin].widgets.push(widgetInfos);

    periphParams[selected_node.original.plugin].config = result.config;
    
    document.getElementById('rule').disabled = false;

    if (periphValueType === 'list' && document.getElementById('box-selection-rule').style.display === "none") {
      document.getElementById('box-selection-rule').style.display = "block";
      addItemMenuSelectionRule();
    }

    document.getElementById('delete_widget').disabled = false;
    document.getElementById('create_widget-label').innerHTML = await Lget ("pluginWidgets", "modifButton");
    document.getElementById('widget').innerHTML = await Lget ("pluginWidgets", "innerWidget")+' <font color="#953d96" style=font-weight:bold;>'+await Lget ("pluginWidgets", "existWidget")+'</font>';

    for (let i in tbl_images){ 
      if (tbl_images[i].delete &&  document.getElementById(tbl_images[i].box).style.display === 'block' && tbl_images[i].type === 'perso') {
        
        if (document.getElementById('sublabel-'+tbl_images[i].box.split('-')[1]+'-widget') && document.getElementById('sublabel-'+tbl_images[i].box.split('-')[1]+'-widget').innerHTML === await Lget ("pluginWidgets", "persoImg"))
          document.getElementById(tbl_images[i].delete).style.display = "flex";

        if (tbl_images[i].box === "values-image-box" && tbl_images[i].type === 'perso') 
          document.getElementById('delete-image-box').style.display = "flex";

        for (let a in result.images) {
          if (tbl_images[i].value === result.images[a].value) {
            tbl_images[i].src = result.images[a].src;
            tbl_images[i].path = result.images[a].path;
            tbl_images[i].file = result.images[a].file;
          }
        }
      }
    }

    widgetvalues 
    ? notification (await Lget ("pluginWidgets", "widgetModified", widgetInfos.title))
    : notification (await Lget ("pluginWidgets", "widgetCreated", widgetInfos.title));
  } catch (err) {
    notification (await Lget ("pluginWidgets", "saveWidgetError", widgetInfos.title)+`<br>${err}`, true);
  }
  
})


async function getCommonRules() {
  if (!document.getElementById('group-selection').toggled) {
    let ruleMenu = document.getElementById("menu-selection-existing-rule");
    for (var i = 0; i < ruleMenu.childNodes.length; i++) {
      if (ruleMenu.childNodes[i].toggled) {
        return ruleMenu.childNodes[i].value;
      }
    }
  } else {
    return (document.getElementById('input-new-rule').value !== '') 
    ? document.getElementById('input-new-rule').value
    : "";
  } 
}


async function getPeriphInformation() {

  let periphInfos = {}
  if (document.getElementById('peripheric-title').value === '') {
    notification (await Lget ("pluginWidgets", "noName"), true);
    return;
  }

  if (document.getElementById("div-value-list").style.display !== 'none' && document.getElementById("click-value-list").childNodes.length > 2) {
    notification (await Lget ("pluginWidgets", "maxValues"), true);
    return;
  }

  if (document.getElementById('div-button-action').style.display !== 'none') {
    if (document.getElementById("plugin-selection-On").toggled && document.getElementById("plugin-selection-Off").toggled && circularMenu.length === 0) {
      notification (await Lget ("pluginWidgets", "atLeastOneClic"), true);
      return;
    }

    if (document.getElementById('plugin-selection-On').toggled && !document.getElementById('plugin-selection-Off').toggled) {
      notification (await Lget ("pluginWidgets", "noClicOn"), true);
      return; 
    }

    if (!document.getElementById('plugin-selection-On').toggled && document.getElementById('key-On').value === "") {
      notification (await Lget ("pluginWidgets", "noActionOn"), true);
      return; 
    }

    if (!document.getElementById('plugin-selection-Off').toggled && document.getElementById('key-Off').value === "") {
      notification (await Lget ("pluginWidgets", "noActionOff"), true);
      return; 
    }
  }

  let selected_node = $('#jstree').jstree(true).get_selected(true)[0];
  let periph = await getPeriphById (selected_node.original.id, selected_node.parents[0], periphParams[selected_node.original.plugin].periphs);
  let periphVal = await getPeriphValues (selected_node.original.plugin, selected_node.original.id, periph.value_type);
  let widgetvalues = await isAlreadyExist (periphParams[selected_node.original.plugin].widgets, selected_node.original.id);
  
  periphInfos.id = periph.periph_id;
  periphInfos.class = selected_node.original.plugin;
  periphInfos.type = periph.value_type;
  periphInfos.usage = periph.usage_name;
  periphInfos.title = document.getElementById('peripheric-title').value;
  periphInfos.macro = periph.value_type === 'list' ? document.getElementById('macro-action-periph').toggled : false;
  periphInfos.click_values = [];
  periphInfos.dblclick_values = [];
  periphInfos.style = {
    color: document.getElementById("widget-color").value,
    textcolor: document.getElementById("widget-text-color").value,
    opacity: parseFloat(document.getElementById("widget-opacity").value),
    borderwidth: parseInt(document.getElementById("widget-border").value)
  };

  if (periph.value_type === 'list' || periph.value_type === 'button') {
    periphInfos.style.title = {
      "display": document.getElementById('widget-title').toggled,
      "fontsize": parseInt(document.getElementById('font-size-title').value)
    };
  }

  if (periph.value_type === 'button') {
    if (widgetvalues) {
      periphInfos.last_value = widgetvalues.last_value;
    } else {
      periphInfos.last_value = !document.getElementById('plugin-selection-On').toggled ? "On" : circularMenu[0].description;
    }
    periphInfos.style.title.pos = {
      "x": widgetvalues ? widgetvalues.style.title.pos.x : 100,
      "y": widgetvalues ? widgetvalues.style.title.pos.y :95
    }
  }

  if (periph.value_type === 'list') {
    let ratioX = document.getElementById('font-size-offsetX-title').value
    let ratioY = document.getElementById('font-size-offsetY-title').value
    periphInfos.style.title.pos = {
        "x": widgetvalues ? widgetvalues.style.title.pos.x + ratioX : 100 + ratioX,
        "y": widgetvalues ? widgetvalues.style.title.pos.y + ratioY : 95 + ratioY
    }
    periphInfos.style.title.size =  {
        "width": 0.1,
        "height":  0.1
    }
    periphInfos.style.title.offset = {
        "x": ratioX,
        "y": ratioY
    }
  }

  if (periph.value_type === 'list' || periph.value_type === 'float' || periph.value_type === 'string') {
    
    periphInfos.rule = await getCommonRules();

    let ratioX = document.getElementById('font-size-offsetX-value').value
    let ratioY = document.getElementById('font-size-offsetY-value').value

    periphInfos.style.value = {
      "display": document.getElementById('widget-value').toggled,
      "fontsize": parseInt(document.getElementById('font-size-value').value),
      "pos": {
        "x": widgetvalues ? widgetvalues.style.value.pos.x + ratioX : 125 + ratioX,
        "y": widgetvalues ? widgetvalues.style.value.pos.y + ratioY : 125 + ratioY
      },
      "size": {
        "width":  0.1,
        "height":  0.1
      },
      "offset": {
        "x": ratioX,
        "y": ratioY
      }
    };
  }

  periphInfos.style.image = {
    "size": {
      "width": document.getElementById('image-size').value,
      "height": document.getElementById('image-size').value
    },
    "pos": {
      "x": widgetvalues ? widgetvalues.style.image.pos.x : 75,
      "y": widgetvalues ? widgetvalues.style.image.pos.y : 130
    }
  };

  switch (periph.value_type) {
    case 'list':
      document.getElementById("click-value-list").childNodes.forEach(clic => {
        let found = periphVal.values.filter(value => value.description === clic.value)
        if (found && found.length > 0) {
          periphInfos.click_values.push({
            "description": found[0].description,
            "value": found[0].value
          })
        }
      })

      document.getElementById("dblclick-value-list").childNodes.forEach(clic => {
        let found = periphVal.values.filter(value => value.description === clic.value)
        if (found && found.length > 0) {
          periphInfos.dblclick_values.push({
            "description": found[0].description,
            "value": found[0].value
          })
        }
      })

      let ratioX = document.getElementById('font-size-offsetX-status').value
      let ratioY = document.getElementById('font-size-offsetY-status').value

      periphInfos.style.status = {
        "display": document.getElementById('widget-status').toggled,
        "fontsize": parseInt(document.getElementById('font-size-status').value),
        "pos": {
          "x": widgetvalues ? widgetvalues.style.status.pos.x + ratioX : 100 + ratioX,
          "y": widgetvalues ? widgetvalues.style.status.pos.y + ratioY : 155 + ratioY
        },
        "size": {
          "width":  0.1,
          "height":  0.1
        },
        "offset": {
          "x": ratioX,
          "y": ratioY
        }
      };

      if (document.getElementById('circular-card').style.display !== 'none') {
        periphInfos.style.circular = {
          "activefillcolor": document.getElementById("circular-selectcolor").value,
          "fillcolor": document.getElementById("circular-bgrcolor").value,
          "fontsize": parseInt(document.getElementById("circular-text").value),
          "fontcolor": document.getElementById("circular-bgrtextcolor").value,
          "radius": parseInt(document.getElementById("circular-radius").value)
        }
      }
      break;
    case 'string':
    case 'float':
      break;
    case 'button':
      if (!document.getElementById('plugin-selection-On').toggled) {
        let menuOn = document.getElementById('plugin-menu-On').childNodes;
        for (let i = 0; i < menuOn.length; i++) {
          if (menuOn[i].toggled) {
            periphInfos.click_values.push({
              "description": "On",
              "plugin": menuOn[i].value,
              "action": document.getElementById('key-On').value
            })
            break;
          }
        }
      }
      if (!document.getElementById('plugin-selection-Off').toggled) {
        let menuOff = document.getElementById('plugin-menu-Off').childNodes;
        for (let i = 0; i < menuOff.length; i++) {
          if (menuOff[i].toggled) {
            periphInfos.click_values.push({
              "description": "Off",
              "plugin": menuOff[i].value,
              "action": document.getElementById('key-Off').value
            })
            break;
          }
        }
      }

      let count = 1;
      circularMenu.forEach(elem => {
        periphInfos.dblclick_values.push({
          "description": elem.label,
          "plugin": elem.plugin,
          "action": elem.action,
          "position": count++
        })
      })

      if (circularMenu.length > 0) {
        periphInfos.style.circular = {
          "activefillcolor": document.getElementById("circular-selectcolor").value,
          "fillcolor": document.getElementById("circular-bgrcolor").value,
          "fontsize": parseInt(document.getElementById("circular-text").value),
          "fontcolor": document.getElementById("circular-bgrtextcolor").value,
          "radius": parseInt(document.getElementById("circular-radius").value)
        }
      }

      periphInfos.style.title.position = document.getElementById('top-text-button').toggled ? 'top': 'bottom'

  }

  return periphInfos;

}



document.getElementById('image').addEventListener('click', async () => {

  let selected_node = $('#jstree').jstree(true).get_selected(true)[0];
  let periph = await getPeriphById (selected_node.original.id, selected_node.parents[0], periphParams[selected_node.original.plugin].periphs);
  
  let resetPeriphTab = (msg) => {
    setTimeout (async () => {
      document.getElementById("image").toggled = false
      document.getElementById("periph").toggled = true
      setBoxTab ('periph')
      notification(msg, true);
    },500)
  }

  if (periph.value_type === 'list') {
    if (document.getElementById("click-value-list").childNodes.length > 2) {
      resetPeriphTab(await Lget ("pluginWidgets", "maxValues"));
      return;
    } 
  } else if (periph.value_type === 'button') {
    let buttonValues = await getButtonValues();
    if (buttonValues.length === 0 && circularMenu.length === 0) {
      resetPeriphTab(await Lget ("pluginWidgets", "noClicOnOff"));
      return;
    } else if (buttonValues.length > 0 && circularMenu.length === 0) {
      let count = 0;
      for (let i in buttonValues) {
        if (buttonValues[i] === 'On') count += 1;
        if (buttonValues[i] === 'Off') count += 2;
      }
      if (count === 2) {
        resetPeriphTab(await Lget ("pluginWidgets", "noClicOn"));
        return;
      }
    }
  } 
    
  setWidgetTabImages ();
  setBoxTab ('image');
})


document.getElementById('rule').addEventListener('click', () => {
  setBoxTab ('rule');
})


function setBoxTab (tab) {
  let buttonsTab = document.getElementsByClassName("button-box-Tab");
  for (let i = 0; i < buttonsTab.length; i++) {
    if (tab === buttonsTab[i].id) {
      buttonsTab[i].toggled = true;
      document.getElementById(buttonsTab[i].id+'-box-Tab').style.display = "block";
    } else {
      buttonsTab[i].toggled = false;
      document.getElementById(buttonsTab[i].id+'-box-Tab').style.display = "none";
    }
  }
}


function setWidgetImg() {

  return new Promise((resolve) => {

    let img = (window.location.href).substring(0, (window.location.href).indexOf('pluginWidgets.html'));
    let imgtype = 0;
    imgtype += document.getElementById('widget-title').toggled ? 1 : 0;
    imgtype += document.getElementById('widget-value').toggled ? 3 : 0;
    imgtype += document.getElementById('widget-status').toggled ? 5 : 0;

    switch (imgtype) {
      case 0:
        img += "../images/createWidgets/button.png"
        break;
      case 1:
        img += "../images/createWidgets/title.png"
        break;
      case 3:
        img += "../images/createWidgets/value.png"
        break;
      case 5:
        img += "../images/createWidgets/status.png"
        break;
      case 4:
        img += "../images/createWidgets/nostatus.png"
        break;
      case 8:
        img += "../images/createWidgets/notitle.png"
        break;
      case 6:
        img += "../images/createWidgets/novalue.png"
        break;
      case 9:
        img += "../images/createWidgets/allvalues.png"
        break;
    }
    document.getElementById('widget-img').src = img;
    resolve();
  })
}


document.getElementById('widget-title').addEventListener('click', async () => {
  setTimeout (async () => {

    let selected_node = $('#jstree').jstree(true).get_selected(true)[0];
    let periph = await getPeriphById (selected_node.original.id, selected_node.parents[0], periphParams[selected_node.original.plugin].periphs);
    
    if (document.getElementById('widget-title').toggled) {
      document.getElementById('box-title').style.display = "flex";
      if (periph.value_type !== 'button') {
        document.getElementById('box-offsetX-title').style.display = "flex";
        document.getElementById('box-offsetY-title').style.display = "flex";
      }
      if (document.getElementById('widget-value').style.display === 'none') {
        document.getElementById('box-pos-text-button').style.display = "flex";
      }

      if (document.getElementById('widget-value').toggled) {
        document.getElementById('box-value').style["margin-left"] = "50px";
        document.getElementById('box-offsetX-value').style["margin-left"] = "20px";
        document.getElementById('box-offsetY-value').style["margin-left"] = "20px";
        document.getElementById('box-status').style["margin-left"] = "50px";
        document.getElementById('box-offsetX-status').style["margin-left"] = "20px";
        document.getElementById('box-offsetY-status').style["margin-left"] = "20px";
      } else {
        document.getElementById('box-value').style["margin-left"] = "0px";
        document.getElementById('box-offsetX-value').style["margin-left"] = "0px";
        document.getElementById('box-offsetY-value').style["margin-left"] = "0px";
        document.getElementById('box-status').style["margin-left"] = "0px";
        document.getElementById('box-offsetX-status').style["margin-left"] = "0px";
        document.getElementById('box-offsetY-status').style["margin-left"] = "0px";
      }
    } else {
      document.getElementById('box-title').style.display = "none";
      document.getElementById('box-offsetX-title').style.display = "none";
      document.getElementById('box-offsetY-title').style.display = "none";
      document.getElementById('box-pos-text-button').style.display = "none";
      if (document.getElementById('widget-value').toggled) {
        document.getElementById('box-value').style["margin-left"] = "0px";
        document.getElementById('box-offsetX-value').style["margin-left"] = "0px";
        document.getElementById('box-offsetY-value').style["margin-left"] = "0px";
        document.getElementById('box-status').style["margin-left"] = "50px";
        document.getElementById('box-offsetX-status').style["margin-left"] = "20px";
        document.getElementById('box-offsetY-status').style["margin-left"] = "20px";
      } else {
        document.getElementById('box-value').style["margin-left"] = "50px";
        document.getElementById('box-offsetX-value').style["margin-left"] = "20px";
        document.getElementById('box-offsetY-value').style["margin-left"] = "20px";
        document.getElementById('box-status').style["margin-left"] = "0px";
        document.getElementById('box-offsetX-status').style["margin-left"] = "0px";
        document.getElementById('box-offsetY-status').style["margin-left"] = "0px";
      }
    }

    await setWidgetImg();
  },50)    
})


document.getElementById('widget-value').addEventListener('click', async () => {

  setTimeout (async () => {
    if (document.getElementById('widget-value').toggled) {
      document.getElementById('box-value').style.display = "flex";
      document.getElementById('box-offsetX-value').style.display = "flex";
      document.getElementById('box-offsetY-value').style.display = "flex";
      if (document.getElementById('widget-title').toggled) {
        document.getElementById('box-value').style["margin-left"] = "50px";
        document.getElementById('box-offsetX-value').style["margin-left"] = "20px";
        document.getElementById('box-offsetY-value').style["margin-left"] = "20px";
        document.getElementById('box-status').style["margin-left"] = "50px";
        document.getElementById('box-offsetX-status').style["margin-left"] = "20px";
        document.getElementById('box-offsetY-status').style["margin-left"] = "20px";
      } else {
        document.getElementById('box-value').style["margin-left"] = "0px";
        document.getElementById('box-offsetX-value').style["margin-left"] = "0px";
        document.getElementById('box-offsetY-value').style["margin-left"] = "0px";
        document.getElementById('box-status').style["margin-left"] = "50px";
        document.getElementById('box-offsetX-status').style["margin-left"] = "20px";
        document.getElementById('box-offsetY-status').style["margin-left"] = "20px";
      }

    } else {
      document.getElementById('box-value').style.display = "none";
      document.getElementById('box-offsetX-value').style.display = "none";
      document.getElementById('box-offsetY-value').style.display = "none";
      if (document.getElementById('widget-title').toggled) {
        document.getElementById('box-status').style["margin-left"] = "50px";
        document.getElementById('box-offsetX-status').style["margin-left"] = "20px";
        document.getElementById('box-offsetY-status').style["margin-left"] = "20px";
      } else {
        document.getElementById('box-status').style["margin-left"] = "0px";
        document.getElementById('box-offsetX-status').style["margin-left"] = "0px";
        document.getElementById('box-offsetY-status').style["margin-left"] = "0px";
      }
    }

    await setWidgetImg()
  },50)

})

document.getElementById('widget-status').addEventListener('click', async () => {
  setTimeout (async () => {
    if (document.getElementById('widget-status').toggled) {
      document.getElementById('box-status').style.display = "flex";
      document.getElementById('box-offsetX-status').style.display = "flex";
      document.getElementById('box-offsetY-status').style.display = "flex";
    } else {
      document.getElementById('box-status').style.display = "none";
      document.getElementById('box-offsetX-status').style.display = "none";
      document.getElementById('box-offsetY-status').style.display = "none";
    }
    await setWidgetImg();
  },50)  
})


document.getElementById('delete-image').addEventListener('click', () => {
  deleteImage("label-img-widget-value", "delete-image-box", "img-widget-value");
})

document.getElementById('delete-icon1-widget').addEventListener('click', () => {
  deleteImage("sublabel-icon1-widget", "delete-icon1-widget", "icon1-widget");
})

document.getElementById('delete-icon2-widget').addEventListener('click', () => {
  deleteImage("sublabel-icon2-widget", "delete-icon2-widget", "icon2-widget");
})

document.getElementById('delete-icon3-widget').addEventListener('click', () => {
  deleteImage("sublabel-icon3-widget", "delete-icon3-widget", "icon3-widget");
})


document.getElementById('assoc-plugin-label').addEventListener('click', async () => {

    let xMenus = document.getElementById("circular-menus").childNodes;
    for (var i = 0; i < xMenus.length; i++) {
      if (xMenus[i].toggled) break;
    }

    if (xMenus && xMenus[i] && xMenus[i].toggled) {
      let plugin = await getButtonSelectedPlugin(document.getElementById("select-plugin-circular"))
      if (!plugin) return notification(await Lget ("pluginWidgets", "selectPlugin"));

      let action = document.getElementById("key-circular").value
      if (action === "") return notification(await Lget ("pluginWidgets", "selectAction"));

      let label = await getcircularMenuLabel(xMenus[i].value)
      label.plugin = plugin
      label.action = action

      notification(await Lget ("pluginWidgets", "selectAssocLabel", xMenus[i].value));

    } else {
      notification(await Lget ("pluginWidgets", "selectLabelFirst"));
    }

})


function getcircularMenuLabel (label) {
  return new Promise((resolve) => {

    for (var i = 0; i < circularMenu.length; i++) {
      if (circularMenu[i].label === label) break;
    }
    if (circularMenu[i]) {
      return resolve(circularMenu[i]);
    }
    resolve();
  })
}


document.getElementById('delete-circular-label').addEventListener('click', async () => {

  let xMenus = document.getElementById("circular-menus").childNodes;
  for (var i = 0; i < xMenus.length; i++) {
    if (xMenus[i].toggled) break;
  }

  if (xMenus && xMenus[i]) {
    let label = xMenus[i].value;
    circularMenu = circularMenu.filter(menu => menu.label !== label);
    document.getElementById("circular-menus").removeChild(xMenus[i]);

    document.getElementById('key-circular').value = "";
    document.getElementById('input-circular').value = "";
    document.getElementById('plugin-menu-circular-selection').toggled = true;

    notification(await Lget ("pluginWidgets", "labelDeleted", label));

  } else {
    notification(await Lget ("pluginWidgets", "selectDeleteLabelFirst"), true);
  }

})



async function getButtonSelectedPlugin (item) {

    let xMenus = item.getElementsByClassName("plugin");
    for (var i = 0; i < xMenus.length; i++) {
      if (xMenus[i].toggled) break;
    }
    if (xMenus && xMenus[i]) {
      return xMenus[i].value;
    } else
      return;

}


document.getElementById('add-circular-label').addEventListener('click', async () => {
  if (document.getElementById('input-circular').value !== '') {
    let found;
    let xMenus = document.getElementsByClassName("term-label");
    for (let i = 0; i < xMenus.length; i++) {
      if (xMenus[i].innerHTML.toLowerCase() == document.getElementById('input-circular').value.toLowerCase()) {
        found = true;
        break;
      }
    }
    if (!found) {
      await createCircularMenu(document.getElementById('input-circular').value);
      notification(await Lget ("pluginWidgets", "addPluginAction"));
    } else {
      notification(await Lget ("pluginWidgets", "labelExist"), true);
    }
  } else {
    notification(await Lget ("pluginWidgets", "noLabel"), true);
  }
})


function createCircularMenu(term) {

  return new Promise((resolve) => {

    let xTermTab = document.getElementById("circular-menus");
    let newTerm = document.createElement("x-tab");
    newTerm.className = 'circular-menu';
    let newTermLabel = document.createElement("x-label");
    newTermLabel.className = 'term-label';
    newTerm.setAttribute('id', term.replace(/ /g,'-'));
    newTerm.setAttribute('value', term);
    newTerm.style.cursor = "pointer";
    newTerm.onclick = async () => {
      let label = await getcircularMenuLabel(newTerm.value)
      if (label.plugin) {
        document.getElementById('key-circular').value = label.action
        let plugins = document.getElementById('plugin-menu-circular')
        for (let i in plugins.childNodes) {
          plugins.childNodes[i].toggled = false;
        }
        document.getElementById('circular-'+label.plugin).toggled = true;
      }
    }
    let label = document.createTextNode(term);
    newTermLabel.appendChild(label);
    newTerm.appendChild(newTermLabel);
    xTermTab.appendChild(newTerm);

    let xMenus = document.getElementsByClassName("circular-menu");
    for (let i = 0; i < xMenus.length; i++) {
      if (xMenus[i].toggled) xMenus[i].toggled = false;
    }
    newTerm.toggled = true;

    circularMenu.push ({
      label: term
    })

    resolve()

  })

}


async function setDiv (div) {
  if (div) {
    document.getElementById("div-no-periph").style.display = "none";
    document.getElementById("div-box").style.display = "none";
    document.getElementById(div).style.display = "block";
  } else {
    document.getElementById("div-box").style.display = "none";
    document.getElementById("div-no-periph").style.display = "flex";
    document.getElementById('create_widget-label').innerHTML = await Lget ("pluginWidgets", "createButton");
    document.getElementById('label-no-periph-selection').innerHTML = await Lget ("pluginWidgets", "selectRoom");
  }
}


async function setCY(target) {

    let cy = cytoscape({
      container: document.getElementById(target),
      boxSelectionEnabled: false,
      autounselectify: false,
      zoomingEnabled: false,
      autoungrabify : false,
      selectionType: 'single',
      userZoomingEnabled: false,
      userPanningEnabled: false,
      panningEnabled: false,
      zoom: 1,
      pan: { x: 0, y: 0 },
      pixelRatio: 'auto',
      style: cytoscape.stylesheet()
          .selector('node')
          .css({
            'label' : 'data(name)',
            'height': 40,
            'width': 40,
            'background-fit': 'cover',
            'border-color': "rgba(226, 45, 17, 1)",
            'border-width': 4,
            'border-opacity': 0,
            "font-size" : 12,
            "color" : "white",
            "text-wrap": "wrap",
            "text-max-width": 75,
            "text-valign": "bottom",
            "text-margin-y": 5,
            "text-halign": "center",
            'text-outline-width': 0,
            'text-outline-color': "rgba(86, 87, 85, 1)"
          })
      })
      return cy;
}


function addCYButton (cy, image, id, name, y, bclass) {

    cy.add(
      { group: "nodes",
        data: { id: id, name: name}
      }
    );
    let s = cy.$('#'+id);
    style = {
        'background-image': "url('"+image+"')"
    };
    s.style(style);
    s.renderedPosition('x', 50);
    s.renderedPosition('y', y);
    cy.$('#'+id).addClass(bclass);
    s.on('tap', function(evt){
        setDiv()
        document.getElementById('close-plugins').click()
        if (!selected || (selected && selected.id() !== evt.target.id())) {
            setSelectedPlugin(evt.target);
            addData(evt.target.id(), periphParams[evt.target.id()].periphs);
        }
    });
    s.lock();
}


function getSelectedPlugin() {
  if (selected) return selected.id();
}

function setSelectedPlugin(ele) {

  if (selected) {
    selected.unselect();
    selected.style ({
      'border-opacity': 0
    });
  }

  ele.select();
  selected = ele;
  ele.style ({
    'border-opacity': 1
  });
}


function addPluginsButton () {

    return new Promise((resolve) => {

        let divSize = document.getElementById('cy-plugins').style.height = document.getElementById('cy-plugins-div').style.height;
        let pos = 35, count = periphParams.length;
        Object.keys(periphParams).forEach(plugin => {
            addCYButton(cyPlugins, periphParams[plugin].image, plugin, periphParams[plugin].name, pos, 'plugin')
            pos += 85;
            if (divSize < pos + 35) {
                document.getElementById('cy-plugins').style.height = (pos - 20)+"px";
            }
            if (!--count) resolve();
        })

    })
}


function getData(plugin, rooms) {

    let data = [];
    rooms.forEach(room => {
        let chart = {
            id: Object.keys(room)[0],
            text: Object.keys(room)[0],
            type: 'room',
            state       : {
              opened    : false, 
              disabled  : true,  
              selected  : false  
            },
            children: []
        };

        Object.keys(room).forEach(periphs => {
            Object.keys(room[periphs]).forEach(periph => {
                let values = {
                    id: room[periphs][periph].periph_id,
                    text: room[periphs][periph].name,
                    type: 'periph',
                    plugin: plugin,
                    state       : {
                      opened    : false,  
                      disabled  : false, 
                      selected  : false 
                    }
                  }
                  chart.children.push(values);
            })
        })

        data.push(chart);

    })

    return (data);
  }


function addData (plugin, rooms) {

    $('#jstree').jstree('destroy');

    let folder = (window.location.href).substring(0, (window.location.href).indexOf('pluginWidgets.html'));
    let data = getData(plugin, rooms);
    $('#jstree').jstree({
        "themes" : { 
            "stripes" : true 
        },
        "types" : {
          "room" : {
            "icon" : folder+"../images/createWidgets/room.png"
          },
          "periph" : {
            "icon" : folder+"../images/createWidgets/peripheric.png"
          }
        },
        "plugins" : ["types"], 
        'core' : {
         'data' : data
        }
    })

    $('#jstree').on("changed.jstree", async (e, selected) => {
      let periph = await getPeriphById (selected.node.original.id, selected.node.parent, periphParams[selected.node.original.plugin].periphs);
      if (periph) {
        tbl_rules = tbl_images = [];
        setDiv('div-box');
        setBoxTab('periph');
        setWidgetTabPeriph(selected.node.original.plugin, periph, periphParams[selected.node.original.plugin].config);
      } else {
        notification(await Lget ("pluginWidgets", "noPeriph", selected.node.original.text), true);
      }
    });
  
}


function getPeriphById (id, room, rooms) {
  return new Promise((resolve) => {
    try{
      Object.keys(rooms).forEach(i => {
        if (Object.keys(rooms[i])[0] === room) {
          Object.keys(rooms[i]).forEach(periphs => {
            Object.keys(rooms[i][periphs]).forEach(periph => {
              if (rooms[i][periphs][periph].periph_id === id)
                return resolve(rooms[i][periphs][periph]);
            })
          })
        }
      })
      resolve();
    } catch(err) {
        resolve();
    }
  })
}



async function setXTagValues(exist, values, clicList, dblClicList) {

  document.getElementById('widget').innerHTML = exist 
  ? await Lget ("pluginWidgets", "innerWidget")+' <font color="#953d96" style=font-weight:bold;>'+await Lget ("pluginWidgets", "existWidget")+'</font>' 
  : await Lget ("pluginWidgets", "innerWidget")+' '+await Lget ("pluginWidgets", "notExistWidget");
  document.getElementById('description-clic-list').innerHTML = exist 
  ?  await Lget ("pluginWidgets", "existValuesClic")
  :  await Lget ("pluginWidgets", "notExistValuesClic");
  document.getElementById('description-dblclic-list').innerHTML = exist
  ? await Lget ("pluginWidgets", "existValuesDblClic")
  : await Lget ("pluginWidgets", "notExistValuesDblClic");

  let ListClic = document.getElementById("click-value-list")
  while (ListClic.firstChild) {
    ListClic.removeChild(ListClic.lastChild);
  }
  let ListdblClic = document.getElementById("dblclick-value-list")
  while (ListdblClic.firstChild) {
    ListdblClic.removeChild(ListdblClic.lastChild);
  }

  if (exist === true) {
    clicList.forEach(clic => {
      let tag = document.createElement("x-tag");
      tag.value = clic.description;
      tag.innerHTML = `<x-label>${clic.description}</x-label>`;
      ListClic.appendChild(tag);
    })
  
    dblClicList.forEach(clic => {
      let tag = document.createElement("x-tag");
      tag.value = clic.description;
      tag.innerHTML = `<x-label>${clic.description}</x-label>`;
      ListdblClic.appendChild(tag);
    })
  } 

  let tblValues = [];
  for (let value in values) {
    tblValues.push(values[value].description)
  }

  ListClic.getSuggestions = (text) => {
    let matchedNames = tblValues.filter((value) => {
      return value.toLowerCase().startsWith(text.toLowerCase()) &&
      ListClic.value.includes(value) === false;
    });

    return matchedNames.map((name) => {
      let tag = document.createElement("x-tag");
      tag.value = name;
      tag.innerHTML = `<x-label>${name}</x-label>`;
      return tag;
    });
  };

  ListdblClic.getSuggestions = (text) => {
    let matchedNames = tblValues.filter((value) => {
      return value.toLowerCase().startsWith(text.toLowerCase()) &&
      ListdblClic.value.includes(value) === false;
    });

    return matchedNames.map((name) => {
      let tag = document.createElement("x-tag");
      tag.value = name;
      tag.innerHTML = `<x-label>${name}</x-label>`;
      return tag;
    });
  };

  document.getElementById('create_widget-label').innerHTML = exist ? await Lget ("pluginWidgets", "modifButton") : await Lget ("pluginWidgets", "createButton");
  document.getElementById('delete_widget').disabled = !exist;
  
  document.getElementById('set-or-macro-periph-label').style.display = exist ? "none" : "block";
  document.getElementById('div-float-label').style.display = "none";
  document.getElementById('div-button-action').style.display = "none";
  document.getElementById('div-value-list').style.display = "block";
}


document.getElementById('group-selection').addEventListener('click', async () => {

  let ruleList = document.getElementById('rule-list')
  while (ruleList.firstChild) {
    ruleList.removeChild(ruleList.lastChild);
  }

  document.getElementById('input-new-rule').value = "";
  document.getElementById('input-rule').value = "";
  document.getElementById('input-rule-command').value = "";

})


document.getElementById('selection-same-rule').addEventListener('click', async () => {
  setTimeout (async () => {
    document.getElementById('box-select-rule').style.display =
    document.getElementById('selection-same-rule').toggled === true ? "block" : "none";

    tbl_rules = [];
    let selected_node = $('#jstree').jstree(true).get_selected(true)[0];
    let config = periphParams[selected_node.original.plugin].config;
    if (config.ruleGroups) addRuleGroups(config.ruleGroups);
  },100)
})


async function addRuleGroups(groups) {

  let menuRules = document.getElementById("menu-selection-existing-rule");
  while (menuRules.firstChild) {
    if (menuRules.lastChild.tagName === 'HR') break;
    menuRules.removeChild(menuRules.lastChild);
  }

  let ruleList = document.getElementById('rule-list')
  while (ruleList.firstChild) {
    ruleList.removeChild(ruleList.lastChild);;
  }

  Object.keys(groups).forEach(group => {
    let itemElem = document.createElement("x-menuitem");
    itemElem.setAttribute('id', 'group-rule-'+group);
    itemElem.value = group;
    itemElem.onclick = async () => {await setRuleGroup(groups[group])}
    let labelElem = document.createElement("x-label");
    labelElem.innerHTML = group;
    itemElem.appendChild(labelElem);
    menuRules.appendChild(itemElem);
  })

  let selected_node = $('#jstree').jstree(true).get_selected(true)[0];
  let periph = await getPeriphById (selected_node.original.id, selected_node.parents[0], periphParams[selected_node.original.plugin].periphs);
  let periphVal = await getPeriphValues (selected_node.original.plugin, selected_node.original.id, periph.value_type);
  let widgetvalues = await isAlreadyExist (periphParams[selected_node.original.plugin].widgets, periphVal.periph_id);

  if (widgetvalues && widgetvalues.rule !== "" ) {
    document.getElementById('box-select-rule').style.display = "block";
    document.getElementById('selection-same-rule').toggled = true;
    if (document.getElementById('group-selection').toggled)
      document.getElementById('group-selection').toggled = false;
    document.getElementById('group-rule-'+widgetvalues.rule).toggled = true;
    await setRuleGroup(groups[widgetvalues.rule]);
  } else {
    document.getElementById('input-new-rule').value = "";
    document.getElementById('input-rule-command').value = "";
    document.getElementById("group-selection").toggled = true;
    document.getElementById("selection-existing-rule").disabled = false;
    getSingleFunction(periph, periphParams[selected_node.original.plugin].config);
    await setRuleGroup(null, true);
  }

}


function getSingleFunction(periph, config) {
 
  tbl_rules = [];
  if (config.ruleAuto && config.ruleAuto[periph.name]) {
    for (let i in config.ruleAuto[periph.name]) {
      if (config.rules[config.ruleAuto[periph.name][i].command]) {
        tbl_rules.push(
          {
            value: config.ruleAuto[periph.name][i].value,
            description: config.ruleAuto[periph.name][i].description,
            rules: config.rules[config.ruleAuto[periph.name][i].command],
            command: config.ruleAuto[periph.name][i].command
          }
        );
      }
    }
  }

}


function setTblRules(group, values) {
  
  tbl_rules = [];
  Object.keys(group).forEach(param => {
    if (values.length > 0) {
      let selected = values.filter(elem => elem.value === param);
      if (selected && selected.length > 0) {
        tbl_rules.push(
          {
            value: selected[0].value,
            description: selected[0].description,
            rules: group[selected[0].value],
            command: group.command
          }
        );
      }
    } else if (param === "get") {
      tbl_rules.push(
        {
          value: 'get',
          rules: group.get,
          command: group.command
        }
      )
    }
  })

}


async function setRuleGroup(group, noreset) {

  let selected_node = $('#jstree').jstree(true).get_selected(true)[0];
  let periph = await getPeriphById (selected_node.original.id, selected_node.parents[0], periphParams[selected_node.original.plugin].periphs);
  let periphVal = await getPeriphValues (selected_node.original.plugin, selected_node.original.id, periph.value_type);
  
  if (group) setTblRules(group, periphVal.values);
  if (!noreset) if (document.getElementById("input-new-rule").value) document.getElementById("input-new-rule").value = "";
  if (document.getElementById("input-rule").value) document.getElementById('input-rule').value = "";

  let selected;
  if (document.getElementById("box-selection-rule").style.display !== 'none') {
    let ruleMenu = document.getElementById("menu-selection-rule");
    for (var i = 0; i < ruleMenu.childNodes.length; i++) {
      if (ruleMenu.childNodes[i].toggled === true) {
        selected = tbl_rules.filter(value => value.description === ruleMenu.childNodes[i].value);
        break;
      }
    }
  } 

  if ((!selected || selected.length === 0) && tbl_rules.length > 0 && tbl_rules[0].value === 'get') {
    selected = [{
      command: tbl_rules[0].command,
      rules: tbl_rules[0].rules
    }];
  }

  if (selected && selected.length > 0) {
      let ruleList = document.getElementById('rule-list');
      while (ruleList.firstChild) {
        ruleList.removeChild(ruleList.lastChild);
      }
      selected[0].rules.forEach(rule => {
        let tag = document.createElement("x-tag");
        tag.value = rule;
        tag.innerHTML = `<x-label>${rule}</x-label>`;
        ruleList.appendChild(tag);
      })
      document.getElementById('input-rule-command').value = selected[0].command;
  } 
}


document.getElementById('rule-list').addEventListener("remove", (event) => {
    let found;
    for (let i in tbl_rules) {
        tbl_rules[i].rules = tbl_rules[i].rules.filter(value => value !== event.detail.value);
        if (tbl_rules[i].rules.length === 0) found = tbl_rules[i].command;
    }

    if (found) {
      for (let i in tbl_rules) {
        tbl_rules = tbl_rules.filter(value => value.command !== found);
      }
    }

    if (document.getElementById("box-selection-rule").style.display === 'none' && tbl_rules[0].rules.length === 0) {
      tbl_rules = [];
      document.getElementById('input-rule-command').value = "";
    }
   
    let count = 0
    for (let i in tbl_rules) {
      if (tbl_rules[i].rules.length === 0) ++count;
    }
    if (count === tbl_rules.length) tbl_rules = [];

})



async function setGroupAction () {
  setTimeout(async () => {
      let ruleList = document.getElementById('rule-list');
      while (ruleList.firstChild) {
        ruleList.removeChild(ruleList.lastChild);
      }

      if (document.getElementById('box-select-rule').style.display === 'none')
        document.getElementById('input-rule-command').value = "";

      await setRuleGroup(null, true);
  },500);
}


document.getElementById("input-new-rule").addEventListener("beforevalidate", (event) => {
  event.preventDefault();
  if (document.getElementById("input-new-rule").value.length > 0) {
    tbl_rules = [];
    document.getElementById("group-selection").toggled = true;
    let ruleList = document.getElementById('rule-list');
    while (ruleList.firstChild) {
      ruleList.removeChild(ruleList.lastChild);
    }
  } else {
    document.getElementById("input-new-rule").setCustomValidity("");
  }
});


document.getElementById('add-input-rule').addEventListener('click', async () => {
  if (document.getElementById('input-rule').value !== '') {

    let selected_node = $('#jstree').jstree(true).get_selected(true)[0];
    let periph = await getPeriphById (selected_node.original.id, selected_node.parents[0], periphParams[selected_node.original.plugin].periphs);
    let periphVal = await getPeriphValues (selected_node.original.plugin, selected_node.original.id, periph.value_type);
    let selected = [];

    if (document.getElementById('input-rule-command').value === '' ) {
      return notification(await Lget ("pluginWidgets", "noFunction"), true);
    }

    let ruleList = document.getElementById('rule-list');
    for (let e in ruleList.childNodes) {
      if (ruleList.childNodes[e].value && ruleList.childNodes[e].value.toLowerCase() === document.getElementById('input-rule').value.toLowerCase())
        return notification(await Lget ("pluginWidgets", "existRule"), true);
    }

    for (let i in tbl_rules) {
      for (let e in tbl_rules[i].rules) {
          if (tbl_rules[i].rules[e] === document.getElementById('input-rule').value.toLowerCase())
            return notification(await Lget ("pluginWidgets", "existRuleValue"), true); 
      }
    }

    if (!document.getElementById('selection-same-rule').toggled) {
      let exist = false;
      if (document.getElementById("box-selection-rule").style.display !== 'none') {
        let ruleMenu = document.getElementById("menu-selection-rule")
        for (var a = 0; a < ruleMenu.childNodes.length; a++) {
          if (ruleMenu.childNodes[a].toggled) break;
        }
        for (let i in tbl_rules) {
          if (tbl_rules[i].description !== ruleMenu.childNodes[a].value && tbl_rules[i].command.toLowerCase() === document.getElementById('input-rule-command').value.toLowerCase()) {
            exist = true
            break;
          } 
        }
      } else if (tbl_rules.length > 0) {
        for (let i in tbl_rules[0].rules) {
          if (tbl_rules[0].rules[i] === document.getElementById('input-rule-command').value.toLowerCase()) {
            exist = true
            break;
          }
        }
      }
      if (exist) return notification(await Lget ("pluginWidgets", "existFunction"), true);
    }

    let tag = document.createElement("x-tag");
    tag.value = document.getElementById('input-rule').value.toLowerCase();
    tag.innerHTML = `<x-label>${document.getElementById('input-rule').value.toLowerCase()}</x-label>`;
    ruleList.appendChild(tag);

    let added = false;
    if (document.getElementById("box-selection-rule").style.display !== 'none') {
      let elem = document.getElementById("menu-selection-rule");
      for (let i = 0; i < elem.childNodes.length; i++) {
        if (elem.childNodes[i].toggled) {
          for (let a in tbl_rules) {
            if (tbl_rules[a].description === elem.childNodes[i].value) {
              tbl_rules[a].rules.push(document.getElementById('input-rule').value.toLowerCase());
              added = true;
              break;
            }
          }
        }
        if (added) break;
      }

      if (!added) {
        var value;
        let elem = document.getElementById("menu-selection-rule")
        for (let i = 0; i < elem.childNodes.length; i++) {
          if (elem.childNodes[i].toggled) {
            value = elem.childNodes[i].value;
            break;
          }
        }
        if (!value)
          return notification(await Lget ("pluginWidgets", "notExistValue"), true);

        selected = periphVal.values.filter(part => part.description === value);
      }
    } else {
      if (tbl_rules.length === 1) {
        tbl_rules[0].rules.push(document.getElementById('input-rule').value.toLowerCase());
        added = true;
      } else {
        selected.push (
          {
            value: "get",
            description: ""
          }
        );
      }
    }
    
    if (!added) {
      if (selected && selected.length > 0) {
        tbl_rules.push(
          {
            value: selected[0].value,
            description: selected[0].description,
            rules: [document.getElementById('input-rule').value.toLowerCase()],
            command: document.getElementById('input-rule-command').value
          }
        );
      }
    }
  }
})


const addItemMenuSelectionRule = () => {
  if (document.getElementById("click-value-list").childNodes.length > 0 || document.getElementById("dblclick-value-list").childNodes.length > 0) {
    let ruleList = [];
    let list = document.getElementById("click-value-list");
    list.childNodes.forEach(clic => {
      ruleList.push(clic.value); 
    })

    list = document.getElementById("dblclick-value-list");
    list.childNodes.forEach(clic => {
      if (ruleList.filter(val => val === clic.value).length === 0) ruleList.push(clic.value);
    })

    let ruleMenu = document.getElementById("menu-selection-rule");
    while (ruleMenu.firstChild) {
      ruleMenu.removeChild(ruleMenu.lastChild);
    }
    ruleList.forEach(rule => {
          let itemElem = document.createElement("x-menuitem");
          itemElem.setAttribute('id', 'rule-'+rule);
          itemElem.value = rule;
          itemElem.onclick = async () => {await setGroupAction()}
          let labelElem = document.createElement("x-label");
          labelElem.innerHTML = rule;
          itemElem.appendChild(labelElem);
          ruleMenu.appendChild(itemElem);
    })

    ruleMenu.childNodes[0].toggled = true;
  }
}


async function setWidgetTabRules () {
  let selected_node = $('#jstree').jstree(true).get_selected(true)[0];
  let periph = await getPeriphById (selected_node.original.id, selected_node.parents[0], periphParams[selected_node.original.plugin].periphs);

  switch (periph.value_type) {
    case 'list': 
      addItemMenuSelectionRule();
    case 'float':
    case 'string':
      if (periph.value_type === 'list') {
        if (document.getElementById("click-value-list").childNodes.length > 0 || document.getElementById("dblclick-value-list").childNodes.length > 0) {
          document.getElementById('box-selection-rule').style.display = "block";
        } else {
          document.getElementById('box-selection-rule').style.display = "none";
        }
        document.getElementById('get-rule').toggled = false;
        document.getElementById('set-rule').toggled = true;
      } else {
        document.getElementById('box-selection-rule').style.display = "none";
        document.getElementById('get-rule').toggled = true;
        document.getElementById('set-rule').toggled = false;
      }

      tbl_rules = [];
      document.getElementById('box-select-rule').style.display = "none";
      document.getElementById('selection-same-rule').toggled = false;
      document.getElementById('selection-same-rule').disabled = false;

      let config = periphParams[selected_node.original.plugin].config;
      if (config.ruleGroups) { 
        addRuleGroups(config.ruleGroups);
      }
  }
}


async function setWidgetTabImages () {

  let selected_node = $('#jstree').jstree(true).get_selected(true)[0];
  let periph = await getPeriphById (selected_node.original.id, selected_node.parents[0], periphParams[selected_node.original.plugin].periphs);
  let tbl_values = await getPeriphValues (selected_node.original.plugin, selected_node.original.id, periph.value_type);

  if (!tbl_values || tbl_values.length === 0) {
    return notification(await Lget ("pluginWidgets", "notExistImg", selected_node.original.id));
  }

  switch (periph.value_type) {
    case 'list': 
        let values = [];
        let clicList = document.getElementById("click-value-list");
        clicList.childNodes.forEach(clic => {
          values.push(clic.value);
        })
        switch (document.getElementById("click-value-list").childNodes.length) {
          case 0:
            switch (document.getElementById("dblclick-value-list").childNodes.length) {
              case 0:
                // no click & no dblclick
                document.getElementById('normal-image-box').style.display = "none";
                document.getElementById('values-image-box').style.display = "block";
                document.getElementById('label-img-widget').innerHTML = await Lget ("pluginWidgets", "infoListValues1");
                addCircularImage("menu-select-values", "-", "label-img-widget-value", "delete-image-box", "img-widget-value", true);
                break;
              default:
                document.getElementById('normal-image-box').style.display = "flex";
                document.getElementById('values-image-box').style.display = "none";
                document.getElementById('label-img-normal-widget').innerHTML = await Lget ("pluginWidgets", "infoListValues2");
                setWidgetImage ({plugin: selected_node.original.plugin, infos: {usage: periph.usage_name, periph_id: selected_node.original.id, values: values}});
                break;
            }
            break;
          case 1:
            document.getElementById('normal-image-box').style.display = "flex";
            document.getElementById('values-image-box').style.display = "none";

            document.getElementById('label-img-normal-widget').innerHTML = (document.getElementById("dblclick-value-list").childNodes.length === 0) 
            ? await Lget ("pluginWidgets", "infoListValues3")
            : await Lget ("pluginWidgets", "infoListValues4");    
            setWidgetImage ({plugin: selected_node.original.plugin, infos: {usage: periph.usage_name, periph_id: selected_node.original.id, values: values}})
          
            break;
          case 2:
            document.getElementById('normal-image-box').style.display = "flex"
            document.getElementById('values-image-box').style.display = "none"

            document.getElementById('label-img-normal-widget').innerHTML = (document.getElementById("dblclick-value-list").childNodes.length === 0) 
            ? await Lget ("pluginWidgets", "infoListValues5")
            : await Lget ("pluginWidgets", "infoListValues6");    
           
            setWidgetImage ({plugin: selected_node.original.plugin, infos: {usage: periph.usage_name, periph_id: selected_node.original.id, values: values}});
            break;
      } 
      break;
    case 'string':
    case 'float': 
      document.getElementById('normal-image-box').style.display = "flex"
      document.getElementById('values-image-box').style.display = "none"
      document.getElementById('label-img-normal-widget').innerHTML = await Lget ("pluginWidgets", "infoFloatValues");
      let floatValues = [periph.usage_name];
      setWidgetImage ({plugin: selected_node.original.plugin, infos: {usage: periph.usage_name, periph_id: selected_node.original.id, values: floatValues}});
      break;
    case 'button':
      document.getElementById('normal-image-box').style.display = "flex";
      document.getElementById('values-image-box').style.display = "none";
      document.getElementById('label-img-normal-widget').innerHTML = await Lget ("pluginWidgets", "infoButtonValues");
      let buttonValues = await getButtonValues();
      setWidgetImage ({plugin: selected_node.original.plugin, infos: {usage: periph.usage_name, periph_id: selected_node.original.id, values: buttonValues}});
  }
  
}


async function getButtonValues () {
  let tbl_values = [];
  let menuOn = document.getElementById('plugin-menu-On').childNodes;
  for (var i = 0; i < menuOn.length; i++) {
    if (menuOn[i].toggled && menuOn[i].value !== 'Sélectionnez un plugin') {
      tbl_values.push("On");
      break;
    }
  }
  let menuOff = document.getElementById('plugin-menu-Off').childNodes;
  for (var i = 0; i < menuOff.length; i++) {
    if (menuOff[i].toggled && menuOff[i].value !== 'Sélectionnez un plugin') {
      tbl_values.push("Off");
      break;
    }
  }
  return tbl_values;
}


async function setWidgetImage(param) {

    let result = [{}];
    try {
      result = await window.electronAPI.getWidgetImages(param);
      if (tbl_images.length === 0) 
        tbl_images.push({
          file: result[0].default.substring(result[0].default.lastIndexOf(pathSeparator)).replace(pathSeparator,'').replace('.png',''),
          src: result[0].default,
          type: "default"
        });
    } catch (err) {
      return notification (await Lget ("pluginWidgets", "infoButtonValues", param.infos.usage, err), true);
    }

    let status_files = [];
    searchImage(param.infos.values, 0, result[0].files, 1, result[0].default, status_files, param.infos.periph_id, async () => {

      let imgText = {default: await Lget ("pluginWidgets", "noImg"), usage: await Lget ("pluginWidgets", "usageImg"), perso: await Lget ("pluginWidgets", "persoImg")};
      
      document.getElementById('delete-icon1-widget').style.display = "none";
      document.getElementById('delete-icon2-widget').style.display = "none";
      document.getElementById('delete-icon3-widget').style.display = "none";
      document.getElementById('box-icon1').style.display = "none";
      document.getElementById('box-icon2').style.display = "none";
      document.getElementById('box-icon3').style.display = "none";

      switch (status_files.length) {
        case 0:
          if ((document.getElementById('div-value-list').style.display === 'block' && document.getElementById('dblclick-value-list').childNodes.length > 0) 
            || (document.getElementById('div-button-action').style.display === 'block' && document.getElementById('circular-menus').childNodes.length > 0)) {
              document.getElementById('box-icon3').style['margin-left'] = "0px";
              document.getElementById('box-icon3').style.display = "block";
              document.getElementById('select-icon3-values').style.display = "flex";
              document.getElementById('label-icon3-widget').innerHTML = await Lget ("pluginWidgets", "circularMenu");
              addCircularImage("menu-icon3-select-values", "-icon3-", "sublabel-icon3-widget", "delete-icon3-widget", "icon3-widget")
          }
          break;
        case 1:
          document.getElementById('box-icon2').style['margin-left'] = "0px";
          document.getElementById('box-icon2').style.display = "block";
          if (status_files[0].type === 'default')
            document.getElementById('sublabel-icon2-widget').innerHTML = imgText.default;
          if (status_files[0].type === 'global')
            document.getElementById('sublabel-icon2-widget').innerHTML = imgText.usage;
          if (status_files[0].type === 'perso') {
            document.getElementById('sublabel-icon2-widget').innerHTML = imgText.perso;
            document.getElementById('delete-icon2-widget').style.display = "flex";
          }

          if ((document.getElementById('div-value-list').style.display === 'block' && document.getElementById('dblclick-value-list').childNodes.length > 0) 
            || (document.getElementById('div-button-action').style.display === 'block' && document.getElementById('circular-menus').childNodes.length > 0)) {
              document.getElementById('box-icon3').style['margin-left'] = "70px";
              document.getElementById('box-icon3').style.display = "block";
              document.getElementById('select-icon3-values').style.display = "flex";
              document.getElementById('label-icon3-widget').innerHTML = await Lget ("pluginWidgets", "circularMenu");
              addCircularImage("menu-icon3-select-values", "-icon3-", "sublabel-icon3-widget", "delete-icon3-widget", "icon3-widget")
          }
          break;
        case 2: 
          document.getElementById('box-icon1').style.display = "block";
          document.getElementById('box-icon2').style.display = "block";
          document.getElementById('box-icon2').style['margin-left'] = "70px";
          if (status_files[0].type === 'default')
            document.getElementById('sublabel-icon1-widget').innerHTML = imgText.default;
          if (status_files[0].type === 'global')
            document.getElementById('sublabel-icon1-widget').innerHTML = imgText.usage;
          if (status_files[0].type === 'perso') {
            document.getElementById('sublabel-icon1-widget').innerHTML = imgText.perso;
            document.getElementById('delete-icon1-widget').style.display = "flex";
          }
          if (status_files[1].type === 'default')
            document.getElementById('sublabel-icon2-widget').innerHTML = imgText.default;
          if (status_files[1].type === 'global')
            document.getElementById('sublabel-icon2-widget').innerHTML = imgText.usage;
          if (status_files[1].type === 'perso') {
            document.getElementById('sublabel-icon2-widget').innerHTML = imgText.perso;
            document.getElementById('delete-icon2-widget').style.display = "flex";
          }

          if ((document.getElementById('div-value-list').style.display === 'block' && document.getElementById('dblclick-value-list').childNodes.length > 0) 
            || (document.getElementById('div-button-action').style.display === 'block' && document.getElementById('circular-menus').childNodes.length > 0)) {
              document.getElementById('box-icon3').style['margin-left'] = "70px";
              document.getElementById('box-icon3').style.display = "block";
              document.getElementById('select-icon3-values').style.display = "flex";
              document.getElementById('label-icon3-widget').innerHTML =await Lget ("pluginWidgets", "circularMenu");
              addCircularImage("menu-icon3-select-values", "-icon3-", "sublabel-icon3-widget", "delete-icon3-widget", "icon3-widget")
          }
      }
    
    })
}



async function addCircularImage(menu, attrb, label, del, img, special) {

  let selected_node = $('#jstree').jstree(true).get_selected(true)[0];
  let periph = await getPeriphById (selected_node.original.id, selected_node.parents[0], periphParams[selected_node.original.plugin].periphs);
  let tbl_values = await getPeriphValues (selected_node.original.plugin, selected_node.original.id, periph.value_type);
  
  let values
  switch (periph.value_type) {
  case 'list':
     values =  {
      click_values: tbl_values.values,
      dblclick_values: [],
      type: periph.value_type
    };
    break;
  case 'button':
    let widgetvalues = await isAlreadyExist (periphParams[selected_node.original.plugin].widgets, tbl_values.periph_id);
    values =  {
      click_values: [],
      dblclick_values: widgetvalues.dblclick_values,
      type: periph.value_type
    };
    break;
  default:
    values =  {
      click_values: [],
      dblclick_values: [],
      type: periph.value_type
    };
  }

  if (special) {

    $("#"+menu).children().remove();
    let menuValues = document.getElementById(menu);
    tbl_values.values.forEach(element => {
      let itemValue = document.createElement("x-menuitem");
      itemValue.setAttribute('id', selected_node.original.id+attrb+element.description)
      itemValue.value = element.description
      itemValue.onclick = () => {
        setImage ({plugin: selected_node.original.plugin, infos: {usage: periph.usage_name,  periph_id: selected_node.original.id, value: element.description, values: values}}, label, del, img)
      }
      let labelItemValue = document.createElement("x-label")
      labelItemValue.innerHTML = element.description
      itemValue.appendChild(labelItemValue)
      menuValues.appendChild(itemValue)
    });
    document.getElementById(selected_node.original.id+attrb+tbl_values.values[0].description).toggled = true;
    setImage ({plugin: selected_node.original.plugin, infos: {usage: periph.usage_name,  periph_id: selected_node.original.id, value: tbl_values.values[0].description, values: values}}, label, del, img);
  } else {

    let dblClicList = (document.getElementById('div-value-list').style.display === 'block')
    ? document.getElementById("dblclick-value-list").childNodes
    : document.getElementById('circular-menus').childNodes;

    $("#"+menu).children().remove()
    let menuValues = document.getElementById(menu);
    let count = 0; 
    let description;
    dblClicList.forEach(element => {
      if (count === 0) description = element.value; ++count;
      let itemValue = document.createElement("x-menuitem");
      itemValue.setAttribute('id', selected_node.original.id+attrb+element.value);
      itemValue.value = element.value;
      itemValue.onclick = () => {
        let image = tbl_images.filter(img => img.value === element.value);
        if (image.length === 0) {
          tbl_images.push({value: element.value})
        }

        setImage ({plugin: selected_node.original.plugin, infos: {usage: periph.usage_name,  periph_id: selected_node.original.id, value: element.value, values: values}}, label, del, img)
      };
      let labelItemValue = document.createElement("x-label");
      labelItemValue.innerHTML = element.value;
      itemValue.appendChild(labelItemValue);
      menuValues.appendChild(itemValue);
    })

    let image = tbl_images.filter(img => img.value === description);
    if (image.length === 0) tbl_images.push({value: description})

    document.getElementById(selected_node.original.id+attrb+description).toggled = true;
    setImage ({plugin: selected_node.original.plugin, infos: {usage: periph.usage_name,  periph_id: selected_node.original.id, value: description, values: values}}, label, del, img);
  } 

}


async function setImage(param, label, del, img) {
  let file, type;
  var image = tbl_images.filter(img => img.value === param.infos.value);
  try {
    file = await window.electronAPI.getWidgetImage(param);
    if (!file) return notification (await Lget ("pluginWidgets", "notExistUsageImg", param.infos.usage), true);

    type = file.indexOf('Default') !== -1
    ? 'default'
    : file.indexOf(param.infos.periph_id) !== -1 ? 'perso' : 'global'

    for (let i in tbl_images) {
      if (tbl_images[i].value === param.infos.value) {
        tbl_images[i].src = file,
        tbl_images[i].path= file.substring(0, file.lastIndexOf(pathSeparator)),
        tbl_images[i].type = type
        break;
      }
    }

  } catch (err) {
    return notification (await Lget ("pluginWidgets", "notExistUsageImg", param.infos.usage)+`: ${err}`, true)
  }
    
  let imgText = {default: await Lget ("pluginWidgets", "noImg"), usage: await Lget ("pluginWidgets", "usageImg"), perso: await Lget ("pluginWidgets", "persoImg")};
  switch (type) {
    case 'default':
      document.getElementById(label).innerHTML = imgText.default;
      document.getElementById(del).style.display = "none";
      break;
    case 'global':
      document.getElementById(label).innerHTML = imgText.usage;
      document.getElementById(del).style.display = "none";
      break;
    case 'perso':
      document.getElementById(label).innerHTML = imgText.perso;

      image.length > 0 
      ? document.getElementById(del).style.display = "flex"
      : document.getElementById(del).style.display = "none";
      
  }
  
  document.getElementById(img).file = document.getElementById(img).src = file;

}


function searchImage(values, pos, files, count, defaultImage, status_files, periph_id, callback) {

   if (pos >= values.length) return callback();
   if (files.length === 0) {
     putImage(values.length, count, values[pos], defaultImage, (val) => {
         status_files.push({name: values[pos], type: 'default'});
         searchImage(values, ++pos, files, val, defaultImage, status_files, periph_id, callback);
     })
     return;
   }
  
   for (let i=0; i<files.length; i++) {
      let test = files[i].substring(files[i].lastIndexOf(pathSeparator)).replace(pathSeparator,'').replace('.png','');
      if (values[pos] === test.replace(/-/g,' ')) {
        putImage(values.length, count, values[pos], files[i], (val) => {
            if (files[i].indexOf(periph_id) !== -1) {
                status_files.push({name: values[pos], type: 'perso'});
            } else
                status_files.push({name: values[pos], type: 'global'});
            
            tbl_images.push ({
                value: values[pos],
                src: files[i],
                path: files[i].substring(0,files[i].lastIndexOf(pathSeparator)),
                type: files[i].indexOf(periph_id) !== -1 ? 'perso' : 'global'
            })

            searchImage(values, ++pos, files, val, defaultImage, status_files, periph_id, callback);
        })
        break;
      }

      if (i+1 === files.length) {
        putImage(values.length, count, values[pos], defaultImage, (val) => {
            status_files.push({name: values[pos], type: 'default'});
            searchImage(values, ++pos, files, val, defaultImage, status_files, periph_id, callback);
        })
      }
  }

}


async function putImage (state, count, title, file, callback) {

  switch (state) {
    case 1:
      document.getElementById('label-icon2-widget').innerHTML = title === "float" ? "Retour d'état" : title;
      document.getElementById('icon2-widget').file = document.getElementById('icon2-widget').src = file;
      callback (count);
      break;
    default:
      document.getElementById('icon'+count+'-widget').file = document.getElementById('icon'+count+'-widget').src = file;
      document.getElementById('label-icon'+count+'-widget').innerHTML = title;
      callback (count+1);
      break;
  }

}


async function deleteImage (label, del, img) {

  let src, valueTest
  if (img === "icon3-widget" || img === "img-widget-value") {
  
    let images = img === "icon3-widget" 
    ? document.getElementById('menu-icon3-select-values')
    : document.getElementById('menu-select-values')

    if (images) {
      for (let i in images.childNodes) {
        if (images.childNodes[i].toggled === true) {
          valueTest =  images.childNodes[i].value
          break
        }
      }
    }
  } else {
    valueTest = document.getElementById(label.replace("sub","")).innerHTML
  }

  for (let i in tbl_images) {
    if (tbl_images[i].value === valueTest) {
      src = tbl_images[i].src
      break
    }
  }

  let selected_node = $('#jstree').jstree(true).get_selected(true)[0];
  
  const result = await window.electronAPI.deleteWidgetImage({plugin: selected_node.original.plugin, file : src});
  
  let periph = await getPeriphById (selected_node.original.id, selected_node.parents[0], periphParams[selected_node.original.plugin].periphs);
  if (!result) return notification (await Lget ("pluginWidgets", "deleteImgError", periph.usage_name), true)

  var values, tbl_values;
  switch(periph.value_type) {
    case 'list':
      tbl_values = await getPeriphValues (selected_node.original.plugin, selected_node.original.id, periph.value_type)
      if (!tbl_values) return
  
      values =  {
        click_values: tbl_values.values,
        dblclick_values: [],
        type: periph.value_type
      }
      break;
    case 'button':
       values = await getButtonValues();
       break;
    }
  
  notification (await Lget ("pluginWidgets", "deleteImg", periph.usage_name));
 
  let value;
  if (img === "icon3-widget" || img === "img-widget-value") {
    if (img === "icon3-widget") {
      document.getElementById('menu-icon3-select-values').children[0].toggled = true;
      value = document.getElementById('menu-icon3-select-values').children[0].value;
    } else {
      document.getElementById('menu-select-values').children[0].toggled = true;
      value = document.getElementById('menu-select-values').children[0].value;
    }
  } else {
    value = document.getElementById(label.replace("sub","")).innerHTML;
  }

  setImage ({plugin: selected_node.original.plugin, infos: {usage: periph.usage_name,  periph_id: selected_node.original.id, value: value, values: values}}, label, del, img);
  switch(periph.value_type) {
    case 'list':
      tbl_images = tbl_images.filter(img => img.value !== document.getElementById(label.replace("sub","")).innerHTML)
      break;
    case 'string':
    case 'float':
      tbl_images = tbl_images.filter(img => img.value !== periph.usage_name)
      break;
    case 'button':
      tbl_images = tbl_images.filter(img => !img.value || img.value !== document.getElementById(label.replace("sub","")).innerHTML)
  }

}


async function getPersonalWidgetImage(menu, label, img, elemValue, deleteButton, box) {

  let result = await window.electronAPI.getPersonalWidgetImage();
  if (result === undefined) return; 

  document.getElementById(img).src = result.fullPath;

  let images = document.getElementById(menu)
  if (images) {
    for (let i in images.childNodes) {
      if (images.childNodes[i].toggled === true) {
        tbl_images = tbl_images.filter(img => img.value !== images.childNodes[i].value);
        tbl_images.push({
          value: images.childNodes[i].value,
          src: result.fullPath,
          path: result.path,
          file: result.fileName,
          type: result.answer === 0 ? "global" : "perso",
          delete: deleteButton,
          box: box
        });
        
        document.getElementById(label).innerHTML = result.answer === 0 ? await Lget ("pluginWidgets", "usageImg") : await Lget ("pluginWidgets", "persoImg");
        break;
      }
    }
  } else {
    let value = document.getElementById(elemValue).innerHTML;
    tbl_images = tbl_images.filter(img => img.value !== value);
    tbl_images.push({
      value: value,
      src: result.fullPath,
      path: result.path,
      file: result.fileName,
      type: result.answer === 0 ? "global" : "perso",
      delete: deleteButton,
      box: box
    });
    document.getElementById(label).innerHTML = result.answer === 0 ? await Lget ("pluginWidgets", "usageImg") : await Lget ("pluginWidgets", "persoImg");
  }

}


async function resetValueList(elem, clicList) {

  let ListClic = document.getElementById(elem);
  while (ListClic.firstChild) {
    ListClic.removeChild(ListClic.lastChild);
  }
  clicList.forEach(clic => {
    let tag = document.createElement("x-tag");
    tag.value = clic.description;
    tag.innerHTML = `<x-label>${clic.description}</x-label>`;
    ListClic.appendChild(tag);
  })

}


document.getElementById('delete-clic').addEventListener('click', async () => {
  let ListClic = document.getElementById("click-value-list");
  while (ListClic.firstChild) {
    ListClic.removeChild(ListClic.lastChild);
  }
})


document.getElementById('delete-dblclic').addEventListener('click', async () => {
  let ListClic = document.getElementById("dblclick-value-list");
  while (ListClic.firstChild) {
    ListClic.removeChild(ListClic.lastChild);
  }
})


document.getElementById('img-widget-value').addEventListener('click', () => {
  getPersonalWidgetImage('menu-select-values', 'label-img-widget-value', 'img-widget-value', null, 'delete-image', 'values-image-box');
})


document.getElementById('icon1-widget').addEventListener('click', () => {
  getPersonalWidgetImage('menu-icon1-select-values', 'sublabel-icon1-widget', 'icon1-widget', 'label-icon1-widget', 'delete-icon1-widget', 'box-icon1');
})

document.getElementById('icon2-widget').addEventListener('click', () => {
  getPersonalWidgetImage('menu-icon2-select-values', 'sublabel-icon2-widget', 'icon2-widget', 'label-icon2-widget', 'delete-icon2-widget', 'box-icon2');
})

document.getElementById('icon3-widget').addEventListener('click', () => {
  getPersonalWidgetImage('menu-icon3-select-values', 'sublabel-icon3-widget', 'icon3-widget', 'label-icon3-widget', 'delete-icon3-widget', 'box-icon3');
})


async function setWidgetTabSettings (plugin, type, widgetvalues, config) {

  switch (type) {
    case 'list':
      document.getElementById('box-title').style.display = "flex";
      document.getElementById('box-offsetX-title').style.display = "flex";
      document.getElementById('box-offsetY-title').style.display = "flex";
      document.getElementById('box-status').style.display = "flex";
      document.getElementById('box-offsetX-status').style.display = "flex";
      document.getElementById('box-offsetY-status').style.display = "flex";
      document.getElementById('box-value').style.display = "flex";
      document.getElementById('box-offsetX-value').style.display = "flex";
      document.getElementById('box-offsetY-value').style.display = "flex";
      document.getElementById('box-pos-text-button').style.display = "none";
      document.getElementById('box-value').style["margin-left"] = "50px";
      document.getElementById('box-offsetX-value').style["margin-left"] = "20px";
      document.getElementById('box-offsetY-value').style["margin-left"] = "20px";
      document.getElementById('widget-value').style.display = 'flex';
      document.getElementById('widget-status').style.display = 'flex';
      document.getElementById('widget-title').style.display = 'flex';
      document.getElementById('circular-card').style.display = "block";

      if (widgetvalues) {
        document.getElementById('widget-title').toggled = widgetvalues.style.title.display;
        document.getElementById('widget-value').toggled = widgetvalues.style.value.display;
        document.getElementById('widget-status').toggled = widgetvalues.style.status.display;

        if (widgetvalues.style.title.display === false) {
          document.getElementById('box-title').style.display = "none";
          document.getElementById('box-offsetX-title').style.display = "none";
          document.getElementById('box-offsetY-title').style.display = "none";
        }

        if (widgetvalues.style.value.display === false) {
          document.getElementById('box-value').style.display = "none";
          document.getElementById('box-offsetX-value').style.display = "none";
          document.getElementById('box-offsetY-value').style.display = "none";
        }

        if (widgetvalues.style.status.display === false) {
          document.getElementById('box-status').style.display = "none";
          document.getElementById('box-offsetX-status').style.display = "none";
          document.getElementById('box-offsetY-status').style.display = "none";
        }
      } else {
          document.getElementById('widget-title').toggled = true;
          document.getElementById('widget-value').toggled = true;
          document.getElementById('widget-status').toggled = true;
      }
      await setWidgetImg();
      await setWidgetTabParams(plugin, config);
      await setCircularMenuParams(plugin);
      await setWidgetTabRules();
      break;
    case 'string':
    case 'float':
      document.getElementById('box-status').style.display = "none";
      document.getElementById('box-offsetX-status').style.display = "none";
      document.getElementById('box-offsetY-status').style.display = "none";
      document.getElementById('box-title').style.display = "none";
      document.getElementById('box-offsetX-title').style.display = "none";
      document.getElementById('box-offsetY-title').style.display = "none";
      document.getElementById('box-value').style.display = "flex";
      document.getElementById('box-offsetX-value').style.display = "flex";
      document.getElementById('box-offsetY-value').style.display = "flex";
      document.getElementById('widget-value').style.display = 'flex';
      document.getElementById('widget-status').style.display = 'none';
      document.getElementById('widget-title').style.display = 'none';
      document.getElementById('widget-title').dispatchEvent(new Event ('click'));
      document.getElementById('widget-status').dispatchEvent(new Event ('click'));
      document.getElementById('circular-card').style.display = "none";
      document.getElementById('box-pos-text-button').style.display = "none";
      document.getElementById('box-value').style["margin-left"] = "0px";
      document.getElementById('box-offsetX-value').style["margin-left"] = "0px";
      document.getElementById('box-offsetY-value').style["margin-left"] = "0px";
      
      if (widgetvalues) {
        document.getElementById('widget-title').toggled = false;
        document.getElementById('widget-value').toggled = widgetvalues.style.value.display;
        document.getElementById('widget-status').toggled =false;
        
        if (widgetvalues.style.value.display === false) {
          document.getElementById('box-value').style.display = "none";
          document.getElementById('box-offsetX-value').style.display = "none";
          document.getElementById('box-offsetY-value').style.display = "none";
        }
      } else {
        document.getElementById('widget-title').toggled = false;
        document.getElementById('widget-value').toggled = true;
        document.getElementById('widget-status').toggled =false;
      }
      await setWidgetImg();
      await setWidgetTabParams(plugin, config);
      await setWidgetTabRules();
      break;
    case 'button':
      document.getElementById('widget-title').style.display = 'flex';
      document.getElementById('widget-status').style.display = 'none';
      document.getElementById('widget-value').style.display = 'none';
      document.getElementById('circular-card').style.display = "none";
      document.getElementById('box-status').style.display = "none";
      document.getElementById('box-offsetX-status').style.display = "none";
      document.getElementById('box-offsetY-status').style.display = "none";
      document.getElementById('box-value').style.display = "none";
      document.getElementById('box-offsetX-value').style.display = "none";
      document.getElementById('box-offsetY-value').style.display = "none";
      document.getElementById('box-title').style.display = "flex";
      document.getElementById('box-offsetX-title').style.display = "none";
      document.getElementById('box-offsetY-title').style.display = "none";
      document.getElementById('box-pos-text-button').style.display = "flex";
     
      if (widgetvalues) {
        document.getElementById('widget-title').toggled = widgetvalues.style.title.display;
        document.getElementById('widget-value').toggled = false;
        document.getElementById('widget-status').toggled = false;
        document.getElementById(widgetvalues.style.title.position+'-text-button').toggled = true;

        if (widgetvalues.style.title.display === false)  {
          document.getElementById('widget-title').toggled = false;
          document.getElementById('box-title').style.display = "none";
          document.getElementById('box-pos-text-button').style.display = "none";
        }
      } else {
        document.getElementById('widget-title').toggled = false;
        document.getElementById('widget-value').toggled = false;
        document.getElementById('widget-status').toggled = false;
        document.getElementById('box-pos-text-button').style.display = "none";
        document.getElementById((config.widget && config.widget.font.position ? config.widget.font.position : 'bottom')+'-text-button').toggled = true;
      }
      await setWidgetImg();
      await setWidgetTabParams(plugin, config);
      await setCircularMenuParams(plugin);
      break;
  }

}


async function isWidgetValues (plugin) {
  let selected_node = $('#jstree').jstree(true).get_selected(true)[0];
  let widgetvalues = await isAlreadyExist (periphParams[plugin].widgets, selected_node.original.id);
  return widgetvalues;
}


async function setWidgetTabParams(plugin, config) {

  let widgetvalues = await isWidgetValues(plugin);

  if (widgetvalues) {
    document.getElementById('widget-color-picker').value = document.getElementById('widget-color').value = widgetvalues.style.color;
    document.getElementById('widget-text-color-picker').value = document.getElementById('widget-text-color').value = widgetvalues.style.textcolor;
    document.getElementById('widget-border').value = widgetvalues.style.borderwidth;
    document.getElementById('widget-opacity').value = widgetvalues.style.opacity;
    document.getElementById('image-size').value = widgetvalues.style.image.size.width;

    if (widgetvalues.style.title) {
      if (widgetvalues.style.title.fontsize) document.getElementById('font-size-title').value = widgetvalues.style.title.fontsize;
      if (widgetvalues.type !== 'button') {
        if (widgetvalues.style.title.offset.x) document.getElementById('font-size-offsetX-title').value = widgetvalues.style.title.offset.x;
        if (widgetvalues.style.title.offset.y) document.getElementById('font-size-offsetY-title').value = widgetvalues.style.title.offset.y;
      }  
    }
  
    if (widgetvalues.style.value) {
      if (widgetvalues.style.value.fontsize) document.getElementById('font-size-value').value = widgetvalues.style.value.fontsize;
      if (widgetvalues.style.value.offset.x) document.getElementById('font-size-offsetX-value').value = widgetvalues.style.value.offset.x;
      if (widgetvalues.style.value.offset.y) document.getElementById('font-size-offsetY-value').value = widgetvalues.style.value.offset.y;
    }
    
    if (widgetvalues.style.status) {
      if (widgetvalues.style.status.fontsize) document.getElementById('font-size-status').value = widgetvalues.style.status.fontsize;
      if (widgetvalues.style.status.offset.x) document.getElementById('font-size-offsetX-status').value = widgetvalues.style.status.offset.x;
      if (widgetvalues.style.status.offset.y) document.getElementById('font-size-offsetY-status').value = widgetvalues.style.status.offset.y;
    }

  } else {
    document.getElementById('widget-color-picker').value = document.getElementById('widget-color').value = 
        config.widget && config.widget.color ? config.widget.color : "rgba(107, 101, 99, 1)";

    document.getElementById('widget-text-color-picker').value = document.getElementById('widget-text-color').value =
        config.widget && config.widget.textColor ? config.widget.textColor : "rgba(255, 255, 255, 1)";

    document.getElementById('widget-border').value = config.widget && config.widget.borderwidth ? 
        config.widget.borderWidth : 5;
        
    document.getElementById('widget-opacity').value = config.widget && config.widget.opacity ? config.widget.opacity : 0.7;
  
    document.getElementById('font-size-title').value = config.widget && config.widget.font.title ? config.widget.font.title : 12;
    document.getElementById('font-size-value').value = config.widget && config.widget.font.value ? config.widget.font.value : 10;
    document.getElementById('font-size-status').value = config.widget && config.widget.font.status ? config.widget.font.status : 8;
    document.getElementById('image-size').value = config.widget && config.widget.size ? config.widget.size : 40;

    document.getElementById('font-size-offsetX-title').value = 0;
    document.getElementById('font-size-offsetY-title').value = 0;
    document.getElementById('font-size-offsetX-value').value = 0;
    document.getElementById('font-size-offsetY-value').value = 0;
    document.getElementById('font-size-offsetX-status').value = 0;
    document.getElementById('font-size-offsetY-status').value = 0;
  }

}


async function setCircularMenuParams (plugin) {

  let config = periphParams[plugin].config;
  let widgetvalues = await isWidgetValues(plugin);
  
  if (widgetvalues && widgetvalues.dblclick_values.length > 0) {
    document.getElementById('circular-radius').value = widgetvalues.style.circular.radius;
    document.getElementById('circular-bgrcolor-picker').value = document.getElementById('circular-bgrcolor').value = widgetvalues.style.circular.fillcolor;
    document.getElementById('circular-selectcolor-picker').value = document.getElementById('circular-selectcolor').value = widgetvalues.style.circular.activefillcolor;
    document.getElementById('circular-text').value = widgetvalues.style.circular.fontsize;
    document.getElementById('circular-bgrtextcolor-picker').value = document.getElementById('circular-bgrtextcolor').value = widgetvalues.style.circular.fontcolor;
  } else {
    document.getElementById('circular-radius').value = config.widget && config.widget?.menu && config.widget?.menu?.radius ? config.widget.menu.radius : 80;
    document.getElementById('circular-bgrcolor').value = document.getElementById('circular-bgrcolor-picker').value = 
    config.widget && config.widget?.menu && config.widget?.menu?.fillColor ? config.widget.menu.fillColor : "rgba(107, 101, 99, 1)";

    document.getElementById('circular-selectcolor').value = document.getElementById('circular-selectcolor-picker').value = 
    config.widget && config.widget?.menu && config.widget?.menu?.activeFillColor ? config.widget.menu.activeFillColor : "rgba(56, 255, 0, 0.75)";

    document.getElementById('circular-text').value = config.widget && config.widget?.menu?.font ? config.widget.menu.font : 12;
    document.getElementById('circular-bgrtextcolor').value = document.getElementById('circular-bgrtextcolor-picker').value = 
    config.widget && config.widget?.menu?.textColor ? config.widget.menu.textColor : "rgba(255, 255, 255, 1)";
  }

}



async function setWidgetTabPeriph (plugin, periph, config) {

  document.getElementById('battery-value').style.display = "block";
  document.getElementById('parent-id-value').style.display = "block";
  document.getElementById('rule').style.display = "flex";

  document.getElementById('peripheric-value').innerHTML = await Lget ("pluginWidgets", "name");
  document.getElementById('id-value').innerHTML = await Lget ("pluginWidgets", "codePeriph" , periph.periph_id); 
  document.getElementById('parent-id-value').innerHTML =  await Lget ("pluginWidgets", "codeParentPeriph")+" "+periph.parent_periph_id;
  document.getElementById('usage-value').innerHTML = await Lget ("pluginWidgets", "usage" ,periph.usage_name);
  document.getElementById('battery-value').innerHTML = periph.battery ? await Lget ("pluginWidgets", "battery" ,periph.battery) : await Lget ("pluginWidgets", "noBattery");
  document.getElementById('type-value').innerHTML = await Lget ("pluginWidgets", "valueType", value_type[periph.value_type]);
  document.getElementById('note-value').innerHTML = periph.notes ? await Lget ("pluginWidgets", "note")+" "+periph.notes : await Lget ("pluginWidgets", "note");
  document.getElementById('create_widget').disabled = false;

  let values = await getPeriphValues (plugin, periph.periph_id, periph.value_type);
  let widgetvalues = await isAlreadyExist (periphParams[plugin].widgets, values.periph_id);
  document.getElementById('peripheric-title').value = widgetvalues ? widgetvalues.title : periph.name;

  document.getElementById('rule').disabled = !widgetvalues;

  switch (periph.value_type) {
    case 'list':
      if (widgetvalues) {
        await setXTagValues(true, values.values, widgetvalues.click_values, widgetvalues.dblclick_values);
        if (widgetvalues.macro) {
          document.getElementById('set-action-periph').toggled = false;
          document.getElementById('macro-action-periph').toggled = true;
        } else {
          document.getElementById('set-action-periph').toggled = true;
          document.getElementById('macro-action-periph').toggled = false;
        }
      } else {
        await setXTagValues(false, values.values);
        document.getElementById('set-action-periph').toggled = true;
        document.getElementById('macro-action-periph').toggled = false;
      }
      await setWidgetTabSettings (plugin, 'list', widgetvalues, config);
      break;
    case 'string':
    case 'float':
      document.getElementById('widget').innerHTML = widgetvalues 
      ? await Lget ("pluginWidgets", "innerWidget")+' <font color="#953d96" style=font-weight:bold;>'+await Lget ("pluginWidgets", "existWidget")+'</font>' 
      : await Lget ("pluginWidgets", "innerWidget")+' '+await Lget ("pluginWidgets", "notExistWidget");
      document.getElementById('create_widget-label').innerHTML = widgetvalues 
      ? await Lget ("pluginWidgets", "modifButton") 
      : await Lget ("pluginWidgets", "createButton");
      document.getElementById('delete_widget').disabled = widgetvalues ? false : true;
      document.getElementById('div-value-list').style.display = "none";
      document.getElementById('div-button-action').style.display = "none";
      document.getElementById('div-float-label').style.display = "block";
      
      await setWidgetTabSettings (plugin, periph.value_type, widgetvalues, config);
      break;
    case 'button':
      circularMenu = []
      let xTermTab = document.getElementById("circular-menus")
      while (xTermTab.firstChild) {
          xTermTab.removeChild(xTermTab.lastChild);
      }

      document.getElementById('battery-value').style.display = "none";
      document.getElementById('parent-id-value').style.display = "none";
      document.getElementById('rule').style.display = "none";
      document.getElementById('create_widget-label').innerHTML = widgetvalues 
      ? await Lget ("pluginWidgets", "modifButton") 
      : await Lget ("pluginWidgets", "createButton");
      document.getElementById('delete_widget').disabled = widgetvalues ? false : true;

      document.getElementById('widget').innerHTML = widgetvalues 
      ? await Lget ("pluginWidgets", "innerWidget")+' <font color="#953d96" style=font-weight:bold;>'+await Lget ("pluginWidgets", "existWidget")+'</font>' 
      : await Lget ("pluginWidgets", "innerWidget")+' '+await Lget ("pluginWidgets", "notExistWidget");

      document.getElementById('description-button-on').innerHTML = await Lget ("pluginWidgets", "actionClicOn");
      document.getElementById('description-button-off').innerHTML = await Lget ("pluginWidgets", "actionclicOff");
      document.getElementById('description-circular').innerHTML = await Lget ("pluginWidgets", "actionCircularMenu");
      document.getElementById('info-circular-buttons').innerHTML = await Lget ("pluginWidgets", "actionCircularInfo");
      document.getElementById('input-circular').value = "";
      document.getElementById('key-On').value = "";
      document.getElementById('key-Off').value = "";
      document.getElementById('key-circular').value = "";
      document.getElementById('plugin-selection-On').toggled = true;
      document.getElementById('plugin-selection-Off').toggled = true;
      document.getElementById('plugin-menu-circular-selection').toggled = true;

      await setPluginList();

      if (widgetvalues) {
        if(widgetvalues.click_values.length > 0) {
          let plugins = document.getElementById('plugin-menu-On');
          for (let i in plugins.childNodes) {
            plugins.childNodes[i].toggled = false;
          }
          document.getElementById('on-'+widgetvalues.click_values[0].plugin).toggled = true;
          document.getElementById('key-On').value = widgetvalues.click_values[0].action;
          
          if (widgetvalues.click_values[1]) {
            let plugins = document.getElementById('plugin-menu-Off');
            for (let i in plugins.childNodes) {
              plugins.childNodes[i].toggled = false;
            }
            document.getElementById('off-'+widgetvalues.click_values[1].plugin).toggled = true ; 
            document.getElementById('key-Off').value = widgetvalues.click_values[1].action;
          } 
        }
          
        if(widgetvalues.dblclick_values.length > 0) {  

          for (let i in widgetvalues.dblclick_values) {
            await createCircularMenu(widgetvalues.dblclick_values[i].description);
            let label = await getcircularMenuLabel(widgetvalues.dblclick_values[i].description);
            label.plugin = widgetvalues.dblclick_values[i].plugin;
            label.action = widgetvalues.dblclick_values[i].action;
          }

          let xMenus = xTermTab.childNodes;
          for (let i = 1; i < xMenus.length; i++) {
            if (xMenus[i].toggled) xMenus[i].toggled = false;
          }

          document.getElementById(widgetvalues.dblclick_values[0].description.replace(/ /g,'-')).toggled = true;
          let plugins = document.getElementById('plugin-menu-circular');
          for (let i in plugins.childNodes) {
            plugins.childNodes[i].toggled = false;
          }
          document.getElementById('circular-'+widgetvalues.dblclick_values[0].plugin).toggled = true;
          document.getElementById('key-circular').value = widgetvalues.dblclick_values[0].action;
        }

      } 

      document.getElementById('div-value-list').style.display = "none";
      document.getElementById('div-float-label').style.display = "none";
      document.getElementById('div-button-action').style.display = "block";

      await setWidgetTabSettings (plugin, 'button', widgetvalues, config);
  }

}


function resetAction (item) {
  document.getElementById(item).value = "";
}



function setPluginList() {

  return new Promise(async (resolve) => {

    let disabled = await Lget("pluginStudio", "disabled");
    let menuOn = document.getElementById('plugin-menu-On');
    let menuOff = document.getElementById('plugin-menu-Off');
    let menuCircular = document.getElementById('plugin-menu-circular');

    while (menuOn.firstChild) {
      if (menuOn.lastChild.tagName === 'HR') break;
      menuOn.removeChild(menuOn.lastChild);
    }
    while (menuOff.firstChild) {
      if (menuOff.lastChild.tagName === 'HR') break;
      menuOff.removeChild(menuOff.lastChild);
    }
    while (menuCircular.firstChild) {
    if (menuCircular.lastChild.tagName === 'HR')  break;
    menuCircular.removeChild(menuCircular.lastChild);
    }

    let count = plugins.length;
    if (count === 0) return resolve()
    plugins.forEach(element => {
            let itemOn = document.createElement("x-menuitem");
            itemOn.className = 'plugin';
            itemOn.setAttribute('id', 'on-'+element.name.replace("\n("+disabled+")",''));
            itemOn.value = element.name.replace("\n("+disabled+")",'');
            itemOn.onclick = () => {resetAction ('key-On')};
            let labelOn = document.createElement("x-label");
            labelOn.innerHTML = element.name;
            itemOn.appendChild(labelOn);
            menuOn.appendChild(itemOn);

            let itemOff = document.createElement("x-menuitem");
            itemOff.className = 'plugin';
            itemOff.setAttribute('id', 'off-'+element.name.replace("\n("+disabled+")",''));
            itemOff.value = element.name.replace("\n("+disabled+")",'');
            itemOff.onclick = () => {resetAction ('key-Off')};
            let labelOff = document.createElement("x-label");
            labelOff.innerHTML = element.name;
            itemOff.appendChild(labelOff);
            menuOff.appendChild(itemOff);

            let itemCircular = document.createElement("x-menuitem");
            itemCircular.className = 'plugin';
            itemCircular.setAttribute('id', 'circular-'+element.name.replace("\n("+disabled+")",''));
            itemCircular.value = element.name.replace("\n("+disabled+")",'');
            itemCircular.onclick = () => { resetAction ('key-circular')};
            let labelCircular = document.createElement("x-label");
            labelCircular.innerHTML = element.name;
            itemCircular.appendChild(labelCircular);
            menuCircular.appendChild(itemCircular);
            
            if (!--count) return resolve();
    })
  })
}


async function getPeriphValues(plugin, id, value_type) {

    for (let i in periphValues) {
      if (periphValues[i].periph_id === id) {
        return periphValues[i];
      }
    }
    try {
      let values = await window.electronAPI.getPeriphValues({plugin: plugin, id: id, type: value_type});
      if (values.values) {
        values.periph_id = values.periph_id.toString();
        periphValues.push(values);
        return values;
      } else {
        return values;
      }
    } catch (err) {
      notification(await Lget ("pluginWidgets", "getPeriphValueErr", id, err), true);
    }
}


function isAlreadyExist(widgets, id) {

  return new Promise((resolve) => {

    for (let i in widgets) {
      if (widgets[i].id === id) {
        return resolve(widgets[i]);
      }
    }
    resolve()
  })

}


function notification (msg, err) {
  let notif = document.getElementById('notification');
  notif.style.color = (err) ? 'red' : 'rgba(255, 255, 255, 0.9)';
  if (notif.opened == true) notif.opened = false;
  notif.innerHTML = msg;
  notif.opened = true;
}



async function setLangTargets() {

  value_type = {
    'list': await Lget ("pluginWidgets", "listValue"),
    'float': await Lget ("pluginWidgets", "floatValue"),
    'string': await Lget ("pluginWidgets", "intValue"),
    'button': await Lget ("pluginWidgets", "actionValue")
  }

  document.getElementById('label-no-periph-selection').innerHTML = await Lget ("pluginWidgets", "selectPeriph");
  document.getElementById('periphLabel').innerHTML = await Lget ("pluginWidgets", "periphLabel");
  document.getElementById('parameterLabel').innerHTML = await Lget ("pluginWidgets", "parameterLabel");
  document.getElementById('imageLabel').innerHTML = await Lget ("pluginWidgets", "imageLabel");
  document.getElementById('rulesLabel').innerHTML = await Lget ("pluginWidgets", "rulesLabel");
  
  document.getElementById('noclick-nodblclick-label').innerHTML = await Lget ("pluginWidgets", "noClicDblclicLabel");
  document.getElementById('set-or-macro-periph-label').innerHTML = await Lget ("pluginWidgets", "setOrMacroLabel");
  document.getElementById('label-set-action-periph').innerHTML = await Lget ("pluginWidgets", "setActionPeriph");
  document.getElementById('label-macro-action-periph').innerHTML = await Lget ("pluginWidgets", "setMacroPeriph");

  document.getElementById('float-label').innerHTML = await Lget ("pluginWidgets", "floatLabel");
  document.getElementById('select-plugin-label-On').innerHTML = await Lget ("pluginWidgets", "selectPluginLabel");
  document.getElementById('select-plugin-label-Off').innerHTML = await Lget ("pluginWidgets", "selectPluginLabel");
  document.getElementById('select-plugin-label-circular').innerHTML = await Lget ("pluginWidgets", "selectPluginLabel");

  document.getElementById('label-circular').innerHTML = await Lget ("pluginWidgets", "circularLabel");
  document.getElementById('add-label').innerHTML = await Lget ("pluginWidgets", "addLabel");
  document.getElementById('delete-label').innerHTML = await Lget ("pluginWidgets", "deleteLabel");
  document.getElementById('assoc-label').innerHTML = await Lget ("pluginWidgets", "assocLabel");

  document.getElementById('text-label').innerHTML = await Lget ("pluginWidgets", "textLabel");
  document.getElementById('title-label').innerHTML = await Lget ("pluginWidgets", "titleLabel");
  document.getElementById('value-label').innerHTML = await Lget ("pluginWidgets", "valueLabel");
  document.getElementById('status-label').innerHTML = await Lget ("pluginWidgets", "statusLabel");

  document.getElementById('label-widget-color').innerHTML = await Lget ("pluginWidgets", "colorLabel");
  
  document.getElementById('label-widget-text-color').innerHTML = await Lget ("pluginWidgets", "textColorLabel");
  document.getElementById('label-font-size-title').innerHTML = await Lget ("pluginWidgets", "fontSizeTitleLabel");
  document.getElementById('label-font-size-value').innerHTML = await Lget ("pluginWidgets", "fontSizeValueLabel");
  document.getElementById('label-font-size-status').innerHTML = await Lget ("pluginWidgets", "fontSizeStatusLabel");
  
  document.getElementById('label-pos-text-button').innerHTML = await Lget ("pluginWidgets", "posTitleLabel");
  document.getElementById('top').innerHTML = await Lget ("pluginWidgets", "posTopTitleLabel");
  document.getElementById('bottom').innerHTML = await Lget ("pluginWidgets", "posBottomTitleLabel");
  
  document.getElementById('label-font-size-offsetX-title').innerHTML = await Lget ("pluginWidgets", "offsetXTitleLabel");
  document.getElementById('label-font-size-offsetX-value').innerHTML = await Lget ("pluginWidgets", "offsetXValueLabel");
  document.getElementById('label-font-size-offsetX-status').innerHTML = await Lget ("pluginWidgets", "offsetXStatusLabel");
  
  document.getElementById('label-font-size-offsetY-title').innerHTML = await Lget ("pluginWidgets", "offsetYTitleLabel");
  document.getElementById('label-font-size-offsetY-value').innerHTML = await Lget ("pluginWidgets", "offsetYValueLabel");
  document.getElementById('label-font-size-offsetY-status').innerHTML = await Lget ("pluginWidgets", "offsetYStatusLabel");
  
  document.getElementById('label-widget-opacity').innerHTML = await Lget ("pluginWidgets", "opacityLabel");
  document.getElementById('label-widget-border').innerHTML = await Lget ("pluginWidgets", "borderLabel");
  document.getElementById('label-image-size').innerHTML = await Lget ("pluginWidgets", "imageSizeLabel");
  
  document.getElementById('default-border-size-label').innerHTML = await Lget ("pluginWidgets", "borderSizeLabel");
  
  document.getElementById('circular-title-label').innerHTML = await Lget ("pluginWidgets", "circularTitleLabel");
  document.getElementById('label-circular-radius').innerHTML = await Lget ("pluginWidgets", "circularRadiusLabel");
  document.getElementById('label-circular-bgrcolor').innerHTML = await Lget ("pluginWidgets", "circularbgrColorLabel");
  document.getElementById('label-circular-selectcolor').innerHTML = await Lget ("pluginWidgets", "circularSelectColorLabel");
  document.getElementById('label-circular-text').innerHTML = await Lget ("pluginWidgets", "circularTextLabel");
  document.getElementById('label-circular-bgrtextcolor').innerHTML = await Lget ("pluginWidgets", "circularTextColorLabel");
  
  document.getElementById('delete-image-label').innerHTML = await Lget ("pluginWidgets", "deleteImgLabel");
  document.getElementById('label-rule').innerHTML = await Lget ("pluginWidgets", "ruleLabel");
  document.getElementById('label-set-rule').innerHTML = await Lget ("pluginWidgets", "setRuleLabel");
  document.getElementById('label-get-rule').innerHTML = await Lget ("pluginWidgets", "getRuleLabel");
  document.getElementById('label-same-rule').innerHTML = await Lget ("pluginWidgets", "sameRuleLabel");
  document.getElementById('selection-same-rule-label').innerHTML = await Lget ("pluginWidgets", "selectSameRuleLabel");
  document.getElementById('group-selection-label').innerHTML = await Lget ("pluginWidgets", "groupSelectRuleLabel");
  document.getElementById('label-existing-rule').innerHTML = await Lget ("pluginWidgets", "existGroupRuleLabel");
  document.getElementById('label-new-rule').innerHTML = await Lget ("pluginWidgets", "newGroupRuleLabel");
  document.getElementById('input-new-rule-label').innerHTML = await Lget ("pluginWidgets", "inputGroupRuleLabel");
  document.getElementById('label-rule-command').innerHTML = await Lget ("pluginWidgets", "commandRuleLabel");
  document.getElementById('label-selection-rule').innerHTML = await Lget ("pluginWidgets", "selectionRuleLabel");
  document.getElementById('label-rule-list').innerHTML = await Lget ("pluginWidgets", "listRuleLabel");
  document.getElementById('label-add-rule').innerHTML = await Lget ("pluginWidgets", "addRuleLabel");
  document.getElementById('add-input-rule-label').innerHTML = await Lget ("pluginWidgets", "addInputRuleLabel");

  document.getElementById('create_widget-label').innerHTML = await Lget ("pluginWidgets", "createButton");
  document.getElementById('delete_widget-label').innerHTML = await Lget ("pluginWidgets", "deleteWidgetLabel");
  document.getElementById('exit-label').innerHTML = await Lget ("pluginWidgets", "exitLabel");
  
  document.getElementById('plugin-selection-On').onclick = () => { resetAction ('key-On')};
  document.getElementById('plugin-selection-Off').onclick = () => { resetAction ('key-Off')};
  document.getElementById('plugin-menu-circular-selection').onclick = () => { resetAction ('key-circular')};

  let img = (window.location.href).substring(0, (window.location.href).indexOf('pluginWidgets.html'))+"../images/createWidgets/allvalues.png";
  document.getElementById('widget-img').src = img;

}


async function Lget (top, target, param, param1) {
  if (param) {
      if (param1)
           return await window.electronAPI.getMsg([top+"."+target, param, param1]);
      else
           return await window.electronAPI.getMsg([top+"."+target, param]);
  } else {
      return await window.electronAPI.getMsg(top+"."+target);
  }
}


async function setSettingsXel(interface) {
  if (interface && interface.screen?.xeltheme) {
    document
    .querySelector('meta[name="xel-theme"]')
    .setAttribute('content', '../../node_modules/xel/themes/' + interface.screen.xeltheme + '.css');
    
    document.querySelector('meta[name="xel-accent-color"]').setAttribute('content', interface.screen.xelcolor);
    
    document
    .querySelector('meta[name="xel-icons"]')
    .setAttribute('content', '../../node_modules/xel/icons/' + interface.screen.xelicons + '.svg');
  }
}


window.electronAPI.onInitApp(async (_event, interface, arg) => {
    if (arg) {
      periphParams = arg.periphs;
      plugins = arg.plugins;
      pathSeparator = arg.appsep;
      __dirname = arg.dirname;
      await setSettingsXel(interface);
      setLangTargets();
      cyPlugins = await setCY('cy-plugins');
      await addPluginsButton();
    }
})