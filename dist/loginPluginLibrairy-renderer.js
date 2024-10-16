let loginSaved, connexion, verify, denied

window.onbeforeunload = async (e) => {
    e.returnValue = false;
    window.electronAPI.closeGithubLogin(loginSaved)
}


$('#close-dialog').click(function(){
    window.dispatchEvent(new Event ('beforeunload'))
})
  
$('#email').click(function(){
    if (document.getElementById("go").className == "denied") {
        document.getElementById("go").className = "";
        document.getElementById("go").value = connexion;
        document.getElementById("email").value = "";
        document.getElementById("password").value = "";
        document.getElementById("litheader").className = "";
    }
})

$('#password').click(function(){
    if (document.getElementById("go").className == "denied") {
        document.getElementById("go").className = "";
        document.getElementById("go").value = connexion;
        document.getElementById("email").value = "";
        document.getElementById("password").value = "";
        document.getElementById("litheader").className = "";
    }
})


async function Lget (top, target) {
    return await window.electronAPI.getMsg(top+"."+target)
}


async function setLangTargets() {
    document.getElementById('email').placeholder = await Lget("loginPluginLibrairy", "access")
    document.getElementById('password').placeholder = await Lget("loginPluginLibrairy", "password")
    document.getElementById('token').innerHTML = await Lget("loginPluginLibrairy", "token")
    document.getElementById('remenber-label').innerHTML = await Lget("loginPluginLibrairy", "remember")
    document.getElementById('close-dialog').innerHTML = await Lget("loginPluginLibrairy", "close")
    document.getElementById('go').value = await Lget("loginPluginLibrairy", "connexion")
    connexion = await Lget("loginPluginLibrairy", "connexion")
    verify = await Lget("loginPluginLibrairy", "verify")
    denied = await Lget("loginPluginLibrairy", "denied")
}


window.electronAPI.onInitApp((_event, arg) => {
    setLangTargets()

    $('#accesspanel').on('submit', async function(e) {
        e.preventDefault();
        if (document.getElementById("go").value === connexion
            && document.getElementById("email").value !== ''
            && document.getElementById("password").value !== '') {
            
            document.getElementById("litheader").className = "poweron"
            document.getElementById("go").value = verify

            let login = {
                "username": document.getElementById("email").value,
                "password": document.getElementById("password").value,
                "encrypted": true
            } 
            let result = await window.electronAPI.getGithubConnexion(login) 
            if (result === false) {
                document.getElementById("litheader").className = ""
                document.getElementById("go").className = "denied"
                document.getElementById("go").value = denied
            } else {
                loginSaved = login
                if (document.getElementById("remember").checked) {
                    let state = await window.electronAPI.saveGithubLogin(login)
                    if (state === true) {
                        window.dispatchEvent(new Event ('beforeunload'))
                    } else {
                        let result = await window.electronAPI.errorRemenberGithubLogin(true)
                        if (result === true){
                            login.encrypted = false
                            let state = await window.electronAPI.saveGithubLogin(login)
                            if (state === true) { 
                                window.dispatchEvent(new Event ('beforeunload'))
                            } else {
                                await window.electronAPI.errorRemenberGithubLogin(false)
                                window.dispatchEvent(new Event ('beforeunload'))
                            }
                        } else {
                           window.dispatchEvent(new Event ('beforeunload'))
                        }
                    }
                } else {
                    window.dispatchEvent(new Event ('beforeunload'))
                }
            }
        }
    })

})
