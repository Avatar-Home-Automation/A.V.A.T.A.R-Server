let password;

window.onbeforeunload = async (e) => {
    e.returnValue = false;
    window.electronAPI.quitEncrypt();
}


document.getElementById("exit").addEventListener("click", async (event) => {
    window.dispatchEvent(new Event ('beforeunload'));
})


document.getElementById("exit-passwd").addEventListener("click", async (event) => {
    window.dispatchEvent(new Event ('beforeunload'));
})


document.getElementById("encrypt").addEventListener("click", async (event) => {
    if (document.getElementById("encrypt-input").value !== '') {
        try {
            const value = await window.electronAPI.encryptString(document.getElementById("encrypt-input").value);
            if (!value) throw new Error (await Lget ("encrypt", "error"));
            
            document.getElementById("decrypt-input").value = value;
        } catch (err) {
            notification (await Lget ("encrypt", "encryptError", err), true);
        }
    }
})


document.getElementById("decrypt").addEventListener("click", async (event) => {
    if (document.getElementById("decrypt-input").value !== '') {
        try {
            //let encrypted = document.getElementById("decrypt-input").value.split(',');
            const value = await window.electronAPI.decryptString(document.getElementById("decrypt-input").value)
            if (!value) throw new Error (await Lget ("encrypt", "error"));

            document.getElementById("encrypt-input").value = value;
        } catch (err) {
            notification (await Lget ("encrypt", "decryptError", err), true);
        }
    }
})



document.getElementById("quit").addEventListener("click", async (event) => {
    document.getElementById("buttons-manage-param").style.display = "none";
    document.getElementById("parameter-box").style.display = "none";
    document.getElementById("encrypt-box").style.display = "block";
    document.getElementById("buttons-manage").style.display = "flex";
})



document.getElementById("save-passwd").addEventListener("click", async (event) => {
    if (document.getElementById("passwd-param-input").value !== '') {
        try {
            await window.electronAPI.saveEncrytPasswdWin(document.getElementById("passwd-param-input").value);
            document.getElementById("delete-passwd").style.display = "flex";
            notification(await Lget ("encrypt", "saveEncrytPasswd"));
        } catch (err) {
            notification (await Lget ("encrypt", "saveEncrytPasswdError", err), true);
        }
    }
})


document.getElementById("delete-passwd").addEventListener("click", async (event) => {
    try {
        await window.electronAPI.deleteEncrytPasswdWin();
        document.getElementById("delete-passwd").style.display = "none";
        notification(await Lget ("encrypt", "deleteEncrytPasswd"));
    } catch (err) {
        notification (await Lget ("encrypt", "deleteEncrytPasswdError", err), true);
    }
})


document.getElementById("valid-passwd").addEventListener("click", async (event) => {
    if (document.getElementById("passwd-input").value !== '') {
        if (document.getElementById("passwd-input").value === password) {
            document.getElementById("passwd-box").style.display = "none";
            document.getElementById("buttons-valid-passwd").style.display = "none";
            document.getElementById("buttons-manage-param").style.display = "none";
            document.getElementById("encrypt-box").style.display = "block";
            document.getElementById("buttons-manage").style.display = "flex";
        } else {
            notification (await Lget ("encrypt", "verifPasswdError"), true);
        }
    }
})


document.getElementById("parameter").addEventListener("click", async (event) => {
    document.getElementById("encrypt-box").style.display = "none";
    document.getElementById("passwd-box").style.display = "none";
    document.getElementById("buttons-manage").style.display = "none";
    document.getElementById("parameter-box").style.display = "block";
    document.getElementById("buttons-manage-param").style.display = "flex";
})



async function setLangTargets() {

    document.getElementById("parameter-box").style.display = "none";
    document.getElementById("buttons-manage-param").style.display = "none";
    document.getElementById("buttons-valid-passwd").style.display = "none";

    document.getElementById('quit-passwd-label').innerHTML = 
    document.getElementById('label-quit').innerHTML =  
    document.getElementById('exit-passwd-label').innerHTML = await Lget("encrypt", "exit");

    document.getElementById('label-parameter').innerHTML = await Lget("encrypt", "parameter");
    document.getElementById('passwd-label').innerHTML = await Lget("encrypt", "password");
    document.getElementById('label-valid-passwd').innerHTML = await Lget("encrypt", "validPassword");
    document.getElementById('encrypt-label').innerHTML = await Lget("encrypt", "decryptValue");
    document.getElementById('decrypt-label').innerHTML = await Lget("encrypt", "cryptValue");
    document.getElementById('encrypt-button-label').innerHTML = await Lget("encrypt", "encrytButton");
    document.getElementById('decrypt-button-label').innerHTML = await Lget("encrypt", "decryptButton");
    document.getElementById('passwd-param-input-label').innerHTML = await Lget("encrypt", "createPasswd");
    document.getElementById('delete-passwd-label').innerHTML = await Lget("encrypt", "deletePasswd");
    document.getElementById('save-passwd-label').innerHTML = await Lget("encrypt", "savePasswd");
    document.getElementById('save-passwd-label').innerHTML = await Lget("encrypt", "savePasswd");
    
}


async function Lget (top, target, param, param1) {
    if (param) {
        if (param1)
             return await window.electronAPI.getMsg([top+"."+target, param, param1])
        else
             return await window.electronAPI.getMsg([top+"."+target, param])
    } else {
        return await window.electronAPI.getMsg(top+"."+target)
    }
}


function notification (msg, err) {
    let notif = document.getElementById('notification');
    notif.style.color = (err) ? 'red' : 'rgba(255, 255, 255, 0.9)';
    if (notif.opened === true) notif.opened = false;
    notif.innerHTML = msg;
    notif.opened = true;
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


window.electronAPI.onInitApp(async (_event, passwd, interface) => {
    await setSettingsXel(interface);
    await setLangTargets();
    if (passwd) {
        document.getElementById("encrypt-box").style.display = "none";
        document.getElementById("buttons-manage").style.display = "none";
        document.getElementById("passwd-box").style.display = "flex";
        document.getElementById("buttons-valid-passwd").style.display = "flex";
        document.getElementById("delete-passwd").style.display = "flex";
        password = passwd;
    } else {
        document.getElementById("passwd-box").style.display = "none";
        document.getElementById("encrypt-box").style.display = "block";
    }
})