window.electronAPI.onMessage(async (_event, message) => {
    document.getElementById("message").innerHTML = message
})


window.electronAPI.onTitle(async (_event, message) => {
    document.getElementById("info").innerHTML = message
})