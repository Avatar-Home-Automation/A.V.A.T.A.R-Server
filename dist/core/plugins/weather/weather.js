import * as path from 'node:path';
import fs from 'fs-extra';
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

import * as widgetLib from '../../../widgetLibrairy.js';
const Widget = await widgetLib.init();

// Private
let periphInfo = []; // devices table
let Locale; //language pak
let currentwidgetState; // button state
let WeatherWindow; // weather forecast window

const widgetFolder = path.resolve(__dirname, 'assets/widget');
const widgetImgFolder = path.resolve(__dirname, 'assets/images/widget');


export async function onClose (widgets) {
	// Save widget positions
	if (Config.modules.weather.widget.display === true) {
		await Widget.initVar(widgetFolder, widgetImgFolder, null, Config.modules.weather);
		if (widgets) await Widget.saveWidgets(widgets);
	}

    // Save meteo forecast position
	if (WeatherWindow) {  // The window is displayed
        // Get window instance position
		let pos = WeatherWindow.getPosition();
        // Writes position and the window state (displayed or closed)
		fs.writeJsonSync(path.resolve(__dirname, 'assets', 'style.json'), {
		  x: pos[0],
		  y: pos[1],
		  start: true,
		});
	} else { // The window is closed
        // If the backup file exists then keeps the position first
        let prop = {};
		if (fs.existsSync(path.resolve(__dirname, 'assets', 'style.json'))) {
			prop = fs.readJsonSync(path.resolve(__dirname, 'assets', 'style.json'), { throws: false });
		}
        // Writes the window state (closed)
		prop.start = false;
		fs.writeJsonSync(path.resolve(__dirname, 'assets', 'style.json'), prop);
	}
}


export async function init () {
    if (!await Avatar.lang.addPluginPak("weather")) {
        return error('weather: unable to load language pak files');
    }

	Locale = await Avatar.lang.getPak("weather", Config.language);
    if (!Locale) {
        return error(`weather: Unable to find the '${Config.language}' language pak.`);
    }

	periphInfo.push({
        Buttons: [
            {
                name: "Weather",
				value_type: "button",
				usage_name: "Button",
				periph_id: "808221",
                notes: "Open weather forecast"
            }
        ]
    });
}


export async function getWidgetsOnLoad () {
	if (Config.modules.weather.widget.display === true) {
		await Widget.initVar(widgetFolder, widgetImgFolder, null, Config.modules.weather);
		let widgets = await Widget.getWidgets();
		return {plugin: "weather", widgets: widgets, Config: Config.modules.weather};
	} 
}


export async function readyToShow () {
	// If a backup file exists
    if (fs.existsSync(path.resolve(__dirname, 'assets', 'style.json'))) {
		let prop = fs.readJsonSync(path.resolve(__dirname, 'assets', 'style.json'), { throws: false });
        // Set currentwidgetState global variable
		currentwidgetState = prop.start;
        // currentwidgetState = true : creates and shows window
		if (currentwidgetState) openWeatherWindow();
	} else 	
        // no display
		currentwidgetState = false;

    // Refreshs information of the widget
	Avatar.Interface.refreshWidgetInfo({plugin: 'weather', id: "808221"});
}


export async function getNewButtonState (arg) {
	return currentwidgetState === true ? "Off" : "On";
}


export async function getPeriphInfo () {
	return periphInfo;
}


export async function widgetAction (even) {
    currentwidgetState = even.value.action === 'On' ? true : false;
	if (!WeatherWindow && even.value.action === 'On') return openWeatherWindow();
    if (WeatherWindow && even.value.action === 'Off') WeatherWindow.destroy();
}


export async function action(data, callback) {

	callback();
 
}


const openWeatherWindow = async () => {

    if (WeatherWindow) return WeatherWindow.show();

    let style = {
        parent: Avatar.Interface.mainWindow(),
        frame: false,
        movable: true,
        resizable: true,
        minimizable: false,
        alwaysOnTop: false,
        show: false,
        width: Config.modules.weather.win.width,
        height: Config.modules.weather.win.height,
        opacity : Config.modules.weather.win.opacity,
        icon: path.resolve(__dirname, 'assets', 'images', 'weather.png'),
        webPreferences: {
            preload: path.resolve(__dirname, 'weather-preload.js')
        },
        title: "Weather forecast"
    }

    if (fs.existsSync(path.resolve(__dirname, 'assets', 'style.json'))) {
        let prop = fs.readJsonSync(path.resolve(__dirname, 'assets', 'style.json'), { throws: false });
        if (prop) {
            style.x = prop.x;
            style.y = prop.y;
        }
    }

    WeatherWindow = await Avatar.Interface.BrowserWindow(style, path.resolve(__dirname, 'weather.html'), false);

    WeatherWindow.once('ready-to-show', () => {
        WeatherWindow.show();
        WeatherWindow.webContents.send('onInit-weather');
        if (Config.modules.weather.devTools) WeatherWindow.webContents.openDevTools();
    })

    Avatar.Interface.ipcMain().on('weather-quit', () => {
        WeatherWindow.destroy();

        // refresh widget button on window closed
        Avatar.Interface.refreshWidgetInfo({plugin: 'weather', id: "808221"});
    })

    // returns the localized message defined in arg
    Avatar.Interface.ipcMain().handle('weather-msg', async (_event, arg) => {return Locale.get(arg)});

    WeatherWindow.on('closed', () => {
        currentwidgetState = false;
        Avatar.Interface.ipcMain().removeHandler('weather-msg');
        Avatar.Interface.ipcMain().removeAllListeners('weather-quit');
        WeatherWindow = null;
    })  
}

