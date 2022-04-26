import { ButtonInteraction, CacheType, Client, GuildMember, Interaction, MessageActionRow, MessageButton, MessageComponentInteraction, MessageEmbed, MessageSelectMenu, TextChannel } from "discord.js";
import { Modal, TextInputComponent, showModal } from "discord-modals";
import { environment } from "../environment/Environment";
import { ModalSubmitInteraction } from "discord-modals";

import ApiService from "../api/ApiService";
import IWhitelistUser from "../interface/IWhitelistUser";
import Store from "../store/Store";
import SubscriptionEvent from "../subscription/SubscriptionEvent";
import MojangApi from "../api/MojangApi";
import LoggerUtil from "../utils/LoggerUtil";
import Embeds from "../utils/Embeds";

enum VerifyReturnEnum {
    minecraftNameUnknown = 0,
    discordUserUnknown = 1,
    minecraftNameAndDiscordUserUnknown = 2,
    violation = 3,
    success = 4,
    error = 5,
    serverEconnrefused = 6
}

export default class WhitelistApply {

    private static readonly _applyUserData = new Map<string, { serverId: string, minecraftName: string | null, interaction: Interaction }>();
    private static readonly _logger = new LoggerUtil("WhitelistApply");
    private static _store: Store;
    private static _client: Client;
    private static readonly _whitelistNumber = 60;

    constructor(client: Client, store: Store) {
        WhitelistApply._client = client;
        WhitelistApply._store = store;
    }

    public init(): void {
        this._applyEmbed();
    }

    private async _applyEmbed() {

        let allServerWhitelist: Array<IWhitelistUser> | null = null;

        try {
            allServerWhitelist = await ApiService.getAllServerWhitelist();
        } catch (error: any) {
            allServerWhitelist = null;
        }

        let mainServerWhitelist: Array<IWhitelistUser> | null = null;
        if (allServerWhitelist !== null) mainServerWhitelist = allServerWhitelist.filter((value) => value.server_id === "mckismetlab-main-server");

        const embed = new MessageEmbed()
            .setTitle("📝 申請伺服器白名單 (BOT) 🤖")
            .setDescription("如果你遇到問題，請聯繫我 <@177388464948510720> 伺服器架設者")
            .setColor("#2894FF")
            .setFooter({
                text: "MCKISMETLAB 無名伺服器 | 模組生存 ⚔ 冒險前進",
                iconURL: WhitelistApply._client.user?.avatarURL() as string
            })
            .setFields(
                {
                    name: `白名單人數`,
                    value: mainServerWhitelist !== null ? mainServerWhitelist.length.toString() : "發生錯誤",
                    inline: true
                },
                {
                    name: "剩餘名額(參考值)",
                    value: mainServerWhitelist !== null ? (WhitelistApply._whitelistNumber - mainServerWhitelist.length).toString() : "發生錯誤",
                    inline: true
                },
                {
                    name: "接受狀態",
                    value: WhitelistApply._store.getWhitelistApplyState() ? "開放中" : "關閉",
                    inline: true
                }
            )

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId("WHITELIST_APPLY")
                    .setLabel("申請白名單")
                    .setStyle("PRIMARY")
                    .setDisabled(!WhitelistApply._store.getWhitelistApplyState()),
                new MessageButton()
                    .setCustomId("SEARCH_WHITELIST")
                    .setLabel("檢查白名單")
                    .setStyle("SECONDARY")
            );

        const channel = WhitelistApply._client.channels.cache.get(environment.whitelistApply.channelId) as TextChannel;
        const messageId = WhitelistApply._store.getWhitelistApplyMessageId();

        if (channel === undefined) throw new Error("Channel not null.");

