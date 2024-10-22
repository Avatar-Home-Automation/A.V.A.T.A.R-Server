let interfaceProperty;
let nodesProperty = [];
let cy;
let tooltips = [];


window.electronAPI.toAppReload(() => {
  close(false);
})

window.electronAPI.toAppExit(() => {
  window.dispatchEvent(new Event ('beforeunload'));
})

window.onbeforeunload = async (e) => {
  const response = await window.electronAPI.isCloseApp();
  if (response === 0) close(true);
  e.returnValue = false;
}


window.electronAPI.showRestartBox (async (_event, value) => {
  document.getElementById('dialog-notification-title').innerHTML = value.title ? value.title : "";
  document.getElementById('dialog-notification-message').innerHTML = value.detail ? value.detail : "";
  showMsgBox();
})


window.electronAPI.propertiesChanged (async (_event) => {
  document.getElementById('dialog-notification-title').innerHTML = await Lget("mainInterface", "notiftitle");
  document.getElementById('dialog-notification-message').innerHTML = await Lget("mainInterface", "notifmessage");
  showMsgBox();
})


function showMsgBox() {

  document.getElementById('agree').addEventListener('click', () => {
    document.getElementById('dialog-notification').close();
    close(false);
  });
  document.getElementById('disagree').addEventListener('click', () => {
     document.getElementById('dialog-notification').close();
  });
  document.getElementById('notification').click();
}


function getfontSize () {
  let txt = document.getElementById('txt')
  return parseInt(window.getComputedStyle(txt, null).getPropertyValue('font-size'))
}

document.getElementById('police-add').addEventListener('mouseover', async (event) => {
  tooltipConsoleShow (event, 'police-add', await Lget("mainInterface", "largeFont"))
})

document.getElementById('police-less').addEventListener('mouseover', async (event) => {
  tooltipConsoleShow (event, 'police-less', await Lget("mainInterface", "lessFont"))
})

document.getElementById('copy_msg').addEventListener('mouseover', async (event) => {
  tooltipConsoleShow (event, 'copy_msg', await Lget("mainInterface", "copyConsoleMsg"))
})  

document.getElementById('clean_msg').addEventListener('mouseover', async (event) => {
  tooltipConsoleShow (event, 'clean_msg', await Lget("mainInterface", "delConsole"))
})


function tooltipConsoleShow(event, type, txt) {

  $('#'+type).qtip({
    overwrite: false, 
    content: {text: txt},
    position: {
      my: 'center left',
      at:  'center right',
    },
    show: {
        event: event.type, 
        ready: true 
    },
    style: {
      classes: "qtip-red qtip-rounded",
      tip: {
        width: 8,
        height: 8
      }
    }
  }, event);
}


document.getElementById('police-add').addEventListener('click', async () => {
  let fontSize = await getfontSize();
  let txt = document.getElementById('txt')
  txt.style.fontSize = (parseInt(fontSize) + 1) + 'px';
});

document.getElementById('police-less').addEventListener('click', async () => {
  let fontSize = await getfontSize();
  let txt = document.getElementById('txt')
  if (fontSize > 6) txt.style.fontSize = (parseInt(fontSize) - 1) + 'px';
});

document.getElementById('clean_msg').addEventListener('click', () => {
  var infomsg = document.getElementById('txt');
  infomsg.innerHTML = "";
})


let btn = document.getElementById('copy_msg');
let clipboard = new ClipboardJS(btn);
clipboard.on('success', async (e) => {
  const isEmpty = await Lget("mainInterface", "emptyConsole")
  if (e.text.indexOf('warn: '+isEmpty) !== -1) {
    let txt = RegExp('warn: '+isEmpty,'gm');
    e.text = e.text.replace(txt,'');
    e.text = e.text.replace(/(\r\n|\n|\r)/gm, '');
  }
  if (e.text === "")
    infoLogger('warn@@@'+isEmpty)
  else {
    const copied = await Lget("mainInterface", "copyConsole")
    infoLogger('info@@@'+copied)
  }
})
.on('error', async (e) => {
    const errCopy = await Lget("mainInterface", "errorConsole")
    infoLogger('error@@@'+errCopy+": "+e)
});


