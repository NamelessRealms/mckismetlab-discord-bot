import { MessageEmbed, Client, TextChannel, Message } from "discord.js";
import { dates } from "../utils/dates";
import * as fs from "fs-extra";
import * as path from "path";
import { getSocketMap } from "../api/socketApi";
import { getDynamicConfigPath } from "../utils/config";
import { logs } from "../utils/logs";

const log: logs = new logs();

interface IReceiveServerInfo {
    playerList: number;
    meanTPS: string;
    meanTickTime: string;
}

interface IServerInfo {
    online: number;
    TPS: number;
    TickTime: string;
    mainStatus: string;
}

const date: dates = new dates();

export function initHandleServerStatus(client: Client): void {

    handleServerStatus(client);
    setInterval(() => {
        handleServerStatus(client);
    }, 10000); // 1m
}

async function handleServerStatus(client: Client): Promise<void> {

    const dynamicConfigPath = getDynamicConfigPath();
    const dynamicConfigJson = fs.readJSONSync(dynamicConfigPath);

    const channelID = dynamicConfigJson.serverStatus.channelID || undefined;
    const messageID = dynamicConfigJson.serverStatus.message || undefined;

    if (channelID === undefined) {
        return;
    }

    const channel = client.channels.cache.get(channelID) as TextChannel;

    let serverInfo = {
        online: 0,
        TPS: 0,
        TickTime: "0",
        mainStatus: "❎離線"
    }

    const socket = getSocketMap("mckismetlab-main-server");

    if (socket !== undefined) {
        serverInfo.mainStatus = "✅上線";

        const listener = (message: IReceiveServerInfo) => {

            serverInfo.online = message.playerList;
            serverInfo.TPS = Number(message.meanTPS);
            serverInfo.TickTime = message.meanTickTime;

            sendServerStatus(serverInfo, client, channel, messageID, dynamicConfigJson, dynamicConfigPath);

            socket.off("getServerInfo", listener);
        };

        socket.on("getServerInfo", listener);
        socket.emit("task", { type: "getServerInfo" });
    } else {
        sendServerStatus(serverInfo, client, channel, messageID, dynamicConfigJson, dynamicConfigPath);
    }
}

async function sendServerStatus(serverInfo: IServerInfo, client: Client, channel: TextChannel, messageID: string, dynamicConfigJson: any, dynamicConfigPath: string): Promise<void> {

    let smoothness = () => {
        if (Number(serverInfo.TPS) >= 15) {
            return `😝 非常順暢 TPS: ${Math.round(serverInfo.TPS)}`;
        } else if (Number(serverInfo.TPS) < 15 && Number(serverInfo.TPS) >= 10) {
            return `🙂 順暢 TPS: ${Math.round(serverInfo.TPS)}`;
        } else if (Number(serverInfo.TPS) < 10 && Number(serverInfo.TPS) >= 5) {
            return `🙁 不順暢 TPS: ${Math.round(serverInfo.TPS)}`;
        } else if (Number(serverInfo.TPS) < 5) {
            return `😫 非常不順暢 TPS: ${Math.round(serverInfo.TPS)}`;
        }
    }

    const embed = new MessageEmbed()
        .setTitle("MCKISMETLAB // 無名伺服器狀態")
        .setColor("#7289DA")
        .setFooter(`MCKISMETLAB 無名伺服器 | 最後更新: ${date.time()}`, client.user?.avatarURL() as string)
        .addFields({
            name: "主服模組伺服器:",
            value: `狀態: ${serverInfo.mainStatus}\n人數: ${serverInfo.online} 名玩家\n順暢度: ${smoothness()}\n遊戲刻: ${serverInfo.TickTime}`
        });

    if (messageID === undefined) {

        const message = await channel.send(embed);

        dynamicConfigJson.serverStatus.message = message.id;

        fs.writeFileSync(dynamicConfigPath, JSON.stringify(dynamicConfigJson, null, 2), "utf-8");

    } else {

        const message = await channel.messages.fetch().then((messages) => {
            return messages.get(messageID) as Message;
        });

        // https://github.com/AngeloCore/discord-buttons/issues/85 { embed: embed }
        message.edit({ embed: embed })
            .catch((error) => {
                console.log(error);

                log.info("[\x1b[36mserverStatus\x1b[0m] 無名伺服器狀態系統，Error機器人無法發送");
            });
    }
}
