import { TextChannel, Role, MessageEmbed, Guild, GuildMember } from "discord.js";
import { Socket } from "socket.io";
import { VerifyNoticeStatus } from "../interface/enum/verifyNoticeStatus";
import { getSocketMap, isSocketOnline } from "../api/socketApi";
import { MessageButton, MessageActionRow } from "discord-buttons";

import MojangApi from "../api/mojangApi";
import BotMain from "../botMain";
import IVerifyUser from "../interface/IVerifyUser";
import IVerifyUserProfile from "../interface/IVerifyUserProfile";
import ApiServiceAxios from "../api/apiServiceAxios";

export default class VerifyWhitelist {

    public static verify(verifyUser: IVerifyUser): Promise<void> {
        return new Promise(async (resolve, reject) => {

            if (!Boolean(Number(verifyUser.consent_rules))) {
                return resolve();
            }

            let userProfile: IVerifyUserProfile = {
                status: VerifyNoticeStatus.normal,
                minecraftName: "",
                minecraftUuid: "",
                discordUserName: "",
                discordUserId: "",
                serverId: "",
                autoAuditResults: "",
                description: "沒有",
                isDbUserlink: false,
                isDbServerWhitelist: false,
                isDbManualVerifyWhitelist: false,
                isDbViolationRecord: false,
                manualVerifyChannelId: "",
                manualVerifyMessageId: ""
            };

            userProfile.minecraftName = verifyUser.minecraft_id;
            userProfile.discordUserName = verifyUser.discord_id;
            userProfile.serverId = verifyUser.server_id;

            // 驗證是否是正版 minecraft id or 有效的 minecraft id ， 沒有就 undefined
            const minecraftUser = await MojangApi.validateSpieler(verifyUser.minecraft_id);

            // 檢查用戶是否在 discord ， 沒有就 undefined
            const discordUser = BotMain.BOT_CLIENT.users.cache.get(verifyUser.discord_id);

            // 檢查 discordId && minecraftUuid 為空就取消
            if (minecraftUser === undefined || discordUser === undefined) {

                let text = "";

                if (minecraftUser === undefined) {
                    text += "Minecraft Name 無效"
                }

                if (discordUser === undefined) {
                    text += "Discrod User ID 無效"
                }

                if (minecraftUser === undefined && discordUser !== undefined) {
                    this._failureUserNotice(discordUser.id);
                }

                userProfile.status = VerifyNoticeStatus.failure;
                userProfile.autoAuditResults = `❎審核失敗!`;
                userProfile.description = text;

                this.discordNotice(userProfile);
                this._log(userProfile);

                return resolve();
            }

            userProfile.minecraftUuid = minecraftUser.id;
            userProfile.discordUserId = discordUser.id;
            userProfile.discordUserName = discordUser.tag as string;

            // 檢查用戶是否在 server_whitelist 資料庫的資料表 - 搜尋用 minecraft uuid
            const userWhitelistResponse = await ApiServiceAxios.getServerWhitelist(minecraftUser.id);

            // 檢查用戶是否在 user_link 資料庫的資料表 - 搜尋用 discord id
            const userLinkResponse = await ApiServiceAxios.getUserLink(discordUser.id);

            // 檢查用戶是否在 manualVerify_whitelist 資料庫的資料表 - 搜尋用 discord id
            const manualVerifyWhitelistResponse = await ApiServiceAxios.getWhitelistManualVerifyDcId(discordUser.id);

            // 檢查用戶是否在違規 violationlist 資料庫的資料表 - 搜尋用 discord id
            const violationDcResponse = await ApiServiceAxios.getViolation(discordUser.id);

            // 檢查用戶是否在違規 violationlist 資料庫的資料表 - 搜尋用 minecraft uuid
            const violationMcResource = await ApiServiceAxios.getViolation(minecraftUser.id);

            // 檢查是否有白名單記錄
            if (userWhitelistResponse.status === 200) {

                this._haveWhitelistHandler(discordUser.id);

                userProfile.status = VerifyNoticeStatus.warning;
                userProfile.autoAuditResults = `❎審核取消!`;
                userProfile.description = "玩家已經加入白名單了，但重複申請。";

                this.discordNotice(userProfile);
                this._log(userProfile);

                return resolve();
            }

            // 檢查是否有違規記錄
            if (violationDcResponse.status === 200 || violationMcResource.status === 200) {

                userProfile.isDbViolationRecord = true;
                userProfile.status = VerifyNoticeStatus.violation;
                userProfile.autoAuditResults = "⛔有違反規則，必須手動審核";
                userProfile.description = "未實作";

                await this._manualVerify(userProfile);
                this._log(userProfile);

                return resolve();
            }

            userProfile.isDbServerWhitelist = userWhitelistResponse.status === 200;
            userProfile.isDbUserlink = userLinkResponse.status === 200;
            userProfile.isDbManualVerifyWhitelist = manualVerifyWhitelistResponse.status === 200;

            // 不用檢查 server 是否有在 online

            userProfile.status = VerifyNoticeStatus.normal;
            userProfile.autoAuditResults = "✅通過";

            await this.handleAddWhitelist(userProfile);

            if (userLinkResponse.status === 204) {
                await ApiServiceAxios.createUserLink(minecraftUser.id, discordUser.id);
            }

            this.discordNotice(userProfile);
            this._log(userProfile);

            // 檢查 server 是否有在 online
            // if (isSocketOnline(verifyUser.server_id)) {

            //     userProfile.status = VerifyNoticeStatus.normal;
            //     userProfile.autoAuditResults = "✅通過";

            //     await this.handleAddWhitelist(userProfile);

            //     if (userLinkResponse.status === 204) {
            //         await ApiServiceAxios.createUserLink(minecraftUser.id, discordUser.id);
            //     }

            //     this.discordNotice(userProfile);
            //     this._log(userProfile);

            // } else {

            //     userProfile.status = VerifyNoticeStatus.warning;
            //     userProfile.autoAuditResults = "⚠暫停! SERVER 未在線上";

            //     this.discordNotice(userProfile);
            //     this._log(userProfile);

            //     await ApiServiceAxios.createTpmeVerifyWhitelist({
            //         minecraft_name: userProfile.minecraftName,
            //         minecraft_uuid: userProfile.minecraftUuid,
            //         discord_user_name: userProfile.discordUserName,
            //         discord_user_id: userProfile.discordUserId,
            //         server_Id: userProfile.serverId
            //     });
            // }
        });
    }

