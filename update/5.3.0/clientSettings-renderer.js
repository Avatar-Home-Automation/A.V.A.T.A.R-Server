let appProperties;
let client;
let virtuals = [];
let cyNodeImage;
let pathSep;
let dirname;

document.body.addEventListener('click', removeClient, false)

window.onbeforeunload = async (e) => {
    e.returnValue = false;
    window.electronAPI.quitSettings();
}


document.getElementById("exit").addEventListener("click", async (event) => {
    window.dispatchEvent(new Event ('beforeunload'))
})


document.getElementById("save-properties").addEventListener("click", async (event) => {
    try {
        let image = await updateProperties((client.type === 'classic') ? true : false);
        await window.electronAPI.applyProperties({reason: 'save', app: (client.type === 'classic') ? appProperties : null, imageNode: {name: client.name, client: client.id, image: image}})
    } catch(err) {
        notification('Error: '+err, true);
    }
})


 document.getElementById("apply-properties").addEventListener("click", async (event) => {
    let s = cyNodeImage.$('#'+"image-node");
    let image = s.data('image');
    window.electronAPI.applyProperties({reason: 'test', imageNode: {name: client.name, client: client.id, image: image}})
 }) 


 async function updateProperties(isApp) {
    if (isApp === true) {
        appProperties.virtual = appProperties.virtual.filter((item) => item.split(',')[1].toLowerCase() !== client.name.toLowerCase())
        let values = document.getElementById('virtual-list').value;
        values.forEach(value => {
            appProperties.virtual.push(`${value},${client.name}`);
        })
    }
    
    let s = cyNodeImage.$('#'+"image-node");
    let image = s.data('image');
    return (image.indexOf("images/rooms/"+client.id+".") === -1) ? image : 'noChange'
}


