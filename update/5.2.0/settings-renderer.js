let interfaceProperties
let appProperties
let BCP47
let platform

document.body.addEventListener('click', removeClient, false)

window.onbeforeunload = async (e) => {
  e.returnValue = false;
  window.electronAPI.quitSettings(true)
}


async function removeClient(event) {

  let found = 0;
  let xMenus = document.getElementById("again-list").childNodes;
  for (var i = 0; found === 0 && i < xMenus.length; i++) {
      if (event.target.innerHTML === xMenus[i].value) {
          document.getElementById('label-delete-again-list').innerHTML = await Lget("settings", "remove", xMenus[i].value)
          found = 1
          break;
      }
  }

  xMenus = document.getElementById("norule-list").childNodes;
  for (var i = 0; found === 0 && i < xMenus.length; i++) {
      if (event.target.innerHTML === xMenus[i].value) {
          document.getElementById('label-delete-norule-list').innerHTML = await Lget("settings", "remove", xMenus[i].value)
          found = 2
          break;
      }
  }

  if (found === 0) {
    document.getElementById('label-delete-norule-list').innerHTML = await Lget("settings", "removeall")
    document.getElementById('label-delete-again-list').innerHTML = await Lget("settings", "removeall")     
  } else if (found === 1) {
    document.getElementById('label-delete-norule-list').innerHTML = await Lget("settings", "removeall")
  } else {
    document.getElementById('label-delete-again-list').innerHTML = await Lget("settings", "removeall")     
  }
}


document.getElementById('delete-again-list').addEventListener('click', async () => {
  let xMenus = document.getElementById("again-list").childNodes;
  let remove = document.getElementById("label-delete-again-list").innerHTML;
  await deleteListItem(xMenus, remove);
})


document.getElementById('delete-norule-list').addEventListener('click', async () => {
  let xMenus = document.getElementById("norule-list").childNodes;
  let remove = document.getElementById("label-delete-norule-list").innerHTML;
  await deleteListItem(xMenus, remove);
})


async function deleteListItem(xMenus, remove) {
  if (remove === await Lget("settings", "removeall")) {
    for (var i = xMenus.length -1; i > -1; i--) {
        xMenus[i].remove()
    }
  } else {
      for (var i = 0; i < xMenus.length; i++) {
          if (remove === await Lget("settings", "remove", xMenus[i].value)) {
              xMenus[i].remove()
              break;
          }
      }
  }
}


function showTab(settingType) {
  document.getElementById("connexion-tab").style.display = "none";
  document.getElementById("nodes-tab").style.display = "none";
  document.getElementById("image-tab").style.display = "none";
  document.getElementById("development-tab").style.display = "none";
  document.getElementById("dialog-tab").style.display = "none";
 
  window.requestAnimationFrame(() => {
    document.getElementById(settingType).style.display = "block";
    if (settingType === "connexion-tab" || settingType === "dialog-tab")
      document.getElementById("apply-properties").style.display = "none"
    else
      document.getElementById("apply-properties").style.display = ""
  })
}

document.getElementById("connexion").addEventListener("click", (event) => {
  showTab("connexion-tab")
})

document.getElementById("nodes").addEventListener("click", (event) => {
  showTab("nodes-tab")
})

document.getElementById("image").addEventListener("click", (event) => {
  showTab("image-tab")
})

document.getElementById("development").addEventListener("click", (event) => {
  showTab("development-tab")
})

document.getElementById("dialog").addEventListener("click", (event) => {
  showTab("dialog-tab")
})


function showParamNodeTab(settingType) {

    document.getElementById("param-node-tab").style.display = "none";
    document.getElementById("param-edge-tab").style.display = "none";
    document.getElementById("tooltip-source-target-tab").style.display = "none";
    
    window.requestAnimationFrame(() => {
      document.getElementById(settingType).style.display = "block";
    })
}
document.getElementById("room").addEventListener("click", (event) => {
  showParamNodeTab("param-node-tab")
})
document.getElementById("edge").addEventListener("click", (event) => {
  showParamNodeTab("param-edge-tab")
})
document.getElementById("dialogue").addEventListener("click", (event) => {
  showParamNodeTab("tooltip-source-target-tab")
})

