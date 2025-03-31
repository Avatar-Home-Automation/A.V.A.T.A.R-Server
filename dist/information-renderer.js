let outdatedPackages = [], auditPackages = [];

window.onbeforeunload = async (e) => {
    e.returnValue = false;
    window.electronAPI.quitInformation();
}


document.getElementById("exit").addEventListener("click", async (event) => {
    window.dispatchEvent(new Event ('beforeunload'))
})


function showParamNodeTab(settingType) {
    document.getElementById("status-packages-outdated-tab").style.display = "none";
    document.getElementById("status-packages-audit-tab").style.display = "none";
    
    window.requestAnimationFrame(() => {
      document.getElementById(settingType).style.display = "block";
      window.resizeTo(window.outerWidth + 1, window.outerHeight);
      window.resizeTo(window.outerWidth - 1, window.outerHeight);
    });
}
document.getElementById("outdated").addEventListener("click", (event) => {
  showParamNodeTab("status-packages-outdated-tab");
})
document.getElementById("audit").addEventListener("click", (event) => {
  showParamNodeTab("status-packages-audit-tab");
})


document.getElementById("link").addEventListener("click", async (event) => {
    window.electronAPI.showAvatarGithub();
})


document.getElementById("changeLog").addEventListener("click", async (event) => {
    window.electronAPI.changeLog();
})



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


function setOutdatedInfos (outdated) {
    return new Promise(async (resolve) => {
        const validKeys = Object.keys(outdated);
        let count = validKeys.length;
        if (!count) return resolve();
        for (const key of validKeys) {
            outdatedPackages.push([key, outdated[key].current, outdated[key].latest]);
            if (!--count) resolve();
        }
    }); 
}


const checkUpdateVersions = (currentVersion, newVersion) => {
    return new Promise(async (resolve) => {
      let splitNewVersion = newVersion.split('.');
      if (parseInt(currentVersion[0]) < parseInt(splitNewVersion[0])) {
          return resolve(newVersion.trim());
      } else if (parseInt(currentVersion[0]) <= parseInt(splitNewVersion[0]) && parseInt(currentVersion[1]) < parseInt(splitNewVersion[1])) {
          return resolve(newVersion.trim());
      } else if (parseInt(currentVersion[0]) <= parseInt(splitNewVersion[0]) && parseInt(currentVersion[1]) <= parseInt(splitNewVersion[1]) && parseInt(currentVersion[2]) < parseInt(splitNewVersion[2])) {
          return resolve(newVersion.trim());
      } else {
        return resolve(false);
      }
    });    
}


function setAuditInfos (audit) {
    return new Promise(async (resolve) => {
        const validKeys = Object.keys(audit);
        let count = validKeys.length;
        if (!count) return resolve();
        
        for (const key of validKeys) {
            let viaName = "";
            let viaTitle = "";
            let showInitInfo = false;
            if (audit[key].effects) {
              if (Array.isArray(audit[key].effects)) {
                viaName = audit[key].effects.length > 0 ? audit[key].effects.join(",") : key;
              } else {
                viaName = audit[plugin].audit[key].effects;
              }
            }

            viaTitle = (audit[key].via[0] && audit[key].via[0].title)
            ? audit[key].via[0].title
            : await Lget("pluginStudio", "impacted", audit[key].via.join(",")); 

            // color
            let severity = "";
            if (audit[key].severity) {
                switch (audit[key].severity) {
                    case 'info':
                        severity = `<span style="color:lightblue">${await Lget("infos", "info")}</span>`;
                        break;
                    case 'low':
                        severity = `<span style="color:lightyellow">${await Lget("infos", "low")}</span>`;
                        break;
                    case 'moderate':
                        severity = `<span style="color:yellow">${await Lget("infos", "moderate")}</span>`;
                        break;
                    case 'high':
                        severity = `<span style="color:red">${await Lget("infos", "hight")}</span>`;
                        break;
                    case 'critical':
                        severity = `<span style="color:tomato">${await Lget("infos", "critical")}</span>`;
                        break;
                    default: 
                        severity = audit[key].severity;
                }
            }

            // fix available
            let fixAvailable = "";
            if (typeof audit[key].fixAvailable !== undefined) {
                if (typeof audit[key].fixAvailable === 'boolean') {
                  fixAvailable = audit[key].fixAvailable === true ?  `<span style="color:green">${await Lget("infos", "true")}</span>` : `<span style="color:red">${await Lget("infos", "false")}</span>`; 
                } else {
                  showInitInfo = true;
                  const result = await window.electronAPI.getInfoPackage({plugin: null, package: key, usedBy: viaName});
                  if (result.used && result.current) {
                    const currentVersion = result.used.split('.');
                    const toUpdate = await checkUpdateVersions (currentVersion, result.current);
                    if (toUpdate) {
                      fixAvailable = `<span style="color:yellow">${await Lget("pluginStudio", "availableFix", toUpdate)}</span>`;
                      viaTitle = viaTitle + await Lget("pluginStudio", "availableFixInfoApp", key);
                    } else {
                      fixAvailable = `<span style="color:red">${await Lget("pluginStudio", "noAvailableFix")}</span>`;
                      viaTitle = viaTitle + await Lget("pluginStudio", "noAvailableFixInfoApp", key); 
                    }
                  } else {
                    fixAvailable = `<span style="color:red">${await Lget("pluginStudio", "noAvailableFixFound")}</span>`
                    viaTitle = viaTitle + await Lget("pluginStudio", "noAvailableFixFoundInfoApp", key); 
                  }
                } 
            }

            auditPackages.push([key, viaName, severity, fixAvailable, viaTitle]);
            if (!--count) {
                if (showInitInfo) await window.electronAPI.destroyInitInfo();
                resolve();
            }
        }
    });
}


