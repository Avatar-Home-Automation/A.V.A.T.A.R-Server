let Plugins = [];
let restart = false;
let tblPosition, yes, no;
let table;

function setParameters () {
    return new Promise(async (resolve, reject) => {
        let byDefault = await window.electronAPI.getMsg("reorderPlugins.default")
        tblPosition = [[byDefault,"zzz"],[1,"a"],[2,"b"],[3,"c"],[4,"d"],[5,"e"],[6,"f"],[7,"g"],[8,"h"],[9,"i"],[10,"j"],
                    [11,"k"],[12,"l"],[13,"m"],[14,"n"],[15,"o"],[16,"p"],[17,"q"],[18,"r"],[19,"s"],[20,"t"],
                    [21,"u"],[22,"v"],[23,"w"],[24,"x"],[25,"y"],[26,"z"],[27,"za"],[28,"zb"],[29,"zc"],[30,"zd"],
                    [31,"ze"],[32,"zf"],[33,"zg"],[34,"zh"],[35,"zi"],[36,"zj"],[37,"zk"],[38,"zl"],[39,"zm"],[40,"zn"],
                    [41,"zo"],[42,"zp"],[43,"zq"],[44,"zr"],[45,"zs"],[46,"zt"],[47,"zu"],[48,"zv"],[49,"zw"],[50,"zx"],
                    [51,"zy"],[52,"zz"],[53,"zza"],[54,"zzb"],[55,"zzc"],[56,"zzd"],[57,"zze"],[58,"zzf"],[59,"zzg"],[60,"zzh"]];

        yes = await Lget("reorderPlugins", "yes")        
        no = await Lget("reorderPlugins", "no")  
        resolve()
    })           
}


window.onbeforeunload = async (e) => {
    e.returnValue = false;
    window.electronAPI.quitReorder(restart)
}


document.getElementById("exit").addEventListener("click", async (event) => {
    window.dispatchEvent(new Event ('beforeunload'))
})


document.getElementById('SavePosition').addEventListener('click', async (event) => {
    let test = await testBeforeSaveNLPPosition()
    if (test === true) {
        return notification(await Lget("reorderPlugins", "samePosSave"))
    } else {
        let pluginsToSave = await saveNLPPosition()
        let result = await window.electronAPI.saveReorderPlugins(pluginsToSave)
        if (result === true) {
            notification(await Lget("reorderPlugins", "saved"))
            restart = true
        } else {
            notification(await Lget("reorderPlugins", "noPlugin"))
        }
    }
})


function setTblActive() {
    return new Promise(async (resolve, reject) => {
        var table = $('#controlPlugins').DataTable();
        var data = table.$('select').serialize();
        data = data.split('&');
        let tblactive = [];
        for(let i=0; i<data.length; i++) {
            tblactive.push(data[i].split('='));
            tblactive[i][0] = tblactive[i][0].substring(tblactive[i][0].indexOf("row-actif-")+10);
            tblactive[i][1] = (tblactive[i][1] === yes) ? true : false;
        }
        resolve (tblactive);
    })
}


function isActive(plugin) {
    return new Promise(async (resolve, reject) => {
        let tblActive = await setTblActive();
        for (let i in tblActive) {
            if (tblActive[i][0] === plugin && tblActive[i][1] === true)
                return resolve(true)
        }
        resolve(false)
    })
}


function saveNLPPosition () {
    return new Promise(async (resolve, reject) => {
        let pluginsToSave = []
        for (let i=0; i < Plugins.length; i++) {
            pluginsToSave.push([
                Plugins[i][0],
                (Plugins[i][4] !== "zzz") ? getOrder(1, 0, Plugins[i][4]) : "default",
                await isActive(Plugins[i][0])
            ])
        
        }
        resolve (pluginsToSave)
    })
}


function testBeforeSaveNLPPosition() {
    return new Promise((resolve, reject) => {
      for (let i=1; i < tblPosition.length; i++) {
        let count = 0
        for (let a in Plugins) {
            if (Plugins[a][4] === tblPosition[i][1]) {
                count += 1
                if (count > 1) return resolve (true); 
            }
        }
      }
      resolve(false);
    })
  }
  

async function defActive (pluginProps, name) {
    if  (pluginProps.active != undefined) {
      if (pluginProps.active === true)
        return '<select size="1" id="row-actif-'+name+'" name="row-actif-'+name+'"><option value='+yes+' selected="selected">'+yes+'</option><option value='+no+'>'+no+'</option></select>';
      else
        return '<select size="1" id="row-actif-'+name+'" name="row-actif-'+name+'"><option value='+yes+'>'+yes+'</option><option value='+no+' selected="selected">'+no+'</option></select>';
    } else {
      return '<select size="1" id="row-actif-'+name+'" name="row-actif-'+name+'"><option value='+yes+' selected="selected">'+yes+'</option><option value='+no+'>'+no+'</option></select>';
    }
}


function getOrder (searchValue, returnValue, position) {
    for (let i in tblPosition) {
        if (tblPosition[i][searchValue] === position) 
            return tblPosition[i][returnValue]
    }
    return 0
}


