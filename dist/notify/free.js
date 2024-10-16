var moment = require('moment');

var freesms = module.exports = function () {
	
	if (!(this instanceof freesms)) {
		return new freesms();
	}
	
	this.send = function (title, body) {this.sendNotif(title, body)};
	
}


freesms.prototype.sendNotif = function (title, txt) {
	
	var client = this;
	moment.locale('fr');
	
	var body = title + "\n";
	body += 'From Avatar on ' + moment().format("DD/MM/YYYY - HH:mm"); 
	body += "\n\n" + txt + "\n";
	
	var token = Config.notification.SMStoken,
		user = Config.notification.SMSuser;

	var url = 'https://smsapi.free-mobile.fr/sendmsg';
	url += '?user=' + user;
	url += '&pass=' + token;
	url += '&msg='+body;
	process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
	
	var request = require('request');
	request({ 'uri': url }, function (err, response, body){
		if (err || response.statusCode != 200)
			error('Free SMS', err);
	}); 
}