async function close(flag) {
  let infos = {};
  let nodesInfo = await getNodes();
  let widgets = await getWidgets();
  infos.widgets = widgets;
  infos.nodes = nodesInfo;
  infos.main = {
    width: window.outerWidth,
    height: window.outerHeight
  };
  flag 
    ? await window.electronAPI.closeApp(infos)
    : await window.electronAPI.reloadApp(infos);
}


function getNodes() {
  return new Promise((resolve) => {
    let nodes = []
    cy.nodes().forEach((ele) => {
      if (ele.hasClass('classic') || ele.hasClass('mobile') || ele.hasClass('virtual')) {
        let id = ele.id()
        let style = {
           size : {
              'height': ele.height(),
              'width' : ele.width()
            },
            position : {
              'x' : ele.renderedPosition('x'),
              'y' : ele.renderedPosition('y')
            }
        }
        nodes.push({node: id, json: style})
      }
    })
    resolve (nodes)
  })
}

async function getNodesByClass () {
    let collection = cy.collection();
    cy.nodes().forEach(ele => {
      if (ele.hasClass('classic')|| ele.hasClass('mobile') ||  ele.hasClass('virtual'))
         collection = collection.union(ele);
    });
    return collection;
}


function notification (msg, err) {
  let notif = document.getElementById('nonode');
  notif.style.color = (err) ? 'red' : 'rgba(255, 255, 255, 0.9)';
  if (notif.opened === true) {
    notif.innerHTML = notif.innerHTML+"<br>"+msg;
  } else {
    notif.innerHTML = msg;
    notif.opened = true;
  }
}


function infoLogger (value) {
  const logger = document.getElementById('txt')
  let type = value.split('@@@')[0]
  let msg = value.split('@@@')[1]

  if (typeof(msg) === 'object') msg = JSON.stringify(msg)
  switch (type ) {
    case 'error':
      msg = "<b>"+type+":</b> <font color='red'>"+msg+"</font>"
      break;
    case 'warn':
      msg = "<b>"+type+":</b> <font color='orange'>"+msg+"</font>"
      break;
    case 'info':
      msg = "<font color='"+interfaceProperty.console.textColor+"'><b>"+type+":</b> <font color='"+interfaceProperty.console.textColor+"'>"+msg+"</font>"
      break;
    case 'infoGreen':
      msg = "<b>info:</b> <font color='green'>"+msg+"</font>"
      break;
    case 'infoOrange':
      msg = "<b>info:</b> <font color='orange'>"+msg+"</font>"
  }

  if (logger.innerHTML != "") {
    let reg = new RegExp("info","g")
    if (logger.innerHTML.match(reg) == 100) logger.innerHTML = ""
  }

  logger.innerHTML = logger.innerHTML != "" ? logger.innerHTML+"<br>"+msg : msg
  logger.scrollTop = logger.scrollHeight
}


window.electronAPI.onUpdateLogger((_event, value) => {
  infoLogger(value)
})

window.electronAPI.onUpdateLoggerConsole((_event, value) => {
  for (let i in value) {
    console.log(value[i])
  }
})


async function getTooltip(id, sens) {
  for (let i=0; i < tooltips.length; i++) {
    if (tooltips[i].id === id && tooltips[i].sens === sens) {
      return true
    }
  }
}


async function clearTooltip (id, sens) {
  for (let i=0; i < tooltips.length; i++) {
    if (tooltips[i].id === id && tooltips[i].sens === sens) {
      tooltips[i].api.destroy(true)
      if (tooltips.length === 1) tooltips = []
    }
  }
}


window.electronAPI.tooltipSpeak(async (_event, values) => {
  tooltipShow (values)
})


