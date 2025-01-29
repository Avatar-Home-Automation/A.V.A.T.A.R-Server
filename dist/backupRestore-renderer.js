let appProperties,
  interfaceProperties,
  reloadMain = false;

window.onbeforeunload = async (e) => {
  e.returnValue = false;
  window.electronAPI.quit(reloadMain);
};

document.getElementById("exit").addEventListener("click", async (event) => {
  window.dispatchEvent(new Event("beforeunload"));
});

document.getElementById("save").addEventListener("click", async (event) => {
  if (
    document.getElementById("folder").value ||
    document.getElementById("delete-tab").style.display === "block"
  ) {
    let toSave, reason, msg;
    if (document.getElementById("backup-tab").style.display === "block") {
      toSave = [
        document.getElementById("backup-properties").toggled,
        document.getElementById("backup-interface").toggled,
        document.getElementById("backup-node").toggled,
        document.getElementById("backup-github").toggled,
        document.getElementById("backup-plugin").toggled,
      ];
      reason = "backup";
      msg = await Lget("backupRestore", "startBackup");
    } else if (
      document.getElementById("restore-tab").style.display === "block"
    ) {
      toSave = [
        document.getElementById("restore-properties").toggled,
        document.getElementById("restore-interface").toggled,
        document.getElementById("restore-node").toggled,
        document.getElementById("restore-github").toggled,
        document.getElementById("restore-plugin").toggled,
      ];
      reason = "restore";
      msg = await Lget("backupRestore", "startRestore");
    } else if (
      document.getElementById("delete-tab").style.display === "block"
    ) {
      toSave = [
        document.getElementById("delete-properties").toggled,
        document.getElementById("delete-interface").toggled,
        document.getElementById("delete-node").toggled,
        document.getElementById("delete-github").toggled,
        false,
      ];
      reason = "default";
      msg = await Lget("backupRestore", "startDefaultRestore");
    }
    notification(msg);
    onSave(reason, toSave, 0, 4);
  } else {
    notification(await Lget("backupRestore", "selectFolder"), true);
  }
});

async function onSave(reason, toSave, index, length) {
  if (index > length) {
    let msg;
    if (reason === "backup") msg = await Lget("backupRestore", "backupDone");
    else if (reason === "restore")
      msg = await Lget("backupRestore", "restoreDone");
    else if (reason === "default")
      msg = await Lget("backupRestore", "restoreDefaultDone");
    return notification(msg);
  }

  if (toSave[index] === true) {
    let result = await window.electronAPI.applyBackupRestore({
      reason: reason,
      index: index,
      folder: document.getElementById("folder").value,
    });
    if (result === true) {
      if (index === 0 && reason === "backup")
        document.getElementById("backup-properties-img").src =
          "../images/icons/done.png";
      if (index === 1 && reason === "backup")
        document.getElementById("backup-interface-img").src =
          "../images/icons/done.png";
      if (index === 2 && reason === "backup")
        document.getElementById("backup-node-img").src =
          "../images/icons/done.png";
      if (index === 3 && reason === "backup")
        document.getElementById("backup-github-img").src =
          "../images/icons/done.png";
      if (index === 4 && reason === "backup")
        document.getElementById("backup-plugin-img").src =
          "../images/icons/done.png";
      if (index === 0 && reason === "restore")
        document.getElementById("restore-properties-img").src =
          "../images/icons/done.png";
      if (index === 1 && reason === "restore")
        document.getElementById("restore-interface-img").src =
          "../images/icons/done.png";
      if (index === 2 && reason === "restore")
        document.getElementById("restore-node-img").src =
          "../images/icons/done.png";
      if (index === 3 && reason === "restore")
        document.getElementById("restore-github-img").src =
          "../images/icons/done.png";
      if (index === 4 && reason === "restore")
        document.getElementById("restore-plugin-img").src =
          "../images/icons/done.png";
      if (index === 0 && reason === "default")
        document.getElementById("delete-properties-img").src =
          "../images/icons/done.png";
      if (index === 1 && reason === "default")
        document.getElementById("delete-interface-img").src =
          "../images/icons/done.png";
      if (index === 2 && reason === "default")
        document.getElementById("delete-node-img").src =
          "../images/icons/done.png";
      if (index === 3 && reason === "default")
        document.getElementById("delete-github-img").src =
          "../images/icons/done.png";
      if (reason === "restore" || reason === "default") reloadMain = true;
      onSave(reason, toSave, ++index, length);
    } else if (result === false) {
      if (index === 0 && reason === "restore")
        document.getElementById("restore-properties-img").src =
          "../images/icons/notRestore.png";
      if (index === 1 && reason === "restore")
        document.getElementById("restore-interface-img").src =
          "../images/icons/notRestore.png";
      if (index === 2 && reason === "restore")
        document.getElementById("restore-node-img").src =
          "../images/icons/notRestore.png";
      if (index === 3 && reason === "restore")
        document.getElementById("restore-github-img").src =
          "../images/icons/notRestore.png";
      if (index === 4 && reason === "restore")
        document.getElementById("restore-plugin-img").src =
          "../images/icons/notRestore.png";
      onSave(reason, toSave, ++index, length);
    } else {
      let msg;
      if (reason === "backup")
        await Lget("backupRestore", "backupError", result);
      else if (reason === "restore")
        await Lget("backupRestore", "restoreError", result);
      else if (reason === "default")
        await Lget("backupRestore", "restoreDefaultError", result);
      return notification(msg, true);
    }
  } else onSave(reason, toSave, ++index, length);
}

