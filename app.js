// setup express etc...
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const argv = require('optimist').argv;
// data
const tweets = [];

// twitter module
const twitter = require('./lib/twitter');
const tweetData = require('./lib/tweet-data');
setInterval(tweetData.process, 60000);
// get the IDs of our twitter users
const twitterUsers = twitter.users.reduce(function(acc, i) { 
  acc.push(i.id);
  return acc;
}, []);

if (argv.historical) {
  console.log("*********** RUNNING IN HISTORICAL MODE ***********");
}

const twitterUpdateStream = argv.historical ? twitter.historicalTweets(twitterUsers) : twitter.updates(twitterUsers);

twitterUpdateStream.on('data', tweetData.process);
twitterUpdateStream.on('error', console.error);





app.get('/historical', function(req, res) {
  twitter.historicalTweets(twitterUsers, function(err, data) {
    if (err) return res.status(404).send(err.message);
    return res.send(data);
  })
});

app.get('/tweets', function(req, res) {
  return res.send(tweetData.data.tweets);
});

app.get('/stocks', function(req, res) {
  const expired = req.query.expired ? true : false;
  let stocks = tweetData.data.stocks;
  let remove = [];
  if (expired === false) {
    for (let stock in stocks) {
      if (stocks[stock].expired === true) {
        remove.push(stock);
      }
    }
    remove.forEach(r => {
      delete stocks[r];
    })
  }

  return res.send(tweetData.data.stocks);
});

app.get('/account', function (req, res) {
  
  if (!req.query.screen_name) {
    return res.status(404).send(`Please supply a "screen_name"\n`);
  }

  const q = {
    screen_name: req.query.screen_name
  }

  twitter.getUser(req.query.screen_name, function(err, data) {

    if (err) {
      return res.status(404).send(err.message);
    }

    return res.send(data);

  });

});

app.listen(3000, function () {
  console.log('listening on port 3000!')
});