function setPluginsList (list) {
    return new Promise(async (resolve) => {
        let count = list.length;
        if (!count) return resolve();
        for (plugin in list) {
            Plugins.push(
                [list[plugin].id,
                (list[plugin].properties.modules[list[plugin].id].version != undefined ? list[plugin].properties.modules[list[plugin].id].version : await Lget("reorderPlugins", "unknown")),
                (list[plugin].properties.modules[list[plugin].id].nlpPosition != undefined ? '<input style="width: 80px;" type="text" id="row-'+list[plugin].id+'" name="row-'+list[plugin].id+'" value="'+list[plugin].properties.modules[list[plugin].id].nlpPosition+'">' : '<input style="width: 80px;" type="text" id="row-'+list[plugin].id+'" name="row-'+list[plugin].id+'" value="'+await Lget("reorderPlugins", "default")+'"Par défaut">'),
                await defActive (list[plugin].properties.modules[list[plugin].id], list[plugin].id),
                (list[plugin].properties.modules[list[plugin].id].nlpPosition != undefined ? getOrder(0, 1, list[plugin].properties.modules[list[plugin].id].nlpPosition) : "zzz"),
                (list[plugin].properties.modules[list[plugin].id].description != undefined ? list[plugin].properties.modules[list[plugin].id].description : "")
            ]);
            if (!--count) {
                resolve();
            }
        }
    })
}


function setLangTargets() {
    return new Promise(async (resolve) => {
        document.getElementById('info1').innerHTML = await Lget("reorderPlugins", "info1")
        document.getElementById('info2').innerHTML = await Lget("reorderPlugins", "info2")
        document.getElementById('info3').innerHTML = await Lget("reorderPlugins", "info3")
        document.getElementById('info4').innerHTML = await Lget("reorderPlugins", "info4")
        document.getElementById('pluginLib').innerHTML = await Lget("reorderPlugins", "pluginLib")
        document.getElementById('saveLabel').innerHTML = await Lget("reorderPlugins", "saveLabel")
        document.getElementById('exitLabel').innerHTML = await Lget("reorderPlugins", "exitLabel")
        resolve()
    })
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


function notification (msg) {
    let notif = document.getElementById('notification');
    if (notif.opened === true) notif.opened = false;
    notif.innerHTML = msg;
    notif.opened = true;
  }


function reOrder(posID, value) {
    var table = $('#controlPlugins').DataTable();
    var indexes = table.rows().eq(0).filter( function (rowIdx) {
      return table.cell( rowIdx, 0 ).data() === posID ? true : false;
    });
  
    table
    .cell(indexes, 4).data(value)
    .order([4, 'asc'])
    .draw();
}
  

async function changeValue (posID, value) {
    let oriValue = value;
    if (value == '') {
      $('#row-'+posID).val(getOrder(1, 0, "zzz"));
      reOrder(posID,getOrder(0, 1, await Lget("reorderPlugins", "default")));
      return;
    }

    let valueToInt = Number(value);
    value = parseInt(value);
    if (valueToInt.toString().indexOf('.') != -1 || isNaN(valueToInt) || isNaN(value) || !Number.isInteger(value)) {
        notification(await Lget("reorderPlugins", "intValue", oriValue, Plugins.length))
        for (let i in Plugins) {
            if (Plugins[i][0] === posID) {
                $('#row-'+posID).val(getOrder(1, 0, Plugins[i][4]));
                return; 
            }
        }
    }

    if (value > 60 || value > Plugins.length) {
        notification(await Lget("reorderPlugins", "posMax", oriValue, Plugins.length))
        for (let i in Plugins) {
            if (Plugins[i][0] === posID) {
                $('#row-'+posID).val(getOrder(1, 0, Plugins[i][4]));
                return; 
            }
        }
    }

    let evens = 0, usedBy
    for (let i in Plugins) {
        evens = getOrder(1, 0,Plugins[i][4])
        if (evens === value) {
            usedBy = Plugins[i][0]
            break;
        }
    }

    if (usedBy) {
        notification(await Lget("reorderPlugins", "posAlreadySet", oriValue, usedBy))
        for (let i in Plugins) {
            if (Plugins[i][0] === posID) {
                $('#row-'+posID).val(getOrder(1, 0, Plugins[i][4]));
                return; 
            }
        }
    }

    reOrder(posID, getOrder(0, 1, value));
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
    let result = await window.electronAPI.getPlugins();
    await setSettingsXel(interface);
    await setParameters();
    await setPluginsList(result);
    await setLangTargets();

    $('#controlPlugins').DataTable({
        layout: {
            topStart: null,
            topEnd: {
                search: {
                    placeholder: await Lget("reorderPlugins", "search")
                }
            },
            bottomStart: null,
            bottomEnd: null
        },
        info: false,
        scrollY: '250px',
        scrollCollapse: true,
        paging: false,
        order: [[4, 'asc']],
        data: Plugins,
        columns: [
            { title: await Lget("reorderPlugins", "plugin")},
            { title: await Lget("reorderPlugins", "version")},
            { title: await Lget("reorderPlugins", "position")},
            { title: await Lget("reorderPlugins", "active")},
            { title: await Lget("reorderPlugins", "NLP")},
            { title: await Lget("reorderPlugins", "description")}
        ],
        columnDefs: [
            {
                orderable: false,
                targets: [0,1,2,3,5],
            },
            {
                target: 4,
                visible: false,
                searchable: false
            }
        ]
    })

    for (let i=0; i < Plugins.length; i++) {
       $('#row-'+Plugins[i][0]).on("change", function() {
          changeValue(Plugins[i][0], this.value);
      });
    }

})