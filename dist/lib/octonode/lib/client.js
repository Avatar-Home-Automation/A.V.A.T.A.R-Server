(function() {
  var Client, HttpError, Promise, Repo, User, extend, pkg, axios, url,
    extend1 = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    slice = [].slice;
  
  axios = require('axios');

  url = require('url');

  Promise = require('bluebird');

  pkg = require('../package.json');

  User = require('./user');

  Repo = require('./repo');

  extend = require('deep-extend');

  HttpError = (function(superClass) {
    extend1(HttpError, superClass);

    function HttpError(message, statusCode, headers, body1) {
      this.message = message;
      this.statusCode = statusCode;
      this.headers = headers;
      this.body = body1;
    }

    return HttpError;

  })(Error);

  Client = (function() {
    function Client(token1, options1) {
      this.token = token1;
      this.options = options1;
      this.limit = bind(this.limit, this);
      this.requestOptions = bind(this.requestOptions, this);
      this.request = this.options && this.options.request || axios;
      this.requestDefaults = {
        headers: {
          'User-Agent': "octonode/" + pkg.version + " (https://github.com/pksunkara/octonode) terminal/0.0"
        }
      };
      if (this.token && typeof this.token === 'string') {
        this.requestDefaults.headers.Authorization = "token " + this.token;
      }
    }

    Client.prototype.conditional = function(etag) {
      this.etag = etag;
      return this;
    };

    Client.prototype.user = function(name) {
      return Promise.promisifyAll(new User(name, this), {
        multiArgs: true
      });
    };

    Client.prototype.repo = function(name) {
      return Promise.promisifyAll(new Repo(name, this), {
        multiArgs: true
      });
    };

    Client.prototype.requestOptions = function(params1, params2) {
      var params3;
      params3 = {};
      if (this.etag) {
        params3.headers = {
          'If-None-Match': this.etag
        };
        this.etag = null;
      }
      return extend(this.requestDefaults, params1, params2, params3);
    };

    Client.prototype.buildUrl = function(path, pageOrQuery, per_page, since) {
      var _url, q, query, separator, urlFromPath;
      if (path == null) {
        path = '/';
      }
      if (pageOrQuery == null) {
        pageOrQuery = null;
      }
      if (per_page == null) {
        per_page = null;
      }
      if (since == null) {
        since = null;
      }
      if ((pageOrQuery != null) && typeof pageOrQuery === 'object') {
        query = pageOrQuery;
      } else {
        query = {};
        if (pageOrQuery != null) {
          if ((since != null) && since === true) {
            query.since = pageOrQuery;
          } else {
            query.page = pageOrQuery;
          }
        }
        if (per_page != null) {
          query.per_page = per_page;
        }
      }
      if (this.token && typeof this.token === 'object' && this.token.id) {
        query.client_id = this.token.id;
        query.client_secret = this.token.secret;
      }
      if (query.q) {
        q = query.q;
        delete query.q;
        if (Object.keys(query).length) {
          separator = '&';
        } else {
          separator = '?';
        }
      }
      urlFromPath = url.parse(path);
      _url = url.format({
        protocol: urlFromPath.protocol || this.options && this.options.protocol || "https:",
        auth: urlFromPath.auth || (this.token && this.token.username && this.token.password ? this.token.username + ":" + this.token.password : ''),
        hostname: urlFromPath.hostname || this.options && this.options.hostname || "api.github.com",
        port: urlFromPath.port || this.options && this.options.port,
        pathname: urlFromPath.pathname,
        query: query
      });
      if (q) {
        _url += separator + "q=" + q;
        query.q = q;
      }
      return _url;
    };

    Client.prototype.errorHandle = function(res, body, callback) {
      var err, ref;
      if (Math.floor(res.statusCode / 100) === 5) {
        return callback(new HttpError('Error ' + res.statusCode, res.statusCode, res.headers));
      }
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body || '{}');
        } catch (error) {
          err = error;
          return callback(err);
        }
      }
      if (body && body.message && ((ref = res.statusCode) === 400 || ref === 401 || ref === 403 || ref === 404 || ref === 410 || ref === 422)) {
        return callback(new HttpError(body.message, res.statusCode, res.headers, body));
      }
      return callback(null, res.statusCode, body, res.headers);
    };

    Client.prototype.get = async function() {
      var callback, i, params, path;
      path = arguments[0], params = 3 <= arguments.length ? slice.call(arguments, 1, i = arguments.length - 1) : (i = 1, []), callback = arguments[i++];
	    try {
        let response = await axios(this.requestOptions({
        url: this.buildUrl.apply(this, [path].concat(slice.call(params))),
        method: 'get',
        responseType: 'json'
        }))
        let elem = {
        statusCode: response.status,
        body: response.data,
        headers: response.headers
        };
            
        return this.errorHandle(elem, elem.body, callback);
      } catch (err){
        if (err.status === 404 && err.url && err.url.toLowerCase().indexOf("info.txt") > -1) {
          let elem = {
            statusCode: 200,
            message: "Not Found"
          }; 
          return this.errorHandle(elem, elem.body, callback);
        } else 
          callback(err);
	    }
    };

    return Client;

  })();

  module.exports = function() {
    var credentials, token;
    token = arguments[0], credentials = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    return Promise.promisifyAll((function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return Object(result) === result ? result : child;
    })(Client, [token].concat(slice.call(credentials)), function(){}), {
      multiArgs: true
    });
  };

}).call(this);
