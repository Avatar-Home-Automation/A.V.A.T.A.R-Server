import _ from 'underscore';
import moment from 'moment-timezone';

//language pak
let Locale;

export async function init() {

    if (!await Avatar.lang.addPluginPak("worldTime")) {
        return error('worldTime: unable to load language pak files');
    }

}


export async function action(data, callback) {

	try {
		Locale = await Avatar.lang.getPak("worldTime", data.language);
        if (!Locale) {
            throw new Error (`worldTime: Unable to find the '${data.language}' language pak.`);
        }

		const tblActions = {
			get : () => get(data)				
		}
		
		info("worldTime:", data.action.command, L.get("plugin.from"), data.client);
			
		tblActions[data.action.command]()
	} catch (err) {
		if (data.client) Avatar.Speech.end(data.client);
		if (err.message) error(err.message);
	}	
		
	callback();
 
}


const get = async data => {
	try {
		const city = (data.relations?.location?.text ? data.relations.location.text : Config.modules.worldTime.default.zone);
		const speechCity = city === Config.modules.worldTime.default.zone ? Config.modules.worldTime.default.speech : city;
		const location = city.replace(/ /gi,"_");
		const timeZones = Intl.supportedValuesOf('timeZone');
		let even = _.find(timeZones, item => { return item.toLowerCase().indexOf(`${location}`.toLowerCase()) !== -1; });
		if (even) {
			even = typeof even === 'string' ? even : even[0];
			moment.locale(data.language);
			const sentence = moment.tz(Date.now(), even).format(Locale.get(["message.time", speechCity]));
			Avatar.speak(sentence, data.client);
		} else {
			Avatar.speak(Locale.get(["error.notime", speechCity]), data.client);
		}
	} catch (err) {
			if (data.client) Avatar.Speech.end(data.client);
			if (err.message) error(err.message);
	}
}




