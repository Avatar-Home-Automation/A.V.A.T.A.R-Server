
window.electronAPI.onMessage(async (_event, message) => {
    document.getElementById("message").innerHTML = message
})


window.electronAPI.onTitle(async (_event, message) => {
    document.getElementById("info").innerHTML = message[0]
    document.getElementById("label-quit").innerHTML = message[1]
})


window.electronAPI.onInstallationDone(async (_event, arg) => {
    document.getElementById("spinner").style.display = "none"
    document.getElementById("exit-box").style.display = "flex"
})


document.getElementById("exit").addEventListener("click", async (event) => {
    window.dispatchEvent(new Event('beforeunload'))
})

window.onbeforeunload = async (e) => {
    e.returnValue = false;
    window.electronAPI.quitPluginInstallation()
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


window.electronAPI.onInitApp(async (_event, interface) => {
    await setSettingsXel(interface);
})