document.getElementById("select-background").addEventListener("click", async (event) => {
  let file = await window.electronAPI.openFile();
  if (file) {
    if (document.getElementById('img-house').style.display === "none")
      document.getElementById('img-house').style.display = "";
    document.getElementById('img-house').src = file;
  }
})

document.getElementById("select-screen-saver").addEventListener("click", async (event) => {
  let file = await window.electronAPI.openScreenSaverFile()
  if (file) document.getElementById('screen-saver').value = file
})

document.getElementById("select-powershell").addEventListener("click", async (event) => {
  let file = await window.electronAPI.openPowershellFile()
  if (file) document.getElementById('powershell').value = file
})

document.getElementById("exit").addEventListener("click", async (event) => {
  window.dispatchEvent(new Event ('beforeunload'))
})


document.getElementById("apply-properties").addEventListener("click", async (event) => {
  try {
    await updateProperties();
    window.electronAPI.applyProperties({reason: 'test', interface: interfaceProperties})
  } catch(err) {
    notification('Error: '+err, true);
  }
})


document.getElementById("save-properties").addEventListener("click", async (event) => {
  if (!await checkProperties()) return;

  try {
    await updateProperties();
    await window.electronAPI.applyProperties({reason: 'save', app: appProperties, interface: interfaceProperties})
    notification(await Lget("settings", "saved"));
  } catch(err) {
    notification('Error: '+err, true);
  }
})


async function checkProperties() {

  if (document.getElementById('http').value === '')
    return notification(await Lget("settings", "httpError"), true);

  if (document.getElementById('udp').value === '')
    return notification(await Lget("settings", "udpError"), true);   

  if (document.getElementById('default-client').value === '')
    return notification(await Lget("settings", "noDefautClientError"), true);   

  if (getXtagList("norule-list").length === 0) {
    return notification(await Lget("settings", "noruleError"), true);  
  }

  if (getXtagList("again-list").length === 0) {
    return notification(await Lget("settings", "againError"), true);  
  }

  return true;     
}


document.getElementById("qtip-jtools-source").addEventListener("click", async (event) => {
  document.getElementById("tooltip-source-img").src = "../images/qtip/qtip-jtools-source.png";
  document.getElementById("tooltip-source-img").alt = "../images/qtip/qtip-jtools-source.png";
})
document.getElementById("qtip-bootstrap-source").addEventListener("click", async (event) => {
  document.getElementById("tooltip-source-img").src = "../images/qtip/qtip-bootstrap-source.png";
  document.getElementById("tooltip-source-img").alt = "../images/qtip/qtip-bootstrap-source.png";
})
document.getElementById("qtip-youtube-source").addEventListener("click", async (event) => {
  document.getElementById("tooltip-source-img").src = "../images/qtip/qtip-youtube-source.png";
  document.getElementById("tooltip-source-img").alt = "../images/qtip/qtip-youtube-source.png";
})
document.getElementById("qtip-cluetip-source").addEventListener("click", async (event) => {
  document.getElementById("tooltip-source-img").src = "../images/qtip/qtip-cluetip-source.png";
  document.getElementById("tooltip-source-img").alt = "../images/qtip/qtip-cluetip-source.png";
})
document.getElementById("qtip-tipped-source").addEventListener("click", async (event) => {
  document.getElementById("tooltip-source-img").src = "../images/qtip/qtip-tipped-source.png";
  document.getElementById("tooltip-source-img").alt = "../images/qtip/qtip-tipped-source.png";
})
document.getElementById("qtip-tipsy-source").addEventListener("click", async (event) => {
  document.getElementById("tooltip-source-img").src = "../images/qtip/qtip-tipsy-source.png";
  document.getElementById("tooltip-source-img").alt = "../images/qtip/qtip-tipsy-source.png";
})
document.getElementById("qtip-rounded-source").addEventListener("click", async (event) => {
  document.getElementById("tooltip-source-img").src = "../images/qtip/qtip-rounded-source.png";
  document.getElementById("tooltip-source-img").alt = "../images/qtip/qtip-rounded-source.png";
})
document.getElementById("qtip-shadow-source").addEventListener("click", async (event) => {
  document.getElementById("tooltip-source-img").src = "../images/qtip/qtip-shadow-source.png";
  document.getElementById("tooltip-source-img").alt = "../images/qtip/qtip-shadow-source.png";
})

