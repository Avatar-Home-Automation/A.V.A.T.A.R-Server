let interfaceProperties;
let cyCreatePlugin;
let cyPlugins;
let cyCreateNodeImage;
let selected;
let plugins;
let tblPlugins = [];
let pluginEditor;
let currentPluginEditor;
let pluginSaved = false;
let outdatedPackages = [], auditPackages = [];

window.onbeforeunload = async (e) => {
  e.returnValue = false;
  window.electronAPI.quitStudio(pluginSaved)
}

async function createNewPlugin() {

  let s = cyCreateNodeImage.$('#image-node');
  
  let createPluginInfos = {
    name: $('#plugin-name').prop('value'),
    label: $('#plugin-label').prop('value'),
    rules: $('#rules-yes').prop('toggled') ? true : false,
    bySyntax: $('#by-syntax').prop('toggled') ? true : false,
    methods: {
      init: $('#method-init').prop('toggled') ? true : false,
      langpak: $('#method-langpak').prop('toggled') ? true : false,
      cron: $('#method-cron').prop('toggled') ? true : false,
      mute: $('#method-mute').prop('toggled') ? true : false,
      unmute: $('#method-unmute').prop('toggled') ? true : false,
      onclose: $('#method-onclose').prop('toggled') ? true : false,
      subspeak: $('#method-subspeak').prop('toggled') ? true : false,
      subplay: $('#method-subplay').prop('toggled') ? true : false,
      addwidget: $('#method-addwidget').prop('toggled') ? true : false,
      timeout: $('#method-timeout').prop('toggled') ? true : false
    },
    image: s.data('image'),
    documentation: $('#html-doc-yes').prop('toggled') ? true : false,
    startPage: $('#plugin-documentation-name').prop('value'),
    serverHTML: $('#http-doc-server').prop('toggled') ? true : false
  };

  try {
    await window.electronAPI.createNewPlugin(createPluginInfos);
    await refreshPluginsButton();
    let ele = cyPlugins.$('#'+createPluginInfos.name);
    if (ele.length > 0) {
      setSelectedPlugin(ele);
      showtab (ele);
      let msg = await Lget("pluginStudio", "pluginCreated", createPluginInfos.name)
      notification (msg)
    } else {
      throw new Error (`Erreur de création du plugin ${createPluginInfos.name}`);
    }
  } catch (err) {
    notification (`${err}`, true);
  }
}


document.getElementById('select-image-node').addEventListener('click', async () => {
  let file = await window.electronAPI.openImageFile()
  if (file) {
    let s = cyCreateNodeImage.$('#'+"image-node");
    style = {
        'background-image': "url('"+"./tmp/"+file.fileName+"')",
    };
    s.data('image', file.fileName)
    s.style(style);
  }
});


document.getElementById('submit').addEventListener('click', () => {
     createNewPlugin();
     
});


const inputPluginName = document.querySelector("#plugin-name");
inputPluginName.addEventListener("beforevalidate", async (event) => {
  event.preventDefault();

  if (inputPluginName.value.length === 0) {
    let msg = await Lget("pluginStudio", "warmMsg0")
    inputPluginName.setCustomValidity(msg);
    inputPluginName.focus()
  }
  else {
    inputPluginName.setCustomValidity("");
  }
});


document.getElementById('rules-yes').addEventListener('click', () => {
  $('#by-syntax').prop('disabled', false)
  $('#by-key').prop('disabled', false)
});


document.getElementById('rules-no').addEventListener('click', () => {
  $('#by-syntax').prop('disabled', true)
  $('#by-key').prop('disabled', true)
});


document.getElementById('html-doc-yes').addEventListener('click', () => {
  $('#plugin-documentation-name').prop('disabled', false)
  $('#http-doc-server').prop('disabled', false)
});

document.getElementById('html-doc-no').addEventListener('click', () => {
  $('#plugin-documentation-name').prop('disabled', true)
  $('#http-doc-server').prop('disabled', true)
  $('#plugin-documentation-name').prop('value', "")
  $('#http-doc-server').prop('toggled', false)
});

const inputPluginDocumentationName = document.querySelector("#plugin-documentation-name");
inputPluginDocumentationName.addEventListener("beforevalidate", async (event) => {
  event.preventDefault();

  if ($('#html-doc-yes').prop('toggled') && inputPluginDocumentationName.value.length === 0) {
    let msg = await Lget("pluginStudio", "warmMsg2")
    inputPluginDocumentationName.setCustomValidity(msg);
    inputPluginDocumentationName.focus()
  }
  else {
    inputPluginDocumentationName.setCustomValidity("");
  }
});


document.getElementById('html-doc-no').addEventListener('click', async () => {
  document.getElementById("http-doc-server").focus()
  inputPluginDocumentationName.setCustomValidity("");
});


document.getElementById('informations').addEventListener('click', async () => {
  document.getElementById('close-plugins').click()
});


document.getElementById('jsoneditor').addEventListener('click', async () => {
  //document.getElementById('close-plugins').click()
});


document.getElementById('informations-tab').addEventListener('click', async () => {
  if (selected) {
    let savedPlugin = await getSelectedPlugin (selected)
    let plugin = await getPlugin (selected.id())
    setTabInformations(plugin)
    savedPlugin.tab = 'informations';
    setTab('informations');
  }
});


document.getElementById('properties-tab').addEventListener('click', async () => {
  if (selected) {
    let savedPlugin = await getSelectedPlugin (selected)
    let plugin = await getPlugin (selected.id())
    let result = await setTabProperties(plugin)
    if (result === false) savedPlugin = setOldPropertySelectedPlugin()
    savedPlugin.tab = 'properties';
    setTab(savedPlugin.tab);
  }
});


document.getElementById('jsoneditor').addEventListener('contextmenu', (ev) => {
  ev.preventDefault();
  let json = pluginEditor.get();
  let id = Object.keys(json.modules)[0];

  var handler = async (e) => {
    e.preventDefault();
    window.electronAPI.showStudioEditorMenu({plugin: id, fullPath: currentPluginEditor.fullPath, property: json})
    window.removeEventListener('contextmenu', handler, false);
  }

  window.addEventListener('contextmenu', handler, false);
  return false;
})


