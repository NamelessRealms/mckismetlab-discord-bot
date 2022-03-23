import { Message, GuildMember } from "discord.js";
import { getSocketMap } from "../../api/socketApi";
import BotMain from "../../botMain";

export function sendMessageHandler(message: Message): void {

    const channelID = message.channel.id;

    let content = message.content;

    // if (message.author.bot || isCommand(content, BotMain.CONFIG_DATA.commands)) return;

    if (message.author.bot) return;

    for (let link of BotMain.CONFIG_DATA.chatChannelLink) {

        if (link.discord_channel_id === channelID) {

            const socket = getSocketMap(link.minecraft_server_id);

            if (socket !== undefined) {

                content = handleTag(content, message);

                const dcUserID = message.author.id;
                const userData = message.guild?.members.cache.get(dcUserID) as GuildMember;
                const userNickName = userData.nickname !== null ? userData.nickname : userData.user.username;

                socket.emit("message", {
                    username: userNickName,
                    content: content
                });

                // log.info(`[\x1b[36mmcServerChat\x1b[0m] [\x1b[36m${message.author.tag}\x1b[0m/\x1b[36m${message.author.id}\x1b[0m]: ${content}`);
            }
        }
    }
}

// function isCommand(content: string, commands: string[]): boolean {

//     for (let commandName of commands) {
//         if (content.toLowerCase().split(" ")[0].replace(BotMain.CONFIG_DATA.prefix, "") === commandName) {
//             return true;
//         }
//     }

//     return false;
// }

function handleTag(content: string, message: Message): string {

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
