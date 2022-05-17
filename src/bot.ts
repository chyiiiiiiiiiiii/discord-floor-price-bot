
import {
  BOT_TOKEN, OPENSEA_PROJECT_NAME, FREQUENCY_OF_FETCHING,
} from "../config";
const Eris = require("eris");
import { Constants, Guild, AnyInteraction, CommandInteraction } from "eris";
const OpenseaScraper = require('opensea-scraper');
const ethPrice = require('eth-price');

/// Command
const COMMAND_FLOOR_PRICE = 'fp'

/// Bot Initialization
const bot = Eris(BOT_TOKEN);

/// DC
let serverGuild: Guild;

/// NFT project
let nftProjectName: string;
/// Floor price of project
let floorPriceInfo: { amount: any; currency: any; };
let floorPriceUSD: number;

//----------------------------------------------------------------

/**
 * Sleep
 * @param {number} ms milliseconds to sleep
 * @return {Promise} promise
 */
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 *  Create some handy command
 */
async function createCommand() {
  await bot.createCommand({
    name: COMMAND_FLOOR_PRICE,
    description: '查詢NFT目前的地板價'
  });
}

/**
 *  Set status for bot
 */
async function setBotStatus() {
  const basicInfo = await OpenseaScraper.basicInfo(OPENSEA_PROJECT_NAME);
  nftProjectName = basicInfo.name
  bot.editStatus([{
    name: nftProjectName,
    type: Constants.ActivityTypes.WATCHING
  }])
}

/**
 *  Check the floor price of the project regularly
 */
async function startWatchingFloorPrice() {
  // Get all discord instance
  const guilds = bot.guilds;
  while (true) {
    await guilds.map(async (guild: Guild) => {
      const discordName = guild.name
      console.log(`Start - get floor price in Discord(${discordName}).`);
      try {
        // Get usd of eth
        const usdInfo = await ethPrice('usd');
        const temp = `${usdInfo}`.split(' ')[1]
        const perEthToUsd = parseFloat(temp)
        // Get new data
        floorPriceInfo = await OpenseaScraper.floorPrice(OPENSEA_PROJECT_NAME);
        // Convert ETH to USD
        floorPriceUSD = floorPriceInfo.amount * perEthToUsd
        // Update bot a new name
        await bot.editSelf(
          { username: `${floorPriceInfo.amount} ${floorPriceInfo.currency}(地板價)` }
        );
        console.log(`Finish - floor price updated in Discord(${discordName}).`);
      } catch (error) {
        console.log(`Error - update floor price failed - ${error}`);
      }
    });

    // Sleep for next time
    const sleepMilliseconds = parseInt(FREQUENCY_OF_FETCHING)
    await delay(sleepMilliseconds);
  }
}

/**
 *  When receive /fp command for getting floor price of the project
 */
async function onReceiveFloorPriceCommand(interaction: CommandInteraction) {
  const message = `${nftProjectName}  ➤  Floor price is ${floorPriceInfo.amount} ${floorPriceInfo.currency} (${floorPriceUSD} USD).`
  return interaction.createMessage(message);
}

//----------------------------------------------------------------

bot.on("ready", async () => {
  console.log("Discord connected and ready.");

  await createCommand()
  await setBotStatus()
  await startWatchingFloorPrice()
});

bot.on("error", (err: any) => {
  console.warn(`Error: ${err}`);
});

bot.on("guildCreate", (guild: any) => {
  console.log(`New guild: ${guild.name}`);
});

bot.on("interactionCreate", async (interaction: AnyInteraction) => {
  if (interaction instanceof CommandInteraction) {
    switch (interaction.data.name) {
      case COMMAND_FLOOR_PRICE:
        return onReceiveFloorPriceCommand(interaction);
      default: {
        return interaction.createMessage("interaction recieved");
      }
    }
  }
});

bot.connect();
