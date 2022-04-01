import * as Discord from "discord.js";

import IEvent from "./IEvent";
import LoggerUtil from "../utils/LoggerUtil";
import ModalSubmitEvent from "./events/ModalSubmitEvent";

export default class ClientEvents {

    private _client: Discord.Client;
    private _eventsClass = new Array<IEvent<keyof Discord.ClientEvents>>();
    private _logger = new LoggerUtil("ClientEvents");

    constructor(client: Discord.Client) {
        this._client = client;
    }

    public register(events: Array<IEvent<keyof Discord.ClientEvents>> | IEvent<keyof Discord.ClientEvents>): this {

        if(!Array.isArray(events)) {
            events = [events];
        }

        events.forEach((value) => this._eventsClass.push(value));

        this._loadEvents();

        return this;
    }

    private _loadEvents(): void {

        if(this._eventsClass.length <= 0) {
            return;
        }

        for(let eventClass of this._eventsClass) {

            if(eventClass.event === undefined) {
                throw new Error("ClientEvents register event name not null.");
            }

            this._logger.info(`Register event ${eventClass.event} success.`);
            this._client.on(eventClass.event, (...args) => eventClass.execute(this._client, ...args));
        }

        // discord-modals register
        this._client.on("modalSubmit", (modal) => new ModalSubmitEvent().execute(this._client, modal));
        this._logger.info(`Register event modalSubmit success.`);

        this._logger.info("Successfully registered application events.");
    }
}

// export function botEvent(client: Client) {

    // client.on("guildMemberAdd", (member) => {

    //     welcomeJoin(member);

    //     Main.LOG.info(`[\x1b[36mEvent\x1b[0m] [\x1b[36m${member.user.tag}\x1b[0m/\x1b[36m${member.user?.id}\x1b[0m]: 加入了DISCORD!`);
    // });

//     client.on("guildMemberRemove", (member) => {

//         Main.LOG.info(`[\x1b[36mEvent\x1b[0m] [\x1b[36m${member.user?.tag}\x1b[0m/\x1b[36m${member.user?.id}\x1b[0m]: 離開了DISCORD!`);
//     });

//     client.on("message", (message) => {

//         sendMessageHandler(message);
//     });

//     // client.on("messageReactionAdd", (async (reaction, user) => {

//     //     if (user.bot) return;

//     //     const serverCheck = await isServerCheck()
//     //         .then(() => { return true; })
//     //         .catch(() => { return false; });
//     // }));

//     client.on("clickButton", async (buttonObject) => {

//         const user = buttonObject.clicker.user;
//         const serverCheck = await isServerCheck()
//             .then(() => { return true; })
//             .catch(() => { return false; });

//         switch (buttonObject.id) {
//             case "googleFormApplyButton":

//                 await GoogleFormHandler.formApplyLinkHandler(buttonObject.client, user as User, serverCheck);
//                 await buttonObject.reply.defer(true);

//                 break;
//             case "whitelistConfirmButton":

//                 await GoogleFormHandler.formApplyConfirmButton(buttonObject.client, user as User, buttonObject.message as any, serverCheck);
//                 await buttonObject.reply.defer(true);

//                 break;
//             case "whitelistCancelButton":

//                 await GoogleFormHandler.formApplyCancelButton(buttonObject.message as any, user as User, serverCheck);
//                 await buttonObject.reply.defer(true);

//                 break;
//             case "manualVerifyPassButton":
//             case "manualVerifyFailButton":

//                 ManualVerify.verify(buttonObject.id, buttonObject, user, serverCheck);
//                 buttonObject.reply.defer(false);

//                 break;
//             case "confirmClearWhitelist":
//             case "cancelClearWhitelist":

//                 ClearWhitelist.clearWhitelistButton(buttonObject.id, buttonObject);
//                 buttonObject.reply.defer(false);

//                 break;
//         }
//     });
// }
