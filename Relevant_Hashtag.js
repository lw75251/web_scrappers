const puppeteer = require("puppeteer");
const csv = require('csv-parser');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const csvWriter = createCsvWriter({
  path: 'output/relevant_tags.csv',
  header: [
    {id: 'interest', title: 'Interest'},
    {id: 'tags', title: 'Tags'},
  ]
});

async function autoScroll(page) {
    await page.evaluate(async () => {
      await new Promise((resolve, reject) => {
        var totalHeight = 0;
        var distance = 100;
        var timer = setInterval(() => {
          var scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
  
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }

 async function snapshotAndExtractHashtagWordCloud(tag) {
    let browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });
  
    url = `https://hashtagify.me/hashtag/${tag}`

    let page = await browser.newPage();
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
  
    const button = await page.$('div.cuIXUx > button');
    await button.evaluate( button => button.click() );

    await autoScroll(page);

    const agreeButton = await page.$('button.iubenda-cs-close-btn')
    await agreeButton.evaluate( button => button.click() );

    await page.waitForSelector('div#word_cloud');
    const element = await page.$('div#word_cloud');
    const text = await page.evaluate(element => element.textContent, element);

    await element.screenshot({
        path: `./output/hashtags/${tag}.png`
    });
  
    console.log(`[Screenshotted]: ${tag}`);
    return text;
  };

const interests = [
    "#TheUndoing",
    "#TheQueensGambit",
    "#Yellowstone",
    "#Fargo",
    "#TheHauntingofBlyManor",
    "#StarTrekDiscovery",
    "#TheMandalorian",
    "#TheBoys",
    "#SouthPark",
    "#Helstrom",
    "#Whatwedointheshadows",
    "#RaisedbyWolves",
    "#TedLasso",
    "#SchittsCreek",
    "#ParksandRecreation",
    "#LovecraftCountry",
    "#TheWestWing",
    "#EmilyinParis",
    "#Evil",
    "#TheHautingofHillHouse",
    "#ArianaGrande",
    "#LukeCombs",
    "#InternetMoney",
    "#24kGoldn",
    "#PopSmoke",
    "#CardiB",
    "#Drake",
    "#JackHarlow",
    "#JustinBieber",
    "#JuiceWRLD",
    "#TheWeeknd",
    "#RittMomney",
    "#ConanGray",
    "#DaBaby",
    "#TateMcRAE",
    "#TyDolla",
    "#HarryStyles",
    "#BTS",
    "#TheKidLAROI",
    "#ShawnMendes",
    "#AnatomyofaMurder",
    "#TheDaily",
    "#TheJoeRoganExperience",
    "#CrimeJunkie",
    "#TheBenShapiroShow",
    "#Enough",
    "#DeadandGone",
    "#UnlockingUs",
    "#DatelineNBC",
    "#MyFavoriteMurder",
    "#CounterClock",
    "#PodSaveAmerica",
    "#TheMegynKellyShow",
    "#UpFirst",
    "#TheDanBonginoShow",
    "#TheJoeBuddenPodcast",
    "#DrDeath",
    "#MorbidATrueCrimePodcast",
    "#ArmchairExpert",
    "#CallHerDaddy",    
];

async function scrapeRelevantTags(tagList) {
    const relevant_tags = []
    for (const i of tagList) {
        const interest = i.replace("#","").toLowerCase();
        try {
            const tags = await snapshotAndExtractHashtagWordCloud(interest);
            relevant_tags.push({
                "interest": interest,
                "tags": tags
            });
        } catch (err) {
            console.error(err)
        }
    }

    return relevant_tags;
}

scrapeRelevantTags(interests).then((data) => csvWriter.writeRecords(data));


// fs.createReadStream('data/interests.csv').pipe(csv())
//   .on('data', async (row) => {
//     const interest = row["lower_case_name"].replace("#","")
//     snapshotAndExtractHashtagWordCloud(interest)
//   })
//   .then(() => {
//     console.log('CSV file successfully processed');
//     csvWriter.writeRecords(relevant_tags)
//   });