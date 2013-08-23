
var hyperseed = require('..');
var express = require('express');

var app = express();
app.use(express.bodyParser());
app.use(function(req, res, next) {
  if (!req.get('authorization')) return res.send(401);
  next();
});

var port = 0;

app.get('/', function(req, res) {
  res.send({
    categories: {
      href: host('/categories')
    },
    vendors: {
      href: host('/vendors')
    }
  });
});

app.get('/categories', function(req, res) {
  res.send({
    create: {
      action: host('/categories'),
      method: 'POST',
      input: {
        name: {
          type: 'text'
        },
        email: {
          type: 'email'
        }
      }
    }
  });
});

app.get('/vendors', function(req, res) {
  res.send({
    create: {
      action: host('/vendors'),
      method: 'POST',
      input: {
        name: {
          type: 'text'
        },
        items: {
          type: 'number'
        }
      }
    }
  });
});

app.post('/categories', function(req, res) {
  if (req.body && req.body.name && req.body.email) return res.send(204); 
  res.send(400);
});

app.post('/vendors', function(req, res) {
  if (req.body && req.body.name && req.body.items) return res.send(204); 
  res.send(400);
});

function host(path) {
  return 'http://localhost:' + port + (path || '');
};

port = app.listen().address().port;

describe('hyperseed', function(){
  it('should', function(done) {
    var seed = hyperseed();

    seed.feed('text', function() {
      return 'Hello';
    });
    seed.feed('email', function() {
      return 'test@theflokk.com';
    });
    seed.feed('number', function() {
      return 123;
    });

    seed(host())
      .set({'authorization': 'Bearer 123'})
      .seed('categories.create')
      .seed('vendors.create')
      .on('error', done)
      .end(function(err, responses) {
        if (err) return done(err);
        // TODO verify each of the responses passed
        done();
      });
  });
});