async function tooltipShow (values) {

  let id = values.client.reformat();
  let ele = cy.$('#'+id);
  if (!ele) return error(Lget("mainInterface", "nonode"), id);

  var handler = function (e) {
    window.removeEventListener('showTooltip'+values.type, handler, false);
  }
  window.addEventListener('showTooltip'+values.type, handler, false);

  let classes = values.type === 'source' ? `${interfaceProperty.infobulle.source.color} ${interfaceProperty.infobulle.source.class}` : `${interfaceProperty.infobulle.target.color} ${interfaceProperty.infobulle.target.class}`
  ele.qtip({
    content: {text: values.tts},
    position: {
      at: ((values.type === 'source') ? 'top center' :  'bottom center'),
      my: ((values.type === 'source') ? 'bottom center' : 'top center')
    },
    hide: {
      inactive: values.type === 'source' ? interfaceProperty.infobulle.source.delay : interfaceProperty.infobulle.target.delay
    },
    show: {
      event: 'showTooltip'+values.type
    },
    style: {
      classes: classes,
      tip: {
        width: 8,
        height: 8
      }
    },
    events: {
      show: (event, api) => {
       if (getTooltip(id, values.type)) clearTooltip(id, values.type)
       tooltips.push({id: id, sens: values.type, api: api});
      },
      hide: (event, api) => {
        clearTooltip(id, values.type)
      }
    }
  })

  ele.emit('showTooltip'+values.type)

}


window.electronAPI.setInfoClient(async (_event, values) => {

  let id = values.client.reformat();
  let ele = cy.$('#'+id);
  if (!ele) return error(Lget("mainInterface", "nonode"), id);
  let loopback = values.infos.loopback 
  ? await Lget("clientInfo", "port", values.infos.loopback) 
  : await Lget("clientInfo", "noport") ;

  ele.qtip({
    overwrite: false, 
    content: {text:  
      await Lget("clientInfo", "id", values.infos.id)+'<br>'+
      await Lget("clientInfo", "name", values.infos.name)+'<br>'+
      await Lget("clientInfo", "language", values.infos.language)+'<br>'+
      await Lget("clientInfo", "ip", values.infos.ip)+'<br>'+
      loopback+'<br>'+
      (values.infos.serverSpeak === true ? await Lget("clientInfo", "serverSpeakYes") : await Lget("clientInfo", "serverSpeakNo"))+'<br>'+
      (values.infos.loopMode === true ? await Lget("clientInfo", "loopModeYes") : await Lget("clientInfo", "loopModeNo"))+'<br>'+
      (values.infos.mobile === true ? await Lget("clientInfo", "mobileYes"): await Lget("clientInfo", "mobileNo"))
    },
    position: {
      my: 'center left',
      at:  'center right'
    },
    show: {
      event: 'showTooltip'+values.id
    },
    style: {
      classes: 'qtip-blue qtip-youtube'
    }
  });

  ele.emit('showTooltip'+values.id);
 
})