function notification (msg) {
    let notif = document.getElementById('notification');
    if (notif.opened == true) notif.opened = false;
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


document.getElementById('select-image-node').addEventListener('click', async () => {
    let file = await window.electronAPI.openImageFile();
    if (file) {
        let image = new URL(file);
        let s = cyNodeImage.$('#'+"image-node");
        style = {
            'background-image': image
        };
        s.data('image', file);
        s.style(style);
    }
}); 



async function addNodeImage() {
    let flag = await isPluginImage();
    cyNodeImage = await setCY('cy-image-node');
    cyNodeImage.add(
      { group: "nodes",
        data: { id: "image-node", name: "image-node"}
      }
    );
    let s = cyNodeImage.$('#'+"image-node");
    style = {
        'background-image': (flag === true) ? "url('../images/rooms/"+client.id+".png')" : "url('../images/rooms/default.png')",
        'width': 120,
        'height': 120
    };

    s.style(style);
    s.data('image', ((flag === true) ? "../images/rooms/"+client.id+".png" : "../images/rooms/default.png"));
    s.renderedPosition('x', 60);
    s.renderedPosition('y', 60);
    s.lock();
  
}
 

function showTab(settingType) {
    if (settingType === "virtual-tab") {
        document.getElementById("image-tab").style.display = "none";
        document.getElementById("apply-properties").style.display = "none";
        document.getElementById("virtual-tab").style.display = "block";
    } else {
        document.getElementById("virtual-tab").style.display = "none";
        document.getElementById("apply-properties").style.display = "";
        document.getElementById("image-tab").style.display = "block";
    }
}
document.getElementById("virtual").addEventListener("click", () => {
    showTab("virtual-tab");
})
document.getElementById("image").addEventListener("click", () => {
    showTab("image-tab");
})


window.electronAPI.clientSettingsSaved(async (_event) => {
    notification(await Lget("settings", "saved"))
})


let input = document.querySelector("x-tagsinput")
input.addEventListener("add", (event) => {
    let addedTag = event.detail;
    if (addedTag.querySelector("x-label").textContent.toLowerCase() === client.name.toLowerCase()) {
        return addedTag.remove()
    }

    for (let tag of input.children) {
        if (
            tag.querySelector("x-label").textContent.toLowerCase() ===
            addedTag.querySelector("x-label").textContent.toLowerCase()
        ) {
            addedTag.replaceWith(tag);
            break;
        }
    }
})


async function removeClient(event) {
    if (event.target && event.target.innerHTML) {
        let xMenus = document.getElementById("virtual-list").childNodes;
        for (var i = 0; i < xMenus.length; i++) {
            if (event.target.innerHTML === xMenus[i].value) {
                document.getElementById('label-delete').innerHTML = await Lget("clientSettings", "remove", xMenus[i].value)
                return;
            }
        }
    }
    
    document.getElementById('label-delete').innerHTML = await Lget("clientSettings", "removeall")
}


document.getElementById('delete-clic').addEventListener('click', async () => {

    let xMenus = document.getElementById("virtual-list").childNodes;
    let remove = document.getElementById("label-delete").innerHTML;
    
    if (remove === await Lget("clientSettings", "removeall")) {
        for (var i = xMenus.length -1; i > -1; i--) {
            xMenus[i].remove()
        }
    } else {
        for (var i = 0; i < xMenus.length; i++) {
            if (remove === await Lget("clientSettings", "remove", xMenus[i].value)) {
                xMenus[i].remove()
                break;
            }
        }
    }
})



async function setHTMLContent() {

    if (client.type === 'classic')  {
        var input = document.querySelector("x-tagsinput");
        appProperties.virtual.forEach((couple) => {
            if (couple.split(',')[1] === client.name) {
                let virtual = couple.split(',')[0]
                let addedTag = document.createElement("x-tag");
                addedTag.onclick = async () => {
                    document.getElementById('label-delete').innerHTML = `Remove ${virtual}`
                }
                addedTag.value = virtual;
                addedTag.className = 'virtual'
                addedTag.innerHTML = `<x-label>${virtual}</x-label>`;
                input.appendChild(addedTag);
            }
        })

        document.getElementById('label-virtual3').innerHTML = await Lget("clientSettings", "labelVirtualClients", client.name)
    } else {
        document.getElementById("apply-properties").style.display = ""
        document.getElementById("virtual-tab").style.display = "none"
        document.getElementById("virtual").style.display = "none"
        document.getElementById("image-tab").style.display = "block"
        document.getElementById("virtual").toggled = false
        document.getElementById("image").toggled = true
    }

}


async function setLangTargets() {

  document.getElementById('tab-virtual-label').innerHTML = await Lget("clientSettings", "titleVirtualClients")
  document.getElementById('tab-image-label').innerHTML = await Lget("clientSettings", "titleImageClient")
  
  document.getElementById('test').innerHTML = await Lget("settings", "test")
  document.getElementById('label-save-properties').innerHTML = await Lget("settings", "saveproperties")
  document.getElementById('label-quit').innerHTML = await Lget("settings", "quit")

  document.getElementById('title-label-virtual').innerHTML = await Lget("clientSettings", "titleVirtualClients")

  document.getElementById('label-virtual').innerHTML = await Lget("clientSettings", "virtualClient1")
  document.getElementById('label-virtual1').innerHTML = await Lget("clientSettings", "virtualClient2")
  document.getElementById('label-virtual2').innerHTML = await Lget("clientSettings", "virtualClient3")
  document.getElementById('label-virtual4').innerHTML = await Lget("clientSettings", "virtualClient4")
  
  document.getElementById('label-image-client').innerHTML = await Lget("clientSettings", "labelImageClient", client.name)
  document.getElementById('label-select-image-node').innerHTML = await Lget("clientSettings", "labelImageNode")

  document.getElementById('label-delete').innerHTML = await Lget("clientSettings", "removeall")

}


async function Lget (top, target, param) {
    if (param) {
        return await window.electronAPI.getMsg([top+"."+target, param])
    } else {
        return await window.electronAPI.getMsg(top+"."+target)
    }
}


function ImageExist(url) {
    return new Promise((resolve) => {
        let test = new Image()
        test.onload = () => { resolve (true) }
        test.onerror = () => { resolve (false) }
        test.src = url;
    });
}


async function isPluginImage() {
    let fileName = (window.location.href).replace('file:///', '');
    fileName = fileName.replace('html/clientSettings.html', 'images/rooms/'+client.id+".png");
    let flag = await ImageExist(fileName);
    return flag;
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
    appProperties = arg.properties;
    client = arg.node;
    pathSep = arg.sep;
    await setSettingsXel(arg.interface);
    setLangTargets();
    setHTMLContent();
    addNodeImage();
})
  

