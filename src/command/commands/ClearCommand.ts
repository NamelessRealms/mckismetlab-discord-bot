import { SlashCommandSubcommandGroupBuilder, ToAPIApplicationCommandOptions } from "@discordjs/builders";
import { Modal, ModalSubmitInteraction, showModal, TextInputComponent } from "discord-modals";
import { CommandInteraction, CacheType, GuildMember, MessageActionRow, MessageButton, ButtonInteraction, Client } from "discord.js";
import ApiService from "../../api/ApiService";
import { environment } from "../../environment/Environment";
import IWhitelistUser from "../../interface/IWhitelistUser";
import SubscriptionEvent from "../../subscription/SubscriptionEvent";
import Dates from "../../utils/Dates";
import Embeds from "../../utils/Embeds";
import Utils from "../../utils/Utils";
import SlashCommandBase from "../SlashCommandBase";

export default class ClearCommand extends SlashCommandBase {
    public name: string = "clear";
    public description: string = "清除指令";
    public defaultPermission: boolean | undefined = false;
    public permissions(): { id: string; type: "USER" | "ROLE"; permission: boolean; }[] {
        return [
            {
                id: environment.admin.roleId,
                type: "ROLE",
                permission: true
            }
        ]
    }

    public options = [
        new SlashCommandSubcommandGroupBuilder()
            .setName("user")
            .setDescription("Discord User")
            .addSubcommand(option =>
                option
                    .setName("errorname")
                    .setDescription("清除錯誤格式暱稱 (Beta)")
            )
    ]

    public execute(interaction: CommandInteraction<CacheType>): void {

        switch (interaction.options.getSubcommand()) {
            case "errorname":
                this._errorFormatNameUser(interaction);
                break;
        }

    }

