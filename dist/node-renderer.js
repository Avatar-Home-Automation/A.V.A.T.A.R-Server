let menu, current_action, destroyMenu
let WidgetClasses = []

function grabbableElement (elem, grabb) {
    return new Promise((resolve) => {
      if (!grabb)
        elem.ungrabify();
      else
        elem.grabify();
      resolve (elem);
    })
}


function addElementPosition (elem, pos) {
    return new Promise((resolve) => {
      if (!pos) return resolve (elem);
      elem.position('x', pos.x);
      elem.position('y', pos.y);
      resolve (elem);
    })
}


function addElementSize (elem, size) {
    return new Promise((resolve) => {
      if (!size) return resolve (elem);
      if (!size.height) size.height = size.width;
      elem.style({
        'height': size.height,
        'width': size.width
      });
      resolve (elem);
    })
}


function addElementImage (elem, img) {
    return new Promise((resolve) => {
      if (!img) return resolve (elem);
      elem.style({
          'background-image': "url('"+img+'?n='+Math.floor(Math.random() * 10000)+"')"
      });
      resolve (elem);
    })
}


function addElementClass (elem, classe) {
    return new Promise((resolve) => {
      elem.addClass(classe);
      resolve (elem);
    })
}

function addElementName (elem, data) {
    return new Promise((resolve) => {
      if (!elem) return resolve ();
      if (!data) return resolve (elem);
      elem.data('name', data);
      resolve (elem);
    })
}
  

function addElementLabel (elem, label) {
    return new Promise((resolve) => {
      if (!elem) return resolve ();
      if (!label) return resolve (elem);
      elem.style({
          'label': label.text,
          'text-valign': label.valign ? label.valign : 'center',
          'text-halign': label.halign ? label.halign : 'center',
          'font-size': label.fontSize ? label.fontSize :  "12px",
          'color': label.fontColor ? label.fontColor : "white",
          'text-outline-width': label.fontOutline ? label.fontOutline : 0,
          'text-rotation': label.textRotation ? label.textRotation : 0,
          'text-wrap': label['text-wrap'] ? label['text-wrap'] : "none",
          'text-max-width': label['text-max-width'] ? label['text-max-width'] : "100px",
          'text-justification': label['text-justification'] ? label['text-justification'] : "center"
      });
      resolve (elem);
    })
}


function addElementLabelOnly (elem, label) {
  return new Promise((resolve) => {
    if (!elem) return resolve ()
    if (!label) return resolve (elem)
    elem.style({
        'label': label
    })
    resolve (elem)
  })
}


function addElementStyle (elem, style, parent) {
    return new Promise((resolve) => {
      if (!style) return resolve (elem);
      elem.style({
          'shape': style.style,
          'border-width': 0,
          'text-border-width' : 0,
          'background-fit': 'cover',
          'background-opacity': (parent ? 0 : style.opacity),
          'text-opacity': 1,
          'text-outline-opacity' : 0,
          'text-background-opacity': 0,
          'text-border-opacity': 0,
          'border-opacity': 0,
          'selection-box-color': style.color,
          'background-color': style.color,
          'text-border-color': style.color,
          'text-outline-color': style.color,
          'text-background-color': style.color,
          'selection-box-border-width' : 0,
          'selection-box-opacity': 0,
          'padding' : style.padding
      });
      resolve (elem);
    })
}


function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


function addGraphElement(id, layout, parent) {
    return new Promise((resolve) => {
      id = id ? id : random(1, 100000).toString();
      cy.add({ group: "nodes",
                  selector: (parent ? "node" : "node:parent"),
                  layout: { name: (layout ? layout : null)},
                  data: {
                    id: id,
                    parent: ((parent && typeof(parent) != "boolean") ? parent.id() : null)
                  }
      });
      resolve(cy.getElementById(id));
    })
}


window.electronAPI.removeWidgetElementByClassName(async (_event, arg) => {

  let removedCollection = await getGraphElementsByClass(arg.class_name, id)
  removedCollection.forEach(element => {
    element.remove()
  })

})


window.electronAPI.removeWidgetElementByID(async (_event, arg) => {
  await removeGraphElementByID(arg)
})


function removeGraphElementByID (id) {
  return new Promise((resolve) => {
    cy.remove(cy.$('#'+id))
    resolve ();
  })
}


