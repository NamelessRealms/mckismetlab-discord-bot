import { Client, TextChannel } from "discord.js";
import { Socket } from "socket.io-client";
import { environment } from "../../environment/Environment";
import Dates from "../../utils/Dates";
import IEventType from "../interface/IEventType";
import IMessagePrivate from "../interface/IMessagePrivate";
import ISockerEvent from "../ISockerEvent";

export default class MessagePrivateEvent implements ISockerEvent<"MESSAGE_PRIVATE_CREATE"> {

    public event: keyof IEventType = "MESSAGE_PRIVATE_CREATE";

    public execute(client: Client, socket: Socket, message: IMessagePrivate): void {

        const channel = client.channels.cache.get(environment.serverPrivateMsg.channelId) as TextChannel;
        if(channel === undefined) return;

        channel.send({
            content: `[${Dates.dateTime()}][${message.serverId}][x:${"`"}${message.pos[0]}${"`"} y:${"`"}${message.pos[1]}${"`"} z:${"`"}${message.pos[2]}${"`"}][level:${"`"}${message.level}${"`"}]\n發件者: ${"`"}${message.senderName}${"`"} 接收者: ${"`"}${message.recipientName}${"`"} 內容: ${"`"}${message.context}${"`"}`
        });
    }
}