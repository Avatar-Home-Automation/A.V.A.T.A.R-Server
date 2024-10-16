global.appInfo = function() {
	if (arguments[0] === undefined) return
	if (Config.verbose) {
		if (arguments[0] === undefined) return;
		var msg;
		for (var i = 0; i < arguments.length ; i++) {
			arguments[i] = typeof(arguments[i]) === 'object' ? JSON.stringify(arguments[i]) : arguments[i]
			msg = i == 0 && arguments[i] !== undefined ? arguments[i] : msg + " " + arguments[i]
		}
		logger ("info", msg)
	}
}

global.info = function() {
	if (arguments[0] === undefined) return;
	var msg;
	for (var i = 0; i < arguments.length ; i++) {
    	arguments[i] = typeof(arguments[i]) === 'object' ? JSON.stringify(arguments[i]) : arguments[i]
		msg = i == 0 && arguments[i] !== undefined ? arguments[i] : msg + " " + arguments[i]
	}
	logger ("info", msg)
};

global.infoGreen = function() {
	if (arguments[0] === undefined) return;
	var msg;
	for (var i = 0; i < arguments.length ; i++) {
    	arguments[i] = typeof(arguments[i]) === 'object' ? JSON.stringify(arguments[i]) : arguments[i];
		msg = i == 0 && arguments[i] !== undefined ? arguments[i] : msg + " " + arguments[i];
	}
	logger ("infoGreen", msg);
};

global.infoOrange = function() {
	if (arguments[0] === undefined) return;
	var msg;
	for (var i = 0; i < arguments.length ; i++) {
    	arguments[i] = typeof(arguments[i]) === 'object' ? JSON.stringify(arguments[i]) : arguments[i];
		msg = i == 0 && arguments[i] !== undefined ? arguments[i] : msg + " " + arguments[i];
	}
	logger ("infoOrange", msg);
};

global.infoConsole = function (...args) {
	if (args[0] === undefined) return;
	var msg = [];
	for (let i in args) {
		msg.push(args[i]);
	}
	loggerConsole (msg);
};

global.warn = function() {
	if (arguments[0] === undefined) return;
	var msg;
	for (var i = 0; i < arguments.length ; i++) {
    	arguments[i] = typeof(arguments[i]) === 'object' ? JSON.stringify(arguments[i]) : arguments[i]
		msg = i == 0 && arguments[i] !== undefined ? arguments[i] : msg + " " + arguments[i]
	}
	logger ("warn", msg);
}

global.error = function() {
	if (arguments[0] === undefined) return
	var msg;
	for (var i = 0; i < arguments.length ; i++) {
    	arguments[i] = typeof(arguments[i]) === 'object' ? JSON.stringify(arguments[i]) : arguments[i]
		msg = i == 0 && arguments[i] !== undefined ? arguments[i] : msg + " " + arguments[i]
	}
	logger ("error", msg);
}