function getGraphElementsByName (name, class_name) {

  return new Promise((resolve) => {
    var collection = cy.collection();
    let count = cy.nodes().length
    cy.nodes().forEach(ele => {
      if ((!class_name && name === ele.data('name')) || (class_name && name === ele.data('name') && ele.hasClass(class_name)))
         collection = collection.union(ele);

      if (!--count) resolve (collection);
    })
  })
}


async function getGraphElementByName (name) {
  return new Promise((resolve) => {
    if (name) {
      let count = cy.nodes().length;
      cy.nodes().forEach(function(ele) {
        if (name === ele.data('name')) {
          return resolve (ele);
        }
        if (!--count) resolve ();
      })
    }
  })
}                         
                          
                          
function getGraphElementsByClass (class_name, id) {
  return new Promise((resolve) => {
    var collection = cy.collection();
    let count = cy.nodes().length
    cy.nodes().forEach(function(ele) {
      if ((ele.hasClass(class_name) && !id) || (ele.id() === id && ele.hasClass(class_name)))
         collection = collection.union(ele);

      if (!--count) resolve (collection);
    })
  })
}


function getGraphElementByID(id) {
  return cy.$('#'+id);
}


function addGraph(params) {
    return new Promise((resolve, reject) => {
        addGraphElement(params.id, params.layout, params.parent)
        .then(elem => addElementStyle(elem, params, params.parent))
        .then(elem => addElementLabel(elem, params.label))
        .then(elem => addElementName(elem, params.name))
        .then(elem => addElementClass(elem, params.class))
        .then(elem => addElementImage(elem, params.image))
        .then(elem => addElementSize(elem, params.size))
        .then(elem => addElementPosition(elem, params.pos))
        .then(elem => grabbableElement(elem, params.parent ? false : true))
        .then(elem => resolve(elem))
        .catch(err => reject(err))
    })
}


function getWidgets() {
  return new Promise((resolve) => {

    let tblPluginWidgets = {}
    let count = cy.nodes().length
    if (WidgetClasses.length === 0 || count === 0) resolve(tblPluginWidgets)
    
    WidgetClasses.forEach(classe => {
      tblPluginWidgets[classe] = []
    })

    cy.nodes().forEach(async ele => {
      let eleClass = ele.classes()[0] ? ele.classes()[0] : null;
      if (eleClass && WidgetClasses.includes(eleClass) && ele.isParent()) {
        let elem = {style: {}};
        elem.id = ele.id();
        let showValue = ele.data('showValue') ? ele.data('showValue') : false;
        let showStatus = ele.data('showStatus') ? ele.data('showStatus') : false;
        let showTitle = ele.data('showTitle') ? ele.data('showTitle') : false;
        if (showTitle === true) {
          let eleTitle = await getGraphElementByName(ele.id()+'_title');
          if (eleTitle) {
            elem.style.title = {};
            elem.style.title.pos = {x: eleTitle.position('x'), y: eleTitle.position('y')};
          }
        }
        if (showValue === true) {
          let eleValue = await getGraphElementByName(ele.id()+'_value')
          if (eleValue) {
            elem.style.value = {};
            elem.style.value.pos = {x: eleValue.position('x'), y: eleValue.position('y')};
          }
        }
        if (showStatus === true) {
          let eleStatus = await getGraphElementByName(ele.id()+'_status')
          if (eleStatus) {
            elem.style.status = {};
            elem.style.status.pos = {x: eleStatus.position('x'), y: eleStatus.position('y')};
          }
        }
        let eleImg = await getGraphElementByName(ele.id()+'_img')
        if (eleImg) {
          elem.style.image = {};
          elem.style.image.pos = {x: eleImg.position('x'), y: eleImg.position('y')};
        }

        tblPluginWidgets[eleClass].push(elem)
      }
      if (!--count) resolve(tblPluginWidgets)
    })
  })
}



window.electronAPI.createWidget(async (_event, params) => {

  var collection = cy.collection();
  let elems = await getGraphElementsByClass(params.widget.class)
  elems.forEach(ele =>{
    if (ele.data('name') === params.widget.id+'_node' || ele.data('name') === params.widget.id+'_title' || ele.data('name') === params.widget.id+'_value' || ele.data('name') === params.widget.id+'_status' || ele.data('name') === params.widget.id+'_img') {
      collection = collection.union(ele);
    }
  })

  cy.remove(collection)

  createWidget(params.plugin, params.widget, params.config)
  .then(async elem => {
      addOnClick (params.plugin, elem, params.config)
  })
  .catch (async err => {
      notification(await Lget("pluginWidgets", "createWidgetError", params.plugin , err), true);
  })

})
  

