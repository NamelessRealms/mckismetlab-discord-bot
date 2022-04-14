import { Client } from "discord.js";
import { Socket } from "socket.io";
import IEventType from "../interface/IEventType";
import IMessage from "../interface/IMessage";
import ISockerEvent from "../ISockerEvent";
import SocketIo from "../SocketIo";

export default class MessageEvent implements ISockerEvent<"MESSAGE_CREATE"> {
    public event: keyof IEventType = "MESSAGE_CREATE";
    public execute(client: Client, socket: Socket, serverId: string, message: IMessage): void {

        const webhook = SocketIo.getWebhook(serverId);
        if(webhook === null) return;

        webhook.send({
            content: message.content,
            username: message.username,
            avatarURL: `https://crafatar.com/renders/head/${message.uuid}?overlay`
        });
    }
}