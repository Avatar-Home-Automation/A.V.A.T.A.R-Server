window.onbeforeunload = async (e) => {
    e.returnValue = false;
    window.electronAPI.quit();
};

window.onload = (e) => {
    e.returnValue = false;
    setTimeout(() => {
        let rde = document.getElementsByClassName("rde-top-bar-height")[0];
        rde.parentNode.removeChild(rde);
    }, 800);
};

document.querySelector("#position").addEventListener("click", () => {
    window.electronAPI.setPosition();
    notification("savePosition");
});

document.querySelector("#btn-search").addEventListener("click", () => {
    let inputRadio = document.querySelector("#input-searchRadio").value;
    if (inputRadio) {
        document.querySelector("#input-searchRadio").value = "";
        searchRadios(inputRadio);
    }
});

document.querySelector("#exit").addEventListener("click", () => {
    window.electronAPI.quit();
});

document.querySelector("#input-searchRadio").addEventListener("keyup", (_event) => {
    let inputRadio = "";
    if (_event.key === "Enter") {
        inputRadio = document.querySelector("#input-searchRadio").value;
        if (inputRadio) {
            document.querySelector("#input-searchRadio").value = "";
            searchRadios(inputRadio);
        }
    }
});

async function Lget(target, ...args) {
    if (args) {
        target = [target];
        args.forEach((arg) => {
            target.push(arg);
        });
    }
    return await window.electronAPI.getMsg(target);
}

async function setElementLabel() {
    document.querySelector("#label-radio").innerHTML = await Lget("label.radio");
    document.querySelector("#menu-radio").title = await Lget("label.select");
    document.querySelector("#position").title = await Lget("label.position");
    document.querySelector("#exit").title = await Lget("label.exit");
    document.querySelector("#input-searchRadio").setAttribute("placeholder", await Lget("label.search"));

    let listeRadio = await window.electronAPI.searchTop()
    let menu = document.querySelector("#menu-radio");
    let item = document.createElement("x-menuitem");

    let label = document.createElement("x-label");
        label.innerHTML = await Lget('label.select');
        label.setAttribute('value', await Lget('label.select'));

        item.appendChild(label);
        menu.appendChild(item);

        item.setAttribute('toggled', '');

        for (let i in listeRadio) {

        let name = listeRadio[i].name;
        let image = listeRadio[i].image;
        let url = listeRadio[i].url;

        let radio = url.split("/");

        let item = document.createElement("x-menuitem");
        item.setAttribute("id", i);
        item.title = i;
        item.value = name;
        item.onclick = () => {
            window.electronAPI.getSelected(radio[radio.length -1]);
        };

         let icon = document.createElement("img");
             icon.setAttribute("src", image);
             item.appendChild(icon);
         let label = document.createElement("x-label");
         label.innerHTML = name;
        
         item.appendChild(label);
         menu.appendChild(item);
    }    
}

async function createPlayer() {
    let listeRadio = await window.electronAPI.getList();
    let s;

    s = document.createElement("script");
    s.type = "text/javascript";
    s.async = true;
    s.id = "radio-de-embedded";
    s.src = "https://www.radio.fr/inc/microsite/js/full.js";
    document.getElementsByTagName("head")[0].appendChild(s);

    let player = document.querySelector("#player");
    player.className = "ng-app-embedded";
    let ui = document.createElement("div");
    ui.id = "ui";
    ui.className = "microsite embedded-radio-player";
    ui.setAttribute("ui-view", "");
    ui.setAttribute("data-playerwidth", "320px");
    ui.setAttribute("data-playertype", "web_embedded");
    ui.setAttribute("data-playstation", listeRadio.selection.radio);
    ui.setAttribute("data-autoplay", true);
    ui.setAttribute("data-apikey", "df04ff67dd3339a6fc19c9b8be164d5b5245ae93");
    player.appendChild(ui);
}

async function searchRadios(radio) {
    const result = await window.electronAPI.searchRadio(radio);
    let menu = document.querySelector("#menu-radio");

    for (let i in result) {
        let r = result[i];
        let item = document.createElement("x-menuitem");

        item.setAttribute("id", r.name);
        item.value = r.id;
        item.title = r.name;
        item.onclick = () => {
            window.electronAPI.getSelected(r.id);
        };

        let icon = document.createElement("img");
        icon.setAttribute("src", "https://station-images-prod.radio-assets.com/175/" + r.id + ".png");
        item.appendChild(icon);

        let label = document.createElement("x-label");
        label.innerHTML = r.name;
        item.appendChild(label);
        menu.appendChild(item);
    }
    document.querySelector("#input-searchRadio").setAttribute("placeholder", await Lget("label.resultSearch"));
    setInterval(async () => {
        document.querySelector("#input-searchRadio").setAttribute("placeholder", await Lget("label.search"));
    }, 6000);
}

async function notification(msg) {
    const notif = await window.electronAPI.getConfig();

    let notification = document.querySelector("#notification");
    notification.setAttribute("timeout", notif.config.notification);
    notification.innerHTML = await Lget("notification." + msg);
    notification.opened = true;
}

window.electronAPI.onInitWebRadio((_event) => {
    setElementLabel();
    createPlayer();
});
