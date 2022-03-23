import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { SocketLnstance } from "../socket/SocketLnstance";
import { TextChannel, Client, Webhook } from "discord.js";

import BotMain from "../botMain";
import VerifyWhitelist from "../whitelist/verifyWhitelist";

const httpServer = createServer();
const io = new Server(httpServer);

let socketMap = new Map();
let webhookMap = new Map();

export function socketHandler(client: Client): void {

    io.on("connection", (socket: Socket) => {

        const doEvent = async (msg: any): Promise<void> => {

            let serverID = msg.server_id;
            let serverType = msg.serverType;
            let inSocket: Socket = socketMap.get(serverID);

            BotMain.LOG.info(`[\x1b[36msocket\x1b[0m] 連接! id: ${socket.id} name: ${serverID}`);

            if (inSocket !== undefined) {
                inSocket.removeAllListeners();
                socketMap.delete(serverID);
            }

            socketMap.set(serverID, socket);

            if (serverType === "mcServer") {

                let isWebhook = webhookMap.get(serverType);

                if (isWebhook !== undefined) {
                    isWebhook.removeAllListeners();
                    webhookMap.delete(serverID);
                }

                let webhook = await getWebhook(serverID, client);

                webhookMap.set(serverID, webhook);

                // whitelist Task
                VerifyWhitelist.whitelistTask(serverID);
            }

            new SocketLnstance(socket, client, serverID).socketEvent();

            socket.off("init", doEvent);
        }

        socket.on("init", doEvent);
    });

    httpServer.listen(8080);
}

async function getWebhook(serverID: string, client: Client): Promise<Webhook | undefined> {

    const chatChannelLink = BotMain.CONFIG_DATA.chatChannelLink.find((channelLink: any) => channelLink.minecraft_server_id === serverID);

    if (chatChannelLink !== undefined) {

        const channelID: string = chatChannelLink.discord_channel_id;
        const channel = await client.channels.fetch(channelID) as TextChannel;
        const webhooks = await channel.fetchWebhooks();
        const webhook = webhooks.find((hook) => hook.name === "mcKismetLab-Bot");

        if (webhook) {
            return webhook;
        } else {
            return (channel as TextChannel).createWebhook("mcKismetLab-Bot");
        }
    }
}

export function getSocketMap(serverID: string): Socket {
    return socketMap.get(serverID);
}

export function deleteSocketMap(serverID: string): void {
    socketMap.delete(serverID);
}

export function getWebhookMap(serverID: string): Webhook | undefined {
    return webhookMap.get(serverID);
}

export function isSocketOnline(serverId: string): boolean {
    return socketMap.get(serverId) !== undefined;
}