window.electronAPI.onUpdateProperties(async (_event, property) => {
 
  interfaceProperty = property.interface;
  let collection = await getNodesByClass();
  collection.forEach((ele) => {
      ele.style ({
        'height': interfaceProperty.nodes.size,
        'width': interfaceProperty.nodes.size,
        'text-outline-width': interfaceProperty.nodes.fontoutline,
        'text-outline-color': interfaceProperty.nodes.fontbordercolor,
        "text-valign": interfaceProperty.nodes.textvalign,
        "text-halign": interfaceProperty.nodes.texthalign,
        "text-margin-y": interfaceProperty.nodes.textmarginv,
        "text-margin-x": interfaceProperty.nodes.textmarginh,
        'font-size': interfaceProperty.nodes.fontsize,
        'color': interfaceProperty.nodes.fontcolor,
        'background-fit': 'cover',
        'background-color': '#999999',
        'selection-box-opacity': 0,
        'selection-box-border-color': 'red',
        'border-color': 'red',
        'border-width': 0,
        'border-opacity': 0,
        'padding': "0px"
      });
      if (ele.hasClass("classic") && ele.data('id') === 'Server')
        ele.style ({
          'label': (!interfaceProperty.nodes.name) ? '' : ele.data('name'),
        });
      if (ele.hasClass("classic") && ele.data('id') !== 'Server')
          ele.style ({
            'label': (!interfaceProperty.nodes.name) ? '' : ele.data('name'),
            'border-color': interfaceProperty.edges.classic.color,
            'border-width': interfaceProperty.edges.classic.width
          });
      if (ele.hasClass("virtual"))
        ele.style ({
          'label': (!interfaceProperty.nodes.name) ? '' : ele.data('name'),
          'border-color': interfaceProperty.edges.virtual.color,
          'border-width': interfaceProperty.edges.virtual.width
        });
      if (ele.hasClass("mobile"))
        ele.style ({
          'label': (!interfaceProperty.nodes.name) ? '' : ele.data('name'),
          'border-color': interfaceProperty.edges.mobile.color,
          'border-width': interfaceProperty.edges.mobile.width
        });
    });
    cy.edges().forEach((ele) => {
      if (ele.hasClass("classic") && ele.data('id') !== 'Server')
          ele.style ({
            'line-color': interfaceProperty.edges.classic.color,
            'width': interfaceProperty.edges.classic.width
          });
      if (ele.hasClass("virtual"))
        ele.style ({
          'line-color': interfaceProperty.edges.virtual.color,
          'width': interfaceProperty.edges.virtual.width
        });
      if (ele.hasClass("mobile")) {
          ele.style ({
            'line-color': interfaceProperty.edges.mobile.color,
            'width': interfaceProperty.edges.mobile.width
          });
        }
    });

    setBackground();
    await tooltipShow ({client: "Server", tts: "Here coming Tom!", type: 'target'})
    await tooltipShow ({client: "Server", tts: "Painting Unicorns", type: 'source'})

})


async function setCY (){

  let documentCY = document.getElementById('cy');
  cy = cytoscape({
    container: documentCY,
    boxSelectionEnabled: false,
    autounselectify: false,
    zoomingEnabled: false,
    userZoomingEnabled: false,
    userPanningEnabled: false,
    zoom: 1,
    pan: { x: 0, y: 0 },
    pixelRatio: 'auto',
    style: cytoscape.stylesheet()
        .selector('node')
        .css({
          'height': interfaceProperty.nodes.size,
          'width': interfaceProperty.nodes.size,
          'text-outline-width': interfaceProperty.nodes.fontoutline,
          'text-outline-color': interfaceProperty.nodes.fontbordercolor,
          "text-valign": interfaceProperty.nodes.textvalign,
          "text-halign": interfaceProperty.nodes.texthalign,
          "text-margin-y": interfaceProperty.nodes.textmarginv,
          "text-margin-x": interfaceProperty.nodes.textmarginh,
          'font-size': interfaceProperty.nodes.fontsize,
          'color': interfaceProperty.nodes.fontcolor,
          'background-fit': 'cover',
          'background-color': '#999999',
          'selection-box-opacity': 0,
          'selection-box-border-color': 'red',
          'border-color': 'red',
          'border-width': 0,
          'border-opacity': 0,
          'padding': "0px"
        })
        .selector('edge')
        .css({
          'curve-style': 'haystack',
          'haystack-radius': 0,
          'width': interfaceProperty.edges.classic.width,
          'line-color': interfaceProperty.edges.classic.color
        })
  });

  // Add Server node
  serverName = await Lget("mainInterface", "serverName");
  addNode('Server', serverName, "classic");
}



window.electronAPI.setNodeBackground(async (_event, values) => {
  var s = cy.$('#'+values.client);
  let image = new URL(values.file);
  style = {
    'background-image': image
  };
  s.style(style);
})


function ImageExist(url) {
  return new Promise((resolve) => {
    let test = new Image()
  	test.onload = () => { resolve (true) }
  	test.onerror = () => { console.clear(); resolve (false) }
    test.src = url
  })
}


