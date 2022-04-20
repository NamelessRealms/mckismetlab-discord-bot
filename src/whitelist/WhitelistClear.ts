import { ButtonInteraction, CommandInteraction, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import ApiService from "../api/ApiService";
import { environment } from "../environment/Environment";
import IUserTime from "../interface/IUserTime";
import IWhitelistUser from "../interface/IWhitelistUser";
import SocketIo from "../socket/SocketIo";
import SubscriptionEvent from "../subscription/SubscriptionEvent";
import Dates from "../utils/Dates";
import LoggerUtil from "../utils/LoggerUtil";
import Utils from "../utils/Utils";
import WhitelistApply from "./WhitelistApply";

interface ICheckWhitelist {
    minecraftUuid: string;
    minecraftName: string | null;
    discordUserId: string | null;
    time: string | null;
    isClear: boolean;
    isSponsor: boolean;
}

export default class WhitelistClear {

    private static _logger = new LoggerUtil("WhitelistClear");
    private static _clearSponsor = false;

    public static async clear(interaction: CommandInteraction, serverId: string) {
        try {

            await interaction.deferReply({ ephemeral: true });

            const serverWhitelist = await this._getServerWhitelist(serverId);

            if (serverWhitelist == null) {
                interaction.editReply({ content: "資料庫沒有玩家名單" });
                return;
            }

            let byTimeHours: number | null = interaction.options.getInteger("時間");
            byTimeHours = byTimeHours !== null ? byTimeHours : 8;

            let checkWhitelist = new Array<ICheckWhitelist>();
            // get user base info
            checkWhitelist = await this._getUserBaseInfo(serverWhitelist);
            // get user player time
            checkWhitelist = await this._getPlayersTime(checkWhitelist, serverId, byTimeHours, this._clearSponsor);

            const byUsers = new Array<{ user: ICheckWhitelist, text: string }>();
            const clearUsers = new Array<{ user: ICheckWhitelist, text: string }>();
            const sponsorText = new Array<string>();

            for (let whitelist of checkWhitelist) {
                if (whitelist.isClear) {
                    clearUsers.push({
                        user: whitelist,
                        text: `name: ${whitelist.minecraftName}, time: ${whitelist.time}, clear: ${whitelist.isClear ? "Yse" : "No"}, sponsor: ${whitelist.isSponsor ? "Yse" : "No"}`
                    });
                } else {
                    byUsers.push({
                        user: whitelist,
                        text: `name: ${whitelist.minecraftName}, time: ${whitelist.time}, clear: ${whitelist.isClear ? "Yse" : "No"}, sponsor: ${whitelist.isSponsor ? "Yse" : "No"}`
                    });
                }
                if (whitelist.isSponsor) sponsorText.push(`name: ${whitelist.minecraftName}, time: ${whitelist.time}, clear: ${whitelist.isClear ? "Yse" : "No"}, sponsor: ${whitelist.isSponsor ? "Yes" : "No"}`);
            }

            if (clearUsers.length <= 0) {
                interaction.editReply({ content: "沒有玩家要被清除" });
                return;
            }

            const embed = new MessageEmbed()
                .setColor("#7289DA")
                .addFields(
                    {
                        name: "總人數",
                        value: checkWhitelist.length.toString(),
                        inline: true
                    },
                    {
                        name: "贊助者人數",
                        value: checkWhitelist.filter(value => value.isSponsor).length.toString(),
                        inline: true
                    },
                    {
                        name: "清除人數",
                        value: clearUsers.length.toString(),
                        inline: true
                    },
                    {
                        name: "通過人數",
                        value: byUsers.length.toString(),
                        inline: true
                    }
                );

            const buttonRow = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId("WHITELIST_CLEAR_CONFIRM")
                        .setLabel("開始清除")
                        .setStyle("SUCCESS"),
                    new MessageButton()
                        .setCustomId("WHITELIST_CLEAR_CANCEL")
                        .setLabel("取消清除")
                        .setStyle("DANGER")
                )

            const text = `${Dates.fullYearTime()}\n\n清除贊助者: ${this._clearSponsor ? "Yse" : "No"}\n清除時間: ${byTimeHours}h\n\n` + "清除玩家名單:\n\n" + clearUsers.map(value => value.text).join("\n") + "\n\n" + "通過玩家名單:\n\n" + byUsers.map(value => value.text).join("\n") + "\n\n" + "贊助者玩家名單:\n\n" + sponsorText.join("\n");
            interaction.editReply({ content: "白名單準備開始清除", embeds: [embed], components: [buttonRow], files: [{ attachment: Buffer.from(text), name: "clear.txt" }] });

            const subscriptionClearConfirm = new SubscriptionEvent("WHITELIST_CLEAR_CONFIRM");
            const subscriptionClearCancel = new SubscriptionEvent("WHITELIST_CLEAR_CANCEL")

            subscriptionClearCancel.subscriptionOnce((client, interaction: ButtonInteraction) => {
                interaction.update({ content: "白名單清除任務取消", embeds: [embed], components: [], files: [{ attachment: Buffer.from(text), name: "clear.txt" }] });
            });

            subscriptionClearConfirm.subscriptionOnce(async (client, inter: ButtonInteraction) => {

                const failedTexts = new Array<string>();
                let failedText: string = "";

                for (let clearUser of clearUsers) {

                    if (clearUser.user.discordUserId !== null) {

                        const guild = inter.guild;
                        if (guild === null) throw new Error("Guild not null.");
                        const member = guild.members.cache.get(clearUser.user.discordUserId);

                        if (member !== undefined) {

                            const roleWhitelist = guild.roles.cache.get(environment.roleWhitelist.roleId);
                            if (roleWhitelist === undefined) throw new Error("RoleWhitelist not null.");

                            member.roles.remove(roleWhitelist)
                                .catch(() => {
                                    failedText = `name: ${clearUser.user.minecraftName}, guild user: Yse, user role remove: No`;
                                });

                        } else {
                            failedText += `name: ${clearUser.user.minecraftName}, guild user: No`;
                        }
                    } else {
                        failedText += `name: ${clearUser.user.minecraftName}, guild user: No`;
                    }

                    try {
                        await ApiService.deleteServerWhitelist(clearUser.user.minecraftUuid);
                    } catch (error: any) {
                        failedText += ", api server delete server whitelist: No";
                    }

                    if(failedText.length > 0) failedTexts.push();
                }

                const files = new Array();
                files.push({ attachment: Buffer.from(text), name: "clear.txt" });
                if (failedTexts.length > 0) {
                    files.push({ attachment: Buffer.from(failedTexts.join("\n")), name: "failed.txt" });
                }

                inter.update({ content: "訊息已公開在此頻道", embeds: [], components: [], files: [] });
                interaction.followUp({ content: "白名單已清除完成", embeds: [embed], components: [], files: files, ephemeral: false });

                WhitelistApply.updateApplyEmbed();
            });

        } catch (error: any) {
            this._logger.error(error);
            interaction.editReply({ content: "執行發生錯誤!" });
        }
    }

    private static async _getUserBaseInfo(serverWhitelist: Array<IWhitelistUser>) {
        const checkWhitelist = new Array<ICheckWhitelist>();
        for (let whitelist of serverWhitelist) {

            const userLink = await ApiService.getUserLink(whitelist.minecraft_uuid);
            const sponsor = await ApiService.getSponsorUser(whitelist.minecraft_uuid);
            const playerName = await Utils.getPlayerName(whitelist.minecraft_uuid);

            checkWhitelist.push({
                minecraftUuid: whitelist.minecraft_uuid,
                minecraftName: playerName,
                discordUserId: userLink !== null ? userLink.discord_id : null,
                time: null,
                isClear: false,
                isSponsor: sponsor !== null
            });
        }
        return checkWhitelist;
    }

    public static async _getPlayersTime(checkWhitelist: Array<ICheckWhitelist>, serverId: string, byTimeHours?: number, clearSponsor: boolean = false) {
        const playersTime = await SocketIo.emitSocket<Array<IUserTime>>("GET_PLAYER_TIME", serverId, { players: checkWhitelist });        
        for (let whitelist of checkWhitelist) {
            const playerTime = playersTime.find(value => value.minecraftUuid === whitelist.minecraftUuid);
            whitelist.time = playerTime !== undefined ? playerTime.playTime : null;
            if (byTimeHours !== undefined) {
                if (playerTime !== undefined) {
                    const hours = playerTime.playTime.split(":")[0];
                    if (whitelist.isSponsor) {
                        if (clearSponsor) whitelist.isClear = Number(hours) < byTimeHours;
                    } else {
                        whitelist.isClear = Number(hours) < byTimeHours;
                    }
                }
            }
        }
        return checkWhitelist;
    }

    private static async _getServerWhitelist(serverId: string): Promise<Array<IWhitelistUser> | null> {
        const allServerWhitelist = await ApiService.getAllServerWhitelist();
        if (allServerWhitelist == null) return null;
        const serverWhitelist = allServerWhitelist.filter(value => value.server_id === serverId);
        return serverWhitelist.length > 0 ? serverWhitelist : null;
    }
}