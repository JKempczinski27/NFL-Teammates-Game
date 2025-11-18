// Artillery processor for custom functions and variables
const { v4: uuidv4 } = require('crypto');

// Generate random session ID for each virtual user
function captureSessionId(requestParams, response, context, ee, next) {
  if (!context.vars.sessionId) {
    context.vars.sessionId = generateSessionId();
  }
  return next();
}

// Generate a UUID-like session ID
function generateSessionId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Generate random player names
function generateRandomName(context, events, done) {
  const firstNames = ['Tom', 'Jerry', 'Randy', 'Jason', 'Josh', 'Aaron', 'Patrick', 'Lamar', 'Russell'];
  const lastNames = ['Brady', 'Rice', 'Moss', 'Pierre-Paul', 'Gordon', 'Rodgers', 'Mahomes', 'Jackson', 'Wilson'];
  context.vars.randomName = firstNames[Math.floor(Math.random() * firstNames.length)] + ' ' +
                            lastNames[Math.floor(Math.random() * lastNames.length)];
  return done();
}

// Generate random email
function generateRandomEmail(context, events, done) {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'nfl.com'];
  const randomNum = Math.floor(Math.random() * 1000000);
  context.vars.randomEmail = `testuser${randomNum}@${domains[Math.floor(Math.random() * domains.length)]}`;
  return done();
}

// Generate random social platform
function generateRandomPlatform(context, events, done) {
  const platforms = ['facebook', 'twitter', 'reddit', 'whatsapp'];
  context.vars.randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];
  return done();
}

// Generate random string for testing
function generateRandomString(context, events, done) {
  const length = 10;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  context.vars.randomString = result;
  return done();
}

// Generate random number
function generateRandomNumber(context, events, done) {
  context.vars.randomNumber = Math.floor(Math.random() * 1000000);
  return done();
}

// Log response for debugging
function logResponse(requestParams, response, context, ee, next) {
  if (response.statusCode >= 400) {
    console.log('Error response:', {
      statusCode: response.statusCode,
      url: requestParams.url,
      body: response.body
    });
  }
  return next();
}

// Track custom metrics
function trackMetrics(requestParams, response, context, ee, next) {
  if (response.timings) {
    ee.emit('customStat', {
      stat: 'ttfb',
      value: response.timings.firstByte
    });
  }
  return next();
}

module.exports = {
  captureSessionId,
  generateRandomName,
  generateRandomEmail,
  generateRandomPlatform,
  generateRandomString,
  generateRandomNumber,
  logResponse,
  trackMetrics
};
