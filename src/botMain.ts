import "dotenv/config";

import * as path from "path";

import { Client } from "discord.js";
import { socketHandler } from "./api/socketApi";
import { botEvent } from "./event/botEvent";
import { initHandleServerStatus } from "./misc/serverStatusHandler";
import { logs } from "./utils/logs";
import { isServerCheck } from "./api/isServerCheck";
import { SlashCommands } from "./module/slashCommands";
import { environment } from "./environment/environment";

import ApiServiceAxios from "./api/apiServiceAxios";

export default class BotMain {

    public static readonly CONFIG_DATA = environment;
    public static readonly LOG = new logs();
    public static readonly IS_DEV = process.env.NODE_ENV === "development";
    public static readonly BOT_CLIENT = new Client();

    constructor() {

        // log out mode
        if (BotMain.IS_DEV) {
            BotMain.LOG.info("[\x1b[36minit\x1b[0m] 啟動模式: development");
        } else {
            BotMain.LOG.info("[\x1b[36minit\x1b[0m] 啟動模式: production");
        }

        BotMain.LOG.info(`Api Service Version: ${BotMain.CONFIG_DATA.api_version}`);
    }

    public async init(): Promise<void> {
        try {

            // examine api service online
            await isServerCheck();

            /**
            * login api service
            * save token
            */
            await ApiServiceAxios.login();

            // bind the buttons to "bot client"
            require("discord-buttons")(BotMain.BOT_CLIENT);

            // on ready
            BotMain.BOT_CLIENT.on("ready", () => {

                BotMain.BOT_CLIENT.user?.setActivity("無名伺服器", { type: "PLAYING" });

                // init event
                botEvent(BotMain.BOT_CLIENT);

                // socket handler
                socketHandler(BotMain.BOT_CLIENT);

                // all reaction handler
                // reactionHandler(BotMain.BOT_CLIENT, BotMain.IS_DEV);

                // server status handler
                initHandleServerStatus(BotMain.BOT_CLIENT);

                // load commands module
                new SlashCommands(BotMain.BOT_CLIENT, {
                    guildId: BotMain.CONFIG_DATA.guilds_id,
                    token: process.env.BOT_TOKEN,
                    commandsDirPath: path.join(__dirname, "commands")
                });

                BotMain.LOG.info("[\x1b[36mmain\x1b[0m] BOT準備好了 !");
            });

            // login discord bot
            BotMain.BOT_CLIENT.login(process.env.BOT_TOKEN);

        } catch (error) {
            BotMain.LOG.error(error);
            process.exit(0);
        }
    }
}

new BotMain().init();
