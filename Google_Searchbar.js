const puppeteer = require("puppeteer");
const csv = require("csv-parser");
const fs = require("fs");
const { url } = require("inspector");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const csvWriter = createCsvWriter({
  path: "output/education_nonprofits.csv",
  header: [{ id: "org", title: "Organization" }],
});

async function extractGoogleSearchCarousel(url) {
  try {
    let browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    let page = await browser.newPage();
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    await page.waitForSelector("div.appbar");

    var carouselItems = await page.evaluate(async () => {
      const appbar = document.querySelector("div.appbar");
      let sections = appbar.querySelectorAll("a");
      console.log(sections);
      let carouselItems = [];
      for (let i = 0; i < sections.length; ++i) {
        let item = sections[i];
        let text = item.innerText;

        carouselItems[i] = {
          org: text.replace("\n", " "),
        };
      }

      return carouselItems;
    });

    await page.screenshot({
      path: `./output/google_search.png`,
    });

    return carouselItems;
  } catch (error) {
    console.error(error);
  }
}

const _url =
  "https://www.google.com/search?rlz=1C1CHBF_enUS919US919&sxsrf=ALeKk00ePCR5aUfs0OS4uIoY1UFk2BJKhQ%3A1604523004059&ei=_BOjX6z_ApHgkgX1iIC4Cg&q=education+nonprofits&oq=education+nonprofits&gs_lcp=CgZwc3ktYWIQAzIECAAQQzIHCAAQFBCHAjICCAAyAggAMgIIADICCAAyAggAMgIIADICCAAyAggAOgQIIxAnOgcIABDJAxBDOggIABCxAxCDAToKCAAQsQMQFBCHAjoICC4QxwEQowI6BQgAELEDOgoILhDHARCvARBDUPJSWKFoYJ5paABwAXgAgAHXAYgBwReSAQYwLjE3LjKYAQCgAQGqAQdnd3Mtd2l6wAEB&sclient=psy-ab&ved=0ahUKEwis7cL94ensAhURsKQKHXUEAKcQ4dUDCA0&uact=5";
extractGoogleSearchCarousel(_url).then((data) => csvWriter.writeRecords(data));
