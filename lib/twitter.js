const Twitter = require('twitter');

const twitter = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_SECRET
});

const EventEmitter = require('events');
const async = require('async');

const users = [
  {"screen_name":"emergocharts","id":"799100129559146497"},
  {"screen_name":"acheffy15","id":"3220009600"},
  {"screen_name":"mausaeus","id":"782865798893277184"},
  {"screen_name":"jarvy55","id":"1146444942"}
];

const updates = (users) => {
  return twitter.stream('statuses/filter', {follow: users.join(',')});
}

const historicalTweets = (users, callback) => {
  let e,
      actions = [];
  
  if (typeof callback !== 'function') {
    e = new EventEmitter();
    callback = function(err, data) {
      if (err) return;
      data.forEach((tweet => {
        e.emit('data', tweet);
      }))
    }
  }

  users.forEach(user => {
    actions.push(callback => {
      twitter.get('statuses/user_timeline', { user_id: user, count: 30 }, callback);
    });
  });

  async.parallel(actions, (err, results) => {

    if (err) return callback(err);

    results = [].concat.apply([], results);
    results = [].concat.apply([], results);
    callback(null, results.filter(result => !result.statusCode));

  }, 5);
  
  if (e) return e;
}

const getUser = (screen_name, callback) => {
  
  if (!screen_name) {
    return callback(new Error('Please provide a "screen_name"'));
  }
  
  const q = {
    screen_name
  }

  twitter.get('users/show', q, function(err, data) {
    
    if (err) return callback(new Error(`User ${screen_name} not found on Twitter`));

    return callback(null, { screen_name: screen_name, id: data.id_str })

  })
}

module.exports = {
  updates,
  users,
  getUser,
  historicalTweets
}