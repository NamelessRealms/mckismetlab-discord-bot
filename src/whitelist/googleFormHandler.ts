import { MessageEmbed, Client, Message, TextChannel, User } from "discord.js";
import { MessageButton, MessageActionRow } from "discord-buttons";

import { logs } from "../utils/logs";
import { getDynamicConfigPath } from "../utils/config";

import * as fs from "fs-extra";
import * as moment from "moment";
import ApiServiceAxios from "../api/apiServiceAxios";
import VerifyWhitelist from "./verifyWhitelist";
import MojangApi from "../api/mojangApi";

moment.locale("zh-tw");

const log: logs = new logs();

export default class GoogleFormHandler {

    private static _userCount = 0;

    public static async createFormButtonMessage(channelObject: TextChannel): Promise<void> {

        const embed = new MessageEmbed()
            .setTitle("📋 **取得個人白名單申請連結 (BOT)**\n\u200b")
            .setDescription("⬇ 點擊下方[申請白名單]按鈕，小幫手會私訊你做進一步說明申請流程。\n⁉ 如果有任何問題歡迎回報給我 <@177388464948510720>。\n\u200b")
            .setColor("#2894FF")
            .setFooter("MCKISMETLAB 無名伺服器 | 模組生存 ⚔ 冒險前進", channelObject.client.user?.avatarURL() as string);

        const applyButton = new MessageButton()
            .setID("googleFormApplyButton")
            .setLabel("申請白名單")
            .setStyle("blurple" as any);

        channelObject.send({
            component: applyButton,
            embed: embed
        } as any);
    }

    public static formApplyLinkHandler(client: Client, user: User, serverCheck: boolean): Promise<void> {
        return new Promise(async (resolve, reject) => {

            if (user.bot) return;

            const dynamicConfigPath = getDynamicConfigPath();
            const dynamicConfigJson = fs.readJSONSync(dynamicConfigPath);

            if (!dynamicConfigJson.googleForm.status) {
                let embed = new MessageEmbed()
                    .setTitle("📋 **白名單申請系統 (BOT)**\n\u200b")
                    .setDescription(`🙋‍♂️ 玩家你好! 我是 **MCKISMETLAB 無名伺服器** 小幫手機器人 🤖\n\n🙏 很抱歉我們白名單人數名額已滿無法在申請，後續有名額會在Discord公告頻道公告。\n\u200b`)
                    .setColor("#2894FF")
                    .setFooter("MCKISMETLAB 無名伺服器 | 模組生存 ⚔ 冒險前進", client.user?.avatarURL() as string);

                log.info(`[\x1b[36mgoogleFormLink\x1b[0m] ${user.tag} 使用了白名單申請連結幫助系統，但白名單人數名額已滿無法在申請 - ${this._userCount}`);

                (await user.send(embed)).delete({ timeout: 15000 }).catch(() => {

                    log.info(`[\x1b[36mgoogleFormLink\x1b[0m] ${user.tag} 使用了白名單申請連結幫助系統，但機器人無法發送該用戶DM - ${this._userCount}`);

                }); // 15s

                return resolve();
            }

            if (!serverCheck) {

                this._sendApiErrorMessage(user, client);

                return resolve();
            }

            // const date: Date = new Date();
            // const dateText = moment(date).add(1, "d").format("MMM Do HH:mm");

            let embed = new MessageEmbed()
                .setTitle("📋 **白名單說明申請流程 (BOT)**")
                .setDescription(`🙋‍♂️ 玩家你好! 我是 **MCKISMETLAB 無名伺服器** 小幫手機器人 🤖\n\n這項功能會幫助你填好 一些基本資訊 或 先前重複性的基本資訊，例如: **正版 Minecraft ID / Discord ID (可不必看)**，你只需要幫我檢查表單對應的問題小幫手機器人有沒有填錯，如果有填錯麻煩你再修正。\n\n⚠ 如果你遇到問題，請聯繫我 <@177388464948510720> 伺服主。\n\u200b`)
                .setColor("#2894FF")
                .setFooter("MCKISMETLAB 無名伺服器 | 模組生存 ⚔ 冒險前進", client.user?.avatarURL() as string);

            log.info(`[\x1b[36mgoogleFormLink\x1b[0m] ${user.tag} 使用了白名單申請連結幫助系統 - ${++this._userCount}`);

            await this._createFormApplyButton(user, embed);

            return resolve();
        });
    }

