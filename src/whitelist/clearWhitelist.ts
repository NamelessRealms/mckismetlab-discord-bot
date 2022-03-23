import { TextChannel } from "discord.js";
import { AppInteractions } from "../module/slashCommands";
import { IUserClearTime } from "../interface/IUserClearTime";
import { getSocketMap } from "../api/socketApi";

import ApiServiceAxios from "../api/apiServiceAxios";
import IWhitelistUser from "../interface/IWhitelistUser";
import ISponsorUser from "../interface/ISponsorUser";
import MojangApi from "../api/mojangApi";
import { IUserLink } from "../interface/IUserLink";
import { dates } from "../utils/dates";

import * as fs from "fs-extra";
import * as path from "path";
import { MessageEmbed, Message, MessageAttachment } from "discord.js";
import { MessageActionRow, MessageButton, MessageComponent } from "discord-buttons";
import { GuildMember } from "discord.js";
import { Guild } from "discord.js";
import { Role } from "discord.js";
import BotMain from "../botMain";

export default class ClearWhitelist {

    private static clearPlayerData = {
        playerTotalQuantity: 0,
        sponsorQuantity: 0,
        clearPlayerQuantity: 0,
        byNumberQuantity: 0,
        serverId: "",
        players: new Array<{ minecraft_uuid: string, discord_user_id: string | undefined }>()
    }
    private static _date: dates = new dates();

    public static async clear(channelObject: TextChannel, timeHH: number, serverId: string): Promise<void> {

        const userWhlistlistsResponse = await ApiServiceAxios.getAllServerWhitelist();
        const sponsorsResponse = await ApiServiceAxios.getAllSponsorUser();
        const userLinksResponse = await ApiServiceAxios.getAllUserLink();

        let sponsors = new Array<ISponsorUser>();
        let checkPlayers: Array<IWhitelistUser>;

        if (sponsorsResponse.status === 200) {
            sponsors = sponsorsResponse.data;
            checkPlayers = this._filterNotSponsorPlayer(userWhlistlistsResponse.data, sponsorsResponse.data);
        } else {
            checkPlayers = userWhlistlistsResponse.data;
        }

        const byPlayersText = new Array();
        const clearPlayersText = new Array();
        const clearPlayers = new Array<{ minecraft_uuid: string, discord_user_id: string | undefined }>();
        const byPlayers = new Array<{ minecraft_uuid: string, discord_user_id: string | undefined }>();
        const playersTime = await this._getPlayersOnlineTime(serverId, checkPlayers);

        for (let playerTime of playersTime) {

            const hours = playerTime.hours.split(":")[0];
            const MojangPlayerData = await MojangApi.getPlayerName(playerTime.minecraft_uuid);
            const playerId = MojangPlayerData?.pop()?.name as string;

            if (Number(hours) < timeHH) {

                clearPlayers.push({
                    minecraft_uuid: playerTime.minecraft_uuid,
                    discord_user_id: userLinksResponse.status === 200 ? this._getPlayersDiscordUserId(playerTime.minecraft_uuid, userLinksResponse.data) : undefined
                });

                clearPlayersText.push(`ID: ${playerId} / play time ${playerTime.hours}`);

            } else {

                byPlayers.push({
                    minecraft_uuid: playerTime.minecraft_uuid,
                    discord_user_id: userLinksResponse.status === 200 ? this._getPlayersDiscordUserId(playerTime.minecraft_uuid, userLinksResponse.data) : undefined
                });

                byPlayersText.push(`ID: ${playerId} / play time ${playerTime.hours}`);

            }

        }

        const sponsorsText = new Array<string>();
        for (let sponsor of sponsors) {
            let MojangPlayerData = await MojangApi.getPlayerName(sponsor.minecraft_uuid);
            let playerId = MojangPlayerData?.pop()?.name as string;
            sponsorsText.push(playerId);
        }

        const fileText = `${this._date.fullYearTime()}\n\n` + "清除玩家名單:\n\n" + clearPlayersText.join("\n") + "\n\n" + "通過玩家名單:\n\n" + byPlayersText.join("\n") + "\n\n" + "贊助者玩家名單:\n\n" + sponsorsText.join("\n");
        const textDir = path.join(__dirname, "..", "..", "temp");
        const textPath = path.join(textDir, "clear.txt");
        fs.ensureDirSync(textDir);
        fs.writeFileSync(textPath, fileText, "utf-8");

        if (clearPlayers.length === 0) {

            const embad = new MessageEmbed()
                .setTitle("沒有玩家要被清除!")
                .setColor("#7289DA");

            await channelObject.send("", { embed: embad, files: [new MessageAttachment(textPath)] });

            // remove cleat.txt
            fs.removeSync(textPath);

            return;
        }

        const embed = new MessageEmbed()
            .setTitle("白名單清除名單: 準備開始清除")
            .addFields(
                {
                    name: "總人數:",
                    value: (userWhlistlistsResponse.data.length + sponsors.length),
                    inline: true
                },
                {
                    name: "贊助者人數",
                    value: sponsors.length,
                    inline: true
                },
                {
                    name: "清除人數:",
                    value: clearPlayers.length,
                    inline: true
                },
                {
                    name: "通過人數:",
                    value: byPlayers.length,
                    inline: true
                })
            .setColor("#7289DA");

        const confirmButton = new MessageButton()
            .setID("confirmClearWhitelist")
            .setLabel("開始清除")
            .setStyle("green");

        const cancelButton = new MessageButton()
            .setID("cancelClearWhitelist")
            .setLabel("取消清除")
            .setStyle("red");

        const buttonRow = new MessageActionRow()
            .addComponent(cancelButton)
            .addComponent(confirmButton);

        await channelObject.send(new MessageAttachment(textPath));

        await channelObject.send({
            component: buttonRow,
            embed: embed
        });

        this.clearPlayerData = {
            playerTotalQuantity: (userWhlistlistsResponse.data.length + sponsors.length),
            sponsorQuantity: sponsors.length,
            clearPlayerQuantity: clearPlayers.length,
            byNumberQuantity: byPlayers.length,
            serverId: serverId,
            players: clearPlayers
        }
    }

