window.onbeforeunload = async (e) => {
    e.returnValue = false;
    window.electronAPI.quit();
}

document.getElementById("quit").addEventListener("click", async (event) => {
    window.dispatchEvent(new Event ('beforeunload'));
})

async function Lget (target, ...args) {

    if (args) {
        target = [target];
        args.forEach(arg => {
            target.push(arg);
        })
    } 

    return await window.electronAPI.getMsg(target);
}

async function setElementLabel() {
    document.getElementById('quit').innerHTML = await Lget("message.quit");
}

window.electronAPI.onInitWeather( _event => {
    setElementLabel(); 
})