document.getElementById("qtip-jtools-target").addEventListener("click", async (event) => {
  document.getElementById("tooltip-target-img").src = "../images/qtip/qtip-jtools-target.png";
  document.getElementById("tooltip-target-img").alt = "../images/qtip/qtip-jtools-target.png";
})
document.getElementById("qtip-bootstrap-target").addEventListener("click", async (event) => {
  document.getElementById("tooltip-target-img").src = "../images/qtip/qtip-bootstrap-target.png";
  document.getElementById("tooltip-target-img").alt = "../images/qtip/qtip-bootstrap-target.png";
})
document.getElementById("qtip-youtube-target").addEventListener("click", async (event) => {
  document.getElementById("tooltip-target-img").src = "../images/qtip/qtip-youtube-target.png";
  document.getElementById("tooltip-target-img").alt = "../images/qtip/qtip-youtube-target.png";
})
document.getElementById("qtip-cluetip-target").addEventListener("click", async (event) => {
  document.getElementById("tooltip-target-img").src = "../images/qtip/qtip-cluetip-target.png";
  document.getElementById("tooltip-target-img").alt = "../images/qtip/qtip-cluetip-target.png";
})
document.getElementById("qtip-tipped-target").addEventListener("click", async (event) => {
  document.getElementById("tooltip-target-img").src = "../images/qtip/qtip-tipped-target.png";
  document.getElementById("tooltip-target-img").alt = "../images/qtip/qtip-tipped-target.png";
})
document.getElementById("qtip-tipsy-target").addEventListener("click", async (event) => {
  document.getElementById("tooltip-target-img").src = "../images/qtip/qtip-tipsy-target.png";
  document.getElementById("tooltip-target-img").alt = "../images/qtip/qtip-tipsy-target.png";
})
document.getElementById("qtip-rounded-target").addEventListener("click", async (event) => {
  document.getElementById("tooltip-target-img").src = "../images/qtip/qtip-rounded-target.png";
  document.getElementById("tooltip-target-img").alt = "../images/qtip/qtip-rounded-target.png";
})
document.getElementById("qtip-shadow-target").addEventListener("click", async (event) => {
  document.getElementById("tooltip-target-img").src = "../images/qtip/qtip-shadow-target.png";
  document.getElementById("tooltip-target-img").alt = "../images/qtip/qtip-shadow-target.png";
})


document.getElementById("choose-tooltip").addEventListener("click", async (event) => {
  if (document.getElementById("choose-tooltip").toggled) {
    document.getElementById("param-target-dialogue-tab").style.display = "none";
    document.getElementById("param-source-dialogue-tab").style.display = "block";
    document.getElementById("label-choose-rule").style.color = "#B249B3"
    document.getElementById("label-choose-avatar").style.color = ""
  } else {
    document.getElementById("param-source-dialogue-tab").style.display = "none";
    document.getElementById("param-target-dialogue-tab").style.display = "block";
    document.getElementById("label-choose-avatar").style.color = "#B249B3"
    document.getElementById("label-choose-rule").style.color = ""
  }
})


document.getElementById("http").addEventListener("beforevalidate", async (event) => {
  event.preventDefault();

  if (document.getElementById("http").empty === true) {
      document.getElementById("http").setCustomValidity(await Lget("settings", "nohttp"));
  }
  else {
      document.getElementById("http").setCustomValidity("");
  }
});