function notification(msg, err) {
  let notif = document.getElementById("notification");
  notif.style.color = err ? "red" : "rgba(255, 255, 255, 0.9)";
  if (notif.opened == true) notif.opened = false;
  notif.innerHTML = msg;
  notif.opened = true;
}

document
  .getElementById("select-folder")
  .addEventListener("click", async (event) => {
    let folder = await window.electronAPI.openBackupFolder();
    if (folder) document.getElementById("folder").value = folder;
  });

function showTab(settingType) {
  document.getElementById("backup-tab").style.display = "none";
  document.getElementById("restore-tab").style.display = "none";
  document.getElementById("delete-tab").style.display = "none";

  window.requestAnimationFrame(() => {
    document.getElementById(settingType).style.display = "block";
  });
}

document.getElementById("backup").addEventListener("click", async (event) => {
  document.getElementById("label-save").innerHTML = await Lget(
    "backupRestore",
    "backup"
  );
  document.getElementById("folder-location-label").innerHTML = await Lget(
    "backupRestore",
    "folderBackupLabel"
  );
  document.getElementById("backup-properties-img").src =
    "../images/icons/notdone.png";
  document.getElementById("backup-interface-img").src =
    "../images/icons/notdone.png";
  document.getElementById("backup-node-img").src =
    "../images/icons/notdone.png";
  document.getElementById("backup-github-img").src =
    "../images/icons/notdone.png";
  document.getElementById("backup-plugin-img").src =
    "../images/icons/notdone.png";
  document.getElementById("select-folder").disabled = "";
  document.getElementById("folder").disabled = "";
  document.getElementById("folder").value = "";
  showTab("backup-tab");
});

document.getElementById("delete").addEventListener("click", async (event) => {
  document.getElementById("label-save").innerHTML = await Lget(
    "backupRestore",
    "delete"
  );
  document.getElementById("folder-location-label").innerHTML = await Lget(
    "backupRestore",
    "folderBackupLabel"
  );
  document.getElementById("delete-properties-img").src =
    "../images/icons/notdone.png";
  document.getElementById("delete-interface-img").src =
    "../images/icons/notdone.png";
  document.getElementById("delete-node-img").src =
    "../images/icons/notdone.png";
  document.getElementById("delete-github-img").src =
    "../images/icons/notdone.png";
  document.getElementById("select-folder").disabled = "true";
  document.getElementById("folder").disabled = "true";
  document.getElementById("folder").value = "";
  showTab("delete-tab");
});

