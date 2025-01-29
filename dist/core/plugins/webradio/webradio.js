import * as path from "node:path";
import * as url from "url";
import fs from "fs-extra";
import axios from "axios";
import * as cheerio from "cheerio";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

import * as widgetLib from "../../../widgetLibrairy.js";
const Widget = await widgetLib.init();

let periphInfo = [];
let Locale;
let currentwidgetState;
let WebRadioWindow;

const widgetFolder = path.resolve(__dirname, "assets/widget");
const widgetImgFolder = path.resolve(__dirname, "assets/images/widget");

export async function onClose(widgets) {
    if (Config.modules.webradio.widget.display === true) {
        await Widget.initVar(widgetFolder, widgetImgFolder, null, Config.modules.webradio);
        if (widgets) await Widget.saveWidgets(widgets);
    }

    if (WebRadioWindow) {
        let pos = WebRadioWindow.getPosition();

        fs.writeJsonSync(path.resolve(__dirname, "assets", "style.json"), {
            x: pos[0],
            y: pos[1],
            start: true,
        });
    } else {
        let prop = {};
        if (fs.existsSync(path.resolve(__dirname, "assets", "style.json"))) {
            prop = fs.readJsonSync(path.resolve(__dirname, "assets", "style.json"), {
                throws: false,
            });
        }

        prop.start = false;
        fs.writeJsonSync(path.resolve(__dirname, "assets", "style.json"), prop);
    }
}

export async function init() {
    if (!(await Avatar.lang.addPluginPak("webradio"))) {
        return error("webradio: unable to load language pak files");
    }

    Locale = await Avatar.lang.getPak("webradio", Config.language);
    if (!Locale) {
        return error(`webradio: Unable to find the '${Config.language}' language pak.`);
    }

    periphInfo.push({
        Buttons: [
            {
                name: "webradio",
                value_type: "button",
                usage_name: "Button",
                periph_id: "444555",
                notes: "Open webradio",
            },
        ],
    });
}

export async function action(data, callback) {
    try {
        Locale = await Avatar.lang.getPak("webradio", data.language);
        if (!Locale) {
            throw new Error(`webRadio: Unbale to find the '${data.language}' language pak.`);
        }
        const tblActions = {
            play: () => play(data),
        };

        tblActions[data.action.command]();

        info("webradio: ", data.action.command + " the radio " + data.relations.item.text , L.get("plugin.from"), data.client);
    } catch (err) {
        if (data.client) Avatar.Speech.end(data.client);
        if (err.message) error(err.message);
    }

    callback();
}

export async function getWidgetsOnLoad() {
    if (Config.modules.webradio.widget.display === true) {
        await Widget.initVar(widgetFolder, widgetImgFolder, null, Config.modules.webradio);
        let widgets = await Widget.getWidgets();
        return {
            plugin: "webradio",
            widgets: widgets,
            Config: Config.modules.webradio,
        };
    }
}

export async function readyToShow() {
    if (fs.existsSync(path.resolve(__dirname, "assets", "style.json"))) {
        let prop = fs.readJsonSync(path.resolve(__dirname, "assets", "style.json"), { throws: false });

        currentwidgetState = prop.start;

        if (currentwidgetState) openWebRadioWindow();
    } else {
        currentwidgetState = false;
    }

    Avatar.Interface.refreshWidgetInfo({ plugin: "webradio", id: "444555" });
}

export async function getNewButtonState(arg) {
    return currentwidgetState === true ? "Off" : "On";
}

export async function getPeriphInfo() {
    return periphInfo;
}

export async function widgetAction(even) {
    currentwidgetState = even.value.action === "On" ? true : false;
    if (!WebRadioWindow && even.value.action === "On") return openWebRadioWindow();
    if (WebRadioWindow && even.value.action === "Off") WebRadioWindow.destroy();
}