document.getElementById("udp").addEventListener("beforevalidate", async (event) => {
  event.preventDefault();

  if (document.getElementById("udp").empty === true) {
      document.getElementById("udp").setCustomValidity(await Lget("settings", "noudp"));
  }
  else {
      document.getElementById("udp").setCustomValidity("");
  }
});


document.getElementById("default-client").addEventListener("beforevalidate", async (event) => {
  event.preventDefault();

  if (document.getElementById("default-client").empty === true) {
      document.getElementById("default-client").setCustomValidity(await Lget("settings", "noDefaultClient"));
  }
  else {
      document.getElementById("default-client").setCustomValidity("");
  }
});


function notification (msg, err) {
  let notif = document.getElementById('notification');
  notif.style.color = (err) ? 'red' : 'rgba(255, 255, 255, 0.9)';
  if (notif.opened == true) notif.opened = false;
  notif.innerHTML = msg;
  notif.opened = true;
}


async function Lget (top, target, param) {
  if (param) {
    return await window.electronAPI.getMsg([top+"."+target, param])
  } else {
      return await window.electronAPI.getMsg(top+"."+target)
  }
}


async function updateProperties() {

  let item = document.getElementsByClassName("item-language");
  for (let i = 0; i < item.length; i++) {
      if (item[i].toggled) {
        appProperties.language = item[i].value;
        break;
      }
  }
  appProperties.http.port = document.getElementById('http').value
  appProperties.udp.port = document.getElementById('udp').value
  appProperties.default.client = document.getElementById('default-client').value
  appProperties.restart = parseInt(document.getElementById('auto-restart').value)
  appProperties.waitAction.time = parseInt(document.getElementById('synchro').value)
  appProperties.screenSaver.exec = document.getElementById('screen-saver').value.replaceAll('\\', '/')
  appProperties.screenSaver.timeout = parseInt(document.getElementById('screen-saver-timer').value) * 1000
  appProperties.screenSaver.active = document.getElementById('screen-saver-label-onoff').toggled
  appProperties.verbose = document.getElementById('info-start').toggled
  appProperties.checkUpdate = document.getElementById('update-start').toggled
  appProperties.powerShell = document.getElementById('powershell').value.replaceAll('\\', '/')

  interfaceProperties.nodes.name = document.getElementById('node-name').toggled
  interfaceProperties.nodes.size = parseInt(document.getElementById('node-size').value)
  interfaceProperties.nodes.fontsize = parseInt(document.getElementById('text-size').value)
  interfaceProperties.nodes.fontoutline = parseInt(document.getElementById('bordure-size').value)
  interfaceProperties.nodes.fontcolor = document.getElementById('text-color').value
  interfaceProperties.nodes.fontbordercolor = document.getElementById('background-color').value
  interfaceProperties.edges.classic.width = parseInt(document.getElementById('edge-classic-size').value)
  interfaceProperties.edges.classic.color = document.getElementById('edge-classic-color').value
  interfaceProperties.edges.virtual.width = parseInt(document.getElementById('edge-virtual-size').value )
  interfaceProperties.edges.virtual.color = document.getElementById('edge-virtual-color').value
  interfaceProperties.edges.mobile.width = parseInt(document.getElementById('edge-mobil-size').value)
  interfaceProperties.edges.mobile.color = document.getElementById('edge-mobil-color').value

  interfaceProperties.console.color = document.getElementById('console-color').value
  interfaceProperties.console.textColor = document.getElementById('text-console-color').value
  interfaceProperties.console.opacity = document.getElementById('opacity-shape').value
  interfaceProperties.console.textBold = document.getElementById('text-console-bold').toggled

  item = document.getElementsByClassName("position-text-h");
  for (i = 0; i < item.length; i++) {
      if (item[i].toggled) {
        interfaceProperties.nodes.texthalign = item[i].value
        break;
      }
  }
  item = document.getElementsByClassName("position-text-v");
  for (i = 0; i < item.length; i++) {
      if (item[i].toggled) {
        interfaceProperties.nodes.textvalign = item[i].value
        break;
      }
  }

  interfaceProperties.nodes.textmarginh = parseInt(document.getElementById('marge-h-text').value)
  interfaceProperties.nodes.textmarginv = parseInt(document.getElementById('marge-v-text').value)

  interfaceProperties.infobulle.source.delay = parseInt(document.getElementById('edge-source-dialogue-time').value) * 1000
  item = document.getElementsByClassName("qtip-color-source");
  for (i = 0; i < item.length; i++) {
      if (item[i].toggled) {
        interfaceProperties.infobulle.source.color = item[i].value
        break;
      }
  }
  item = document.getElementsByClassName("qtip-source");
  for (i = 0; i < item.length; i++) {
      if (item[i].toggled) {
        interfaceProperties.infobulle.source.class = item[i].value
        break;
      }
  }


  interfaceProperties.infobulle.target.delay = parseInt(document.getElementById('edge-target-dialogue-time').value) * 1000
  item = document.getElementsByClassName("qtip-color-target");
  for (i = 0; i < item.length; i++) {
      if (item[i].toggled) {
        interfaceProperties.infobulle.target.color = item[i].value
        break;
      }
  }
  item = document.getElementsByClassName("qtip-target");
  for (i = 0; i < item.length; i++) {
      if (item[i].toggled) {
        interfaceProperties.infobulle.target.class = item[i].value
        break;
      }
  }

  if (document.getElementById('img-house').src.indexOf('.jpg') !== -1) {
    let src = new URL(document.getElementById('img-house').src);
    if (document.getElementById('img-house').alt.indexOf('.jpg') !== -1) {
      let currentImage = new URL(document.getElementById('img-house').alt);
      if (decodeURIComponent(src.pathname) !== decodeURIComponent(currentImage.pathname)) {
          interfaceProperties.screen.background = decodeURIComponent(src.pathname.substring(1));
      }
    } else {
      interfaceProperties.screen.background = decodeURIComponent(src.pathname.substring(1)); 
    }
  }
 
  appProperties.norule[appProperties.language] = getXtagList("norule-list");  
  appProperties.againrule = getXtagList("again-list");

}