    private static _log(userProfile: IVerifyUserProfile): void {
        BotMain.LOG.info(`[\x1b[36mverify\x1b[0m] [\x1b[36m${userProfile.minecraftName}\x1b[0m/\x1b[36m${userProfile.discordUserName}\x1b[0m/\x1b[36m${userProfile.serverId}\x1b[0m] ${userProfile.autoAuditResults}!`);
    }

    public static async whitelistTask(serverId: string): Promise<void> {

        const tpmeVerifyUsersData = await ApiServiceAxios.getTpmeVerifyWhitelist();

        if (tpmeVerifyUsersData.status !== 200) {
            return;
        }

        for (let tpmeVerifyUserData of tpmeVerifyUsersData.data) {

            console.log(tpmeVerifyUserData.server_Id, serverId);

            if (tpmeVerifyUserData.server_Id !== serverId) {
                break;
            }

            const userProfile: IVerifyUserProfile = {
                status: VerifyNoticeStatus.normal,
                minecraftName: tpmeVerifyUserData.minecraft_name,
                minecraftUuid: tpmeVerifyUserData.minecraft_uuid,
                discordUserName: tpmeVerifyUserData.discord_user_name,
                discordUserId: tpmeVerifyUserData.discord_user_id,
                serverId: tpmeVerifyUserData.server_Id,
                autoAuditResults: "✅通過",
                description: "沒有",
                isDbUserlink: false,
                isDbServerWhitelist: false,
                isDbManualVerifyWhitelist: false,
                isDbViolationRecord: false,
                manualVerifyChannelId: "",
                manualVerifyMessageId: ""
            };

            await this.handleAddWhitelist(userProfile);

            // 檢查用戶是否在 user_link 資料庫的資料表 - 搜尋用 discord id
            const userLinkResponse = await ApiServiceAxios.getUserLink(userProfile.discordUserId);

            if (userLinkResponse.status === 204) {
                await ApiServiceAxios.createUserLink(tpmeVerifyUserData.minecraft_uuid, tpmeVerifyUserData.discord_user_id);
            }

            await ApiServiceAxios.deleteTpmeVerifyWhitelist(tpmeVerifyUserData.discord_user_id);

            this.discordNotice(userProfile);
            this._log(userProfile);
        }
    }

