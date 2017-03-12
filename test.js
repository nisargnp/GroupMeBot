var cron = require('cron');
var cronJob = cron.job("* * 23 * * *", function(){
    // perform operation e.g. GET request http.get() etc.
    console.info('cron job completed');
}, undefined, true, "America/New_York");
cronJob.start();