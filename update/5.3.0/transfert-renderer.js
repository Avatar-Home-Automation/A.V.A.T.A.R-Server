let plugin;

window.onbeforeunload = async (e) => {
    e.returnValue = false;
    window.electronAPI.quitTransfert();
}


document.getElementById("exit").addEventListener("click", async (event) => {
    window.dispatchEvent(new Event ('beforeunload'));
})


document.getElementById("transfert").addEventListener("click", async (event) => {
    let client;
    const items = document.getElementsByClassName("client");
    for (let i in items) {
        if (items[i].value !== 'choose-client' && items[i].toggled) {
            client = items[i].value;
            break;
        }
    }

    if (!client) return notification(await Lget("transfert.noClient"), true);  

    document.getElementById('execute-label').innerHTML = await Lget("transfert.exec");

    const result = await window.electronAPI.transfertPlugin({plugin: plugin, client: client, backup: document.getElementById("backup-plugins").toggled, restart: document.getElementById("restart-client").toggled})
    if (result === true) {
        document.getElementById('execute-label').innerHTML = await Lget("transfert.done", client); 
        document.getElementById('execute-label').setAttribute("class", "blink");
    } else {
        document.getElementById('execute-label').innerHTML = await Lget("transfert.errorLabel", client);
        notification(await Lget("transfert.error", result), true);  
    }

})


const refreshMessage = () => {
    document.getElementById('execute-label').innerHTML = "";
    document.getElementById('execute-label').setAttribute("class", "");
}


const notification = (msg, err) => {
    const notif = document.getElementById('notification');
    notif.style.color = (err) ? 'red' : 'rgba(255, 255, 255, 0.9)';
    if (notif.opened == true) notif.opened = false;
    notif.innerHTML = msg;
    notif.opened = true;
}


const setHTMLContent = async (clients) => {
    const menuOn = document.getElementById('clients');
    for (let i in clients) {
        let itemOn = document.createElement("x-menuitem");
        itemOn.setAttribute('id', clients[i]);
        itemOn.setAttribute("class", "client");
        itemOn.value = clients[i];
        itemOn.onclick = () => refreshMessage();
        let labelOn = document.createElement("x-label");
        labelOn.innerHTML = clients[i];
        itemOn.appendChild(labelOn);
        menuOn.appendChild(itemOn);
    }

    const item = document.getElementsByClassName("client");
    item[0].toggled = true;
    item[0].addEventListener("click", () => refreshMessage());
}


const setLangTargets = async () => {
   document.getElementById('label-quit').innerHTML = await Lget("transfert.quit");
   document.getElementById('label-transfert').innerHTML = await Lget("transfert.do");
   document.getElementById('select-client-label').innerHTML = await Lget("transfert.selectClientLabel");
   document.getElementById('select-client-msg').innerHTML = await Lget("transfert.clientMsg");
   document.getElementById('label-backup').innerHTML = await Lget("transfert.backup", plugin);
   document.getElementById('label-restart-client').innerHTML = await Lget("transfert.restart");
}


const Lget = async (target, ...args) => {

    if (args) {
        target = [target];
        args.forEach(arg => {
            target.push(arg);
        })
    } 
    return await window.electronAPI.getMsg(target);
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


window.electronAPI.onInitApp(async (_event, plug, clients, interface) => {
    plugin = plug;
    await setSettingsXel(interface);
    await setLangTargets();
    await setHTMLContent(clients);
    
})