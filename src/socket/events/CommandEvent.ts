import { Client, TextChannel } from "discord.js";
import { Socket } from "socket.io-client";
import { environment } from "../../environment/Environment";
import Dates from "../../utils/Dates";
import ICommand from "../interface/ICommand";
import IEventType from "../interface/IEventType";
import ISockerEvent from "../ISockerEvent";

export default class CommandEvent implements ISockerEvent<"COMMAND_CREATE"> {

    public event: keyof IEventType = "COMMAND_CREATE";

    public execute(client: Client<boolean>, socket: Socket, command: ICommand): void {

        const channel = client.channels.cache.get(environment.serverCommandCarriedOut.channelId) as TextChannel;
        if(channel === undefined) return;

        channel.send({
            content: `[${Dates.dateTime()}][${command.serverId}][x:${"`"}${command.pos[0]}${"`"} y:${"`"}${command.pos[1]}${"`"} z:${"`"}${command.pos[2]}${"`"}][level:${"`"}${command.level}${"`"}][op: ${"`"}${command.op ? "Yes" : "No"}${"`"}]\n執行者: ${"`"}${command.senderName}${"`"} 指令: ${"`"}${command.commandName}${"`"} 內容: ${"`"}${command.commandString}${"`"}`
        });
    }
}