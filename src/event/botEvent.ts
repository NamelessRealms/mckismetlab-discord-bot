import { Client, User } from "discord.js";
import { welcomeJoin } from "../misc/welcomeHandler";
import { sendMessageHandler } from "./message/sendMessageHandle";
import { isServerCheck } from "../api/isServerCheck";
import BotMain from "../botMain";
import GoogleFormHandler from "../whitelist/googleFormHandler";
import ManualVerify from "../whitelist/manualVerify";
import ClearWhitelist from "../whitelist/clearWhitelist";

export function botEvent(client: Client) {

    client.on("guildMemberAdd", (member) => {

        welcomeJoin(member);

        BotMain.LOG.info(`[\x1b[36mEvent\x1b[0m] [\x1b[36m${member.user.tag}\x1b[0m/\x1b[36m${member.user?.id}\x1b[0m]: 加入了DISCORD!`);
    });

    client.on("guildMemberRemove", (member) => {

        BotMain.LOG.info(`[\x1b[36mEvent\x1b[0m] [\x1b[36m${member.user?.tag}\x1b[0m/\x1b[36m${member.user?.id}\x1b[0m]: 離開了DISCORD!`);
    });

    client.on("message", (message) => {

        sendMessageHandler(message);
    });

    // client.on("messageReactionAdd", (async (reaction, user) => {

    //     if (user.bot) return;

    //     const serverCheck = await isServerCheck()
    //         .then(() => { return true; })
    //         .catch(() => { return false; });
    // }));

    client.on("clickButton", async (buttonObject) => {

        const user = buttonObject.clicker.user;
        const serverCheck = await isServerCheck()
            .then(() => { return true; })
            .catch(() => { return false; });

        switch (buttonObject.id) {
            case "googleFormApplyButton":

                await GoogleFormHandler.formApplyLinkHandler(buttonObject.client, user as User, serverCheck);
                await buttonObject.reply.defer(true);

                break;
            case "whitelistConfirmButton":

                await GoogleFormHandler.formApplyConfirmButton(buttonObject.client, user as User, buttonObject.message as any, serverCheck);
                await buttonObject.reply.defer(true);

                break;
            case "whitelistCancelButton":

                await GoogleFormHandler.formApplyCancelButton(buttonObject.message as any, user as User, serverCheck);
                await buttonObject.reply.defer(true);

                break;
            case "manualVerifyPassButton":
            case "manualVerifyFailButton":

                ManualVerify.verify(buttonObject.id, buttonObject, user, serverCheck);
                buttonObject.reply.defer(false);

                break;
            case "confirmClearWhitelist":
            case "cancelClearWhitelist":

                ClearWhitelist.clearWhitelistButton(buttonObject.id, buttonObject);
                buttonObject.reply.defer(false);

                break;
        }
    });
}
