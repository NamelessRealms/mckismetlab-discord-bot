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

type serverType = "main" | "deputy";

type IServersInfo = {
    [type in serverType]: {
        online: number;
        TPS: number;
        TickTime: string;
        mainStatus: string;
    };
};

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

        const serversInfo: IServersInfo = {
            main: {
                online: 0,
                TPS: 0,
                TickTime: "0",
                mainStatus: "❎離線"
            },
            deputy: {
                online: 0,
                TPS: 0,
                TickTime: "0",
                mainStatus: "❎離線"
            }
        }

        try {

            const mainServerInfoReceive = await SocketIo.emitSocket<IReceiveServerInfo>("GET_SERVER_INFO", "mckismetlab-main-server");
            serversInfo.main.mainStatus = "✅上線";
            serversInfo.main.online = mainServerInfoReceive.playerList;
            serversInfo.main.TPS = Number(mainServerInfoReceive.meanTPS);
            serversInfo.main.TickTime = mainServerInfoReceive.meanTickTime;

        } catch (error) {};

        try {

            const deputyServerInfoReceive = await SocketIo.emitSocket<IReceiveServerInfo>("GET_SERVER_INFO", "mckismetlab-deputy-server");
            serversInfo.deputy.mainStatus = "✅上線";
            serversInfo.deputy.online = deputyServerInfoReceive.playerList;
            serversInfo.deputy.TPS = Number(deputyServerInfoReceive.meanTPS);
            serversInfo.deputy.TickTime = deputyServerInfoReceive.meanTickTime;

        } catch (error) {};

        this._sendServerStatus(serversInfo, client, channel, messageId);
    }

    private async _sendServerStatus(serversInfo: IServersInfo, client: Client, channel: TextChannel, messageId: string | null): Promise<void> {

        let smoothness = (tps: number) => {
            if (Number(tps) >= 15) {
                return `😝 非常順暢 TPS: ${Math.round(tps)}`;
            } else if (Number(tps) < 15 && Number(tps) >= 10) {
                return `🙂 順暢 TPS: ${Math.round(tps)}`;
            } else if (Number(tps) < 10 && Number(tps) >= 5) {
                return `🙁 不順暢 TPS: ${Math.round(tps)}`;
            } else if (Number(tps) < 5) {
                return `😫 非常不順暢 TPS: ${Math.round(tps)}`;
            }
            return "發生錯誤";
        }

        const embed = new MessageEmbed()
            .setTitle("MCKISMETLAB // 無名伺服器狀態")
            .setColor("#7289DA")
            .setFooter({
                text: `MCKISMETLAB 無名伺服器 | 最後更新: ${Dates.time()}`,
                iconURL: client.user?.avatarURL() as string
            })
            .addFields(
                {
                    name: "主服模組伺服器",
                    value: `狀態: ${serversInfo.main.mainStatus}\n人數: ${serversInfo.main.online} 名玩家\n順暢度: ${smoothness(serversInfo.main.TPS)}\nMSPT: ${serversInfo.main.TickTime}`
                },
                {
                    name: "副服模組伺服器",
                    value: `狀態: ${serversInfo.deputy.mainStatus}\n人數: ${serversInfo.deputy.online} 名玩家\n順暢度: ${smoothness(serversInfo.deputy.TPS)}\nMSPT: ${serversInfo.deputy.TickTime}`
                }
            );

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
