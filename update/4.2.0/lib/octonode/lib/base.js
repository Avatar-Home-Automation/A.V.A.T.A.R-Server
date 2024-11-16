(function() {
  var Base;

  Base = (function() {
    function Base() {}

    Base.prototype.conditional = function(etag) {
      this.client.conditional(etag);
      return this;
    };

    return Base;

  })();

  module.exports = Base;

}).call(this);
