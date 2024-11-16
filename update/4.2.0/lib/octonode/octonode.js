(function() {
  var octonode;

  octonode = module.exports = {
    client: require('./lib/client'),
    user: require('./lib/user'),
    repo: require('./lib/repo')
  };

}).call(this);