function setLangTargets(infos) {
    return new Promise(async (resolve) => {
        document.getElementById('version').innerHTML = await Lget("infos", "version", infos.version);
        document.getElementById('arch').innerHTML = await Lget("infos", "arch", infos.arch);
        document.getElementById('electronVer').innerHTML = await Lget("infos", "electronVer", infos.electronVer);
        document.getElementById('nodeVer').innerHTML = await Lget("infos", "nodeVer", infos.nodeVer);
        document.getElementById('chromeVer').innerHTML = await Lget("infos", "chromeVer", infos.chromeVer);
        document.getElementById('repository').innerHTML = await Lget("infos", "repository");
        document.getElementById('link').innerHTML = infos.repository;
        document.getElementById('audit-label').innerHTML = await Lget("infos", "audit");
        document.getElementById('outdated-label').innerHTML = await Lget("infos", "outdated");
        document.getElementById('audit-text-label').innerHTML = await Lget("infos", "auditText");
        document.getElementById('outdated-text-label').innerHTML = await Lget("infos", "outdatedText");
        document.getElementById('exitLabel').innerHTML = await Lget("infos", "exit");
        resolve();
    })
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


window.electronAPI.onInitApp(async (_event, arg) => {
    await setSettingsXel(arg.interface);
    await setLangTargets(arg.infos);
    await setOutdatedInfos(arg.outdated);
    await setAuditInfos(arg.audit);

    $('#controlOutdated').DataTable({
        layout: {
            topStart: null,
            topEnd: null
        },
        info: false,
        scrollY: '150px',
        scrollCollapse: true,
        paging: false,
        data: outdatedPackages,
        columns: [
            { title: await Lget("infos", "package")},
            { title: await Lget("infos", "current")},
            { title: await Lget("infos", "latest")}
        ],
        columnDefs: [
            {
                className: 'dt-body-nowrap',
                searchable: false,
                orderable: false,
                targets: [0]
            },
            {
                searchable: false,
                orderable: false,
                targets: [1,2]
            }
        ]
    });


    $('#controlAudit').DataTable({
        layout: {
            topStart: null,
            topEnd: null
        },
        info: false,
        scrollY: '150px',
        scrollCollapse: true,
        paging: false,
        data: auditPackages,
        columns: [
            { title: await Lget("infos", "package")},
            { title: await Lget("infos", "via")},
            { title: await Lget("infos", "severity")},
            { title: await Lget("infos", "fixAvailable")},
            { title: await Lget("infos", "description")}
        ],
        columnDefs: [
            {
                className: 'dt-body-nowrap',
                searchable: false,
                orderable: false,
                targets: [0,1]
            },
            {
                searchable: false,
                orderable: false,
                targets: [2,3,4]
            }
        ]
    })

    await window.electronAPI.showInfoWindow();
})