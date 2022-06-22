import { Client, Webhook } from "discord.js";
import SocketEvent from "./SocketEvent";
import MessageEvent from "./events/MessageEvent";
import LoggerUtil from "../utils/LoggerUtil";
import { Socket, io } from "socket.io-client";
import ApiService from "../api/ApiService";
import MessagePrivateEvent from "./events/MessagePrivateEvent";
import CommandEvent from "./events/CommandEvent";
import UserBoostEvent from "./events/UserBoost";

export default class SocketIo {

    private _logger = new LoggerUtil("SocketIo");
    // private _authTokens = "";
    private _clientType = "Discord";
    private _apiUrl = process.env.API_SERVICE_URL;
    private _client: Client;
    private static _socket: Socket | null = null;

    constructor(client: Client) {
        this._client = client;
    }

    public async connect() {

        if (this._apiUrl === undefined) {
            throw new Error("Socket Api url not null.");
        }

        SocketIo._socket = io(this._apiUrl, {
            autoConnect: false,
            reconnection: true,
            query: {
                clientType: this._clientType,
                clientId: "main"
            },
            auth: {
                token: await ApiService.login()
            }
        });

        SocketIo._socket.on("connect", () => {
            this._logger.info("Socket Connected.");
        });

        // register events
        new SocketEvent(this._client, SocketIo._socket as Socket).register([
            new MessageEvent(),
            new MessagePrivateEvent(),
            new CommandEvent(),
            new UserBoostEvent()
        ]);

        // this.initBaseEvent(SocketIo._socket);

        SocketIo._socket.connect();
    }

    // public initBaseEvent(socket: Socket) {

    //     socket.on("connect", () => {

    //         this._logger.info("Socket Connected.");

    //         // register events
    //         new SocketEvent(this._client, SocketIo._socket as Socket).register([
    //             new MessageEvent(),
    //             new MessagePrivateEvent(),
    //             new CommandEvent(),
    //             new UserBoostEvent()
    //         ]);

    //     });

    //     socket.on("disconnect", () => {
    //         this._logger.info("Socket Disconnect.");
    //     });

    //     socket.on("connect_error", async (error) => {
    //         try {

    //             let errorJson: { code: number; error: string; error_description: string; } | null = null;

    //             try {
    //                 errorJson = JSON.parse(error.message);
    //             } catch (e) {
    //                 throw new Error(error.message);
    //             }

    //             if (errorJson === null) return;

    //             if (errorJson.code === 400 || errorJson.code === 401) {

    //                 const newTokenResponse = await ApiService.login();

    //                 if (newTokenResponse === undefined) {
    //                     throw new Error("Init socket error.");
    //                 }

    //                 this._authTokens = newTokenResponse;

    //                 if(SocketIo._socket !== null) {
    //                     SocketIo._socket.removeAllListeners();
    //                     SocketIo._socket = null;
    //                 }

    //                 SocketIo._socket = io(this._apiUrl as string, {
    //                     query: {
    //                         clientType: this._clientType,
    //                         clientId: "main"
    //                     },
    //                     auth: {
    //                         token: this._authTokens
    //                     }
    //                 });

    //                 this.initBaseEvent(SocketIo._socket);
    //             }

    //         } catch (error: any) {
    //             // this._logger.error(error);
    //         }
    //     });
    // }

    public static getSocket(): Socket | null {
        return this._socket;
    }

    public static checkSocketConnection(serverId: string): Promise<boolean> {
        return new Promise<boolean>(async (resolve) => {
            const socket = SocketIo._socket;
            if (socket === null) return resolve(false);
            try {
                const checkSocketConnectionReceive = await this.emitSocket<boolean>("CHECK_SOCKET_CONNECTION", { clientType: "mcServer", clientId: serverId });
                return resolve(checkSocketConnectionReceive);
            } catch (error) {
                return resolve(false);
            }
        });
    }

    public static async emitSocket<T>(eventName: string, data?: any): Promise<T> {
        return new Promise<T>((resolve, reject) => {

            const socket = SocketIo._socket;

            if (socket === null) {
                throw {
                    error: "socket-no-online",
                    error_description: "Socket no online."
                };
            }

            const listener = (data: T) => {

                if ((data as any).error) {
                    return reject({
                        error: "socket-no-online",
                        error_description: "Socket no online."
                    });
                }

                resolve(data);
                socket.off(eventName, listener);
            }

            socket.on(eventName, listener);

            if (data !== undefined) {
                socket.emit(eventName, data);
            } else {
                socket.emit(eventName);
            }
        });
    }
}
