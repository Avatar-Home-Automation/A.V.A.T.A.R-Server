window.electronAPI.onMessage(async (_event, message) => {
    document.getElementById("message").innerHTML = message
})


window.electronAPI.onTitle(async (_event, message, interface) => {
    await setSettingsXel(interface);
    document.getElementById("info").innerHTML = message
})


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