    public static formApplyConfirmButton(client: Client, user: User, message: Message, serverCheck: boolean): Promise<void> {
        return new Promise(async (resolve, reject) => {

            if (!serverCheck) {
                this._sendApiErrorMessage(user, client);
            }

            const reactVerifyFromResponse = await ApiServiceAxios.getWhitelistAwaitVerify(user.id);

            message.delete();

            if (reactVerifyFromResponse.status === 200) {

                const embed = new MessageEmbed()
                    .setColor("#2894FF")
                    .setDescription("📣 你的白名單申請已確認 !! 等待我們的通知 !!");

                await ApiServiceAxios.deleteWhitelistAwaitVerify(user.id);

                log.info(`[\x1b[36mgoogleFormLink\x1b[0m] ${user.tag} 使用了白名單申請連結幫助系統，已完成申請! - ${--this._userCount}`);

                VerifyWhitelist.verify(reactVerifyFromResponse.data);

                (await message.channel.send(embed)).delete({ timeout: 64000 }); // 64s

            } else {

                const embed = new MessageEmbed()
                    .setColor("#2894FF")
                    .setDescription("📣 你好像沒有填寫白名單申請表哦 !! 請你填寫好後，在次點擊下方[申請]按鈕確認你的申請。");

                await this._createFormApplyButton(user, embed);
            }

            return resolve();
        });
    }

    public static async formApplyCancelButton(message: Message, user: User, serverCheck: boolean): Promise<void> {

        message.delete();

        const embed = new MessageEmbed()
            .setColor("#2894FF")
            .setDescription("📣 你的白名單申請已取消 !!");

        log.info(`[\x1b[36mgoogleFormLink\x1b[0m] ${user.tag} 使用了白名單申請連結幫助系統，但取消申請 - ${--this._userCount}`);

        if (serverCheck) {
            await ApiServiceAxios.deleteWhitelistAwaitVerify(user.id);
        }

        (await message.channel.send(embed)).delete({ timeout: 10000 }); // 10s

    }

    private static _googleFromURL(user: User): Promise<string> {
        return new Promise(async (resolve, reject) => {

            let googleFormVerifyURL = "https://docs.google.com/forms/d/e/1FAIpQLScUK6Ok513tCETHo3z6HT_8aGYKq8SWb2qgtz3m4RduB1VjVA/viewform?";

            const userLinkResponse = await ApiServiceAxios.getUserLink(user.id);

            let playerName = "";

            if (userLinkResponse.status === 200) {
                const playerUUID = userLinkResponse.data.minecraft_uuid;

                if (playerUUID !== undefined) {
                    const playerData = await MojangApi.getPlayerName(playerUUID);
                    if (playerData !== undefined) {
                        playerName = playerData.pop()?.name || "";
                    }
                }
            }

            // ASCII %23 = #
            // const userName = `${user.username}%23${user.discriminator}`;

            const entrys = ["entry.57262147", playerName || "", "entry.1988444974", user.id || ""];

            for (let i = 0; i < entrys.length; i++) {
                let entry = entrys[i];
                if (entry.indexOf("entry.") !== -1) {
                    let value = entrys[i + 1];
                    if (value.length !== 0) {
                        googleFormVerifyURL += `${entry}=${value}&`;
                    }
                }
            }

            return resolve(googleFormVerifyURL);

        });
    }

    private static _createFormApplyButton(user: User, embed: MessageEmbed): Promise<void> {
        return new Promise(async (resolve, reject) => {

            const googleFormVerifyURL = await this._googleFromURL(user);

            const googleFormUrlButton = new MessageButton()
                .setLabel("個人白名單填表連結")
                .setURL(googleFormVerifyURL)
                .setStyle("url" as any);

            const confirmButton = new MessageButton()
                .setID("whitelistConfirmButton")
                .setLabel("申請")
                .setStyle("green" as any);

            const cancelButton = new MessageButton()
                .setID("whitelistCancelButton")
                .setLabel("取消")
                .setStyle("red" as any);

            const buttonRow = new MessageActionRow()
                .addComponent(googleFormUrlButton)
                .addComponent(cancelButton)
                .addComponent(confirmButton);

            await user.send({
                component: buttonRow,
                embed: embed
            } as any)
                .catch(() => {
                    log.info(`[\x1b[36mgoogleFormLink\x1b[0m] ${user.tag} 使用了白名單申請連結幫助系統，但機器人無法發送該用戶DM - ${--this._userCount}`);
                    return resolve();
                });

            return resolve();
        });
    }

    private static async _sendApiErrorMessage(user: User, client: Client): Promise<void> {

        const embed = new MessageEmbed()
            .setTitle("📋 **小幫手機器人白名單申請連結 (BOT)**\n\u200b")
            .setDescription(`🙋‍♂️ 玩家你好! 我是 **MCKISMETLAB 無名伺服器** 小幫手機器人 🤖\n\n🙏 很抱歉我們白名單申請系統(API)未上線，請稍後再嘗試。\n\n⁉ 如果有任何問題歡迎回報給我 <@177388464948510720>。\n\u200b`)
            .setColor("#2894FF")
            .setFooter("MCKISMETLAB 無名伺服器 | 模組生存 ⚔ 冒險前進", client.user?.avatarURL() as string);

        log.info(`[\x1b[36mgoogleFormLink\x1b[0m] ${user.tag} 使用了白名單申請連結幫助系統，但白名單申請系統(API)未上線 - ${this._userCount}`);

        (await user.send(embed)).delete({ timeout: 10000 }); // 10s

    }
}
