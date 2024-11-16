
var pushover = module.exports = function () {
	
	if (!(this instanceof pushover)) {
		return new pushover();
	}
	
	this.send = function (title, body) {this.sendNotif(title, body)};
	
}


pushover.prototype.sendNotif = function (title, body) {
	
	var client = this;
	
	body = '<font color="purple">'+body+"</font><br>";
	var msg = {
		message: body,
		sound: 'magic',
		title: title,
		html: 1,
	};
	
	var token = Config.notification.pushoverToken,
		user = Config.notification.pushoverUser;

	var push = require('pushover');
    var p = new push({
		user: user,
		token: token,
		update_sounds: true,
		debug: true
	});

	p.send(msg, function( err, result ) {
		if (err && result != 200)
			error('Push error: %s', err);
		else 
			info('result: %s', result);
	}); 
}