    public static handleAddWhitelist(userProfile: IVerifyUserProfile): Promise<void> {
        return new Promise(async (resolve, reject) => {

            if (!userProfile.isDbServerWhitelist) {
                await ApiServiceAxios.createServerWhitelist({
                    minecraft_uuid: userProfile.minecraftUuid,
                    server_id: userProfile.serverId
                });
            }

            const guild = BotMain.BOT_CLIENT.guilds.cache.get(BotMain.CONFIG_DATA.guilds_id) as Guild;
            const member = guild.members.cache.get(userProfile.discordUserId as string);

            try {

                await this._roleHandeReaction(guild, member as GuildMember);

                // this._addWhitelistServer(userProfile.minecraftUuid, userProfile.serverId);
                this._byUserNotice(member);

                resolve();

            } catch (error) {
                BotMain.LOG.error(error);
                reject(error);
            }
        });
    }

    private static _addWhitelistServer(uuid: string, serverId: string): void {
        const mcSocket: Socket = getSocketMap(serverId);

        mcSocket.emit("task", {
            type: "whitelist_add",
            uuid: uuid
        });
    }

    private static _roleHandeReaction(guild: Guild, member: GuildMember): Promise<void> {
        return new Promise((resolve, reject) => {

            const roleWhitelist = guild.roles.cache.get(BotMain.CONFIG_DATA.roleWhitelist.roleId);

            // 加入白名單身分組
            member.roles.add(roleWhitelist as Role)
                .then(() => {
                    resolve();
                })
                .catch((error) => {
                    reject(new Error(error));
                });
        });
    }

    public static discordNotice(userProfile: IVerifyUserProfile): void {

        const channel = BotMain.BOT_CLIENT.channels.cache.get(BotMain.CONFIG_DATA.verifyDiscordNoticeChannelId) as TextChannel;

        const color = () => {
            switch (userProfile.status) {
                case 0:
                    return "#0779E8";
                case 1:
                    return "#FEB63F";
                case 2:
                    return "#FF4F42";
                case 3:
                    return "#6D39E6";
                default:
                    return "#7289DA";
            }
        }

        let embed = new MessageEmbed()
            .setTitle(`🖥 **審核系統 (BETA)，自動審核: ${userProfile.autoAuditResults}**`)
            .addFields(
                {
                    name: "`玩家名稱:`",
                    value: userProfile.minecraftName || "空值",
                    inline: false
                },
                {
                    name: "`玩家UUID:`",
                    value: userProfile.minecraftUuid || "空值",
                    inline: false
                },
                {
                    name: "`玩家Dsicord名稱`",
                    value: userProfile.discordUserName || "空值",
                    inline: false
                },
                {
                    name: "`玩家Discord ID:`",
                    value: userProfile.discordUserId || "空值",
                    inline: false
                },
                {
                    name: "描述:",
                    value: userProfile.description || "空值",
                    inline: false
                })
            .setColor(color());

        channel.send(embed);
    }

    private static _manualVerify(userProfile: IVerifyUserProfile): Promise<void> {
        return new Promise(async (resolve, reject) => {

            const embad = new MessageEmbed()
                .setTitle("🖥 **審核系統 (BETA)，有違規紀錄，必須手動審核!**")
                .addFields(
                    {
                        name: "`玩家名稱:`",
                        value: userProfile.minecraftName || "空值",
                        inline: false
                    },
                    {
                        name: "`玩家UUID:`",
                        value: userProfile.minecraftUuid || "空值",
                        inline: false
                    },
                    {
                        name: "`玩家Dsicord名稱`",
                        value: userProfile.discordUserName || "空值",
                        inline: false
                    },
                    {
                        name: "`玩家Discord ID:`",
                        value: userProfile.discordUserId || "空值",
                        inline: false
                    },
                    {
                        name: "`違規紀錄:`",
                        value: "未實作",
                        inline: false
                    })
                .setColor("#7289DA");

            const channel = BotMain.BOT_CLIENT.channels.cache.get(BotMain.CONFIG_DATA.manualVerifyChannelId) as TextChannel;

            const passButton = new MessageButton()
                .setID("manualVerifyPassButton")
                .setLabel("通過")
                .setStyle("green");

            const failButton = new MessageButton()
                .setID("manualVerifyFailButton")
                .setLabel("不通過")
                .setStyle("red");

            const buttonRow = new MessageActionRow()
                .addComponent(failButton)
                .addComponent(passButton);

            const reactMessage = await channel.send({
                component: buttonRow,
                embed: embad
            });

            if (!userProfile.isDbManualVerifyWhitelist) {

                // New 加入人工審核清單
                await ApiServiceAxios.createWhitelistManualVerify({
                    minecraft_uuid: userProfile.minecraftUuid,
                    minecraft_id: userProfile.minecraftName,
                    discord_user_name: userProfile.discordUserName,
                    discord_user_id: userProfile.discordUserId,
                    channel_id: channel.id,
                    message_id: reactMessage.id,
                    server_id: userProfile.serverId
                });
            }

            resolve();
        });
    }

