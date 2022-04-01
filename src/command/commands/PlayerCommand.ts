import { SlashCommandBooleanOption } from "@discordjs/builders";
import { CommandInteraction, CacheType, MessageEmbed, GuildMember } from "discord.js";
import ApiService from "../../api/ApiService";
import MojangApi from "../../api/MojangApi";
import IUserTime from "../../interface/IUserTime";
import SocketIo from "../../socket/SocketIo";
import Dates from "../../utils/Dates";
import Embeds from "../../utils/Embeds";
import SlashCommandBase from "../SlashCommandBase";

export default class PlayerCommand extends SlashCommandBase {

    public name: string = "player";
    public description: string = "查詢玩家資料";
    public defaultPermission: boolean | undefined = true;
    public options = [
        new SlashCommandBooleanOption()
            .setName("是否每個人看到")
            .setDescription("是否每個人都可以看到你的玩家資料 (預設只有你看得到)")

    ];
    public permissions(): { id: string; type: "USER" | "ROLE"; permission: boolean; }[] {
        return [];
    }
    public async execute(interaction: CommandInteraction): Promise<void> {
        try {

            await interaction.deferReply({ ephemeral: true });

            const userLink = await ApiService.getUserLink(interaction.user.id);

            if (userLink === null) {
                interaction.editReply({ content: "你的 Minecraft 帳號尚未與 Discord 帳號綁定，你無法使用玩家查詢資料功能。如果你遇到問題，請聯繫我 <@177388464948510720> 伺服器架設者。" });
                return;
            }

            const userWhitelist = await ApiService.getServerWhitelist(userLink.minecraft_uuid);
            const playerNames = await MojangApi.getPlayerName(userLink.minecraft_uuid);
            const playerName = playerNames !== null ? playerNames[playerNames.length - 1] !== undefined ? playerNames.pop()?.name as string : null : null;

            const usersTime = await SocketIo.emitSocket<Array<IUserTime>>("getPlayerTime", "mckismetlab-main-server", {
                players: [
                    {
                        minecraft_uuid: userLink.minecraft_uuid
                    }
                ]
            });

            const userTime = usersTime.find(value => value.minecraft_uuid === userLink.minecraft_uuid);

            if (userTime === undefined) {
                interaction.editReply({ embeds: [Embeds.botErrorEmbed()]});
                return;
            }

            const member = (interaction.member as GuildMember);
            const userNickName = member.nickname !== null ? member.nickname : member.user.username;

            const embed = new MessageEmbed()
                .setTitle(`🎮 ${playerName} 玩家資料`)
                .setAuthor({
                    name: userNickName,
                    iconURL: interaction.user.avatarURL() as string
                })
                .setThumbnail(`https://crafatar.com/renders/body/${userLink.minecraft_uuid}?overlay`)
                .setFooter({
                    text: `MCKISMETLAB 無名伺服器 模組生存 ⚔ 冒險前進 ${Dates.time()}`,
                    iconURL: interaction.client.user?.avatarURL() as string
                })
                .setColor("RANDOM")
                .addFields(
                    {
                        name: "📋 白名單",
                        value: userWhitelist === null ? "▫ 沒有白名單" : "▫ 有白名單",
                        inline: true
                    },
                    {
                        name: "⏰ 遊玩時間:",
                        value: `▫ ${userTime.hours.split(":")[0]} 時 ${userTime.hours.split(":")[1]} 分 ${userTime.hours.split(":")[2]} 秒`,
                        inline: true
                    }
                );

            const ephemeralOption = interaction.options.getBoolean("是否每個人看到");
            const ephemeral = ephemeralOption !== null ? !ephemeralOption : true;

            if (ephemeral) {
                interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.editReply({ content: "⚠ 每個人都可以看到你的玩家資料 👀" });
                interaction.followUp({ embeds: [embed], ephemeral: false });
            }

        } catch (error: any) {

            if (error.error === "server_econnrefused") {
                const embed = Embeds.apiServerOfflineEmbed();
                interaction.editReply({ embeds: [embed] });
                return;
            }

            if (error.error === "socket-no-online") {
                interaction.editReply({ content: "很抱歉，玩家查詢資料系統未上線，請稍後再嘗試。如果你在遇到問題，請聯繫我 <@177388464948510720> 伺服器架設者。" });
                return;
            }

            interaction.editReply({ embeds: [Embeds.botErrorEmbed()] });
        }
    }
}