const openWebRadioWindow = async () => {
    if (WebRadioWindow) return WebRadioWindow.show();

    let style = {
        parent: Avatar.Interface.mainWindow(),
        frame: false,
        movable: true,
        resizable: true,
        minimizable: false,
        alwaysOnTop: false,
        show: false,
        width: Config.modules.webradio.window.width,
        height: Config.modules.webradio.window.height,
        opacity: Config.modules.webradio.window.opacity,
        icon: path.resolve(__dirname, "assets", "images", "webradio.png"),
        webPreferences: {
            preload: path.resolve(__dirname, "html", "webradio-preload.js"),
        },
        title: "Web Radio",
    };

    if (fs.existsSync(path.resolve(__dirname, "assets", "style.json"))) {
        let prop = fs.readJsonSync(path.resolve(__dirname, "assets", "style.json"), { throws: false });
        if (prop) {
            style.x = prop.x;
            style.y = prop.y;
        }
    }

    WebRadioWindow = await Avatar.Interface.BrowserWindow(style, path.resolve(__dirname, "html", "webradio.html"), false);

    WebRadioWindow.once("ready-to-show", () => {
        WebRadioWindow.show();
        WebRadioWindow.webContents.send("onInit-webradio");
        if (Config.modules.webradio.devTools) WebRadioWindow.webContents.openDevTools();
    });

    Avatar.Interface.ipcMain().on("webradio-quit", () => {
        WebRadioWindow.destroy();

        // refresh widget button on window closed
        Avatar.Interface.refreshWidgetInfo({ plugin: "webradio", id: "444555" });
    });

    Avatar.Interface.ipcMain().on("webradio-position", () => {
        save_position();
    });

    Avatar.Interface.ipcMain().handle("webradio-selected", async (_event, arg) => {
        await save_selected(arg);
        WebRadioWindow.destroy();
        Avatar.Interface.refreshWidgetInfo({ plugin: "webradio", id: "444555" });
        openWebRadioWindow();
    });

    Avatar.Interface.ipcMain().handle("webradio-reload", async (_event, arg) => {
        WebRadioWindow.destroy();
        Avatar.Interface.refreshWidgetInfo({ plugin: "webradio", id: "444555" });
        openWebRadioWindow();
        return arg;
    });

    // Liste Radio
    Avatar.Interface.ipcMain().handle("webradio-liste", async (_event) => {
        let prop = {};
        if (fs.existsSync(path.resolve(__dirname, "webradio.prop"))) {
            prop = fs.readJsonSync(path.resolve(__dirname, "webradio.prop"), {
                throws: false,
            });
        }
        return {
            radios: prop.modules.webradio.radios,
            selection: prop.modules.webradio.selection,
        };
    });

    // Config Radio
    Avatar.Interface.ipcMain().handle("webradio-config", async (_event) => {
        let prop = {};
        if (fs.existsSync(path.resolve(__dirname, "webradio.prop"))) {
            prop = fs.readJsonSync(path.resolve(__dirname, "webradio.prop"), {
                throws: false,
            });
        }
        return {
            config: prop.modules.webradio,
        };
    });

    // Search Radio
    Avatar.Interface.ipcMain().handle("webradio-search", async (_event, arg) => {
        const apiUrl = `https://prod.radio-api.net/stations/search?query=${arg}&count=10&offset=0`;
        let result = await axios.get(apiUrl);
        result.headers[("Content-Type", "application/ld+json; charset=utf-8")];
        return result.data.playables;
    });

    // Top 100 Radios
    Avatar.Interface.ipcMain().handle("webradio-top", async (_event) => {
        return await searchTopRadio();
    });

    Avatar.Interface.ipcMain().handle("webradio-msg", async (_event, arg) => {
        return Locale.get(arg);
    });

    WebRadioWindow.on("closed", () => {
        currentwidgetState = false;
        Avatar.Interface.ipcMain().removeHandler("webradio-msg");
        Avatar.Interface.ipcMain().removeHandler("webradio-liste");
        Avatar.Interface.ipcMain().removeHandler("webradio-config");
        Avatar.Interface.ipcMain().removeHandler("webradio-search");
        Avatar.Interface.ipcMain().removeHandler("webradio-top");
        Avatar.Interface.ipcMain().removeHandler("webradio-reload");
        Avatar.Interface.ipcMain().removeHandler("webradio-selected");
        Avatar.Interface.ipcMain().removeAllListeners("webradio-position");
        Avatar.Interface.ipcMain().removeAllListeners("webradio-quit");
        WebRadioWindow = null;
    });
};

const play = async (data) => {
    const search_radio = data.relations?.item?.text ? data.relations.item.text : Config.modules.webradio.selection.radio;
    const listeRadios = await searchTopRadio()
    let radio;     
    let vradio;   

    console.log(data.relations);

    console.log(data.sentence);
    
    console.log(data.tokens);

    listeRadios.forEach((station, index) => {
            radio = station.url.split('/');
            vradio = radio[radio.length -1];

         if (search_radio === station.name.toLowerCase()) {
            console.log(`${index + 1 }. ${station.name}. ${vradio} `)

        // save_selected(vradio);
        // openWebRadioWindow();
         }
    });

    try {
        info("webRadio: ", data.action.command + " the radio ( " + search_radio + " )");
        // save_selected(vradio);
        // openWebRadioWindow();

    } catch (err) {
        if (data.client) Avatar.Speech.end(data.client);
        if (err.message) error(err.message);
    }
};

const searchTopRadio = async () => {
    const topUrl = "https://www.radio.fr/top-stations";
    let result = await axios.get(topUrl);
    result.headers[("Content-Type", "application/ld+json; charset=utf-8")];

    const $ = cheerio.load(result.data);
    const obj = $("script[type='application/ld+json']");

    let content = JSON.parse(obj[0].children[0].data);
    const transformedData = content.itemListElement.map((item) => {
        return {
            name: item.name,
            image: item.image,
            url: item.url,
        };
    });

    transformedData.sort(function (a, b) {
        if (a.name < b.name) {
            return -1;
        }
        if (a.name > b.name) {
            return 1;
        }
        return 0;
    });
    return transformedData;
};

const save_selected = async (radio) => {
    let prop = {};
    if (fs.existsSync(path.resolve(__dirname, "webradio.prop"))) {
        prop = fs.readJsonSync(path.resolve(__dirname, "webradio.prop"), {
            throws: false,
        });
    }
    prop.modules.webradio.selection = { radio: radio };
    fs.writeJsonSync(path.resolve(__dirname, "webradio.prop"), prop);
};

const save_position = async () => {
    if (WebRadioWindow) {
        let pos = WebRadioWindow.getPosition();
        fs.writeJsonSync(path.resolve(__dirname, "assets", "style.json"), {
            x: pos[0],
            y: pos[1],
            start: true,
        });
    } else {
        let prop = {};
        if (fs.existsSync(path.resolve(__dirname, "assets", "style.json"))) {
            prop = fs.readJsonSync(path.resolve(__dirname, "assets", "style.json"), {
                throws: false,
            });
        }
        prop.start = false;
        fs.writeJsonSync(path.resolve(__dirname, "assets", "style.json"), prop);
    }
};