function createWidget (plugin, params, config) {
    return new Promise((resolve, reject) => {
      switch (params.type) {
        case 'button':
        case 'list':
          createListWidget(plugin, params, config)
          .then(child => {
              resolve(child);
          })
          .catch(err => {
            reject(err);
          })
          break;
        case 'string':
        case 'float':
          createFloatWidget(plugin, params, config)
          .then(child => {
            resolve(child);
          })
          .catch(err => {
            reject(err);
          })
          break;
      }
    });
}


function addTblWidgetClass (classe) {
  if (WidgetClasses.includes(classe)) return;
  WidgetClasses.push(classe)
}


window.electronAPI.initWidgets(async () => {
  try {
    let pluginWidgets = await window.electronAPI.getPluginWidgets();
    for (let a in pluginWidgets) {
      addTblWidgetClass(pluginWidgets[a].plugin)
      for (let i in pluginWidgets[a].widgets) {
          createWidget(pluginWidgets[a].plugin, pluginWidgets[a].widgets[i], pluginWidgets[a].Config)
          .then(async elem => {
              addOnClick (pluginWidgets[a].plugin, elem, pluginWidgets[a].Config)
          })
      }
    }  
    await window.electronAPI.readyToShow();
  } catch (err) {
    notification(await Lget("pluginWidgets", "searchWidgetError",err), true);
  }
})


window.electronAPI.newPluginWidgetInfo(async (_event, params) => {
  try {
    let elem = await getGraphElementByName(params.id+'_img');
    if (elem && elem.length > 0) await refreshPluginWidgetInfo(params.plugin, elem);
  } catch (err) {
    notification(await Lget("pluginWidgets", "searchWidgetError",err), true);
  }
})



async function refreshPluginWidgetInfo(plugin, elem) {

  try {
    let value = elem.parent().data('type') === 'button' ? elem.parent().data('last_value') : null;

    let infos = await window.electronAPI.refreshPluginWidgetInfo({plugin: plugin, periphId: elem.parent().id(), usage: elem.parent().data('usage'), value: value, type: elem.parent().data('type'), click: elem.parent().data('click_values'), dblclick: elem.parent().data('dblclick_values')})
    await addElementImage(elem, infos.img);

    let elemValue = await getGraphElementByName(elem.parent().id()+'_value')
    if (elemValue) {
      await addElementLabel(elemValue,
      {
        'text-wrap': infos.iswrap && infos.iswrap.sizing ? "wrap" : "none",
        'text-max-width': "200px",
        'text-justification': "center",
        valign: 'center',
        halign: 'center',
        text: infos.iswrap.value+(infos.unit ? ' '+infos.unit : ''),
        fontSize : elemValue.style('font-size'),
        fontColor : elemValue.style('color'),
        fontOutline : 0
      })
    }
    let elemStatus = await getGraphElementByName(elem.parent().id()+'_status')
    if (elemStatus) {
      await addElementLabelOnly(elemStatus, infos.status)
    }
    current_action = false
    
  } catch (err) {
    current_action = false;
    notification(await Lget("pluginWidgets", "refreshWidgetError", err), true);
  }

}


async function setMenuCommands (plugin, elem, dblclick_values, defaults, config, callback) {
  var count = 0
  for (let value in dblclick_values) {
    let command = {
      content: dblclick_values[value].description,
      select: () => {
          let val = elem.parent().data('type') === 'list' ? dblclick_values[value].value : dblclick_values[value]
          widget_action(plugin, elem, val, () => {
              if (menu) {
                  menu.destroy();
                  menu = null;
              }
              elem.parent().data('last_value', elem.parent().data('type') === 'button' ? val.description : value);
              setTimeout(async () => {
                await refreshPluginWidgetInfo(plugin, elem)
              }, (elem.parent().data('macro') === true) ? config.widget.latency_macro : config.widget.latency);
          })
      }
    }

    defaults.commands.push(command);
    if (++count === dblclick_values.length) callback(defaults);
  }
}