async function setHTMLContent() {

    // Parameters
    document.getElementById(appProperties.language).toggled = true
    document.getElementById('http').value = appProperties.http.port
    document.getElementById('udp').value = appProperties.udp.port
    document.getElementById('default-client').value = appProperties.default.client
    document.getElementById('auto-restart').value = appProperties.restart
    document.getElementById('synchro').value = appProperties.waitAction.time
    document.getElementById('screen-saver').value = appProperties.screenSaver.exec
    document.getElementById('screen-saver-timer').value = appProperties.screenSaver.timeout / 1000
    document.getElementById('screen-saver-label-onoff').toggled = appProperties.screenSaver.active
    document.getElementById('info-start').toggled = appProperties.verbose
    document.getElementById('update-start').toggled = appProperties.checkUpdate
    document.getElementById('powershell').value = appProperties.powerShell

    //nodes
    document.getElementById('node-name').toggled = interfaceProperties.nodes.name
    document.getElementById('node-size').value = interfaceProperties.nodes.size
    document.getElementById('text-size').value = interfaceProperties.nodes.fontsize
    document.getElementById('bordure-size').value = interfaceProperties.nodes.fontoutline
    document.getElementById('text-color').value = interfaceProperties.nodes.fontcolor
    document.getElementById('text-color-picker').value = interfaceProperties.nodes.fontcolor
    document.getElementById('background-color').value = interfaceProperties.nodes.fontbordercolor
    document.getElementById('background-color-picker').value = interfaceProperties.nodes.fontbordercolor
    //Edges
    document.getElementById('edge-classic-size').value = interfaceProperties.edges.classic.width
    document.getElementById('edge-classic-color').value = interfaceProperties.edges.classic.color
    document.getElementById('edge-classic-color-picker').value = interfaceProperties.edges.classic.color

    document.getElementById('edge-virtual-size').value = interfaceProperties.edges.virtual.width
    document.getElementById('edge-virtual-color').value = interfaceProperties.edges.virtual.color
    document.getElementById('edge-virtual-color-picker').value = interfaceProperties.edges.virtual.color

    document.getElementById('edge-mobil-size').value = interfaceProperties.edges.mobile.width
    document.getElementById('edge-mobil-color').value = interfaceProperties.edges.mobile.color
    document.getElementById('edge-mobil-color-picker').value = interfaceProperties.edges.mobile.color

    document.getElementById('console-color').value = interfaceProperties.console.color
    document.getElementById('console-color-picker').value = interfaceProperties.console.color
    document.getElementById('text-console-color').value = interfaceProperties.console.textColor
    document.getElementById('text-console-color-picker').value = interfaceProperties.console.textColor
    document.getElementById('opacity-shape').value = interfaceProperties.console.opacity
    document.getElementById('text-console-bold').toggled = interfaceProperties.console.textBold

    document.getElementById("position-text-h-"+interfaceProperties.nodes.texthalign).toggled = true
    document.getElementById("position-text-v-"+interfaceProperties.nodes.textvalign).toggled = true
    document.getElementById('marge-h-text').value = interfaceProperties.nodes.textmarginh
    document.getElementById('marge-v-text').value = interfaceProperties.nodes.textmarginv

    document.getElementById("label-choose-rule").style.color = "#B249B3"
    document.getElementById('edge-source-dialogue-time').value = interfaceProperties.infobulle.source.delay / 1000
    document.getElementById(interfaceProperties.infobulle.source.color+"-source").toggled = true
    document.getElementById(interfaceProperties.infobulle.source.class+"-source").toggled = true
    document.getElementById("tooltip-source-img").src = "../images/qtip/" + interfaceProperties.infobulle.source.class+"-source.png";
    document.getElementById("tooltip-source-img").alt = "../images/qtip/" + interfaceProperties.infobulle.source.class+"-source.png";

    document.getElementById('edge-target-dialogue-time').value = interfaceProperties.infobulle.target.delay / 1000
    document.getElementById(interfaceProperties.infobulle.target.color+"-target").toggled = true
    document.getElementById(interfaceProperties.infobulle.target.class+"-target").toggled = true
    document.getElementById("tooltip-target-img").src = "../images/qtip/" + interfaceProperties.infobulle.target.class+"-target.png";
    document.getElementById("tooltip-target-img").alt = "../images/qtip/" + interfaceProperties.infobulle.target.class+"-target.png";

    // background
    if (interfaceProperties.screen.background) {
      document.getElementById('img-house').src = document.getElementById('img-house').alt = 'file://'+interfaceProperties.screen.background;
    } else {
      document.getElementById('img-house').style.display = "none";
      document.getElementById('img-house').src = document.getElementById('img-house').alt = ""
    }

    if (appProperties.norule[appProperties.language])
      setXtagList(appProperties.norule[appProperties.language], "norule-list");
    
    if (appProperties.againrule)
      setXtagList(appProperties.againrule, "again-list");

}


