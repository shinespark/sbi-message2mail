const moment = require('moment');
const puppeteer = require('puppeteer');

const sbi = {
  "loginUrl": "https://www.netbk.co.jp/contents/pages/wpl010101/i010101CT/DI01010210",
}

const date = moment().format(moment.HTML5_FMT.DATETIME_LOCAL_MS);

async function login(page) {
    await page.goto(sbi.loginUrl);
    await page.type('#userName', `${process.env.SBI_USERNAME}`);
    await page.type('#loginPwdSet', `${process.env.SBI_PASSWORD}`);
    await page.click('button[data-js="login"]');
    await page.waitFor(5000);
}

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await login(page);
    await page.screenshot({path: 'example.png'});
    // await captureAllPortfolio(page, 'service/portfolio', '.section-frame');

    await browser.close();
})();
