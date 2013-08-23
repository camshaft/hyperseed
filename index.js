/**
 * Module dependencies
 */

var superagent = require('superagent');
var Batch = require('batch');

var proto = {};

module.exports = function() {
  function client(href) { return client.root(href); };
  for (var prop in proto) {
    client[prop] = proto[prop];
  };
  client.types = {};
  return client;
};

proto.root = function(href) {
  var req = superagent.get(href);
  req.seed = seed;
  req._types = this.types;
  req._end = req.end;
  req._paths = [];
  req.end = end;
  return req;
};

proto.feed = function(type, fn) {
  this.types[type] = fn;
  return this;
};

function seed(path) {
  this._paths.push(path.split('.'));
  return this;
};

function end(fn) {
  var self = this;
  self._end(function(res) {
    var batch = new Batch();

    self._paths.forEach(function(path) {
      var pathref = path.slice();
      var rel = pathref.shift();

      // Fill out the form and submit it
      if (!pathref.length) return batch.push(function(done) {
        var form = res.body[rel];
        var data = {};
        var err;
        Object.keys(form.input).forEach(function(key) {
          if (err) return;
          var type = form.input[key].type;
          var feed = self._types[type];
          if (!feed) return err = new Error('Feed not specified for type "' + type + '"');
          data[key] = feed(res);
        });

        if (err) return done(err);

        var method = (form.method || 'GET').toLowerCase();

        superagent[method](form.action)
          .set(self.request()._headers)
          .send(data)
          .on('error', done)
          .end(function(res) {
            done(null, res);
          })
      });

      batch.push(function(done) {
        var req = superagent.get(res.body[rel].href);
        req._end = req.end;
        req._types = self._types;
        req._paths = [pathref];
        req.end = end;

        req
          .set(self.request()._headers)
          .on('error', done)
          .end(done);
      });
    });

    batch.end(fn);
  });
};
