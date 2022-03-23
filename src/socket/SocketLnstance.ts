import { Client } from "discord.js";
import { Socket } from "socket.io";
import { messageHandler } from "./messageHandler";
import { logs } from "../utils/logs";
import { deleteSocketMap } from "../api/socketApi";
import ApiServiceAxios from "../api/apiServiceAxios";
import BotMain from "../botMain";

const log: logs = new logs();

export class SocketLnstance {

    private _socket: Socket;
    private _client: Client;
    private _serverID: string;

    constructor(socket: Socket, client: Client, serverID: string) {
        this._socket = socket;
        this._client = client
        this._serverID = serverID;
    }

    socketEvent(): void {

        this._socket.on("message", (message) => {
            messageHandler(message, this._client, this._serverID);
        });

        this._socket.on("disconnect", () => {
            deleteSocketMap(this._serverID);
            log.info(`[\x1b[36msocket\x1b[0m] 斷開! id: ${this._socket.id} name: ${this._serverID}`);
        });

        this._socket.on("getIsPlayerBoost", async (minecraftUuid: string) => {

            const userLinkData = await ApiServiceAxios.getUserLink(minecraftUuid);

            if (userLinkData.status !== 200) {
                this._socket.emit("isPlayerBoost", false);
                return;
            }

            const guild = this._client.guilds.cache.get(BotMain.CONFIG_DATA.guilds_id);
            const discordMember = guild?.members.cache.get(userLinkData.data.discord_id);

            if (discordMember === undefined) {
                this._socket.emit("isPlayerBoost", false);
                return;
            }

            // TODO: test id
            const isBoostRole = discordMember.roles.cache.get("802168196924309506") !== undefined;

            this._socket.emit("isPlayerBoost", isBoostRole);
        });
    }
}
