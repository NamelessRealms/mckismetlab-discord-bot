import { Client } from "discord.js";
import { Socket } from "socket.io";
import LoggerUtil from "../utils/LoggerUtil";
import IEventType from "./interface/IEventType";
import ISockerEvent from "./ISockerEvent";
import SocketIo from "./SocketIo";


export default class SocketEvent {

    private _logger = new LoggerUtil("SocketEvent");
    private _serverId: string;
    private _socket: Socket;
    private _client: Client;

    constructor(client: Client, socket: Socket, serverId: string) {
        this._client = client;
        this._serverId = serverId;
        this._socket = socket;
    }

    public register(events: Array<ISockerEvent<keyof IEventType>>) {

        if(events.length <= 0) {
            throw new Error("events not null.")
        }

        events.forEach((eventClass) => {
            this._logger.info(`Register event ${eventClass.event} success.`);
            this._socket.on(eventClass.event, (...args: any) => eventClass.execute(this._client, this._socket, this._serverId, ...args));
        });

        this._socket.on("disconnect", () => {
            SocketIo.deleteSocket(this._serverId);
            this._logger.info(`Server id: ${this._serverId} socket disconnect.`);
        });
    }
}