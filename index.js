const moment = require('moment');
const puppeteer = require('puppeteer');

const sbi = {
  "loginUrl": "https://www.netbk.co.jp/contents/pages/wpl010101/i010101CT/DI01010210",
  "messageBoxUrl": "https://www.netbk.co.jp/contents/pages/wpl200601/i200601CT/DI20060000"
}

const date = moment().format(moment.HTML5_FMT.DATETIME_LOCAL_MS);

async function login(page) {
  await page.goto(sbi.loginUrl);
  const loginButton = 'button[data-js="login"]';
  await page.waitForSelector(loginButton);

  await page.type('#userName', `${process.env.SBI_USERNAME}`);
  await page.type('#loginPwdSet', `${process.env.SBI_PASSWORD}`);
  await page.click('button[data-js="login"]');
}

async function showMessageBox(page) {
  await page.goto(sbi.messageBoxUrl);

  const unreadMessagesClassName = '.m-linkMail.ng-star-inserted:not(.m-already)';
  const unreadMessages = await page.$$(unreadMessagesClassName);
  if (unreadMessages.length == 0) {
    return;
  }
  await page.waitForSelector(unreadMessagesClassName);

  await page.click(unreadMessagesClassName);
  await page.screenshot({path: date + '_.png'}); // for debug

  // ページ読み込み完了まで待つ
  await page.waitForSelector('p.m-txtAreaR');

  const title = await page.$('.m-hdr1.ng-star-inserted', node => node.innerText);
  console.log(title);
  const datetime = await page.$('.m-txtAreaR.ng-star-inserted', node => node.innerText);
  console.log(datetime);
  const text = await page.$('p.m-txtAreaR', node => node.innerText);
  console.log(text);
}

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await login(page);
  await page.screenshot({path: 'afterlogin.png'});
  await showMessageBox(page);
  // await captureAllPortfolio(page, 'service/portfolio', '.section-frame');

  await browser.close();
})();