function setXtagList(list, ele) {
  let XTagsinput = document.getElementById(ele);
  list.forEach(async (elem) => {
      let inner = elem;
      let tag = document.createElement("x-tag");
      tag.value = elem;
      tag.innerHTML = `<x-label>${inner}</x-label>`;
      XTagsinput.appendChild(tag);
  });
}

function getXtagList(ele) {
  let list = [];
  let XTagsinput = document.getElementById(ele).value;
  XTagsinput.forEach(elem => {
      list.push(elem)
  })
  return list;
}


function setRuleGroup (tag) {
  let Xtags = document.getElementById("norule-list");
  while (Xtags.firstChild) {
      Xtags.removeChild(Xtags.lastChild);
  }
  if (appProperties.norule[tag])
    setXtagList(appProperties.norule[tag], "norule-list");
}



async function setLangTargets() {

    document.getElementById('connexion').innerHTML = await Lget("settings", "settings")
    document.getElementById('nodes').innerHTML = await Lget("settings", "nodes")
    document.getElementById('image').innerHTML = await Lget("settings", "background")
    document.getElementById('dialog').innerHTML = await Lget("settings", "dialog")
    document.getElementById('development').innerHTML = await Lget("settings", "console")
    
    document.getElementById('lang').innerHTML = await Lget("settings", "lang")
    let menuOn = document.getElementById('BCP47');
    for (let i in BCP47) {
        let itemOn = document.createElement("x-menuitem");
        itemOn.setAttribute('id', BCP47[i].tag);
        itemOn.setAttribute("class", "item-language");
        itemOn.value = BCP47[i].tag;
        itemOn.onclick = () => {setRuleGroup(BCP47[i].tag)};
        let labelOn = document.createElement("x-label");
        labelOn.innerHTML = BCP47[i].tag+" : "+BCP47[i].region;
        itemOn.appendChild(labelOn);
        menuOn.appendChild(itemOn);
    }
    
    document.getElementById('http-label').innerHTML = await Lget("settings", "http")
    document.getElementById('udp-label').innerHTML = await Lget("settings", "udp")
    document.getElementById('default-client-label').innerHTML = await Lget("settings", "defaultclient")
    document.getElementById('restart-label').innerHTML = await Lget("settings", "restart")
    document.getElementById('synchro-label').innerHTML = await Lget("settings", "synchro")
    document.getElementById('screen-saver-label').innerHTML = await Lget("settings", "screensaver")
    document.getElementById('select-screen-saver-label').innerHTML = await Lget("settings", "selectscreensaver")
    document.getElementById('screen-saver-timer-label').innerHTML = await Lget("settings", "screensavertimer")
    document.getElementById('label-screen-saver-label-onoff').innerHTML = await Lget("settings", "screensavertimerOnoff")
    document.getElementById('update-label').innerHTML = await Lget("settings", "update")
    document.getElementById('select-powershell-label').innerHTML = await Lget("settings", "powershell")
    document.getElementById('label-powershell').innerHTML = await Lget("settings", "powershellVersion")
    document.getElementById('node-name-label').innerHTML = await Lget("settings", "nodename")

    document.getElementById('node-size-label').innerHTML = await Lget("settings", "nodesize")

    document.getElementById('param-tab-text').innerHTML = await Lget("settings", "texttab")
    document.getElementById('param-tab-edge').innerHTML = await Lget("settings", "edgetab")
    document.getElementById('param-tab-image').innerHTML = await Lget("settings", "imagetab")

    document.getElementById('label-text-size').innerHTML = await Lget("settings", "textsize")

    document.getElementById('label-bordure-size').innerHTML = await Lget("settings", "textbordure")

    document.getElementById('label-text-color').innerHTML = await Lget("settings", "textcolor")

    document.getElementById('label-background-color').innerHTML = await Lget("settings", "backgroundcolor")

    document.getElementById('label-text-position-v').innerHTML = await Lget("settings", "positionVtext")

    document.getElementById('label-text-v-top').innerHTML = await Lget("settings", "texttopV")
    document.getElementById('label-text-v-center').innerHTML = await Lget("settings", "textcenterV")
    document.getElementById('label-text-v-bottom').innerHTML = await Lget("settings", "textbottomV")

    document.getElementById('label-text-position-h').innerHTML = await Lget("settings", "positionHtext")

    document.getElementById('label-text-h-left').innerHTML = await Lget("settings", "textleftH")
    document.getElementById('label-text-h-center').innerHTML = await Lget("settings", "textcenterH")
    document.getElementById('label-text-h-right').innerHTML = await Lget("settings", "textrightH")

    document.getElementById('label-marging-v').innerHTML = await Lget("settings", "marginV")

    document.getElementById('label-marging-h').innerHTML = await Lget("settings", "marginH")

    document.getElementById('xlabel-classic-strong').innerHTML = await Lget("settings", "classic")
    document.getElementById('label-classic').innerHTML = await Lget("settings", "classicmin")
    document.getElementById('label-classic-edge').innerHTML = await Lget("settings", "thickness")
    document.getElementById('label-edge-color').innerHTML = await Lget("settings", "color")

    document.getElementById('xlabel-virtual-strong').innerHTML = await Lget("settings", "virtual")
    document.getElementById('label-virtual').innerHTML = await Lget("settings", "virtualmin")
    document.getElementById('label-virtual-edge').innerHTML = await Lget("settings", "thickness")
    document.getElementById('label-edge-virtual-color').innerHTML = await Lget("settings", "color")

    document.getElementById('xlabel-mobil-strong').innerHTML = await Lget("settings", "mobil")
    document.getElementById('label-mobil').innerHTML = await Lget("settings", "mobilmin")
    document.getElementById('label-mobil-edge').innerHTML = await Lget("settings", "thickness")
    document.getElementById('label-edge-mobil-color').innerHTML = await Lget("settings", "color")

    document.getElementById('label-target-dialogue-time').innerHTML = await Lget("settings", "dialogtime")
    document.getElementById('label-target-edge-dialogue-color').innerHTML = await Lget("settings", "dialogcolor")
    document.getElementById('label-target-infobulle').innerHTML = await Lget("settings", "tooltip")

    document.getElementById('label-choose-rule').innerHTML = await Lget("settings", "vocaleRule")
    document.getElementById('label-choose-avatar').innerHTML = await Lget("settings", "avatarAnswer")
    document.getElementById('label-source-dialogue-time').innerHTML = await Lget("settings", "dialogtime")
    document.getElementById('label-source-edge-dialogue-color').innerHTML = await Lget("settings", "dialogcolor")
    document.getElementById('label-source-infobulle').innerHTML = await Lget("settings", "tooltip")
    
    document.getElementById('label-select-background').innerHTML = await Lget("settings", "selectimage")

    document.getElementById('label-info-start').innerHTML = await Lget("settings", "verbose")
    document.getElementById('label-update-start').innerHTML = await Lget("settings", "updateLabel")

    document.getElementById('label-console-color').innerHTML = await Lget("settings", "consoleColor")
    document.getElementById('label-text-console-color').innerHTML = await Lget("settings", "textConsoleColor")
    document.getElementById('opacity-shape-label').innerHTML = await Lget("settings", "labelOpacity")
    document.getElementById('label-text-console-bold').innerHTML = await Lget("settings", "textConsoleBold")
    document.getElementById('label-devtool4').innerHTML = await Lget("settings", "labeltool4")
  
    document.getElementById('norule-label').innerHTML = await Lget("settings", "norule")
    document.getElementById('again-label').innerHTML = await Lget("settings", "againrule")
    document.getElementById('again-label-info').innerHTML = await Lget("settings", "againruleinfo")
   
    document.getElementById('test').innerHTML = await Lget("settings", "test")
    document.getElementById('label-save-properties').innerHTML = await Lget("settings", "saveproperties")
    document.getElementById('label-quit').innerHTML = await Lget("settings", "quit")

    document.getElementById('label-delete-again-list').innerHTML = await Lget("settings", "removeall")
    document.getElementById('label-delete-norule-list').innerHTML = await Lget("settings", "removeall")

}


window.electronAPI.onInitApp(async (_event, arg) => {
  interfaceProperties = arg.interface;
  appProperties = arg.properties;
  BCP47 = arg.BCP47;
  platform = arg.platform;
  await setLangTargets();
  await setHTMLContent();
})
