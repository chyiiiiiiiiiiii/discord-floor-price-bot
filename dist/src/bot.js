"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../config");
const Eris = require("eris");
const eris_1 = require("eris");
const OpenseaScraper = require('opensea-scraper');
const ethPrice = require('eth-price');
/// Command
const COMMAND_FLOOR_PRICE = 'fp';
/// Bot Initialization
const bot = Eris(config_1.BOT_TOKEN);
/// DC
let serverGuild;
/// NFT project
let nftProjectName;
/// Floor price of project
let floorPriceInfo;
let floorPriceUSD;
//----------------------------------------------------------------
/**
 * Sleep
 * @param {number} ms milliseconds to sleep
 * @return {Promise} promise
 */
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 *  Create some handy command
 */
function createCommand() {
    return __awaiter(this, void 0, void 0, function* () {
        yield bot.createCommand({
            name: COMMAND_FLOOR_PRICE,
            description: '查詢NFT目前的地板價'
        });
    });
}
/**
 *  Set status for bot
 */
function setBotStatus() {
    return __awaiter(this, void 0, void 0, function* () {
        const basicInfo = yield OpenseaScraper.basicInfo(config_1.OPENSEA_PROJECT_NAME);
        nftProjectName = basicInfo.name;
        bot.editStatus([{
                name: nftProjectName,
                type: eris_1.Constants.ActivityTypes.WATCHING
            }]);
    });
}
/**
 *  Check the floor price of the project regularly
 */
function startWatchingFloorPrice() {
    return __awaiter(this, void 0, void 0, function* () {
        // Get all discord instance
        const guilds = bot.guilds;
        while (true) {
            yield guilds.map((guild) => __awaiter(this, void 0, void 0, function* () {
                const discordName = guild.name;
                console.log(`Start - get floor price in Discord(${discordName}).`);
                try {
                    // Get usd of eth
                    const usdInfo = yield ethPrice('usd');
                    const temp = `${usdInfo}`.split(' ')[1];
                    const perEthToUsd = parseFloat(temp);
                    // Get new data
                    floorPriceInfo = yield OpenseaScraper.floorPrice(config_1.OPENSEA_PROJECT_NAME);
                    // Convert ETH to USD
                    floorPriceUSD = floorPriceInfo.amount * perEthToUsd;
                    // Update bot a new name
                    yield bot.editSelf({ username: `${floorPriceInfo.amount} ${floorPriceInfo.currency}(地板價)` });
                    console.log(`Finish - floor price updated in Discord(${discordName}).`);
                }
                catch (error) {
                    console.log(`Error - update floor price failed - ${error}`);
                }
            }));
            // Sleep for next time
            const sleepMilliseconds = parseInt(config_1.FREQUENCY_OF_FETCHING);
            yield delay(sleepMilliseconds);
        }
    });
}
/**
 *  When receive /fp command for getting floor price of the project
 */
function onReceiveFloorPriceCommand(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        const message = `${nftProjectName}  ➤  Floor price is ${floorPriceInfo.amount} ${floorPriceInfo.currency} (${floorPriceUSD} USD).`;
        return interaction.createMessage(message);
    });
}
//----------------------------------------------------------------
bot.on("ready", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Discord connected and ready.");
    yield createCommand();
    yield setBotStatus();
    yield startWatchingFloorPrice();
}));
bot.on("error", (err) => {
    console.warn(`Error: ${err}`);
});
bot.on("guildCreate", (guild) => {
    console.log(`New guild: ${guild.name}`);
});
bot.on("interactionCreate", (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    if (interaction instanceof eris_1.CommandInteraction) {
        switch (interaction.data.name) {
            case COMMAND_FLOOR_PRICE:
                return onReceiveFloorPriceCommand(interaction);
            default: {
                return interaction.createMessage("interaction recieved");
            }
        }
    }
}));
bot.connect();
//# sourceMappingURL=bot.js.map