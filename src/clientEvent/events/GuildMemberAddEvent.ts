import { Client, ClientEvents, GuildMember, MessageEmbed, TextChannel } from "discord.js";
import { environment } from "../../environment/Environment";
import LoggerUtil from "../../utils/LoggerUtil";
import IEvent from "../IEvent";

export default class GuildMemberAddEvent implements IEvent<"guildMemberAdd"> {

    public event: keyof ClientEvents = "guildMemberAdd";

    private _logger = new LoggerUtil("GuildMemberAddEvent");

    public execute(client: Client, member: GuildMember) {
        this._logger.info(`${member.user.username} 加入了 DISCORD!`);
        this._welcomeJoin(member);
    }

    private _welcomeJoin(member: GuildMember) {

        const welcomeChannelId = environment.welcome.channelId;
        const ruleChannelId = environment.rule.channelId;

        const userObject = member.user;
        const userName = userObject.username;
        const userAvatarURL = userObject.avatarURL() as string;

        const ruleChannel = member.guild.channels.cache.get(ruleChannelId)?.toString();

        const embed = new MessageEmbed()
            .setTitle(`🎉 歡迎 ${userName} 加入 Discord 社群伺服器 🤗`)
            .setThumbnail(userAvatarURL)
            .setDescription(`▫歡迎你加入無名伺服器 Discord 社群，如果你遇到問題，你可以在聊天室尋求幫助。\n\n▫進入無名 Discord 社群伺服器請先更改你的暱稱 ➡ **隨意名字-正版Minecraft名字**。\n\n▫進入伺服器、無名 Discord 社群伺服器就視同同意 ${ruleChannel} 規則，如玩家不遵守規則不聽從管理員勸導將做懲處。`)
            .setColor("RANDOM")
            .setFooter({
                text: "MCKISMETLAB 無名伺服器 | 模組生存 ⚔ 冒險前進",
                iconURL: member.guild.client.user?.avatarURL() as string
            });

        const channel = member.guild.channels.cache.get(welcomeChannelId) as TextChannel;

        channel.send({ embeds: [embed] })
            .catch(this._logger.error);
    }
}