        if (messageId !== null) {

            const message = (await channel.messages.fetch()).find(value => value.id === messageId);
            if (message === undefined) throw new Error("Message not null.");

            message.edit({ embeds: [embed], components: [row] });

        } else {

            const messageObj = await channel.send({ embeds: [embed], components: [row] });
            WhitelistApply._store.setWhitelistApplyMessageId(messageObj.id);
            WhitelistApply._store.save();

        }
    }

    public static updateApplyEmbed() {
        new WhitelistApply(this._client, this._store)._applyEmbed();
    }

    public static setWhitelistStatus(state: boolean) {
        this._store.setWhitelistApplyState(state);
        this._store.save();
        this.updateApplyEmbed();
    }

    public static async apply(interaction: ButtonInteraction<CacheType>) {

        await interaction.deferReply({ ephemeral: true });

        if (!this._store.getWhitelistApplyState()) {
            interaction.editReply({ content: "😢 很抱歉我們白名單名額已滿無法在申請，後續有名額會在Discord公告。" });
            return;
        }

        const serverId = "mckismetlab-main-server";
        const userId = interaction.user.id;
        const member = interaction.member as GuildMember;
        let userMinecraftPlayerName: string | null = null;

        try {

            const userLink = await ApiService.getUserLink(userId);

            if (userLink !== null) {

                const userWhitelist = await ApiService.getServerWhitelist(userLink.minecraft_uuid);

                if (userWhitelist !== null) {
                    const mainUserWhitelist = userWhitelist.find((value) => value.server_id === serverId);
                    if (mainUserWhitelist !== undefined) {
                        interaction.editReply({ content: "⛔ 你已經加入白名單了，請勿重複申請 ⛔" });
                        return;
                    }
                }

                // Get minecraft player name
                const playerNames = await MojangApi.getPlayerName(userLink.minecraft_uuid);
                if (playerNames !== null) userMinecraftPlayerName = playerNames[playerNames.length - 1] !== undefined ? playerNames.pop()?.name as string : null;
            }

        } catch (error: any) {
            if (error.error === "server_econnrefused") {
                const embed = Embeds.apiServerOfflineEmbed();
                interaction.editReply({ embeds: [embed] });
                return;
            }
            return;
        }

        const rowSelectMenu = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId("WHITELIST_APPLY_SELECT_SERVER")
                    .setPlaceholder("請選擇伺服器")
                    .addOptions([
                        {
                            label: "主服模組伺服器",
                            description: "目前主要在運作的模組伺服器",
                            value: "mckismetlab-main-server",
                            default: true
                        }
                    ])
            );

        const rowButton = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId("WHITELIST_APPLY_EDIT_MINECRAFT_NAME")
                    .setLabel("更改 Minecraft 用戶名")
                    .setStyle("PRIMARY"),
                new MessageButton()
                    .setCustomId("WHITELIST_APPLY_CANCEL")
                    .setLabel("取消申請")
                    .setStyle("DANGER"),
                new MessageButton()
                    .setCustomId("WHITELIST_APPLY_CONFIRM")
                    .setLabel("確認申請")
                    .setStyle("SUCCESS")
            )

        const applyUserData = this._applyUserData.get(interaction.user.id);
        if (applyUserData !== undefined) {
            (applyUserData.interaction as ButtonInteraction).editReply({ embeds: [], content: "由於你重複按申請白名單按鈕，這則申請將自動關閉。", components: [] });
        }

        // reply apply
        interaction.editReply({ embeds: [this._applyUserContentEmbed(member, userMinecraftPlayerName)], components: [rowSelectMenu, rowButton] });
        this._applyUserData.set(interaction.user.id, { serverId: "mckismetlab-main-server", minecraftName: userMinecraftPlayerName, interaction: interaction });

        // subscription WHITELIST_APPLY_EDIT_MINECRAFT_NAME
        const subscriptionEditMinecraftNameEvent = new SubscriptionEvent("WHITELIST_APPLY_EDIT_MINECRAFT_NAME", interaction.user.id);
        subscriptionEditMinecraftNameEvent.subscription((client, inter: ButtonInteraction) => {

            if (inter.user.id !== interaction.user.id) return;

            // create model
            const modal = new Modal()
                .setCustomId("WHITELIST_APPLY_MODAL_EDIT_MINECRAFT_NAME")
                .setTitle("申請白名單")
                .addComponents(
                    new TextInputComponent()
                        .setCustomId("MINECRAFT_NAME")
                        .setLabel("正版 Minecraft Name")
                        .setStyle("SHORT")
                        .setPlaceholder("請輸入 Minecraft Name")
                        .setRequired(true)
                );

            showModal(modal, {
                client: client,
                interaction: inter
            });
        });

        // subscription WHITELIST_APPLY_MODAL_EDIT_MINECRAFT_NAME
        const subscriptionChangeMinecraftNameEvent = new SubscriptionEvent("WHITELIST_APPLY_MODAL_EDIT_MINECRAFT_NAME", interaction.user.id);
        subscriptionChangeMinecraftNameEvent.subscription(async (client, modal: ModalSubmitInteraction) => {

            if (modal.user.id !== interaction.user.id) return;

            const applyUserData = this._applyUserData.get(modal.user.id);
            if (applyUserData !== undefined) {
                this._applyUserData.delete(modal.user.id);
                applyUserData.minecraftName = modal.getTextInputValue("MINECRAFT_NAME");
                this._applyUserData.set(modal.user.id, applyUserData);
                modal.update({ embeds: [this._applyUserContentEmbed(member, applyUserData.minecraftName)], components: [rowSelectMenu, rowButton] });
            }

        });

        const subscriptionApplyCancelEvent = new SubscriptionEvent("WHITELIST_APPLY_CANCEL", interaction.user.id);
        const subscriptionApplyConfirmEvent = new SubscriptionEvent("WHITELIST_APPLY_CONFIRM", interaction.user.id);

        // subscription WHITELIST_APPLY_CANCEL
        subscriptionApplyCancelEvent.subscription(async (client, inter: ButtonInteraction) => {

            if (inter.user.id !== interaction.user.id) return;

            // remove subscription event
            subscriptionEditMinecraftNameEvent.delete();
            subscriptionChangeMinecraftNameEvent.delete();
            subscriptionApplyConfirmEvent.delete();
            subscriptionApplyCancelEvent.delete();

            this._applyUserData.delete(inter.user.id);

            const embed = new MessageEmbed()
                .setColor("#2894FF")
                .setDescription("📣 你提出申請已取消。");

            inter.update({ embeds: [embed], components: [] });
        });

        // subscription WHITELIST_APPLY_CONFIRM
        subscriptionApplyConfirmEvent.subscription(async (client, inter: ButtonInteraction) => {

            if (inter.user.id !== interaction.user.id) return;

            const applyUserData = this._applyUserData.get(inter.user.id);
            if (applyUserData === undefined) throw new Error("ApplyUserData not null.");
            const minecraftName = applyUserData.minecraftName;

            if (minecraftName === null) {
                inter.update({ content: "⚠ Minecraft 用戶名不能空白", embeds: [this._applyUserContentEmbed(member, null)], components: [rowSelectMenu, rowButton] });
                return;
            }

            // remove subscription event
            subscriptionEditMinecraftNameEvent.delete();
            subscriptionChangeMinecraftNameEvent.delete();
            subscriptionApplyConfirmEvent.delete();

            const embed = new MessageEmbed()
                .setColor("#2894FF")
                .setDescription("📣 你提出申請已確認，等待Bot私訊通知。\n(請你確認你有沒有打開允許伺服器成員傳送私人訊息，否則Bot無法傳送通知)");

            await inter.update({ content: null, embeds: [embed], components: [] });

            // verify
            const verify = await this._verify(client, minecraftName, inter.user.id);
            this._applyUserData.delete(inter.user.id);

            if (verify.verifyState === VerifyReturnEnum.serverEconnrefused) {
                const embed = Embeds.apiServerOfflineEmbed();
                interaction.editReply({ embeds: [embed] });
                return;
            }

            if (verify.verifyState === VerifyReturnEnum.error) {
                const embed = new MessageEmbed()
                    .setDescription("很抱歉我們Bot出現了問題，請稍後再嘗試。\n如果你在遇到問題，請聯繫我 <@177388464948510720> 伺服器架設者。")
                    .setColor("#2894FF");
                interaction.editReply({ embeds: [embed] });
                return;
            }

            if (verify.verifyState === VerifyReturnEnum.success) {
                const embed = new MessageEmbed()
                    .setTitle(`🎉 嗨! 你好玩家 ${member.user.username} 恭喜你通過白名單審核 🎉`)
                    .setFooter({
                        text: "MCKISMETLAB 無名伺服器 | 模組生存 ⚔ 冒險前進",
                        iconURL: client.user?.avatarURL() as string
                    })
                    .setColor("#7289DA")
                    .addFields(
                        {
                            name: "📢 通過審核歡迎語:",
                            value: "感謝你加入我們伺服器! 你能使用 mckismetlab.net 位址進來伺服器了窩。本伺服器第一次自架公開伺服器，有問題請見諒。"
                        },
                        {
                            name: "🔗 伺服器官網:",
                            value: "[點擊前往 -> 無名伺服器官網](https://mckismetlab.net/)"
                        },
                        {
                            name: "💻 伺服器 IP:",
                            value: "mckismetlab.net"
                        }
                    )
                interaction.user.send({ embeds: [embed] })
                    .catch(() => this._logger.warn(`Bot無法發送該用戶DM - ${interaction.user.tag}`));

                try {

                    const allServerWhitelist = await ApiService.getAllServerWhitelist();
                    if (allServerWhitelist !== null) {
                        if (allServerWhitelist.length >= this._whitelistNumber) {
                            this._store.setWhitelistApplyState(false);
                            this._store.save();
                        }
                    }

                } catch (error: any) {
                    this._logger.warn("出現了問題未判斷白名單人數");
                }

                this.updateApplyEmbed();
            }

            if (verify.verifyState === VerifyReturnEnum.minecraftNameUnknown) {
                const embed = new MessageEmbed()
                    .setTitle("⚠ 你提出申請白名單，申請失敗! ⚠")
                    .setFooter({
                        text: "MCKISMETLAB 無名伺服器 | 模組生存 ⚔ 冒險前進",
                        iconURL: client.user?.avatarURL() as string
                    })
                    .setColor("#FF0000")
                    .addFields(
                        {
                            name: "⁉ 失敗原因:",
                            value: "你的 Minecraft Name 驗證沒過。"
                        },
                        {
                            name: "📣 如果你在遇到問題:",
                            value: "請聯繫我 <@177388464948510720> 伺服器架設者。"
                        }
                    )
                interaction.user.send({ embeds: [embed] })
                    .catch(() => this._logger.warn(`Bot無法發送該用戶DM - ${interaction.user.tag}`));
            }

            // TODO: VerifyReturnEnum.violation

            this._discordLogNotice(client, verify.verifyState, minecraftName, verify.minecraftUuid, inter);
        });
    }

    private static async _verify(client: Client, minecraftName: string, discordUserId: string): Promise<{ verifyState: VerifyReturnEnum, minecraftUuid: string | null }> {
        try {

            // 驗證是否是正版 minecraft name OR 有效的 minecraft name
            const minecraftProfilesUser = await MojangApi.validateSpieler(minecraftName);

            // 檢查用戶是否在 discord
            const discordUser = client.users.cache.get(discordUserId);

            if (minecraftProfilesUser === null && discordUser === null) {
                return {
                    verifyState: VerifyReturnEnum.minecraftNameAndDiscordUserUnknown,
                    minecraftUuid: null
                };
            }

            if (minecraftProfilesUser === null) {
                return {
                    verifyState: VerifyReturnEnum.minecraftNameUnknown,
                    minecraftUuid: null
                };
            }

            if (discordUser === null) {
                return {
                    verifyState: VerifyReturnEnum.discordUserUnknown,
                    minecraftUuid: minecraftProfilesUser.id
                };
            }

            // 檢查用戶是否在違規 violation 資料庫
            const violationDiscord = await ApiService.getViolation(discordUserId);
            const violationMinecraft = await ApiService.getViolation(minecraftProfilesUser.id);

            // 檢查是否有違規記錄
            if (violationDiscord !== null || violationMinecraft !== null) {
                return {
                    verifyState: VerifyReturnEnum.violation,
                    minecraftUuid: minecraftProfilesUser.id
                };
            }

            // 通過判斷，執行以下 code

            await ApiService.createUserLink(minecraftProfilesUser.id, discordUserId);
            await ApiService.createServerWhitelist({
                minecraft_uuid: minecraftProfilesUser.id,
                server_id: this._applyUserData.get(discordUserId)?.serverId
            });

            const guild = client.guilds.cache.get(environment.guilds_id);
            if (guild === undefined) throw new Error("Guild not null.");
            const member = guild.members.cache.get(discordUserId);
            if (member === undefined) throw new Error("Member not null.");
            const roleWhitelist = guild.roles.cache.get(environment.roleWhitelist.roleId);
            if (roleWhitelist === undefined) throw new Error("RoleWhitelist not null.");

            // discord user add whitelist role
            await member.roles.add(roleWhitelist);

            return {
                verifyState: VerifyReturnEnum.success,
                minecraftUuid: minecraftProfilesUser.id
            };

        } catch (error: any) {

            if (error.error === "server_econnrefused") {
                return {
                    verifyState: VerifyReturnEnum.serverEconnrefused,
                    minecraftUuid: null
                };
            }

            this._logger.error(error);
            return {
                verifyState: VerifyReturnEnum.error,
                minecraftUuid: null
            };
        }
    }

    private static _discordLogNotice(client: Client, verifyState: VerifyReturnEnum, minecraftName: string, minecraftUuid: string | null, interaction: MessageComponentInteraction) {

        let autoAuditResults: "審核取消" | "通過" | "不通過" | null = null;
        let description: string | null = null;
        let color: "#0779E8" | "#FEB63F" | "#FF4F42" | "#7289DA" = "#7289DA";

        if (verifyState === VerifyReturnEnum.success) {
            autoAuditResults = "通過";
            color = "#0779E8";
        }

        if (verifyState === VerifyReturnEnum.minecraftNameUnknown) {
            autoAuditResults = "審核取消";
            description = "Minecraft Name 驗證沒過"
            color = "#FF4F42";
        }

        const embed = new MessageEmbed()
            .setTitle(`**審核系統 (BETA) 自動審核: ${autoAuditResults}**`)
            .setColor(color)
            .addFields(
                {
                    name: "Minecraft 名稱",
                    value: minecraftName
                },
                {
                    name: "Minecraft UUID",
                    value: minecraftUuid !== null ? minecraftUuid : "無"
                },
                {
                    name: "Discord 名稱",
                    value: interaction.user.tag
                },
                {
                    name: "Discord ID",
                    value: interaction.user.id
                },
                {
                    name: "描述:",
                    value: description !== null ? description : "無"
                });

        const channel = client.channels.cache.get(environment.verifyDiscordNoticeChannelId) as TextChannel;
        channel.send({ embeds: [embed] });
    }

    public static _applyUserContentEmbed(member: GuildMember, minecraftPlayerName: string | null) {

        const embed = new MessageEmbed()
            .setTitle(`📝  申請伺服器白名單 (BOT) 申請內容`)
            // .setDescription("")
            .setFields(
                {
                    name: "Minecraft 用戶名",
                    value: minecraftPlayerName !== null ? minecraftPlayerName : "請先新增你的 Minecraft 用戶名",
                    inline: true
                },
                {
                    name: "Discord 用戶名",
                    value: member.user.username,
                    inline: true
                },
                { // TODO:
                    name: "申請伺服器",
                    value: "主服模組伺服器",
                    inline: true
                }
            )

        return embed;
    }
}