import { ClientEvents, Client, Message, GuildMember } from "discord.js";
import { environment } from "../../environment/Environment";
import Main from "../../Main";
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
        const content = message.content;

        for (let link of environment.chatChannelLink) {

            if (link.discord_channel_id === channelId) {

                const socket = SocketIo.getSocket(link.minecraft_server_id);

                if (socket !== null) {

                    const dcUserID = message.author.id;
                    const userData = message.guild?.members.cache.get(dcUserID) as GuildMember;
                    const userNickName = userData.nickname !== null ? userData.nickname : userData.user.username;

                    socket.emit("messageCreate", {
                        username: userNickName,
                        content: this._handleTag(content, message)
                    });
                }
            }
        }
    }

    private _handleTag(content: string, message: Message): string {

        const tagUserArray = content.replace(/<@!?(\d+)>/g, (match) => {
            const id: any = match.match(/<@!?(\d+)>/);
            const user = message.client.users.cache.get(id[1]);
            return user?.username as string;
        });
    
        content = tagUserArray;
    
        const tagRoleArray = content.replace(/<@&?(\d+)>/g, (match) => {
            const id: any = match.match(/<@&?(\d+)>/);
            const role = message.guild?.roles.cache.get(id[1]);
            return role?.name as string;
        });
    
        content = tagRoleArray;
    
        const tagChannelArray = content.replace(/<#?(\d+)>/g, (match) => {
            const id: any = match.match(/<#?(\d+)>/);
            const channel = message.guild?.channels.cache.get(id[1]);
            return channel?.name as string;
        });
    
        content = tagChannelArray;
    
        return content;
    }
}