async function addNode(id, name, type, callback) {

  if (cy) {
    cy.add(
        {
          group: "nodes",
          data: { id: id, name: name }
        }
      );

      let style;
      for (let i in nodesProperty) {
        if (nodesProperty[i][id]) {
          style = nodesProperty[i][id].properties
          break
        }
      }
      let x, y;
      if (!style) {
        x = (window.innerWidth / 2);
        y = (window.innerHeight / 2);
        if (id !== 'Server') {
          notification(await Lget("mainInterface", "clientLocation", name));
        } else {
          notification(await Lget("mainInterface", "serverLocation", name));
        }
      } else {
        x = style.position.x;
        y = style.position.y;
      }
      style = {node: {}};

      let fileName = (window.location.href).substring(0, (window.location.href).indexOf('index.html'))+"../images/rooms/"+id+".png"
      let flag = await ImageExist(fileName)
      style.node['background-image'] = (flag === true) ? "url('../images/rooms/"+id+".png')" : "url('../images/rooms/default.png')";

      let s = cy.$('#'+id);
      s.style (style.node);
      s.renderedPosition('x', x);
      s.renderedPosition('y', y);

      if (interfaceProperty.nodes.name)
        s.style({
          label: name
        })
      s.addClass(type);

      // Menu Contextuel on right click
      s.on('tap', async (evt) => {
          x = evt.target.renderedPosition('x');
          y = evt.target.renderedPosition('y');
          await window.electronAPI.showMenu({id: evt.target.id(), type: type, name: evt.target.data('name'), pos: {x: x, y: y}})
      });

      // virtual client(s)
      if (id !== 'Server') {
        let virtualClients = await window.electronAPI.getVirtualClients(name)
        if (virtualClients.length > 0) {
          addVirtualNodes(id, virtualClients, 0, addVirtualNodes, callback);
        } else {
          if (callback) callback();
        }
      } else if (callback) return callback();
  }
}



function addVirtualNodes (source, virtualClients, pos, callback, next) {
  if (pos == virtualClients.length) return (next) ? next() : null;
  let id = virtualClients[pos].reformat();
  addNode(id, virtualClients[pos], "virtual", () => {
      addEdge(source, id, "virtual", () => {
          setEdgeColor(source, id, "virtual", () => {
              callback(source, virtualClients, ++pos, callback, next);
          });
      });
  });
}



function addEdge(source, target, type, callback) {
  if (cy) {
    cy.add(
      { group: "edges",
         data: {
           id: source+"-"+target,
           source: source,
           target: target
         }
      }
    );
    cy.$('#'+source+"-"+target).addClass(type);
    if (callback) callback();
  }
}


function setEdgeColor (source, target, type, callback) {

  var style = interfaceProperty.edges[type];
  if (cy) {
    var s = cy.$("#"+source+"-"+target);
    s.style ({
      'line-color': style.color,
      'width': style.width
    });

    if (target != "Server")
      setNodeColor(target, style, callback);
  }
}


function setNodeColor (target, style, callback) {
  if (cy) {
    var s = cy.$("#"+target);
    s.style ({
      'border-color': style.color,
      'border-width': style.width,
      'border-opacity': 1
    });
    if (callback) callback();
  }
}


window.electronAPI.addClientNode((_event, node) => {
  addNode(node.id, node.name, node.type, () => {
    addEdge("Server", node.id, node.type, () => {
        setEdgeColor ("Server", node.id, node.type);
    })
  })
})


function removeVirtualClients(virtualClients) {
  for (let i in virtualClients) {
      let id = virtualClients[i].reformat();
      let j = cy.$("#"+id);
      cy.remove(j);
    }
}


window.electronAPI.removeClientNode(async (_event, name) => {

  if (!name) return;

  let virtualClients = await window.electronAPI.getVirtualClients(name)
  if (virtualClients.length > 0) removeVirtualClients(virtualClients)

  name = name.reformat();
  let j = cy.$("#"+name);
  cy.remove(j);
})