    private static _byUserNotice(member: GuildMember | undefined): void {

        if (member === undefined) {
            BotMain.LOG.error("[\x1b[36mverifyHandler\x1b[0m] 通過通知!向玩家發送訊息失敗。");
            return;
        }

        let embed = new MessageEmbed()
            .setTitle(`🎉 嗨! 你好玩家 ${member.user.tag}，恭喜你通過白名單審核 🎉`)
            .addFields(
                {
                    name: "📢 `通過審核歡迎語:`",
                    value: "感謝你加入我們無名伺服器! 你能使用 mckismetlab.net 位址進來伺服器了窩。本伺服器第一次自架公開伺服器，有問題請見諒。"
                },
                {
                    name: "🔗 `伺服器官網:`",
                    value: "[點擊前往 無名伺服器 - mcKismetLab](https://mckismetlab.net/)",
                    inline: true
                },
                {
                    name: "💻 `伺服器 IP:`",
                    value: "mckismetlab.net"
                }
            )
            .setColor("#7289DA")
            .setFooter("MCKISMETLAB 無名伺服器 | 模組生存 ⚔ 冒險前進", BotMain.BOT_CLIENT.user?.avatarURL() as string);

        member.send(embed);
    }

    private static _failureUserNotice(discordId: string): void {

        const guild = BotMain.BOT_CLIENT.guilds.cache.get(BotMain.CONFIG_DATA.guilds_id) as Guild;
        const member = guild.members.cache.get(discordId);

        if (member === undefined) {
            BotMain.LOG.error("[\x1b[36mverifyHandler\x1b[0m] 通過通知!向玩家發送訊息失敗。");
            return;
        }

        let embed = new MessageEmbed()
            .setTitle("⚠ 你提出的白名單申請，申請失敗! ⚠")
            .addFields(
                {
                    name: "⁉ `失敗原因:`",
                    value: "你的 Minecraft ID 驗證沒過。"
                },
                {
                    name: "📣 `如果你有任何的問題:`",
                    value: "請麻煩回報給我 <@177388464948510720> 服主我。"
                }
            )
            .setColor("#FF0000")
            .setFooter("MCKISMETLAB 無名伺服器 | 模組生存 ⚔ 冒險前進", BotMain.BOT_CLIENT.user?.avatarURL() as string);

        member.send(embed);
    }

    private static _haveWhitelistHandler(discordId: string) {

        const guild = BotMain.BOT_CLIENT.guilds.cache.get(BotMain.CONFIG_DATA.guilds_id) as Guild;
        const member = guild.members.cache.get(discordId);

        if (member === undefined) {
            BotMain.LOG.error("[\x1b[36mverifyHandler\x1b[0m] 已有白名單通知!向玩家發送訊息失敗。");
            return;
        }

        let embed = new MessageEmbed()
            .setTitle("⚠ 你提出的白名單申請，申請失敗! ⚠")
            .addFields(
                {
                    name: "⁉ `失敗原因:`",
                    value: "你已經加入白名單了，請勿重複申請。"
                },
                {
                    name: "📣 `如果你有任何的問題:`",
                    value: "請麻煩回報給我 <@177388464948510720> 服主我。"
                }
            )
            .setColor("#FF0000")
            .setFooter("MCKISMETLAB 無名伺服器 | 模組生存 ⚔ 冒險前進", BotMain.BOT_CLIENT.user?.avatarURL() as string);

        member.send(embed);
    }
}
