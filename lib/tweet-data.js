const sentiment = require('sentiment');
const expiryTimeout = 45; // minutes
const sentimentThreshold = 2;
const data = {
  tweets:[],
  stocks: {} //  { }
}
const sortByCreatedDate = (a, b) => a.created < b.created ? -1 : 1;
const process = (tweet) => {
  
  // handle expiries
  console.log(`tidying up expired stocks`);
  let now = Math.round((new Date()).getTime() / 1000);
  for (let stock in data.stocks) {
    if (now > data.stocks[stock].expiry) {
      data.stocks[stock].expired = true;
    }
  };

  // if we have no tweet data, stop here
  if (!tweet) {
    return;
  }

  console.log(`new: ${tweet.text}`);
  
  // create new tweet
  const d = new Date(tweet.created_at);
  const t = { 
    user_id: tweet.user.id_str,
    screen_name: tweet.user.screen_name,
    created: d.toISOString().substr(0, 19).replace('T', ' '),
    text: tweet.text,
    stocks: (tweet.text.match(/#[a-zA-Z]{3,4}\b/g) || []).map(stock => stock.replace('#', '')),
    sentiment: sentiment(tweet.text).score,
    sentiment_data: sentiment(tweet.text)
  }

  // store it in tweets and order by date
  data.tweets.push(t);
  data.tweets.sort(sortByCreatedDate);

  // handle mentions
  t.stocks.forEach(stock => {

    if (t.sentiment >= sentimentThreshold) {
      if (!data.stocks[stock]) {
        data.stocks[stock] = {
          expiry: Math.round((new Date()).getTime() / 1000) + (expiryTimeout * 60),
          expired: false,
          mentions: []
        };
      }
      
      if (!data.stocks[stock].mentions.includes(t.screen_name)) {
        data.stocks[stock].mentions.push(t.screen_name);
      }
    }
  });
  
}

module.exports = {
  process,
  data,
  expiryTimeout
}