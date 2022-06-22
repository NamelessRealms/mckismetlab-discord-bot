import { Client } from "discord.js";
import { Socket } from "socket.io-client";
import IEventType from "./interface/IEventType";

export default interface ISockerEvent<Key extends keyof IEventType> {

    event: keyof IEventType;

    execute(client: Client, socket: Socket, ...args: IEventType[Key]): void;
}