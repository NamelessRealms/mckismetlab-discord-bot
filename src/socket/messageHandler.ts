import { Client, TextChannel, MessageEmbed } from "discord.js";
import { logs } from "../utils/logs";
import { getWebhookMap } from "../api/socketApi";
import { IMessageChat } from "./IMessageChat";
import { ICommandMag } from "./ICommandMag";
import { IPrivateMag } from "./IPrivateMag";
import { dates } from "../utils/dates";
import { getConfig } from "../utils/config";

const config = getConfig();

const date: dates = new dates();

const log: logs = new logs();

const crafatarURL = "https://crafatar.com/renders/head";

export function messageHandler(socketObject: any, client: Client, serverID: string): void {

    const type = socketObject.type;

    if (type === "text" || type === "server") {

        chat(type, socketObject, serverID, client);

    } else if (type === "privateMsg") {

        const channel = client.channels.cache.get(config.serverPrivateMsg.channelID) as TextChannel;

        if (channel !== undefined) {

            const message = socketObject as IPrivateMag;

            // let embed = new MessageEmbed()
            //     .addFields(
            //         {
            //             name: "伺服器:",
            //             value: serverID,
            //             inline: false
            //         },
            //         {
            //             name: "發件者:",
            //             value: message.sender,
            //             inline: true
            //         },
            //         {
            //             name: "接收者:",
            //             value: message.args[0],
            //             inline: true
            //         },
            //         {
            //             name: "內容:",
            //             value: message.args[1],
            //             inline: false
            //         }
            //     )
            //     .setFooter(date.fullYearTime())
            //     .setColor("#7289DA");

            // channel.send(embed);

            channel.send(`[${date.dateTime()}][${serverID}]${message.args[2]}[${message.args[3]}] 發件者: ${message.sender} 接收者: ${message.args[0]} 內容: ${message.args[1]}`);
        }
    } else if (type === "command") {

        const channel = client.channels.cache.get(config.serverCommandCarriedOut.channelID) as TextChannel;

        if (channel !== undefined) {
            const message = socketObject as ICommandMag;

            // let embed = new MessageEmbed()
            //     .addFields(
            //         {
            //             name: "伺服器:",
            //             value: serverID,
            //             inline: false
            //         },
            //         {
            //             name: "執行者:",
            //             value: message.sender,
            //             inline: true
            //         },
            //         {
            //             name: "指令:",
            //             value: message.command,
            //             inline: true
            //         },
            //         {
            //             name: "內容:",
            //             value: `/${message.command} ${message.args.join(" ")}`,
            //             inline: false
            //         }
            //     )
            //     .setFooter(date.fullYearTime())
            //     .setColor("#7289DA");

            // channel.send(embed);

            channel.send(`[${date.dateTime()}][${serverID}]${message.args[1]}[${message.args[2]}] OP: ${message.args[3]} 執行者: ${message.sender} 指令: ${message.command} 內容: ${message.args[0]}`);
        }
    }

}

function chat(type: string, socketObject: IMessageChat, serverID: string, client: Client): void {

    const content = socketObject.content;

    if (type === "text") {

        const userName = socketObject.user;
        const userUUID = socketObject.uuid;
        const playerSkinUrl = crafatarURL + `/${userUUID}` + "?overlay";

        if (content.length === 0 || content === null) return;

        // log.info(`[\x1b[36mmcServerChat\x1b[0m] [\x1b[36m${userName}\x1b[0m/\x1b[36m${userUUID}\x1b[0m]: ${content}`);

        const sendWebhook = getWebhookMap(serverID);

        if (sendWebhook === undefined) return;

        sendWebhook.send(content, {
            username: userName,
            avatarURL: playerSkinUrl
        });

    } else if (type === "server") {

        if (content.length === 0 || content === null) return;

        log.info(`[\x1b[36mmcServerChat\x1b[0m] [\x1b[36mServer\x1b[0m]: ${content}`);

        const sendChannelId = getServerChannelID(serverID);

        if (sendChannelId === null) return;

        const channel = client.channels.cache.get(sendChannelId) as TextChannel;

        channel.send(content);
    }
}

function getServerChannelID(serverID: string): string | null {

    for (let list of config.chatChannelLink) {

        if (serverID === list.minecraft_server_id) {
            return list.discord_channel_id;
        }
    }

    return null;
}
