(function() {
  var Base, User,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  Base = require('./base');

  User = (function(superClass) {
    extend(User, superClass);

    function User(login, client) {
      this.login = login;
      this.client = client;
    }

    User.prototype.profile = function(data) {
      return Object.keys(data).forEach((function(_this) {
        return function(e) {
          return _this[e] = data[e];
        };
      })(this));
    };

    User.prototype.info = function(cb) {
      return this.client.get("/users/" + this.login, function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error('User info error'));
        } else {
          return cb(null, b, h);
        }
      });
    };

    User.prototype.followers = function() {
      var cb, i, params, ref;
      params = 2 <= arguments.length ? slice.call(arguments, 0, i = arguments.length - 1) : (i = 0, []), cb = arguments[i++];
      return (ref = this.client).get.apply(ref, ["/users/" + this.login + "/followers"].concat(slice.call(params), [function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error('User followers error'));
        } else {
          return cb(null, b, h);
        }
      }]));
    };

    User.prototype.following = function() {
      var cb, i, params, ref;
      params = 2 <= arguments.length ? slice.call(arguments, 0, i = arguments.length - 1) : (i = 0, []), cb = arguments[i++];
      return (ref = this.client).get.apply(ref, ["/users/" + this.login + "/following"].concat(slice.call(params), [function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error('User following error'));
        } else {
          return cb(null, b, h);
        }
      }]));
    };

    User.prototype.repos = function() {
      var cb, i, params, ref;
      params = 2 <= arguments.length ? slice.call(arguments, 0, i = arguments.length - 1) : (i = 0, []), cb = arguments[i++];
      return (ref = this.client).get.apply(ref, ["/users/" + this.login + "/repos"].concat(slice.call(params), [function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error('User repos error'));
        } else {
          return cb(null, b, h);
        }
      }]));
    };

    User.prototype.events = function() {
      var cb, events, i, params, ref;
      params = 3 <= arguments.length ? slice.call(arguments, 0, i = arguments.length - 2) : (i = 0, []), events = arguments[i++], cb = arguments[i++];
      if (!cb && typeof events === 'function') {
        cb = events;
        events = null;
      } else if (events != null) {
        if (typeof events === 'number' && params.length > 0) {
          params[1] = events;
          events = null;
        } else if (!Array.isArray(events)) {
          events = [events];
        }
      }
      return (ref = this.client).get.apply(ref, ["/users/" + this.login + "/events"].concat(slice.call(params), [function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error('User events error'));
        }
        if (events != null) {
          b = b.filter(function(event) {
            return events.indexOf(event.type) !== -1;
          });
        }
        return cb(null, b, h);
      }]));
    };

    User.prototype.orgs = function() {
      var cb, i, params, ref;
      params = 2 <= arguments.length ? slice.call(arguments, 0, i = arguments.length - 1) : (i = 0, []), cb = arguments[i++];
      return (ref = this.client).get.apply(ref, ["/users/" + this.login + "/orgs"].concat(slice.call(params), [function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error('User organizations error'));
        } else {
          return cb(null, b, h);
        }
      }]));
    };

    return User;

  })(Base);

  module.exports = User;

}).call(this);
