import { Client, TextChannel } from "discord.js";
import { Socket } from "socket.io";
import { environment } from "../../environment/Environment";
import Dates from "../../utils/Dates";
import IEventType from "../interface/IEventType";
import IMessagePrivate from "../interface/IMessagePrivate";
import ISockerEvent from "../ISockerEvent";

export default class MessagePrivateEvent implements ISockerEvent<"messagePrivateCreate"> {
    public event: keyof IEventType = "messagePrivateCreate";
    public execute(client: Client, socket: Socket, serverId: string, message: IMessagePrivate): void {

        const channel = client.channels.cache.get(environment.serverPrivateMsg.channelId) as TextChannel;
        if(channel === undefined) return;

        channel.send({
            content: `[${Dates.dateTime()}][${serverId}][x:${"`"}${message.pos[0]}${"`"} y:${"`"}${message.pos[1]}${"`"} z:${"`"}${message.pos[2]}${"`"}][level:${"`"}${message.level}${"`"}]\n發件者: ${"`"}${message.senderName}${"`"} 接收者: ${"`"}${message.recipientName}${"`"} 內容: ${"`"}${message.context}${"`"}`
        });
    }
}