document.getElementById("restore").addEventListener("click", async (event) => {
  document.getElementById("label-save").innerHTML = await Lget(
    "backupRestore",
    "restore"
  );
  document.getElementById("folder-location-label").innerHTML = await Lget(
    "backupRestore",
    "folderRestoreLabel"
  );
  document.getElementById("restore-properties-img").src =
    "../images/icons/notdone.png";
  document.getElementById("restore-interface-img").src =
    "../images/icons/notdone.png";
  document.getElementById("restore-node-img").src =
    "../images/icons/notdone.png";
  document.getElementById("restore-github-img").src =
    "../images/icons/notdone.png";
  document.getElementById("restore-plugin-img").src =
    "../images/icons/notdone.png";
  document.getElementById("select-folder").disabled = "";
  document.getElementById("folder").disabled = "";
  document.getElementById("folder").value = "";
  showTab("restore-tab");
});

async function Lget(top, target, param) {
  if (param) {
    return await window.electronAPI.getMsg([top + "." + target, param]);
  } else {
    return await window.electronAPI.getMsg(top + "." + target);
  }
}

async function setHTMLContent() {
  // Meta Xel
  document
    .querySelector('meta[name="xel-theme"]')
    .setAttribute(
      "content",
      "../.." +
        "/node_modules/xel/themes/" +
        interfaceProperties.interface.xeltheme +
        ".css"
    );
  document
    .querySelector('meta[name="xel-accent-color"]')
    .setAttribute("content", interfaceProperties.interface.xelcolor);
  document
    .querySelector('meta[name="xel-icons"]')
    .setAttribute(
      "content",
      "../.." +
        "/node_modules/xel/icons/" +
        interfaceProperties.interface.xelicon +
        ".svg"
    );
}

function setLangTargets() {
  return new Promise(async (resolve) => {
    document.getElementById("backup").innerHTML = await Lget(
      "backupRestore",
      "backup"
    );
    document.getElementById("delete").innerHTML = await Lget(
      "backupRestore",
      "delete"
    );
    document.getElementById("restore").innerHTML = await Lget(
      "backupRestore",
      "restore"
    );

    document.getElementById("backup-properties-label").innerHTML = await Lget(
      "backupRestore",
      "backupPropertiesLabel"
    );
    document.getElementById("backup-interface-label").innerHTML = await Lget(
      "backupRestore",
      "backupInterfaceLabel"
    );
    document.getElementById("backup-node-label").innerHTML = await Lget(
      "backupRestore",
      "backupNodesLabel"
    );
    document.getElementById("backup-github-label").innerHTML = await Lget(
      "backupRestore",
      "backupGithubLabel"
    );
    document.getElementById("backup-plugin-label").innerHTML = await Lget(
      "backupRestore",
      "backupPluginLabel"
    );

    document.getElementById("restore-properties-label").innerHTML = await Lget(
      "backupRestore",
      "restorePropertiesLabel"
    );
    document.getElementById("restore-interface-label").innerHTML = await Lget(
      "backupRestore",
      "restoreInterfaceLabel"
    );
    document.getElementById("restore-node-label").innerHTML = await Lget(
      "backupRestore",
      "restoreNodesLabel"
    );
    document.getElementById("restore-github-label").innerHTML = await Lget(
      "backupRestore",
      "restoreGithubLabel"
    );
    document.getElementById("restore-plugin-label").innerHTML = await Lget(
      "backupRestore",
      "restorePluginLabel"
    );

    document.getElementById("delete-properties-label").innerHTML = await Lget(
      "backupRestore",
      "deletePropertiesLabel"
    );
    document.getElementById("delete-interface-label").innerHTML = await Lget(
      "backupRestore",
      "deleteInterfaceLabel"
    );
    document.getElementById("delete-node-label").innerHTML = await Lget(
      "backupRestore",
      "deleteNodesLabel"
    );
    document.getElementById("delete-github-label").innerHTML = await Lget(
      "backupRestore",
      "deleteGithubLabel"
    );

    document.getElementById("folder-label").innerHTML = await Lget(
      "backupRestore",
      "folderLabel"
    );
    document.getElementById("folder-location-label").innerHTML = await Lget(
      "backupRestore",
      "folderBackupLabel"
    );

    document.getElementById("label-save").innerHTML = await Lget(
      "backupRestore",
      "backup"
    );
    document.getElementById("label-quit").innerHTML = await Lget(
      "backupRestore",
      "quit"
    );
    resolve();
  });
}

window.electronAPI.onInitApp(async (_event, arg) => {
  appProperties = arg.properties;
  interfaceProperties = arg.interface;

  await setLangTargets();
  await setHTMLContent();
});
