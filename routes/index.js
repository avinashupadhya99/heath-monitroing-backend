const cron = require('node-cron');
const express = require('express');
var router = express.Router();
const {CourierClient} = require('@trycourier/courier');
const fetch = require('node-fetch');

const courier = CourierClient({
  authorizationToken: 'dk_prod_M03WT4ZE6A4B97GK2GCDBG8FBC9G',
});

let thresholds = [90, 40, 30, 50, 500, 40];
let notificationTimestamps = {};

router.get('/', function(req, res, next) {
  res.send(thresholds);
});

router.post('/', function(req, res, next) {
  const { threshold, field } = req.body;
  thresholds[parseInt(field)] = parseInt(threshold);
  console.log(thresholds);
  res.send(thresholds);
});

module.exports = router;

const sendNotification = async data => {
  console.log("Send notification");
  if(!notificationTimestamps[`${data.feed}-${data.timeMilliSeconds}`]) {
    notificationTimestamps[`${data.feed}-${data.timeMilliSeconds}`] = true;
    const {messageId} = await courier.send({
      eventId: 'RQEBE9G9YV42DKMJFF5NW9Q1Q4PT',
      recipientId: 'ed52d3a4-f19c-4913-97e8-e8306d17d823',
      profile: {
        email: 'avinashupadhya99@gmail.com',
        phone_number: '+919481029088',
      },
      data: data,
      override: {},
    });
    console.log(messageId);
  }
};

cron.schedule('*/30 * * * * *', function() {
    fetch(
      'https://api.thingspeak.com/channels/1268340/feeds.json?api_key=RCW348S17GG6FXWT&days=1&round=2',
    )
    .then(feedData => feedData.json())
    .then(feedData => {
      feedData.feeds.map(feed => {
        if (feed.field1 > thresholds[0]) {
          sendNotification({
            feed: feedData.channel.field1,
            threshold: thresholds.field1,
            feedValue: feed.field1,
            dateTime: new Date(feed.created_at).toString(),
            timeMilliSeconds: new Date(feed.created_at).getTime(),
          });
          // console.log(new Date(feed.created_at).getTime());
        }
        if (feed.field2 > thresholds[1]) {
          sendNotification({
            feed: feedData.channel.field2,
            threshold: thresholds.field2,
            feedValue: feed.field2,
            dateTime: new Date(feed.created_at).toString(),
            timeMilliSeconds: new Date(feed.created_at).getTime(),
          });
        }
        
      });
    })
    .catch(fetchError => {
      console.error(fetchError);
    });
});