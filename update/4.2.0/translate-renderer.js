var langs;

window.onbeforeunload = async (e) => {
    e.returnValue = false;
    window.electronAPI.quitTranslate();
}


document.getElementById("exit").addEventListener("click", async (event) => {
    window.dispatchEvent(new Event ('beforeunload'));
})


document.getElementById("translate").addEventListener("click", async (event) => {
    
    if (document.getElementById('translate-input').value !== "") {
        const item = document.getElementsByClassName("item-language");
        let i;
        for (i = 0; i < item.length; i++) {
            if (item[i].toggled) {
              break;
            }
        }

        const result = await window.electronAPI.translate({language: item[i].id, sentence: document.getElementById('translate-input').value})
        if (!result) {
            notification(await Lget("translate", "translateError"), true);  
        } else {
            document.getElementById('translated-output').value = result;
        }
    }


})


const notification = (msg, err) => {
    const notif = document.getElementById('notification');
    notif.style.color = (err) ? 'red' : 'rgba(255, 255, 255, 0.9)';
    if (notif.opened == true) notif.opened = false;
    notif.innerHTML = msg;
    notif.opened = true;
}


const setHTMLContent = async () => {

    const menuOn = document.getElementById('BCP47');
    for (let i in langs) {
        let itemOn = document.createElement("x-menuitem");
        itemOn.setAttribute('id', langs[i]);
        itemOn.setAttribute("class", "item-language");
        itemOn.value = langs[i];
        let labelOn = document.createElement("x-label");
        labelOn.innerHTML = langs[i];
        itemOn.appendChild(labelOn);
        menuOn.appendChild(itemOn);

        if (langs[i]===language)  itemOn.toggled = true;
    }

    const item = document.getElementsByClassName("item-language");
    item[0].toggled = true;

}


const setLangTargets = async () => {
   document.getElementById('translate-label').innerHTML = await Lget("translate", "translateLabel");
   document.getElementById('translate-button-label').innerHTML = await Lget("translate", "translateButton");
   document.getElementById('label-quit').innerHTML = await Lget("translate", "quitButton");
   document.getElementById('translated-output-label').innerHTML = await Lget("translate", "translatedLabel");
   document.getElementById('lang-select').innerHTML = await Lget("translate", "langSelect");
}


const Lget = async (top, target, param, param1) => {
    if (param) {
        if (param1)
             return await window.electronAPI.getMsg([top+"."+target, param, param1])
        else
             return await window.electronAPI.getMsg([top+"."+target, param])
    } else {
        return await window.electronAPI.getMsg(top+"."+target)
    }
}


window.electronAPI.onInitApp(async (_event, lg, lgs) => {
    language = lg;
    langs = lgs;
    await setLangTargets();
    await setHTMLContent();
    
})