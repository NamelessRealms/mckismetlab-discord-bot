import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { Client, TextChannel, Webhook } from "discord.js";
import SocketEvent from "./SocketEvent";
import MessageEvent from "./events/MessageEvent";
import LoggerUtil from "../utils/LoggerUtil";
import CommandEvent from "./events/CommandEvent";
import MessagePrivateEvent from "./events/MessagePrivateEvent";
import UserBoostEvent from "./events/UserBoost";
import { environment } from "../environment/Environment";

export default class SocketIo {

    private port: number = 8080;
    private _logger = new LoggerUtil("SocketIo");
    private _client: Client;
    private static _sockets: Map<string, Socket> = new Map<string, Socket>();
    private static _webhooks: Map<string, Webhook> = new Map<string, Webhook>();

    constructor(client: Client) {
        this._client = client;
    }

    public listeners() {

        const httpServer = createServer();
        const io = new Server(httpServer);

        io.on("connection", (socketConnection: Socket) => {

            if(socketConnection.conn.remoteAddress !== "::ffff:127.0.0.1") {
                socketConnection.disconnect();
                return;
            }

            const doEvent = async (msg: any): Promise<void> => {

                const serverId = msg.server_id;
                const serverType = msg.serverType;
                const socket = SocketIo._sockets.get(serverId);

                this._logger.info(`Server id: ${serverId} socket connection.`);

                if (socket !== undefined) {
                    socket.removeAllListeners();
                    SocketIo._sockets.delete(serverId);
                }

                SocketIo._sockets.set(serverId, socketConnection);

                if (serverType === "mcServer") {

                    let webhook = SocketIo._webhooks.get(serverType);

                    if (webhook !== undefined) {
                        // webhook.removeAllListeners(); // TODO:
                        SocketIo._webhooks.delete(serverId);
                    }

                    webhook = await this._doWebhook(serverId);

                    if (webhook !== undefined) {
                        SocketIo._webhooks.set(serverId, webhook);
                    }

                    // whitelist Task TODO:
                    // VerifyWhitelist.whitelistTask(serverId);
                }

                // register events
                new SocketEvent(this._client, socketConnection, serverId).register([
                    new MessageEvent(),
                    new MessagePrivateEvent(),
                    new CommandEvent(),
                    new UserBoostEvent()
                ]);

                socketConnection.off("init", doEvent);
            }

            socketConnection.on("init", doEvent);
        });

        httpServer.listen(this.port);
        this._logger.info(`Socket server listening on port ${this.port}.`);
    }

    private async _doWebhook(serverId: string): Promise<Webhook | undefined> {

        const chatChannelLink = environment.chatChannelLink.find((channelLink: any) => channelLink.minecraft_server_id === serverId);

        if (chatChannelLink !== undefined) {

            const channelId: string = chatChannelLink.discord_channel_id;
            const channel = await this._client.channels.fetch(channelId) as TextChannel;
            const webhooks = await channel.fetchWebhooks();
            const webhook = webhooks.find((hook) => hook.name === "mcKismetLab-Bot");

            if (webhook) {
                return webhook;
            } else {
                return (channel as TextChannel).createWebhook("mcKismetLab-Bot");
            }
        }

        return undefined;
    }

    public static getSocket(serverId: string): Socket | null {
        const socket = this._sockets.get(serverId);
        return socket !== undefined ? socket : null;
    }

    public static deleteSocket(serverId: string): void {
        this._sockets.delete(serverId);
    }

    public static getWebhook(serverId: string): Webhook | null {
        const webhook = this._webhooks.get(serverId);
        return webhook !== undefined ? webhook : null;
    }

    public static checkSocketConnection(serverId: string): boolean {
        return this._sockets.get(serverId) !== undefined;
    }

    public static async emitSocket<T>(eventName: string, serverId: string, data?: any): Promise<T> {
        return new Promise<T>((resolve) => {

            const socket = this.getSocket(serverId);

            if (socket === null) {
                throw {
                    error: "socket-no-online",
                    error_description: "Socket no online."
                };
            }

            const listener = (data: T) => {
                resolve(data);
                socket.off(eventName, listener);
            }

            socket.on(eventName, listener);
            
            if(data !== undefined) {
                socket.emit(eventName, data);
            } else {
                socket.emit(eventName);
            }
        });
    }
}
