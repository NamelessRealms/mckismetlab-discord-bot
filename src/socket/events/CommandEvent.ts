import { Client, TextChannel } from "discord.js";
import { Socket } from "socket.io";
import { environment } from "../../environment/Environment";
import Dates from "../../utils/Dates";
import ICommand from "../interface/ICommand";
import IEventType from "../interface/IEventType";
import ISockerEvent from "../ISockerEvent";

export default class CommandEvent implements ISockerEvent<"commandCreate"> {
    public event: keyof IEventType = "commandCreate";
    public execute(client: Client<boolean>, socket: Socket, serverId: string, command: ICommand): void {

        const channel = client.channels.cache.get(environment.serverCommandCarriedOut.channelId) as TextChannel;
        if(channel === undefined) return;

        channel.send({
            content: `[${Dates.dateTime()}][${serverId}][x:${"`"}${command.pos[0]}${"`"} y:${"`"}${command.pos[1]}${"`"} z:${"`"}${command.pos[2]}${"`"}][level:${"`"}${command.level}${"`"}][op: ${"`"}${command.op ? "Yes" : "No"}${"`"}]\n執行者: ${"`"}${command.senderName}${"`"} 指令: ${"`"}${command.commandName}${"`"} 內容: ${"`"}${command.commandString}${"`"}`
        });
    }
}