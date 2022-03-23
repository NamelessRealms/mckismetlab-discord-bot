import { MessageComponent } from "discord-buttons";
import { Message } from "discord.js";
import { VerifyNoticeStatus } from "../interface/enum/verifyNoticeStatus";

import ApiServiceAxios from "../api/apiServiceAxios";
import IVerifyUserProfile from "../interface/IVerifyUserProfile";
import { isSocketOnline } from "../api/socketApi";
import { MessageEmbed } from "discord.js";
import { User } from "discord.js";
import VerifyWhitelist from "./verifyWhitelist";
import BotMain from "../botMain";
import { TextChannel } from "discord.js";

export default class ManualVerify {

    public static async verify(buttonId: string, buttonObject: MessageComponent, user: User, serverCheck: boolean): Promise<void> {

        if (!serverCheck) {
            return;
        }

        const channelId = buttonObject.channel.id;
        const messageId = (buttonObject.message as unknown as Message).id;
        const manualVerifyWhitelistResponse = await ApiServiceAxios.getWhitelistManualVerify(channelId, messageId);

        if (manualVerifyWhitelistResponse.status !== 200) {
            return;
        }

        let userProfile: IVerifyUserProfile = {
            status: VerifyNoticeStatus.normal,
            minecraftName: manualVerifyWhitelistResponse.data.minecraft_id,
            minecraftUuid: manualVerifyWhitelistResponse.data.minecraft_uuid,
            discordUserName: manualVerifyWhitelistResponse.data.discord_user_name,
            discordUserId: manualVerifyWhitelistResponse.data.discord_user_id,
            serverId: manualVerifyWhitelistResponse.data.server_id,
            autoAuditResults: "",
            description: "沒有",
            isDbUserlink: false,
            isDbServerWhitelist: false,
            isDbManualVerifyWhitelist: false,
            isDbViolationRecord: false,
            manualVerifyChannelId: "",
            manualVerifyMessageId: ""
        };

        const embad = new MessageEmbed()
            .setTitle("🖥 **審核系統 (BETA)，完成手動審核!**")
            .addFields(
                {
                    name: "`玩家名稱:`",
                    value: userProfile.minecraftName,
                    inline: false
                },
                {
                    name: "`玩家UUID:`",
                    value: userProfile.minecraftUuid,
                    inline: false
                },
                {
                    name: "`玩家Dsicord名稱`",
                    value: userProfile.discordUserName,
                    inline: false
                },
                {
                    name: "`玩家Discord ID:`",
                    value: userProfile.discordUserId,
                    inline: false
                },
                {
                    name: "`違規紀錄:`",
                    value: "未實作",
                    inline: false
                })
            .setColor("#7289DA");

        if (buttonId === "manualVerifyPassButton") {

            // 檢查用戶是否在 server_whitelist 資料庫的資料表 - 搜尋用 minecraft uuid
            const userWhlistUserResponse = await ApiServiceAxios.getServerWhitelist(userProfile.minecraftUuid);

            // 檢查用戶是否在 user_link 資料庫的資料表 - 搜尋用 discord id
            const userLinkResponse = await ApiServiceAxios.getUserLink(userProfile.discordUserId);

            userProfile.isDbServerWhitelist = userWhlistUserResponse.status === 200;
            userProfile.isDbUserlink = userLinkResponse.status === 200;

            if (isSocketOnline(userProfile.serverId)) {

                userProfile.status = VerifyNoticeStatus.normal;
                userProfile.autoAuditResults = "手動審核: ✅通過";
                userProfile.description = "沒有";

                await VerifyWhitelist.handleAddWhitelist(userProfile);

                if (userLinkResponse.status === 204) {
                    await ApiServiceAxios.createUserLink(userProfile.minecraftUuid, userProfile.discordUserId);
                }

            } else {

                userProfile.status = VerifyNoticeStatus.warning;
                userProfile.autoAuditResults = "手動審核: ⚠SERVER 未在線上";
                userProfile.description = "沒有";

                await ApiServiceAxios.createTpmeVerifyWhitelist({
                    minecraft_name: userProfile.minecraftName,
                    minecraft_uuid: userProfile.minecraftUuid,
                    discord_user_name: userProfile.discordUserName,
                    discord_user_id: userProfile.discordUserId,
                    server_Id: userProfile.serverId
                });
            }

            embad.addFields(
                {
                    name: "`手動審核結果:`",
                    value: "✅通過",
                    inline: false
                },
                {
                    name: "`手動審核人員:`",
                    value: user.tag,
                    inline: false
                });

            await ApiServiceAxios.deleteWhitelistManualVerify(channelId, messageId);

            VerifyWhitelist.discordNotice(userProfile);

            buttonObject.reply.defer(true);

        } else if (buttonId === "manualVerifyFailButton") {

            userProfile.status = VerifyNoticeStatus.failure;
            userProfile.autoAuditResults = "手動審核: ❎不通過";
            userProfile.description = "沒有";

            embad.addFields(
                {
                    name: "`手動審核結果:`",
                    value: "❎不通過",
                    inline: false
                },
                {
                    name: "`手動審核人員:`",
                    value: user.tag,
                    inline: false
                });

            await ApiServiceAxios.deleteWhitelistManualVerify(channelId, messageId);

            VerifyWhitelist.discordNotice(userProfile);

            buttonObject.reply.defer(true);
        }

        BotMain.LOG.info(`[\x1b[36mverify\x1b[0m] [\x1b[36m${userProfile.minecraftName}\x1b[0m/\x1b[36m${userProfile.discordUserName}\x1b[0m/\x1b[36m${userProfile.serverId}\x1b[0m] ${userProfile.autoAuditResults}!`);

        (buttonObject.message as unknown as Message).delete();
        (buttonObject.channel as TextChannel).send(embad);
    }
}