window.electronAPI.propertySaved(async (_event, arg) => {
  let id = Object.keys(arg.property.modules)[0];
  if (arg.saved === true) {
    pluginSaved = true;
    let ele = cyPlugins.$('#'+id)
    let msg = await Lget("pluginStudio", "disabled")
    ele.data('name', (arg.property.modules[id].active === undefined || (arg.property.modules[id].active && arg.property.modules[id].active === true)) ? ele.data('name').replace("\n("+msg+")", "") : (ele.data('name').indexOf(msg) === -1) ? ele.data('name')+"\n("+msg+")" : ele.data('name'))
    let plugin = getPlugin(id);
    setNewPluginProperty(id, arg.property);
    currentPluginEditor = plugin;
    msg = await Lget("pluginStudio", "pluginPropertySaved", id); 
    notification (msg);
  } else {
    msg = await Lget("pluginStudio", "pluginPropertyNoSaved", id);
    notification (msg);
  }
})


window.electronAPI.activePlugin(async (_event, arg) => {

  let msg = await Lget("pluginStudio", "disabled") 
  cyPlugins.$('#'+arg.plugin).data('name', (arg.state) ? arg.name.replace("\n("+msg+")", "") : arg.name + "\n("+msg+")");

  let plugin = getPlugin(arg.plugin)
  plugin.properties.modules[arg.plugin].active = arg.state
  setNewPluginProperty(arg.plugin, plugin.properties)

  if (pluginEditor) {
     let json = pluginEditor.get();
     if (json.modules[arg.plugin]) {
          pluginEditor.destroy();
          pluginEditor = null;
          let container = document.getElementById("jsoneditor");
          pluginEditor = new JSONEditor(container);
          pluginEditor.set(plugin.properties);
          pluginEditor.expandAll();
     }
   }

  let info
  if (arg.state) {
    info = await Lget("pluginStudio", "pluginActivated") 
  } else {
    info = await Lget("pluginStudio", "pluginDesactivated") 
  }
  msg = await Lget("pluginStudio", "plugin", arg.plugin) 
  notification (msg + " " + info)
})


async function refreshPluginsButton () {
  let collection = cyPlugins.filter((element, i) => {
    if (element.hasClass('plugin')) return true;
      return false;
  });
  cyPlugins.remove(collection);

  await addPluginsButton();

  if (pluginEditor) {
    let json = pluginEditor.get();
    if (json.modules[plugin]) {
         pluginEditor.destroy();
         pluginEditor = null;
         currentPluginEditor = null;
    }
  }
}


window.electronAPI.returnDeletePlugin( async (_event, plugin) => {
  await refreshPluginsButton();
  emptyTab();
  let msg = await Lget("pluginStudio", "pluginRemoved", plugin);
  notification (msg);
})


window.electronAPI.refreshPlugin(async (_event, plugin) => {
  let msg = await Lget("pluginStudio", "pluginReloaded", plugin)
  notification (msg)
})


window.electronAPI.documentationError((_event, err) => {
  notification (err)
})


function notification (msg, err) {
  let notif = document.getElementById('notification');
  notif.style.color = (err) ? 'red' : 'rgba(255, 255, 255, 0.9)';
  if (notif.opened === true) notif.opened = false;
  notif.innerHTML = msg;
  notif.opened = true;
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
    return cy
}


async function addCreateNodeImage() {

  cyCreateNodeImage = await setCY('cy-image-node')
  cyCreateNodeImage.add(
    { group: "nodes",
      data: { id: "image-node", name: "image-node"}
    }
  );
  let s = cyCreateNodeImage.$('#'+"image-node");
  style = {
      'background-image': "url('"+'../images/icons/plugin.png'+"')",
      'width': 120,
      'height': 120
  };
  s.style(style);
  s.data('image', "by default")
  s.renderedPosition('x', 60);
  s.renderedPosition('y', 60);
  s.lock();

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
    if (id === 'createPlugin') {
      createPlugin();
    } else if (id === 'auditPlugin') {
      auditPlugins();
    } else {
      if (selected && selected.id() == evt.target.id()) {
          window.electronAPI.showPluginMenu({id: evt.target.id(), name: evt.target.data('name')})
      } else if (!selected || (selected && selected.id() != evt.target.id())) {
          document.getElementById('close-plugins').click()
          showtab(evt.target);
      }
    }
  });
  s.lock();
}


function getSelectedPlugin(ele) {
  for (i in tblPlugins) {
    if (tblPlugins[i].id === ele.id()) return tblPlugins[i]
  }
}


function getPlugin(id) {
  for (i in plugins) {
    if (plugins[i].id === id) return plugins[i]
  }
}


function deletePlugin (id) {
  for (i in plugins) {
    if (plugins[i].id === id) {
      delete plugins[i];
      return;
    }
  }
}


function setNewPluginProperty(id, property) {
  for (i in plugins) {
    if (plugins[i].id === id) {
      plugins[i].properties = property
      break
    }
  }
}


