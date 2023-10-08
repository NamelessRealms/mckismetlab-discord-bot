import { Client, ClientEvents, GuildMember, MessageEmbed, TextChannel } from "discord.js";
import ApiService from "../../api/ApiService";
import { environment } from "../../environment/Environment";
import LoggerUtil from "../../utils/LoggerUtil";
import IEvent from "../IEvent";

export default class GuildMemberAddEvent implements IEvent<"guildMemberAdd"> {

    public event: keyof ClientEvents = "guildMemberAdd";

    private _logger = new LoggerUtil("GuildMemberAddEvent");

    public execute(client: Client, member: GuildMember) {
        this._logger.info(`${member.user.username} 加入了 DISCORD!`);
        // this._welcomeJoin(member);
        this._addOriginalRole(member);
    }

    private async _addOriginalRole(member: GuildMember) {

        const discordUserId = member.user.id;
        const userLink = await ApiService.getUserLink(discordUserId);

        if(userLink === null) {
            return;
        }

        const guild = member.guild;
        const serverWhitelistRole = guild.roles.cache.get(environment.roleWhitelist.roleId);
        const sponsorRole = guild.roles.cache.get(environment.sponsor.roleId);

        const generalMemberRole = guild.roles.cache.get(environment.generalMember.roleId)
        if(generalMemberRole !== undefined) {
            member.roles.add(generalMemberRole);
        }

        const serverWhitelist = await ApiService.getServerWhitelist(userLink.minecraft_uuid);
        const sponsorUser = await ApiService.getSponsorUser(userLink.minecraft_uuid);

        if(serverWhitelist !== null && serverWhitelistRole !== undefined) {
            member.roles.add(serverWhitelistRole);
        }

        if(sponsorUser !== null && sponsorRole !== undefined) {
            member.roles.add(sponsorRole);
        }
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
            // .setDescription(`▫歡迎你加入無名伺服器 Discord 社群，如果你遇到問題，你可以在聊天室尋求幫助。\n▫進入無名 Discord 社群伺服器請先更改你的暱稱 ➡ **隨意名字-正版Minecraft名字**。\n▫進入伺服器、無名 Discord 社群伺服器就視同同意 ${ruleChannel} 規則，如玩家不遵守規則不聽從管理員勸導將做懲處。`)
            .setDescription(`▫歡迎你加入無名伺服器 Discord 社群，如果你遇到問題，你可以在聊天室尋求幫助。\n▫進入無名 Discord 社群伺服器請先更改你的暱稱 ➡ **隨意名字-正版Minecraft名字**。`)
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