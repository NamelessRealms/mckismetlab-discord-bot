import { Client } from "discord.js";
import { Socket } from "socket.io";
import IEventType from "./interface/IEventType";

export default interface ISockerEvent<Key extends keyof IEventType> {

    event: keyof IEventType;

    execute(client: Client, socket: Socket, serverId: string, ...args: IEventType[Key]): void;
}