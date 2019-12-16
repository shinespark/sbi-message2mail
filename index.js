const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const {google} = require('googleapis');
require('dotenv').config();

const SBI = {
  "loginUrl": "https://www.netbk.co.jp/contents/pages/wpl010101/i010101CT/DI01010210",
  "messageBoxUrl": "https://www.netbk.co.jp/contents/pages/wpl200601/i200601CT/DI20060000"
}

// https://developers.google.com/gmail/api/quickstart/nodejs#step_3_set_up_the_sample
// https://github.com/googleapis/google-api-nodejs-client/blob/master/samples/gmail/send.js
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
const TOKEN_PATH = path.join(__dirname, 'token.json');
let auth;
fs.readFile(path.join(__dirname, 'credentials.json'), (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  const {client_secret, client_id, redirect_uris} = JSON.parse(content).installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    oAuth2Client.setCredentials(JSON.parse(token));
    auth = oAuth2Client;
  });
});


async function login(page) {
  await page.goto(SBI.loginUrl, {waitUntil: 'networkidle2'});

  await page.type('#userName', `${process.env.SBI_USERNAME}`);
  await page.type('#loginPwdSet', `${process.env.SBI_PASSWORD}`);
  await page.click('button[data-js="login"]');
}

async function getUnreadMessages(page) {
  await page.goto(SBI.messageBoxUrl, {waitUntil: 'networkidle2'});

  const unreadMessagesSelector = '.m-linkMail.ng-star-inserted:not(.m-already)';
  const result = await page.$$eval(unreadMessagesSelector, unreadMessages => {
    let list = [];
    for (let i = 0; unreadMessages.length > i; i++) {
      list.push({
        href: unreadMessages[i].href,
        text: unreadMessages[i].textContent.trim()
      })
    }
    return list
  });

  console.log(result)

  return result
}

async function sendMail(subject, body) {
  console.log(subject);
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const messageParts = [
    `From: sbi-message2mail <${process.env.FROM}>`,
    `To: Yourself <${process.env.TO}>`,
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: 7bit',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    `${body}`
  ];
  const message = messageParts.join('\n');

  // The body needs to be base64url encoded.
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const gmail = google.gmail({version: 'v1', auth: auth});
  return gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
    },
  });
}

(async () => {
  const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
  const page = await browser.newPage();

  await login(page);

  const unreadMessages = await getUnreadMessages(page);
  // await captureAllPortfolio(page, 'service/portfolio', '.section-frame');

  await browser.close();
})();