    private async _errorFormatNameUser(interaction: CommandInteraction) {

        const nickNameRegex = /.+\s?-\s?[a-zA-Z0-9_]+/;
        // const nickNameRegex = /[a-zA-Z\u4e00-\u9fa5]+-\w+/;

        await interaction.deferReply({ ephemeral: true });

        if (!await Utils.checkApiServer()) {
            const embed = Embeds.apiServerOfflineEmbed();
            interaction.editReply({ embeds: [embed] });
            return;
        }

        const guild = interaction.guild;
        if (guild === null) {
            interaction.editReply({ content: "Not Guild." });
            return;
        }

        const collectionMembers = await guild.members.fetch();

        const originalUsers = new Array<GuildMember>();
        let kickUsers = new Array<{ member: GuildMember; uuid: string | null, text: string }>();

        for (let [id, member] of collectionMembers) {

            const adminRole = member.roles.cache.get(environment.admin.roleId);
            if(!member.user.bot && adminRole === undefined) originalUsers.push(member);

            let nickName: string | null = member.nickname !== null ? member.nickname : member.user.username;
            const nickNameMatch = nickName !== null ? nickName.match(nickNameRegex) : null;
            if(nickNameMatch !== null) nickName = nickNameMatch[0] === nickName ? nickNameMatch[0] : null;

            if (!member.user.bot && adminRole === undefined && nickName === null) {
                const userLink = await ApiService.getUserLink(member.user.id);
                let serverWhitelist: Array<IWhitelistUser> | null = null;
                if (userLink !== null) serverWhitelist = await ApiService.getServerWhitelist(userLink.minecraft_uuid);
                kickUsers.push({
                    member: member,
                    uuid: serverWhitelist !== null ? serverWhitelist[0].minecraft_uuid : null,
                    text: `nickName: ${member.nickname}, nameTag: ${member.user.tag}, userId: ${member.user.id}, whitelist: ${serverWhitelist !== null ? "Yse" : "No"}`
                });
            }
        }

        await interaction.editReply({ components: [this._getErrorNameButtonComponents()], files: [{ attachment: Buffer.from(this._getTextKickUsers(originalUsers, kickUsers)), name: "kickUsers.txt" }] });

        const subscriptionAddExceptionUserEvent = new SubscriptionEvent("ADD_ERROR_USER_MODAL_EDIT", interaction.user.id);
        subscriptionAddExceptionUserEvent.subscription((client: Client, modal: ModalSubmitInteraction) => {
            const discordUserId = modal.getTextInputValue("DISCORD_ID");
            kickUsers = kickUsers.filter((kickUser) => kickUser.member.user.id !== discordUserId);
            modal.update({ components: [this._getErrorNameButtonComponents()], files: [{ attachment: Buffer.from(this._getTextKickUsers(originalUsers, kickUsers)), name: "kickUsers.txt" }] });
        });

        // subscription button
        const subscriptionAddExceptionUserButtonEvent = new SubscriptionEvent("ADD_ERROR_USER_NICKNAME_BUTTON", interaction.user.id);
        const subscriptionErrorUserNameCancelEvent = new SubscriptionEvent("ERROR_USER_NICKNAME_CANCEL", interaction.user.id);
        const subscriptionErrorUserNameConfirmEvent = new SubscriptionEvent("ERROR_USER_NICKNAME_CONFIRM", interaction.user.id);

        subscriptionAddExceptionUserButtonEvent.subscription((client: Client, inter: ButtonInteraction) => {

            const modal = new Modal()
                .setCustomId("ADD_ERROR_USER_MODAL_EDIT")
                .setTitle("申請白名單")
                .addComponents(
                    new TextInputComponent()
                        .setCustomId("DISCORD_ID")
                        .setLabel("Discord User ID")
                        .setStyle("SHORT")
                        .setPlaceholder("請輸入 Discord User ID")
                        .setRequired(true)
                );

            showModal(modal, {
                client: client,
                interaction: inter
            });
        });

        subscriptionErrorUserNameCancelEvent.subscriptionOnce((client: Client, inter: ButtonInteraction) => {
            subscriptionErrorUserNameConfirmEvent.delete();
            subscriptionAddExceptionUserButtonEvent.delete();
            subscriptionErrorUserNameCancelEvent.delete();
            subscriptionAddExceptionUserEvent.delete();
            inter.update({ content: "❌ 取消踢出任務", components: [], files: [{ attachment: Buffer.from(this._getTextKickUsers(originalUsers, kickUsers)), name: "kickUsers.txt" }] });
        });

        subscriptionErrorUserNameConfirmEvent.subscriptionOnce(async (client: Client, inter: ButtonInteraction) => {

            subscriptionErrorUserNameCancelEvent.delete();
            subscriptionAddExceptionUserButtonEvent.delete();
            subscriptionErrorUserNameConfirmEvent.delete();
            subscriptionAddExceptionUserEvent.delete();

            const files: Array<{ attachment: Buffer, name: string }> = new Array();
            files.push({ attachment: Buffer.from(this._getTextKickUsers(originalUsers, kickUsers)), name: "kickUsers.txt" });

            await inter.update({ content: "⏱ 正在踢出用戶....", components: [this._getErrorNameButtonComponents(true)], files: files });

            const kickFailureTextUsers = new Array<string>();

            for (let kickUser of kickUsers) {
                if (kickUser.uuid !== null) await ApiService.deleteServerWhitelist(kickUser.uuid);
                await kickUser.member.kick().catch(() => {
                    kickFailureTextUsers.push(kickUser.text);
                });
            }

            if (kickFailureTextUsers.length > 0) {
                const text = `發生錯誤，請手動踢出\n\n${kickFailureTextUsers.join("\n")}`;
                files.push({ attachment: Buffer.from(text), name: "errorKickUsers.txt" });
            }

            await inter.editReply({ content: "👀 訊息已公開", components: [], files: [] });
            inter.channel?.send({ content: `📄 成功踢出 用戶: ${kickUsers.length - kickFailureTextUsers.length} | 失敗: ${kickFailureTextUsers.length}`, components: [], files: files });
        });
    }

    private _getTextKickUsers(originalUsers: Array<GuildMember>, kickUsers: Array<{ member: GuildMember; text: string }>) {
        return `${Dates.fullYearTime()}\n\n判斷人數: ${originalUsers.length}\n被踢出人數: ${kickUsers.length}\n\n被踢出的名單:\n\n${kickUsers.map((kickUser) => kickUser.text).join("\n")}`;
    }

    private _getErrorNameButtonComponents(disabled: boolean = false) {
        return new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId("ERROR_USER_NICKNAME_CONFIRM")
                    .setLabel("開始踢出")
                    .setStyle("SUCCESS")
                    .setDisabled(disabled),
                new MessageButton()
                    .setCustomId("ERROR_USER_NICKNAME_CANCEL")
                    .setLabel("取消踢出")
                    .setStyle("DANGER")
                    .setDisabled(disabled),
                new MessageButton()
                    .setCustomId("ADD_ERROR_USER_NICKNAME_BUTTON")
                    .setLabel("設定例外用戶")
                    .setStyle("SECONDARY")
                    .setDisabled(disabled)
            )
    }
}