import { MessageEmbed, Client, TextChannel } from "discord.js";
import { environment } from "../environment/Environment";
import SocketIo from "../socket/SocketIo";
import Store from "../store/Store";
import Dates from "../utils/Dates";
import LoggerUtil from "../utils/LoggerUtil";

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

export default class ServerStatus {

    private _logger = new LoggerUtil("ServerStatusHandler");
    private _store: Store;
    private _client: Client;

    constructor(client: Client, store: Store) {
        this._store = store;
        this._client = client;
    }

    public init() {
        this._handleServerStatus(this._client);
        setInterval(() => {
            this._handleServerStatus(this._client);
        }, 10000); // 10s
    }

    private async _handleServerStatus(client: Client): Promise<void> {

        const channelId = environment.serverStatus.channelId;
        const messageId = this._store.getServerStatusMessageId();

        if (channelId === null) return;

        const channel = client.channels.cache.get(channelId) as TextChannel;

        const serverInfo = {
            online: 0,
            TPS: 0,
            TickTime: "0",
            mainStatus: "❎離線"
        }

        try {

            const serverInfoReceive = await SocketIo.emitSocket<IReceiveServerInfo>("getServerInfo", "mckismetlab-main-server");

            serverInfo.mainStatus = "✅上線";
            serverInfo.online = serverInfoReceive.playerList;
            serverInfo.TPS = Number(serverInfoReceive.meanTPS);
            serverInfo.TickTime = serverInfoReceive.meanTickTime;

            this._sendServerStatus(serverInfo, client, channel, messageId);

        } catch (error: any) {
            this._sendServerStatus(serverInfo, client, channel, messageId);
        }
    }

    private async _sendServerStatus(serverInfo: IServerInfo, client: Client, channel: TextChannel, messageId: string | null): Promise<void> {

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
            .setFooter({
                text: `MCKISMETLAB 無名伺服器 | 最後更新: ${Dates.time()}`,
                iconURL: client.user?.avatarURL() as string
            })
            .addFields({
                name: "主服模組伺服器:",
                value: `狀態: ${serverInfo.mainStatus}\n人數: ${serverInfo.online} 名玩家\n順暢度: ${smoothness()}\nMSPT: ${serverInfo.TickTime}`
            });

        if (messageId !== null) {

            const message = (await channel.messages.fetch()).find(value => value.id === messageId);
            if (message === undefined) return;
            message.edit({ embeds: [embed] }).catch(() => this._logger.error("無名伺服器狀態系統，Error機器人無法發送"));

        } else {

            const message = await channel.send({ embeds: [embed] });
            this._store.setServerStatusMessageId(message.id);
            this._store.save();

        }
    }
}
