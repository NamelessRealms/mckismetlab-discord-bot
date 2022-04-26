import { ClientEvents, Client, Message, GuildMember } from "discord.js";
import { environment } from "../../environment/Environment";
import SocketIo from "../../socket/SocketIo";
import IEvent from "../IEvent";

export default class MessageEvent implements IEvent<"messageCreate"> {
    public event: keyof ClientEvents = "messageCreate";
    public execute(client: Client, message: Message) {
        if(message.author.bot) return;
        this._sendChatMessage(message);
    }

    private _sendChatMessage(message: Message) {

        const channelId = message.channel.id;
        let content = message.content;

        for (let link of environment.chatChannelLink) {

            if (link.discord_channel_id === channelId) {

                const socket = SocketIo.getSocket(link.minecraft_server_id);

                if (socket !== null) {

                    content = this._handleTag(content, message);

                    const dcUserID = message.author.id;
                    const userData = message.guild?.members.cache.get(dcUserID) as GuildMember;
                    const userNickName = userData.nickname !== null ? userData.nickname : userData.user.username;

                    socket.emit("MESSAGE_CREATE", {
                        username: userNickName,
                        content: content
                    });
                }
            }
        }
    }

    private _handleTag(content: string, message: Message): string {

        // user
        content = content.replace(/<@!?(\d+)>/g, (match) => {
            const id: any = match.match(/<@!?(\d+)>/);
            const user = message.client.users.cache.get(id[1]);
            return user?.username as string;
        });
    
        // role
        content = content.replace(/<@&?(\d+)>/g, (match) => {
            const id: any = match.match(/<@&?(\d+)>/);
            const role = message.guild?.roles.cache.get(id[1]);
            return role?.name as string;
        });
    
        // channel
        content = content.replace(/<#?(\d+)>/g, (match) => {
            const id: any = match.match(/<#?(\d+)>/);
            const channel = message.guild?.channels.cache.get(id[1]);
            return channel?.name as string;
        });

        // emoji
        content = content.replace(/<[a-zA-Z]*:[A-Za-z0-9_~]+:\d+>/g, (match) => {
            const emojiName = match.split(":")[1];
            return `:${emojiName}:`;
        });

        return content;
    }
}