async function widget_action (plugin, elem, value, callback) {

  let type;
  switch (elem.parent().data('type')) {
  case 'list':
      type = elem.parent().data('macro') === true ? 'macro' : 'normal'
  case 'button':
      try {
        if (!type) type = 'button'; 


        await window.electronAPI.pluginWidgetAction({plugin: plugin, type: type, id: elem.parent().id(), value: value});
        elem.parent().data('last_value', type === 'button' ? value.description : value);
        if (callback) callback();
      } catch (err) {
        throw new Error(await Lget("pluginWidgets", "actionWidgetError", plugin, err));
      }
      break;
  default:
    if (callback) callback(false);
    break;
  }
}



function addCytoMenu (plugin, elem, config, dblclick_values) {

    let circular = elem.parent().data('circular') ? elem.parent().data('circular') : null;
    let defaults = {
        menuRadius: circular ? circular.radius : config.widget.menu.radius, 
        selector: 'node',
        commands: [],
        fillColor:  circular ? circular.fillcolor : config.widget.menu.fillColor, 
        activeFillColor: circular ? circular.activefillcolor : config.widget.menu.activeFillColor, 
        activePadding: 0, 
        indicatorSize: 18, 
        separatorWidth: 0, 
        spotlightPadding: 2,
        minSpotlightRadius: 12,
        maxSpotlightRadius: 38, 
        openMenuEvents: 'dbltap', 
        itemColor: circular ? circular.fontcolor : config.widget.menu.textColor, 
        itemTextShadowColor: 'transparent', 
        zIndex: 9999, 
        atMouse: false 
    }

    setMenuCommands (plugin, elem, dblclick_values, defaults, config, (defaults) => {
        menu = cy.cxtmenu(defaults);
        const cxtmenus = document.querySelectorAll('.cxtmenu')
        cxtmenus.forEach(cxtmenu => {
          cxtmenu.style.fontSize = circular ? circular.fontsize+"px" : config.widget.menu.font+"px";
        })
        destroy_menu(config);
    })

}


function destroy_menu(config) {

  setTimeout(async () => {
    if (menu) {
      if (menu) menu.destroy();
      menu = null
      current_action = false
    }
  }, config.widget.menu.timeOut)

}


function ctxtap (plugin, widget, config) {
  if (current_action === true) return;
  if (menu) {
    menu.destroy();
    menu = null;
  }

  current_action = true;
  if (widget.parent().data('dblclick_values').length === 0 && widget.parent().data('click_values').length === 0) {
    setTimeout(async () => {
        await refreshPluginWidgetInfo(plugin, widget)
    }, (widget.parent().data('macro') === true) ? config.widget.latency_macro : config.widget.latency);
  } else {
      onOneClick (plugin, config, widget)
  } 
}


async function ctxdbltap (plugin, widget, config) {
  if (current_action === true) return
  if (menu) {
    menu.destroy();
    menu = null;
  }
  current_action = true
  addCytoMenu(plugin, widget, config, widget.parent().data('dblclick_values'))
}



async function onOneClick (plugin, config, widget) {

  try {
    let value;
    if (widget.parent().data('type') !== 'button') {
      value = await window.electronAPI.getNewValuePluginWidgetById({plugin: plugin, periphId: widget.parent().id(), currentValue: widget.parent().data('click_values')})
      if (value.length === 0) throw new Error(await Lget("pluginWidgets", "getValueWidgetError"))
      value = value[0].value;
    } else {
      let last_value = widget.parent().data('last_value');
      let clics = widget.parent().data('click_values');
      value = (clics.length > 1 
         ? clics.filter(clic => clic.description !== last_value)
         : clics)[0];
    }

    widget_action(plugin, widget, value, () => {
      setTimeout(async () => {
          await refreshPluginWidgetInfo(plugin, widget)
      }, (widget.parent().data('macro') == true) ? config.widget.latency_macro : config.widget.latency);

    });
  } catch (err) {
    notification (err, true)
    current_action = false
  }

}


function onClick (elem, callback) {
    return new Promise((resolve) => {
        elem.on('onetap', () => {
            callback(elem);
        });
        resolve (elem);
    })
}


function onDblClick (elem, callback) {
  return new Promise((resolve) => {
      elem.on('dbltap', () => {
          callback(elem);
      });
      resolve (elem);
  })
}


function addOnClick (plugin, widget, config) {

      switch (widget.parent().data('type')) {
        case 'list':
        case 'button':
            if (widget.parent().data('click_values').length > 0 || (widget.parent().data('click_values').length === 0 && widget.parent().data('dblclick_values').length === 0))
              onClick(widget, () => {
                  ctxtap(plugin, widget, config)
              })
            if (widget.parent().data('dblclick_values').length > 0)
              onDblClick(widget, () => {
                ctxdbltap(plugin, widget, config)
              })
          break;
        case 'string':
        case 'float':
            onClick(widget, () => {
              setTimeout(async () => {
                  await refreshPluginWidgetInfo(plugin, widget)
              }, config.widget.latency);
            })
          break;
      }

}