    public static async clearWhitelistButton(buttonId: string, buttonObject: MessageComponent): Promise<void> {

        if (buttonId === "confirmClearWhitelist") {

            // const removeWhitelists = new Array<string>();

            for (let clearPlayer of this.clearPlayerData.players) {

                if (clearPlayer.discord_user_id !== undefined) {
                    const membersUser = buttonObject.guild.members.cache.get(clearPlayer.discord_user_id);
                    if (membersUser !== undefined) {
                        await this._roleHandeReaction(membersUser, buttonObject.guild);
                    }
                }

                await ApiServiceAxios.deleteServerWhitelist(clearPlayer.minecraft_uuid);
                // removeWhitelists.push(clearPlayer.minecraft_uuid);
            }

            // const socket = getSocketMap(this.clearPlayerData.serverId);

            // emit minecraft server - task whitelist_remove
            // socket.emit("task", {
            //     type: "whitelist_remove",
            //     uuids: removeWhitelists
            // });

            const embed = new MessageEmbed()
                .setTitle("白名單清除名單: 已清除完成!")
                .addFields(
                    {
                        name: "總人數:",
                        value: this.clearPlayerData.playerTotalQuantity,
                        inline: true
                    },
                    {
                        name: "贊助者人數",
                        value: this.clearPlayerData.sponsorQuantity,
                        inline: true
                    },
                    {
                        name: "清除人數:",
                        value: this.clearPlayerData.clearPlayerQuantity,
                        inline: true
                    },
                    {
                        name: "通過人數:",
                        value: this.clearPlayerData.byNumberQuantity,
                        inline: true
                    })
                .setColor("#7289DA");

            (buttonObject.message as unknown as Message).delete();
            (buttonObject.channel as TextChannel).send(embed);

        } else if (buttonId === "cancelClearWhitelist") {

            const embed = new MessageEmbed()
                .setTitle("白名單清除任務取消!")
                .setColor("#7289DA");

            (buttonObject.message as unknown as Message).delete();
            (buttonObject.channel as TextChannel).send(embed);
        }

    }

    private static _getPlayersDiscordUserId(minecraftUuid: string, userLinks: Array<IUserLink>): string | undefined {
        return userLinks.find(item => item.minecraft_uuid === minecraftUuid)?.discord_id;
    }

    private static _getPlayersOnlineTime(serverId: string, checkPlayers: Array<IWhitelistUser>): Promise<Array<IUserClearTime>> {
        return new Promise((resolve, reject) => {

            const socket = getSocketMap(serverId);

            const listener = (playersTime: Array<IUserClearTime>) => {
                socket.off("getPlayerTime", listener);
                return resolve(playersTime);
            };

            socket.on("getPlayerTime", listener);

            socket.emit("task", {
                type: "getPlayerTime",
                players: checkPlayers
            });
        });
    }

    private static _filterNotSponsorPlayer(serverWhitelists: Array<IWhitelistUser>, sponsors: Array<ISponsorUser>): Array<IWhitelistUser> {

        const list = new Array<IWhitelistUser>();

        for (let serverWhitelist of serverWhitelists) {

            const isFind = sponsors.find(item => item.minecraft_uuid === serverWhitelist.minecraft_uuid);

            if (!isFind) {
                list.push(serverWhitelist);
            }
        }

        return list;
    }

    private static _roleHandeReaction(member: GuildMember, guild: Guild): Promise<void> {
        return new Promise((resolve, reject) => {

            const roleWhitelist = guild.roles.cache.get(BotMain.CONFIG_DATA.roleWhitelist.roleId);

            // 刪除白名單身分組
            member.roles.remove(roleWhitelist as Role)
                .then(() => {
                    resolve();
                })
                .catch((error) => {
                    reject(new Error(error));
                });
        });
    }
}
