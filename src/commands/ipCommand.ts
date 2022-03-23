import { GuildMember, MessageEmbed, TextChannel } from "discord.js";
import { AppInteractions, SlashCommandBase } from "../module/slashCommands";

export default class IpCommand extends SlashCommandBase {

    public name: string = "ip";
    public description: string = "伺服器 IP 位址";

    public callback(appInteractions: AppInteractions, channelObject: TextChannel, member: GuildMember, args: Array<any>): void {

        let embed = new MessageEmbed()
            .setAuthor("伺服器IP: mckismetlab.net", channelObject.guild.client.user?.avatarURL() as string)
            .setColor("#7289DA");

        appInteractions.callbackMessage(embed);
    }

}
