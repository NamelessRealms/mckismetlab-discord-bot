import "dotenv/config";

import LoggerUtil from "./utils/LoggerUtil";
import ClientEvents from "./clientEvent/ClientEvents";
import GuildMemberAddEvent from "./clientEvent/events/GuildMemberAddEvent";
import GuildMemberRemoveEvent from "./clientEvent/events/GuildMemberRemoveEvent";
import CommandBuilder from "./command/CommandBuilder";
import TestCommand from "./command/commands/TestCommand";
import IpCommand from "./command/commands/IpCommand";
import SocketIo from "./socket/SocketIo";
import MessageEvent from "./clientEvent/events/MessageEvent";
import Store from "./store/Store";
import ServerStatus from "./misc/ServerStatus";
import ServerCommandCommand from "./command/commands/ServerCommandCommand";
import EmbedCommand from "./command/commands/EmbedCommand";
import WhitelistApply from "./whitelist/WhitelistApply";
import ButtonEvent from "./clientEvent/events/ButtonEvent";

import { environment } from "./environment/Environment";
import { Client, Intents } from "discord.js";
import SelectMenuEvent from "./clientEvent/events/SelectMenuEvent";
import PlayerCommand from "./command/commands/PlayerCommand";
import ClearCommand from "./command/commands/ClearCommand";
import InfoCommand from "./command/commands/infoCommand";
import RestartCommand from "./command/commands/RestartCommand";

const discordModals = require("discord-modals");

export default class Main {

    public static readonly IS_DEV = process.env.NODE_ENV === "development";
    private readonly _store = new Store();
    private readonly _client = new Client({ intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_PRESENCES ] });
    private readonly _logger = new LoggerUtil("Main");

    constructor() {
        this._logger.info(`Start model: ${process.env.NODE_ENV}`);
        this._logger.info(`Version: ${environment.version}`);
    }

    public async start(): Promise<void> {
        try {

            // event ready
            this._client.on("ready", () => {

                this._logger.info("Discord BOT Start !");

                // discord-modals needs your client in order to interact with modals
                discordModals(this._client);

                // init activity
                this._botActivity();

                // server status
                new ServerStatus(this._client, this._store).init();

                // socket listener
                new SocketIo(this._client).listeners();

                // register event
                new ClientEvents(this._client).register([
                    new MessageEvent(),
                    new GuildMemberAddEvent(),
                    new GuildMemberRemoveEvent(),
                    new ButtonEvent(),
                    new SelectMenuEvent()
                ]);

                // register commands
                new CommandBuilder(this._client, environment.guilds_id).register([
                    // new TestCommand(),
                    new IpCommand(),
                    new ServerCommandCommand(),
                    new EmbedCommand(),
                    new PlayerCommand(),
                    new ClearCommand(),
                    new InfoCommand(),
                    new RestartCommand()
                ]);

                new WhitelistApply(this._client, this._store).init();
            });

            // login discord bot
            this._client.login(process.env.BOT_TOKEN);

        } catch (error) {
            this._logger.error(error);
            process.exit(0);
        }
    }

    private _botActivity() {
        this._client.user?.setPresence({
            activities: [
                {
                    name: `Minecraft 🎮`,
                    type: "PLAYING"
                }
            ]
        });
    }
}

// start bot
new Main().start();