window.electronAPI.deleteWidget(async (_event, params) => {
  var collection = cy.collection();
  let elems = await getGraphElementsByClass(params.class)
  elems.forEach(function(ele) {
    if (ele.data('name') == params.id+'_node' || ele.data('name') == params.id+'_title' || ele.data('name') == params.id+'_value' || ele.data('name') == params.id+'_status' || ele.data('name') == params.id+'_img') {
      collection = collection.union(ele);
    }
  })
  cy.remove(collection)
})


function createListWidget (plugin, params, config) {

    return new Promise((resolve, reject) => {
      let topParent;
      addGraph({
        id: params.id,
        layout: plugin,
        style: "round-rectangle",
        name: params.id+'_node',
        class: params.class,
        color: params.style.color ? params.style.color : config.widget.color,
        opacity: params.style.opacity ? params.style.opacity : config.widget.opacity,
        fontOutline : 0,
        padding: params.style.borderwidth ? params.style.borderwidth : config.widget.borderwidth, 
        })
      .then(elem => {
        topParent = elem;
        topParent.data('type', params.type);
        topParent.data('click_values', params.click_values);
        topParent.data('dblclick_values', params.dblclick_values);
        topParent.data('usage', params.usage);
        topParent.data('macro', params.macro);
        topParent.data('circular', params.style.circular ? params.style.circular : []);
        if (params.type === 'button') topParent.data('last_value', params.last_value);
        
        return new Promise((resolve) => {
          if (params.style.title && params.style.title.display === true && params.type !== 'button') {
            topParent.data('showTitle', true);
            addGraph({
              parent: topParent,
              layout: plugin,
              style: "round-rectangle",
              label: {
                  text: params.title,
                  valign: 'center',
                  halign: 'center',
                  "text-justification": "center",
                  fontSize : params.style.title.fontsize ? params.style.title.fontsize : config.widget.font.title,
                  fontColor : params.style.textcolor ? params.style.textcolor : config.widget.textColor,
                  fontOutline : 0
              },
              color: params.style.color ? params.style.color : config.widget.color,
              opacity: params.style.opacity ? params.style.opacity : config.widget.opacity,
              padding: 0,
              name: params.id+'_title',
              class: params.class,
              size: {
                  width: params.style.title.size.width,
                  height: params.style.title.size.height
              },
              pos: {
                  x: params.style.title.pos.x,
                  y: params.style.title.pos.y
              }
            })
            .then(() => resolve())
          } else {
            topParent.data('showTitle', false);
            resolve()
          }
        })
      })
      .then(() => {
        return new Promise((resolve) => {
          if (params.style.value && params.style.value.display === true) {
            topParent.data('showValue', true);
            addGraph({
                  parent: topParent,
                  layout: plugin,
                  style: "round-rectangle",
                  label: {
                      'text-wrap': (params.isWrap.sizing) ? "wrap" : "none",
                      'text-max-width': "200px",
                      'text-justification': "center",
                      text: params.isWrap.value,
                      valign: 'center',
                      halign: 'center',
                      fontSize : params.style.value.fontsize ? params.style.value.fontsize : config.widget.font.value,
                      fontColor : params.style.textColor ? params.style.textcolor : config.widget.textcolor,
                      fontOutline : 0
                  },
                  color: params.style.color ? params.style.color : config.widget.color,
                  opacity: params.style.opacity ? params.style.opacity : config.widget.opacity,
                  padding: 0,
                  name: params.id+'_value',
                  class: params.class,
                  pos: {
                      x: params.style.value.pos.x,
                      y: params.style.value.pos.y
                  },
                  size: {
                      width: params.style.value.size.width,
                      height: params.style.value.size.height
                  }
              })
            .then(() => resolve())
          } else {
            topParent.data('showValue', false);
            resolve()
          }
        })
      })
      .then(() => {
        return new Promise((resolve) => {
          if (params.style.status && params.style.status.display === true) {
            topParent.data('showStatus', true);
            addGraph({
                    parent: topParent,
                    layout: plugin,
                    style: "round-rectangle",
                    label: {
                    text: params.status,
                    valign: 'center',
                    halign: 'center',
                    fontSize : params.style.status.fontsize ? params.style.status.fontsize : config.widget.font.status,
                    fontColor : params.style.textcolor ? params.style.textcolor : config.widget.textColor,
                    fontOutline : 0
                },
                color: params.style.color ? params.style.color : config.widget.color,
                opacity: params.style.opacity ? params.style.opacity : config.widget.opacity,
                padding: 0,
                name: params.id+'_status',
                class: params.class,
                pos: {
                    x: params.style.status.pos.x,
                    y: params.style.status.pos.y
                },
                size: {
                    width: params.style.status.size.width,
                    height: params.style.status.size.height
                }
            })
            .then(() => resolve())
          } else {
            topParent.data('showStatus', false);
            resolve()
          }
        })
      })
      .then(() => {
          return new Promise((resolve) => {
            addGraph({
                parent: topParent,
                layout: plugin,
                name:  params.id+'_img',
                class: params.class,
                label: params.style.title && params.style.title.display === true && params.type === 'button' ? {
                  text: params.title,
                  valign: params.style.title.position ? params.style.title.position : config.widget.font.position,
                  halign: 'center',
                  fontSize : params.style.title.fontsize ? params.style.title.fontsize : config.widget.font.title,
                  fontColor : params.style.textcolor ? params.style.textcolor : config.widget.textColor,
                  fontOutline : 0
                } : "",
                image: params.style.image.path,
                color: params.style.color ? params.style.color : config.widget.color,
                padding: 0,
                size: {
                    width: params.style.image.size.width,
                    height: params.style.image.size.height
                },
                pos: {
                    x: params.style.image.pos.x,
                    y: params.style.image.pos.y
                }
            })
            .then(child => {
              if (params.style.title.display === true && params.type === 'button') {
                topParent.data('showTitle', true)
              } else if (params.style.title.display === false && params.type === 'button') {
                topParent.data('showTitle', false)
              }
              resolve(child)
            })
          })
      })
      .then(child => resolve(child))
      .catch(err => {
            reject(err);
      })
  })
}