function setBackground () {
  document.body.style.margin = 0;
  document.body.style.padding = 0;
  interfaceProperty.screen.background = interfaceProperty.screen.background.replaceAll('\\', '/');
  document.body.style.background = "url('"+interfaceProperty.screen.background+"') no-repeat center fixed";
  document.body.style["background-size"] = "cover";

  document.getElementById('console').style.background = interfaceProperty.console.color
  document.getElementById('console').style["border-color"] = interfaceProperty.console.color
  document.getElementById('console').style.opacity = interfaceProperty.console.opacity
  
  document.getElementById('open_console').style.background = interfaceProperty.console.color
  document.getElementById('open_console').style["border-color"] = interfaceProperty.console.color
  document.getElementById('open_console').style["--light-accent-color"] = interfaceProperty.console.color
  document.getElementById('open_console').style["color"] = interfaceProperty.console.textColor
  document.getElementById('open_console').style["font-weight"] = (interfaceProperty.console.textBold === true) ? "bold" : "normal"
 
  document.getElementById('close_console').style.background = interfaceProperty.console.color
  document.getElementById('close_console').style["border-color"] = interfaceProperty.console.color
  document.getElementById('close_console').style["--light-accent-color"] = interfaceProperty.console.color
  document.getElementById('close_console').style["color"] = interfaceProperty.console.textColor
  document.getElementById('close_console').style["font-weight"] = (interfaceProperty.console.textBold === true) ? "bold" : "normal"

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


async function setLangTargets() {
  let textConsole = interfaceProperty.console.textBold === true ? "<b>"+await Lget("mainInterface", "console")+"</b>" : await Lget("mainInterface", "console")
  document.getElementById('open_console').innerHTML = textConsole
  document.getElementById('close_console').innerHTML = textConsole
  document.getElementById('restart').innerHTML = await Lget("mainInterface", "restart")
  document.getElementById('later').innerHTML = await Lget("mainInterface", "later")
}


window.electronAPI.onInitApp((_event, arg) => {
  interfaceProperty = arg.interface;
  nodesProperty = arg.nodes;
  setBackground();
  setLangTargets();
  setCY();
})


window.electronAPI.newVersion(async (_event, version) => {

  const signs = document.querySelectorAll('x-sign');
  const randomIn = (min, max) => (
    Math.floor(Math.random() * (max - min + 1) + min)
  )

  const mixupInterval = el => {
    const ms = randomIn(2000, 4000)
    el.style.setProperty('--interval', `${ms}ms`)
  }

  signs.forEach(el => {
    mixupInterval(el)
    el.addEventListener('webkitAnimationIteration', () => {
      mixupInterval(el)
    })
  })

  const msg = await Lget("mainInterface", "newVersion", version);
  document.getElementById('newVersionLabel').innerHTML = msg;
  document.getElementById('newVersionLabel').onclick = async () => {
    const result = await window.electronAPI.setNewVersion(version);
    if (result === true) {
      document.getElementById('newVersion').style.display = "none";
      document.getElementById('dialog-notification-title').innerHTML = await Lget("mainInterface", "notiftitle");
      document.getElementById('dialog-notification-message').innerHTML = await Lget("mainInterface", "notifmessage");
      showMsgBox();
    }
  };
  infoLogger('info@@@'+msg);
  document.getElementById('newVersion').style.display = "block";
})


String.prototype.reformat = function(){
    var accent = [
        /[\300-\306]/g, /[\340-\346]/g, // A, a
        /[\310-\313]/g, /[\350-\353]/g, // E, e
        /[\314-\317]/g, /[\354-\357]/g, // I, i
        /[\322-\330]/g, /[\362-\370]/g, // O, o
        /[\331-\334]/g, /[\371-\374]/g, // U, u
        /[\321]/g, /[\361]/g, // N, n
        /[\307]/g, /[\347]/g, // C, c
        / /g, /'/g,
        /"/g
    ];
    var noaccent = ['A','a','E','e','I','i','O','o','U','u','N','n','C','c','_','_','_'];

    var str = this;
    for(var i = 0; i < accent.length; i++){
        str = str.replace(accent[i], noaccent[i]);
    }

    return str;
}
