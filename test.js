var cron = require('cron');
new cron.CronJob('* * 23 * * *', function() {
  console.log('You will see this message every second');
}, null, true, 'America/New_York');