function setOldPropertySelectedPlugin() {
  let json = pluginEditor.get();
  let id = Object.keys(json.modules)[0];
  let ele = cyPlugins.$('#'+id);
  setSelectedPlugin(ele)
  return getSelectedPlugin(ele)
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


function unSelectPlugin() {
  if (selected) {
    selected.unselect();
    selected.style ({
      'border-opacity': 0
    });
  }
  selected = null
}


async function showtab (ele) {

  setSelectedPlugin(ele)
  let savedPlugin = await getSelectedPlugin (ele)
  let plugin = await getPlugin (ele.id())

  if (!savedPlugin) {
    tblPlugins.push({id: ele.id(), name: ele.data('name'), tab: 'informations'});
    setTabInformations(plugin)
    setTab('informations')
  } else {
    switch (savedPlugin.tab) {
      case 'informations':
        setTabInformations(plugin)
        setTab(savedPlugin.tab);
      break;
      case 'properties':
        let result = await setTabProperties(plugin)
        if (result === false)
          savedPlugin = setOldPropertySelectedPlugin()
        savedPlugin.tab = 'properties';
        setTab(savedPlugin.tab);
        break;
    }
  }

}


function emptyTab () {

  let tabs = document.getElementsByClassName("plugin-class");
  for (i = 0; i < tabs.length; i++) {
      tabs[i].style.display = "none";
  }
  let link = document.getElementsByClassName("plugins-tab");
  for (i = 0; i < link.length; i++) {
      link[i].className = link[i].className.replace(" active", "");
      link[i].selected = false;
  }
  document.getElementById('empty').style.display = "block";
}


function setTab (selected) {

  let tabs = document.getElementsByClassName("plugin-class");
  for (i = 0; i < tabs.length; i++) {
      tabs[i].style.display = "none";
  }
  let link = document.getElementsByClassName("plugins-tab");
  for (i = 0; i < link.length; i++) {
      link[i].className = link[i].className.replace(" active", "");
      link[i].toggled = false;
  }
  document.getElementById(selected).style.display = "block";
  if (selected !== 'createplugin' && selected !== 'auditplugin') {
    let tabs = document.getElementsByClassName("action-tab");
    for (i = 0; i < tabs.length; i++) {
      tabs[i].style.display = "";
    }

    document.getElementById(selected+'-tab').className += " active";
    document.getElementById(selected+'-tab').toggled = true;
  } else {
    let tabs = document.getElementsByClassName("action-tab");
    for (i = 0; i < tabs.length; i++) {
      tabs[i].style.display = "none";
    }
  }
}



async function setTabProperties (plugin) {

    if (!currentPluginEditor || currentPluginEditor.id !== plugin.id) {
        if (pluginEditor) {
          let json = pluginEditor.get();
          let answer = await window.electronAPI.savePluginPropertyFile({id: currentPluginEditor.id, fullPath: currentPluginEditor.fullPath, editor: json, property: currentPluginEditor.properties})
          switch (answer) {
            case 0:
              pluginSaved = true;
              let ele = cyPlugins.$('#'+currentPluginEditor.id);
              msg = await Lget("pluginStudio", "disabled");
              ele.data('name', ((json.modules[currentPluginEditor.id].active !== undefined && json.modules[currentPluginEditor.id].active === false) ? ele.data('name') + "\n("+msg+")" : ele.data('name').replace("\n("+msg+")", "")));
              setNewPluginProperty(currentPluginEditor.id, json);
              let msg = await Lget(["pluginStudio", "pluginPropertySaved", currentPluginEditor.id]);
              notification (msg);
            case 1:
              pluginEditor.destroy();
              pluginEditor = null;
              currentPluginEditor = null;
              break;
            case 2:
              return false;
          }
        }

        let container = document.getElementById("jsoneditor");
        pluginEditor = new JSONEditor(container);
        currentPluginEditor = plugin;
        pluginEditor.set(plugin.properties);
        pluginEditor.expandAll();
        return true;
    }
}


function setTabInformations (plugin) {

    let converter = new showdown.Converter();
    converter.setOption('headerLevelStart', 2);
    converter.setOption('tasklists', true);
    converter.setOption('ghCompatibleHeaderId', true);
    converter.setOption('rawHeaderId', true);
    converter.setOption('literalMidWordAsterisks', true);
    converter.setOption('strikethrough', true);
    converter.setOption('tables', true);
    converter.setOption('ghCodeBlocks', true);
    converter.setOption('tablesHeaderId', true);
    converter.setOption('simpleLineBreaks', true);
    converter.setOption('openLinksInNewWindow', true);
    converter.setOption('backslashEscapesHTMLTags', true);
    converter.setOption('emoji', true);
    converter.setOption('simplifiedAutoLink', true);
    converter.setOption('parseImgDimensions', true);
    converter.setOption('excludeTrailingPunctuationFromURLs', true);

    converter.setFlavor('github');

    let html = converter.makeHtml(plugin.md);
    document.getElementById("markdown").innerHTML = html;

}


function createPlugin() {
  document.getElementById('close-plugins').click();
  setTab('createplugin');
  unSelectPlugin();
}


function auditPlugins() {
  document.getElementById('close-plugins').click();
  setTab('auditplugin');
  unSelectPlugin();
}


document.getElementById('audit-plugins').addEventListener('click', async () => {
    document.getElementById('audit-start-label').innerHTML = "";
    document.getElementById('audit-button-label').innerHTML = await Lget("pluginStudio", "auditInProgress");
    document.getElementById('audit-plugins').disabled = true;
    window.electronAPI.auditPlugin();
});


document.getElementById('tblAudit-fix-button').addEventListener('click', async () => {
    document.getElementById('tblAudit-fix-button-label').innerHTML = await Lget("pluginStudio", "fixInProgress");
    document.getElementById('tblAudit-fix-button').disabled = true;
    window.electronAPI.pluginVulnerabilityFix(auditPackages);
});


document.getElementById('tblOutdated-update-button').addEventListener('click', async () => {

  let table = $('#controlOutdated').DataTable();
  let count = table.rows({ selected: true }).count();
  if (!count) return notification(await Lget("pluginStudio", "selectPackage"), true);

  const isNumeric = (str) => {
    const num = Number(str);
    return !isNaN(num);
  }

  let packages = [];
  const data = table.rows( { selected: true } ).data();
  const validKeys = Object.keys(data);
  for (let i of validKeys) {
    if (isNumeric(i)) packages.push(data[i])
  }

  document.getElementById('tblOutdated-update-button-label').innerHTML = await Lget("pluginStudio", "updateInProgress");
  document.getElementById('tblOutdated-update-button').disabled = true;
  window.electronAPI.pluginUpdatePackage(packages);
});


function setOutdatedInfos (outdated) {
  return new Promise(async (resolve) => {
      const validKeys = Object.keys(outdated);
      let count = validKeys.length;
      if (!count) return resolve();
      for (const plugin of validKeys) {
        const validPlugins = Object.keys(outdated[plugin].outdated);
        for (const key of validPlugins) {
          outdatedPackages.push([outdated[plugin].plugin, key, outdated[plugin].outdated[key].current, outdated[plugin].outdated[key].latest]);
        }
        if (!--count) resolve();
      }
  }); 
}


const checkUpdateVersions = (currentVersion, newVersion) => {
  return new Promise(async (resolve) => {
    let splitNewVersion = newVersion.split('.');
    if (parseInt(currentVersion[0]) < parseInt(splitNewVersion[0])) {
        return resolve(newVersion.trim());
    } else if (parseInt(currentVersion[0]) <= parseInt(splitNewVersion[0]) && parseInt(currentVersion[1]) < parseInt(splitNewVersion[1])) {
        return resolve(newVersion.trim());
    } else if (parseInt(currentVersion[0]) <= parseInt(splitNewVersion[0]) && parseInt(currentVersion[1]) <= parseInt(splitNewVersion[1]) && parseInt(currentVersion[2]) < parseInt(splitNewVersion[2])) {
        return resolve(newVersion.trim());
    } else {
      return resolve(false);
    }
  });    
}


function setAuditInfos (audit) {
  return new Promise(async (resolve) => {
      const validKeys = Object.keys(audit);
      let count = validKeys.length;
      if (!count) return resolve();
      for (const plugin of validKeys) {
        const validPlugins = Object.keys(audit[plugin].audit);
        let countKey = validPlugins.length;
        for (const key of validPlugins) {
          let viaName = "";
          let viaTitle = "";
          if (audit[plugin].audit[key].effects) {
            if (Array.isArray(audit[plugin].audit[key].effects)) {
              viaName = audit[plugin].audit[key].effects.length > 0 ? audit[plugin].audit[key].effects.join(",") : audit[plugin].plugin;
            } else {
              viaName = audit[plugin].audit[key].effects;
            }
          }

          viaTitle = (audit[plugin].audit[key].via[0] && audit[plugin].audit[key].via[0].title)
            ? audit[plugin].audit[key].via[0].title
            : await Lget("pluginStudio", "impacted", audit[plugin].audit[key].via.join(",")); 
          
          // color
          let severity = "";
          if (audit[plugin].audit[key].severity) {
              switch (audit[plugin].audit[key].severity) {
                case 'info':
                  severity = `<span style="color:lightblue">${await Lget("infos", "info")}</span>`;
                  break;
                case 'low':
                  severity = `<span style="color:lightyellow">${await Lget("infos", "low")}</span>`;
                  break;
                case 'moderate':
                  severity = `<span style="color:yellow">${await Lget("infos", "moderate")}</span>`;
                  break;
                case 'high':
                  severity = `<span style="color:red">${await Lget("infos", "hight")}</span>`;
                  break;
                case 'critical':
                  severity = `<span style="color:darkred">${await Lget("infos", "critical")}</span>`;
                  break;
                default: 
                  severity = audit[plugin].audit[key].severity;
              }
          }

          // fix available
          let fixAvailable = "";
          if (typeof audit[plugin].audit[key].fixAvailable !== undefined) {
              if (typeof audit[plugin].audit[key].fixAvailable === 'boolean') {
                fixAvailable = audit[plugin].audit[key].fixAvailable === true ?  `<span style="color:green">${await Lget("infos", "true")}</span>` : `<span style="color:red">${await Lget("infos", "false")}</span>`; 
              } else {
                const result = await window.electronAPI.getInfoPackage({plugin: audit[plugin].plugin, package: key, usedBy: viaName});
                if (result.used && result.current) {
                  const currentVersion = result.used.split('.');
                  const toUpdate = await checkUpdateVersions (currentVersion, result.current)
                  if (toUpdate) {
                    fixAvailable = `<span style="color:yellow">${await Lget("pluginStudio", "availableFix", toUpdate)}</span>`;
                    viaTitle = viaTitle + await Lget("pluginStudio", "availableFixInfo", audit[plugin].plugin);
                  } else {
                    fixAvailable = `<span style="color:red">${await Lget("pluginStudio", "noAvailableFix")}</span>`;
                    viaTitle = viaTitle + await Lget("pluginStudio", "noAvailableFixInfo", key, audit[plugin].plugin); 
                  }
                } else {
                  fixAvailable = `<span style="color:red">${await Lget("pluginStudio", "noAvailableFixFound")}</span>`
                  viaTitle = viaTitle + await Lget("pluginStudio", "noAvailableFixFoundInfo", key, audit[plugin].plugin); 
                }
              } 
          }

          auditPackages.push([audit[plugin].plugin, key, viaName, severity, fixAvailable, viaTitle]);

          --countKey;
          if (!count && !countKey) resolve();
        }

        --count;
        if (!count && !countKey) resolve();
      }
  });
}

window.electronAPI.auditLabel((_event, txt) => {
  document.getElementById("exec-audit-label").style.display = "block";
  document.getElementById("exec-audit-label").innerHTML = txt;
})


window.electronAPI.getFixResult(async (_event, result) => {
  document.getElementById('tblAudit-fix-button-label').innerHTML = await Lget("pluginStudio", "fixDone");
  result.forEach(async element => {
    if (element.result === false) {
      notification (await Lget("pluginStudio", "ResultFixError", element.plugin), true);
    }
  });
  setResult();
})


window.electronAPI.getUpdatePackageResult(async (_event, result) => {
  document.getElementById('tblAudit-fix-button-label').innerHTML = await Lget("pluginStudio", "updateDone");
  result.forEach(async element => {
    if (element.result === false) {
      notification (await Lget("pluginStudio", "resultUpdatePackageError", element.plugin), true);
    }
  });
  setResult();
})


async function setResult () {
  document.getElementById("audit-button-label").style.disabled = false;
  document.getElementById("audit-button-label").innerHTML = await Lget("pluginStudio", "auditInProgress");
  document.getElementById("exec-audit-label").innerHTML = await Lget("pluginStudio", "refreshFix");
  pluginSaved = true;
  window.electronAPI.auditPlugin();
}


window.electronAPI.getAudit(async (_event, audit) => {

  outdatedPackages = [], auditPackages = [];
  await setOutdatedInfos(audit.outdated);
  await setAuditInfos(audit.audit);

  $('#controlAudit').DataTable().destroy();
  $('#controlOutdated').DataTable().destroy();

  $('#controlOutdated').DataTable({
      layout: {
          topStart: null,
          topEnd: null,
          bottomStart: 'info'
      },
      info: true,
      scrollY: '250px',
      scrollCollapse: true,
      paging: false,
      data: outdatedPackages,
      columns: [
        {
          data: null
        },
        { data: "0", title: await Lget("pluginStudio", "auditPluginLabel")},
        { data: "1", title: await Lget("infos", "package")},
        { data: "2", title: await Lget("infos", "current")},
        { data: "3", title: await Lget("infos", "latest")}
      ],
      columnDefs: [
          {
            orderable: false,
            searchable: false,
            render: DataTable.render.select(),
            targets: 0
          },
          {
              className: 'dt-body-nowrap',
              searchable: false,
              orderable: false,
              targets: [1, 2]
          },
          {
              searchable: false,
              orderable: false,
              targets: [3, 4]
          }
      ],
      select: {
        style: 'os',
        selector: 'td:first-child'
      }
  });


  $('#controlAudit').DataTable({
      layout: {
          topStart: null,
          topEnd: null,
          bottomStart: 'info'
      },
      info: true,
      scrollY: '250px',
      scrollCollapse: true,
      paging: false,
      data: auditPackages,
      columns: [
          { title: await Lget("pluginStudio", "auditPluginLabel")},
          { title: await Lget("infos", "package")},
          { title: await Lget("infos", "via")},
          { title: await Lget("infos", "severity")},
          { title: await Lget("infos", "fixAvailable")},
          { title: await Lget("infos", "description")}
      ],
      columnDefs: [
          {
              className: 'dt-body-nowrap',
              searchable: false,
              orderable: false,
              targets: [0,1,2]
          },
          {
              searchable: false,
              orderable: false,
              targets: [3,4,5]
          }
      ]
  });

  document.getElementById('tblAudit-fix-button').disabled = false;
  document.getElementById('tblOutdated-update-button').disabled = false;
  document.getElementById('tblAudit-fix-button-label').innerHTML = await Lget("pluginStudio", "auditActionButton");
  document.getElementById('tblOutdated-update-button-label').innerHTML = await Lget("pluginStudio", "outdatedActionButton");
  document.getElementById('audit-button-label').innerHTML = await Lget("pluginStudio", "auditDone");
  document.getElementById("exec-audit-label").style.display = "none";
  try {
    window.resizeTo(window.outerWidth + 1, window.outerHeight);
    window.resizeTo(window.outerWidth - 1, window.outerHeight);
  } catch (err) {};
  document.getElementById("status-packages-xcard").style.display = "block";

  let found;
  if (auditPackages.length > 0) {
    let fix = `<span style="color:green">${await Lget("infos", "true")}</span>`;
    auditPackages.forEach(element => {
      if (!found && element[4] === fix) {
        document.getElementById("tblAudit-actions").style.display = "flex";
        found = true;
      }
    });
  } else {
    document.getElementById("tblAudit-actions").style.display = "none";
  }

  document.getElementById("tblOutdated-actions").style.display = outdatedPackages.length > 0 ? "flex" : "none";
  
})


function showAuditTab(settingType) {
  document.getElementById("status-packages-outdated-tab").style.display = "none";
  document.getElementById("status-packages-audit-tab").style.display = "none";
  
  window.requestAnimationFrame(() => {
    document.getElementById(settingType).style.display = "block";
    window.resizeTo(window.outerWidth + 1, window.outerHeight);
    window.resizeTo(window.outerWidth - 1, window.outerHeight);
  });
}
document.getElementById("outdated").addEventListener("click", (event) => {
  showAuditTab("status-packages-outdated-tab");
})
document.getElementById("audit").addEventListener("click", (event) => {
  showAuditTab("status-packages-audit-tab");
})


async function setLangTargets() {

  document.getElementById('open-plugins').innerHTML = await Lget("pluginStudio", "openClose")
  document.getElementById('close-plugins').innerHTML = await Lget("pluginStudio", "openClose")
  document.getElementById('info-label').innerHTML = await Lget("pluginStudio", "info")
  document.getElementById('properties-label').innerHTML = await Lget("pluginStudio", "properties")
  document.getElementById('plugin-title').innerHTML = await Lget("pluginStudio", "pluginTitle")
  document.getElementById('plugin-subtitle').innerHTML = await Lget("pluginStudio", "pluginSubtitle")
  
  document.getElementById('1-li').innerHTML = await Lget("pluginStudio", "li1")
  document.getElementById('2-li').innerHTML = await Lget("pluginStudio", "li2")
  document.getElementById('3-li').innerHTML = await Lget("pluginStudio", "li3")
  document.getElementById('4-li').innerHTML = await Lget("pluginStudio", "li4")
  document.getElementById('5-li').innerHTML = await Lget("pluginStudio", "li5")
  document.getElementById('6-li').innerHTML = await Lget("pluginStudio", "li6")
  
  document.getElementById('1fs-title').innerHTML = await Lget("pluginStudio", "fs1Title")
  document.getElementById('1fs-subtitle').innerHTML = await Lget("pluginStudio", "fs1Subtitle")
  document.getElementById('1fs-chapter-info').innerHTML = await Lget("pluginStudio", "fs1ChapterInfo")
  document.getElementById('1fs-chapter-subinfo').innerHTML = await Lget("pluginStudio", "fs1ChapterSubinfo")
  document.getElementById('1fs-name').innerHTML = await Lget("pluginStudio", "fs1Name")
  document.getElementById('1fs-label').innerHTML = await Lget("pluginStudio", "fs1Label")
  document.getElementById('1fs-sublabel').innerHTML = await Lget("pluginStudio", "fs1Sublabel")
  document.getElementById('1fs-label-input').innerHTML = await Lget("pluginStudio", "fs1LabelInput")
  document.getElementById('1-button').value = await Lget("pluginStudio", "fsNextButton")

  document.getElementById('2fs-title').innerHTML = await Lget("pluginStudio", "fs2Title")
  document.getElementById('2fs-subtitle').innerHTML = await Lget("pluginStudio", "fs2Subtitle")
  document.getElementById('rules-label').innerHTML = await Lget("pluginStudio", "rulesLabel")
  document.getElementById('rules-yes-label').innerHTML = await Lget("pluginStudio", "rulesYes")
  document.getElementById('rules-yes').toggled = true
  document.getElementById('rules-no-label').innerHTML = await Lget("pluginStudio", "rulesNo")
  document.getElementById('2fs-info1').innerHTML = await Lget("pluginStudio", "fs2Info1")
  document.getElementById('2fs-info2').innerHTML = await Lget("pluginStudio", "fs2Info2")
  document.getElementById('2fs-search-rules').innerHTML = await Lget("pluginStudio", "fs2SearchRules")
  document.getElementById('2fs-search-syntax').innerHTML = await Lget("pluginStudio", "fs2SearchSyntax")
  document.getElementById('2fs-search-key').innerHTML = await Lget("pluginStudio", "fs2SearchKey")
  document.getElementById('2-button-next').value = await Lget("pluginStudio", "fsNextButton")
  document.getElementById('2-button-previous').value = await Lget("pluginStudio", "fsPreviousButton")

  document.getElementById('3fs-title').innerHTML = await Lget("pluginStudio", "fs3Title")
  document.getElementById('3fs-subtitle').innerHTML = await Lget("pluginStudio", "fs3Subtitle")
  document.getElementById('3fs-info-0').innerHTML = await Lget("pluginStudio", "fs3Info0")
  document.getElementById('3fs-info-1').innerHTML = await Lget("pluginStudio", "fs3Info1")
  document.getElementById('3fs-info-10').innerHTML = await Lget("pluginStudio", "fs3Info10")
  document.getElementById('3fs-info-2').innerHTML = await Lget("pluginStudio", "fs3Info2")
  document.getElementById('3fs-info-3').innerHTML = await Lget("pluginStudio", "fs3Info3")
  document.getElementById('3fs-info-4').innerHTML = await Lget("pluginStudio", "fs3Info4")
  document.getElementById('3fs-info-5').innerHTML = await Lget("pluginStudio", "fs3Info5")
  document.getElementById('3fs-info-6').innerHTML = await Lget("pluginStudio", "fs3Info6")
  document.getElementById('3fs-info-7').innerHTML = await Lget("pluginStudio", "fs3Info7")
  document.getElementById('3fs-info-8').innerHTML = await Lget("pluginStudio", "fs3Info8")
  document.getElementById('3fs-info-9').innerHTML = await Lget("pluginStudio", "fs3Info9")
  document.getElementById('3-button-next').value = await Lget("pluginStudio", "fsNextButton")
  document.getElementById('3-button-previous').value = await Lget("pluginStudio", "fsPreviousButton")

  document.getElementById('4fs-title').innerHTML = await Lget("pluginStudio", "fs4Title")
  document.getElementById('4fs-subtitle').innerHTML = await Lget("pluginStudio", "fs4Subtitle")
  document.getElementById('label-image-node').innerHTML = await Lget("pluginStudio", "fs4LabelImage")
  document.getElementById('label-select-image-node').innerHTML = await Lget("pluginStudio", "fs4LabelSelectImage")
  document.getElementById('label-documentation').innerHTML = await Lget("pluginStudio", "fs4LabelDocumentation")
  document.getElementById('html-doc-yes-label').innerHTML = await Lget("pluginStudio", "rulesYes")
  document.getElementById('html-doc-no-label').innerHTML = await Lget("pluginStudio", "rulesNo")
  document.getElementById('html-doc-no').toggled = true
  document.getElementById('start-html-doc').innerHTML = await Lget("pluginStudio", "startHtmlDoc")
  document.getElementById('http-doc-server-label').innerHTML = await Lget("pluginStudio", "httpDocServer")
  document.getElementById('http-doc-folder').innerHTML = await Lget("pluginStudio", "httpDocFolder")
  document.getElementById('4-button-previous').value = await Lget("pluginStudio", "fsPreviousButton")
  document.getElementById('4-button').value = await Lget("pluginStudio", "fsNextButton")
  
  document.getElementById('5fs-title').innerHTML = await Lget("pluginStudio", "fs5Title")
  document.getElementById('5fs-subtitle').innerHTML = await Lget("pluginStudio", "fs5Subtitle")
  document.getElementById('5-button-previous').value = await Lget("pluginStudio", "fsPreviousButton")
  document.getElementById('submit').value = await Lget("pluginStudio", "fs5CreateButton")

  document.getElementById('audit-start-label').innerHTML = await Lget("pluginStudio", "auditLabel")
  document.getElementById("audit-button-label").innerHTML = await Lget("pluginStudio", "auditButtonLabel")
  document.getElementById('audit-label').innerHTML = await Lget("infos", "audit");
  document.getElementById('outdated-label').innerHTML = await Lget("infos", "outdated");
  document.getElementById('audit-text-label').innerHTML = await Lget("pluginStudio", "auditText");
  document.getElementById('outdated-text-label').innerHTML = await Lget("pluginStudio", "outdatedText");
  document.getElementById('report-audit-title0').innerHTML = await Lget("pluginStudio", "reportTitle0");
  document.getElementById('report-audit-title1').innerHTML = await Lget("pluginStudio", "reportTitle1");
  document.getElementById('report-audit-title2').innerHTML = await Lget("pluginStudio", "reportTitle2");
  document.getElementById('report-audit-title3').innerHTML = await Lget("pluginStudio", "reportTitle3");
  document.getElementById('report-audit-title4').innerHTML = await Lget("pluginStudio", "reportTitle4");
  document.getElementById('report-audit-title5').innerHTML = await Lget("pluginStudio", "reportTitle5");
  document.getElementById('report-audit-title6').innerHTML = await Lget("pluginStudio", "reportTitle6");

  document.getElementById('tblAudit-actions-label0').innerHTML = await Lget("pluginStudio", "auditAction0");
  document.getElementById('tblAudit-actions-label1').innerHTML = await Lget("pluginStudio", "auditAction1");
  document.getElementById('tblAudit-fix-button-label').innerHTML = await Lget("pluginStudio", "auditActionButton");

  document.getElementById('tblOutdated-actions-label0').innerHTML = await Lget("pluginStudio", "outdatedAction0");
  document.getElementById('tblOutdated-actions-label1').innerHTML = await Lget("pluginStudio", "auditAction1");
  document.getElementById('tblOutdated-update-button-label').innerHTML = await Lget("pluginStudio", "outdatedActionButton");
}


async function Lget (top, target, param, param1) {
  if (param && param1) {
    return await window.electronAPI.getMsg([top+"."+target, param, param1]);
  } else if (param) {
    return await window.electronAPI.getMsg([top+"."+target, param])
  } else {
    return await window.electronAPI.getMsg(top+"."+target);
  }
}


function resetCreatePluginForm() {

  $('#plugin-name').prop('value', "")
  $('#plugin-label').prop('value', "")
  $('#by-syntax').prop('disabled', false)
  $('#by-key').prop('disabled', false)
  $('#rules-yes').prop('toggled', true)
  $('#by-syntax').prop('toggled', true)
  $('#method-init').prop('toggled', false)
  $('#method-cron').prop('toggled', false)
  $('#method-mute').prop('toggled', false)
  $('#method-unmute').prop('toggled', false)
  $('#method-onclose').prop('toggled', false)
  $('#method-subspeak').prop('toggled', false)
  $('#method-subplay').prop('toggled', false)
  $('#method-addwidget').prop('toggled', false)
  $('#method-timeout').prop('toggled', false)
  let s = cyCreateNodeImage.$('#'+"image-node");
  style = {
      'background-image': "url('"+'../images/icons/plugin.png'+"')"
  };
  s.style(style);
  s.data('image', "by default")

  $('#html-doc-yes').prop('toggled', false)
  $('#html-doc-no').prop('toggled', true)
  $('#plugin-documentation-name').prop('disabled', false)
  $('#plugin-documentation-name').prop('value', "")
  $('#plugin-documentation-name').prop('disabled', true)
  $('#http-doc-server').prop('disabled', false)
  $('#http-doc-server').prop('toggled', false)
  $('#http-doc-server').prop('disabled', true)
}


const resumeCreation = async () => {

  let yes = await Lget("pluginStudio", "rulesYes")
  let no = await Lget("pluginStudio", "rulesNo")
  let info = $('#plugin-name').prop('value')
  let msg = await Lget("pluginStudio", "pluginName", info)
  $('#resume-name').html(msg)
  msg = await Lget("pluginStudio", "pluginLabelIdem")
  info = $('#plugin-label').prop('value') !== "" ? $('#plugin-label').prop('value') : msg
  msg = await Lget("pluginStudio", "pluginLabel", info)
  $('#resume-label').html(msg)
  info = $('#rules-yes').prop('toggled') ? yes : no
  msg = await Lget("pluginStudio", "vocalRule", info)
  $('#resume-rules').html(msg)
  if ($('#rules-yes').prop('toggled')) {
    let bySyntax = await Lget("pluginStudio", "bySyntax")
    let byKey = await Lget("pluginStudio", "byKey")
    info = $('#by-syntax').prop('toggled') ? bySyntax : byKey
    msg = await Lget("pluginStudio", "ruleType", info)
    $('#resume-search-rules').html(msg)
  } else {
    msg = await Lget("pluginStudio", "vocalRules")
    $('#resume-multi-rules').html(msg)
    msg = await Lget("pluginStudio", "searchRules")
    $('#resume-search-rules').html(msg)
  }
  info = ($('#method-init').prop('toggled') 
    || $('#method-cron').prop('toggled')
    || $('#method-langpak').prop('toggled')
    || $('#method-mute').prop('toggled')
    || $('#method-unmute').prop('toggled')
    || $('#method-onclose').prop('toggled')
    || $('#method-subspeak').prop('toggled')
    || $('#method-subplay').prop('toggled')
    || $('#method-addwidget').prop('toggled')
    || $('#method-timeout').prop('toggled')) ? yes : no
  msg = await Lget("pluginStudio", "methods", info)
  $('#resume-method').html(msg)

  let s = cyCreateNodeImage.$('#'+"image-node");
  info = s.data('image')
  if (info === "by default") info = await Lget("pluginStudio", "defaultImage")
  msg = await Lget("pluginStudio", "image", info)
  $('#resume-image').html(msg)

  info = $('#html-doc-yes').prop('toggled') ? yes : no
  msg = await Lget("pluginStudio", "documentation", info)
  $('#resume-documentation').html(msg)
  if ($('#html-doc-yes').prop('toggled')) {
    info = $('#plugin-documentation-name').prop('value')
    msg = await Lget("pluginStudio", "start", info)
    $('#resume-page-documentation').html(msg)
    info = $('#http-doc-server').prop('toggled') ? yes : no
    msg = await Lget("pluginStudio", "httpserver", info)
    $('#resume-server-documentation').html(msg)
  }
  else {
    msg = await Lget("pluginStudio", "noStart")
    $('#resume-page-documentation').html(msg)
    msg = await Lget("pluginStudio", "nohttpserver")
    $('#resume-server-documentation').html(msg)
  }
}


async function addPluginsButton () {
  plugins = await window.electronAPI.getPlugins();
  let divSize = document.getElementById('cy-plugins').style.height = document.getElementById('cy-plugins-div').style.height;
  let pos = 35;
  for (let plugin in plugins) {
    addCYButton(cyPlugins, plugins[plugin].image, plugins[plugin].id, plugins[plugin].name, pos, 'plugin');
    pos += 85;
    if (divSize < pos + 35) {
      document.getElementById('cy-plugins').style.height = (pos - 20)+"px";
    }
  }
}


document.getElementById('help').addEventListener('mouseover', async (event) => {
  tooltipShow (event, 'help', await Lget("pluginStudio", "auditPluginHelp"));
})


function tooltipShow(event, type, txt) {

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


window.electronAPI.onInitApp(async (_event, arg) => {

  interfaceProperties = arg.nodes;
  setSettingsXel(arg.interface);
  setLangTargets();
  cyCreatePlugin = await setCY('cy-create-plugin');
  cyPlugins = await setCY('cy-plugins');
  let msg = await Lget("pluginStudio", "createPlugin");
  addCYButton(cyCreatePlugin, '../images/icons/createPlugin.jpg', 'createPlugin', msg, 30, 'create-plugin');
  msg = await Lget("pluginStudio", "auditPlugin");
  addCYButton(cyCreatePlugin, '../images/icons/auditPlugin.jpg', 'auditPlugin', msg, 110, 'audit-plugin');
  addPluginsButton();
  addCreateNodeImage();
  initPlugintStudio();
})


function initPlugintStudio() {

  var current_fs, next_fs, previous_fs, first_fs, second_fs;
  var left, opacity;
  var animating;

  $(".steps").validate({
    errorClass: 'invalid',
    errorElement: 'span',
    errorPlacement: function(error, element) {
        error.insertAfter(element.next('span').children());
    },
    highlight: function(element) {
        $(element).next('span').show();
    },
    unhighlight: function(element) {
        $(element).next('span').hide();
    }
});
$(".create-next").click(async function() {
    $(".steps").validate({
        errorClass: 'invalid',
        errorElement: 'span',
        errorPlacement: function(error, element) {
            error.insertAfter(element.next('span').children());
        },
        highlight: function(element) {
            $(element).next('span').show();
        },
        unhighlight: function(element) {
            $(element).next('span').hide();
        }
    });
    if ($(this).attr('id') === '1-button') {
      if (!first_fs) {
        first_fs = $(this).parent();
        second_fs = $(this).parent().next();
      }
      if (inputPluginName.value.length === 0) {
        let msg = await Lget("pluginStudio", "warmMsg0")
        inputPluginName.setCustomValidity(msg);
        inputPluginName.focus()
        return false;
      } else {
        let result = await window.electronAPI.isPluginExist(inputPluginName.value)
        if (result) {
          let msg = await Lget("pluginStudio", "warmMsg1", inputPluginName.value)
          inputPluginName.setCustomValidity(msg);
          inputPluginName.focus()
          return false
        }
        inputPluginName.setCustomValidity("");
      }
    }
    if ($(this).attr('id') === '4-button') {
      if ($('#html-doc-yes').prop('toggled') && $(this).attr("alt") === "verif-doc" && inputPluginDocumentationName.value.length === 0) {
        let msg = await Lget("pluginStudio", "warmMsg2")
        inputPluginDocumentationName.setCustomValidity(msg);
        inputPluginDocumentationName.focus()
        return false;
      } else {
        inputPluginDocumentationName.setCustomValidity("");
      }
    }
    if ((!$('.steps').valid())) {
        return true;
    }
    if (animating) return false;
    animating = true;
    current_fs = $(this).parent();
    next_fs = $(this).parent().next();
    $("#progressbar li").eq($("fieldset").index(next_fs)).addClass("active");
    next_fs.show();
    current_fs.animate({
        opacity: 0
    }, {
        step: function(now, mx) {
            left = (now * 50) + "%";
            opacity = 1 - now;
            next_fs.css({
                'left': left,
                'opacity': opacity
            });
        },
        duration: 800,
        complete: function() {
            current_fs.hide();
            animating = false;
        },
        easing: 'easeInOutExpo'
    });
    if ($(this).attr('id') === '4-button') {
      resumeCreation();
    }
    if ($(this).attr('id') === 'submit') {
      $("#6-li").removeClass("active");
      $("#6-fs").attr("style", "display: none");
      $("#6-fs").attr("style", "opacity: 0");
      $("#6-fs").attr("style", "transform: scale(1)");

      $("#5-li").removeClass("active");
      $("#5-fs").attr("style", "display: none");
      $("#5-fs").attr("style", "opacity: 0");
      $("#5-fs").attr("style", "transform: scale(1)");

      $("#4-li").removeClass("active");
      $("#4-fs").attr("style", "display: none");
      $("#4-fs").attr("style", "opacity: 0");
      $("#4-fs").attr("style", "transform: scale(1)");

      $("#3-li").removeClass("active");
      $("#3-fs").attr("style", "display: none");
      $("#3-fs").attr("style", "opacity: 0");
      $("#3-fs").attr("style", "transform: scale(1)");

      $("#2-li").removeClass("active");
      $("#2-fs").attr("style", "display: none");
      $("#2-fs").attr("style", "opacity: 0");
      $("#2-fs").attr("style", "transform: scale(1)");

      $("#1-fs").attr("style", "display: block");
      $("#1-fs").attr("style", "opacity: 1");
      $("#1-fs").attr("style", "transform: scale(1)");

      resetCreatePluginForm()
    }
  });
  $(".create-previous").click(function() {
      if (animating) return false;
      animating = true;
      current_fs = $(this).parent();
      previous_fs = $(this).parent().prev();
      $("#progressbar li").eq($("fieldset").index(current_fs)).removeClass("active");
      previous_fs.show();
      current_fs.animate({
          opacity: 0
      }, {
          step: function(now, mx) {
              left = ((1 - now) * 50) + "%";
              opacity = 1 - now;
              current_fs.css({
                  'left': left
              });
              previous_fs.css({
                  'opacity': opacity
              });
          },
          duration: 800,
          complete: function() {
              current_fs.hide();
              animating = false;
          },
          easing: 'easeInOutExpo'
      });
  });
  
}
