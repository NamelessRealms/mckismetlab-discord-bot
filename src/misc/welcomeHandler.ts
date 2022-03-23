import { GuildMember, TextChannel, MessageEmbed } from "discord.js";
import { logs } from "../utils/logs";

const log: logs = new logs();

const welcomeChannelID = "485695057526128641"; // welcome channel
const ruleChannelID = "604231523901767719";
const postChannelID = "604180154176241664";
const whlistChannelID = "485678694678003716";

export function welcomeJoin(member: GuildMember) {

    let userObject = member.user;
    let userName = userObject.username;
    let userID = userObject.id;
    let userAvatarURL = userObject.avatarURL() as string;

    let ruleChannel = member.guild.channels.cache.get(ruleChannelID)?.toString();
    let postChannel = member.guild.channels.cache.get(postChannelID)?.toString();
    let whlistChannel = member.guild.channels.cache.get(whlistChannelID)?.toString();

    let embed = new MessageEmbed()
        .setTitle(`🎉 ${userName} 歡迎你，加入 mcKismetLab: Discord 🎉🤗 !`)
        .setThumbnail(userAvatarURL)
        .setDescription(`注意事項:\n<@${userID}> 進入本伺服器請先看清楚 ${ruleChannel} 及 ${postChannel} 後，在去填寫伺服器 ${whlistChannel} 白名單申請表哦。\n\n🔹 請先更改你的暱稱 ➡ 隨意名字-正版Minecraft名字。`)
        .setColor("RANDOM")
        .setFooter("MCKISMETLAB 無名伺服器 | 模組生存 ⚔ 冒險前進", member.guild.client.user?.avatarURL() as string);

    let sendChannel = member.guild.channels.cache.get(welcomeChannelID) as TextChannel;
    sendChannel.send(embed)
        .catch(log.error);

    // member.send("感謝你加入我們的 DISCORD!");
}
