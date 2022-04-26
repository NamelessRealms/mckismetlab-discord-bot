import { Client } from "discord.js";
import { Socket } from "socket.io";
import { environment } from "../../environment/Environment";
import IEventType from "../interface/IEventType";
import IMessage from "../interface/IMessage";
import ISockerEvent from "../ISockerEvent";
import SocketIo from "../SocketIo";

export default class MessageEvent implements ISockerEvent<"MESSAGE_CREATE"> {
    public event: keyof IEventType = "MESSAGE_CREATE";
    public execute(client: Client, socket: Socket, serverId: string, message: IMessage): void {

        const webhook = SocketIo.getWebhook(serverId);
        if(webhook === null) return;

        message.content = this._handleTag(message.content, client);

        webhook.send({
            content: message.content,
            username: message.username,
            avatarURL: `https://crafatar.com/renders/head/${message.uuid}?overlay`
        });
    }

    private _handleTag(content: string, client: Client): string {

        // emoji
        content = content.replace(/:[A-Za-z0-9]+:/g, (match) => {
            const emojiName = match.replace(/:/g, "");
            const emojiId = client.emojis.cache.find((emoji) => emoji.name === emojiName);
            if(emojiId === undefined) return match; 
            return `${emojiId}`;
        });

        // tag role
        content = content.replace(/@.\S+/g, (match) => {
            const roleName = match.replace("@", "");
            const guild = client.guilds.cache.get(environment.guilds_id);
            if(guild === undefined) return match;
            const role = guild.roles.cache.find((role) => role.name.toLocaleLowerCase() === roleName.toLocaleLowerCase());
            if(role === undefined) return match;
            return `<@&${role.id}>`;
        });

        // tag user
        content = content.replace(/@.\S+/g, (match) => {
            const userName = match.replace("@", "");
            // const user = client.users.cache.find((user) => user.username === userName);
            const guild = client.guilds.cache.get(environment.guilds_id);
            const member = guild !== undefined ? guild.members.cache.find((member) => member.nickname !== null ? member.nickname.toLocaleLowerCase() === userName.toLocaleLowerCase() : undefined || member.user.username.toLocaleLowerCase() === userName.toLocaleLowerCase()) : undefined;
            // if(user !== undefined) return `<@&${user.id}>`;
            if(member !== undefined) return `<@${member.user.id}>`;
            return match;
        });

        // tag channel
        content = content.replace(/#.\S+/g, (match) => {
            const channelName = match.replace("#", "");
            const guild = client.guilds.cache.get(environment.guilds_id);
            if(guild === undefined) return match;
            const channel = guild.channels.cache.find((channel) => channel.name === channelName);
            if(channel === undefined) return match;
            return `<#${channel.id}>`;
        });

        return content;
    }
}