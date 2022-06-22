import { Client } from "discord.js";
import { Socket } from "socket.io-client";
import ApiService from "../api/ApiService";
import LoggerUtil from "../utils/LoggerUtil";
import IEventType from "./interface/IEventType";
import ISockerEvent from "./ISockerEvent";

export default class SocketEvent {

    private _logger = new LoggerUtil("SocketEvent");
    private _socket: Socket;
    private _client: Client;

    constructor(client: Client, socket: Socket) {
        this._client = client;
        this._socket = socket;
    }

    public register(events: Array<ISockerEvent<keyof IEventType>>) {

        if (events.length <= 0) {
            throw new Error("events not null.")
        }

        events.forEach((eventClass) => {
            this._logger.info(`Register event ${eventClass.event} success.`);
            this._socket.on(eventClass.event, (...args: any) => eventClass.execute(this._client, this._socket, ...args));
        });

        this._socket.on("disconnect", () => {
            this._logger.info(`Socket Disconnect.`);
        });

        this._socket.on("connect_error", async (error) => {
            try {

                let errorJson: { code: number; error: string; error_description: string; } | null = null;

                try {
                    errorJson = JSON.parse(error.message);
                } catch (e) {
                    throw new Error(error.message);
                }

                if (errorJson === null) return;

                if (errorJson.code === 400 || errorJson.code === 401) {

                    const newTokenResponse = await ApiService.login();

                    if (newTokenResponse === undefined) {
                        throw new Error("Init socket error.");
                    }

                    (this._socket.auth as any).token = newTokenResponse;
                    this._socket.connect();
                }

            } catch (error: any) {
                // this._logger.error(error);
            }
        });
    }
}