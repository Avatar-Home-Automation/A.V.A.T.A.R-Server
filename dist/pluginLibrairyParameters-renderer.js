document.body.addEventListener('click', removeClient, false)

async function removeClient(event) {
    if (event.target && event.target.innerHTML) {
        let xMenus = document.getElementById("ignored-contrib").childNodes;
        for (var i = 0; i < xMenus.length; i++) {
            if (event.target.innerHTML === xMenus[i].value) {
                document.getElementById('label-delete').innerHTML = await Lget("pluginLibrairy", "remove", xMenus[i].value)
                return;
            }
        }
    }
    
    document.getElementById('label-delete').innerHTML = await Lget("pluginLibrairy", "removeall")
}


document.getElementById('delete-clic').addEventListener('click', async () => {

    let xMenus = document.getElementById("ignored-contrib").childNodes;
    let remove = document.getElementById("label-delete").innerHTML;
    
    if (remove === await Lget("pluginLibrairy", "removeall")) {
        for (var i = xMenus.length -1; i > -1; i--) {
            xMenus[i].remove()
        }
    } else {
        for (var i = 0; i < xMenus.length; i++) {
            if (remove === await Lget("pluginLibrairy", "remove", xMenus[i].value)) {
                xMenus[i].remove()
                break;
            }
        }
    }
})

document.getElementById("save-button").addEventListener("click", async (event) => {
    let contributors = document.getElementById("ignored-contrib").value
    let isRemember = document.getElementById('remember').toggled
    let result = await window.electronAPI.applyProperties({contributors: contributors, isRemember: !isRemember})
    let message
    if (result === true) 
         message = await Lget("pluginLibrairy", "paramsSaved")
    else
        message = await Lget("pluginLibrairy", "saveParamsError")

    let notification = document.getElementById('notification')
    notification.innerHTML = message
    notification.opened = true
})


window.electronAPI.onGithubParams(async (_event, arg) => {

    setLangTargets()

    document.getElementById('remember').toggled = !arg.isRemember
    
    let contributors = document.getElementById('ignored-contrib')
    arg.contributors.forEach(contributor => {
        let addedTag = document.createElement("x-tag");
        addedTag.value = contributor;
        addedTag.className = 'contributor'
        addedTag.innerHTML = `<x-label>${contributor}</x-label>`;
        contributors.appendChild(addedTag);
    })
})


document.getElementById("exit-button").addEventListener("click", async (event) => {
    window.dispatchEvent(new Event('beforeunload'))
})


window.onbeforeunload = async (e) => {
    e.returnValue = false;
    window.electronAPI.quitPluginLibrairyParameters()
}


async function setLangTargets() {
    document.getElementById('remember-label').innerHTML = await Lget("pluginLibrairy", "remember")
    document.getElementById('ignored-contrib-label').innerHTML = await Lget("pluginLibrairy", "contribIgnore")
    document.getElementById('save').innerHTML = await Lget("pluginLibrairy", "save")
    document.getElementById('exit').innerHTML = await Lget("pluginLibrairy", "quit")
    document.getElementById('label-delete').innerHTML = await Lget("pluginLibrairy", "removeall")
}
  
  
async function Lget (top, target, param) {
    if (param) {
        return await window.electronAPI.getMsg([top+"."+target, param])
    } else {
        return await window.electronAPI.getMsg(top+"."+target)
    }
}