function createFloatWidget (plugin, params, config) {

    return new Promise((resolve, reject) => {
      let topParent;
      addGraph({
        id: params.id,
        layout: plugin,
        style: "round-rectangle",
        name: params.id+'_node',
        class: params.class,
        color: params.style.color ? params.style.color : config.widget.color,
        opacity: params.style.opacity ? params.style.opacity : config.widget.opacity,
        padding: params.style.borderWidth ? params.style.borderWidth : config.widget.borderWidth
        })
      .then(elem => {
        topParent = elem;
        topParent.data('type', params.type);
        topParent.data('usage', params.usage);
        topParent.data('showValue', params.showValue);

        return new Promise((resolve) => {
          if (params.style.value && params.style.value.display === true) {
            topParent.data('showValue', true);
            addGraph({ 
              parent: topParent,
              layout: plugin,
              style: "round-rectangle",
              label: {
                  text: params.value+(params.unit ? ' '+params.unit : ''),
                  valign: 'center',
                  halign: 'center',
                  fontSize : params.style.value.fontsize ? params.style.value.fontsize : config.widget.font.value,
                  fontColor : params.style.textColor ? params.style.textColor : config.widget.textColor,
                  fontOutline : 0
              },
              color: params.style.color ? params.style.color : config.widget.color,
              opacity: params.style.opacity ? params.style.opacity : config.widget.opacity,
              padding: 0,
              name: params.id+'_value',
              class: params.class,
              pos: {
                  x: params.style.value.pos.x,
                  y: params.style.value.pos.y
              },
              size: {
                  width: params.style.value.size.width,
                  height: params.style.value.size.height
              }
              })
              .then(() => resolve())
          } else {
              topParent.data('showValue', false);
              resolve()
          }
        })
      })
      .then(() => {
          return new Promise((resolve) => {
            addGraph({       
                parent: topParent,
                layout: plugin,
                name:  params.id+'_img',
                class: params.class,
                image: params.style.image.path,
                padding: 0,
                size: {
                    width: params.style.image.size.width,
                    height: params.style.image.size.height
                },
                pos: {
                    x: params.style.image.pos.x,
                    y: params.style.image.pos.y
                }
            })
            .then(child => {
                resolve(child);
            })
          })
      })
      .then(child => resolve(child))
      .catch(err => {
        reject(err);
      })
    })
}
