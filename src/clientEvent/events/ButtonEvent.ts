import { ClientEvents, Client, Interaction, CacheType, ButtonInteraction, MessageEmbed } from "discord.js";
import ApiService from "../../api/ApiService";
import MojangApi from "../../api/MojangApi";
import SubscriptionEvent from "../../subscription/SubscriptionEvent";
import Embeds from "../../utils/Embeds";
import Utils from "../../utils/Utils";
import WhitelistApply from "../../whitelist/WhitelistApply";
import IEvent from "../IEvent";

export default class ButtonEvent implements IEvent<"interactionCreate"> {

    public event: keyof ClientEvents = "interactionCreate";

    public execute(client: Client<boolean>, interaction: Interaction<CacheType>) {

        if (!interaction.isButton()) return;

        switch (interaction.customId) {
            case "WHITELIST_APPLY":
                WhitelistApply.apply(interaction);
                break;
            case "WAIT_WHITELIST_NOTICE":
                WhitelistApply.getWaitWhitelistNotices(interaction);
                break;
            case "WHITELIST_APPLY_CANCEL":
                SubscriptionEvent.emit("WHITELIST_APPLY_CANCEL", client, interaction);
                break;
            case "WHITELIST_APPLY_CONFIRM":
                SubscriptionEvent.emit("WHITELIST_APPLY_CONFIRM", client, interaction);
                break;
            case "WHITELIST_APPLY_EDIT_MINECRAFT_NAME":
                SubscriptionEvent.emit("WHITELIST_APPLY_EDIT_MINECRAFT_NAME", client, interaction);
                break;
            case "SEARCH_WHITELIST":
                this._showUserWhitelist(interaction);
                break;
            case "WHITELIST_CLEAR_CONFIRM":
                SubscriptionEvent.emit("WHITELIST_CLEAR_CONFIRM", client, interaction);
                break;
            case "WHITELIST_CLEAR_CANCEL":
                SubscriptionEvent.emit("WHITELIST_CLEAR_CANCEL", client, interaction);
                break;
            case "ERROR_USER_NICKNAME_CANCEL":
                SubscriptionEvent.emit("ERROR_USER_NICKNAME_CANCEL", client, interaction);
                break;
            case "ERROR_USER_NICKNAME_CONFIRM":
                SubscriptionEvent.emit("ERROR_USER_NICKNAME_CONFIRM", client, interaction);
                break;
            case "ADD_ERROR_USER_NICKNAME_BUTTON":
                SubscriptionEvent.emit("ADD_ERROR_USER_NICKNAME_BUTTON", client, interaction);
                break;
        }
    }

    private async _showUserWhitelist(interaction: ButtonInteraction) {

        await interaction.deferReply({ ephemeral: true });

        try {

            const userLink = await ApiService.getUserLink(interaction.user.id);

            if (userLink === null) {
                interaction.editReply({ content: "你的 Minecraft 帳號尚未與 Discord 帳號綁定，你無法查詢白名單。如果你遇到問題，請聯繫我 <@177388464948510720> 伺服器架設者。" });
                return;
            }

            // TODO:
            const userWhitelist = await ApiService.getServerWhitelist(userLink.minecraft_uuid);
            const playerName = await Utils.getPlayerName(userLink.minecraft_uuid);

            const embed = new MessageEmbed()
                .setColor("BLUE")
                .setAuthor({
                    name: `${playerName} 白名單: ${userWhitelist !== null ? "Yse" : "No"}`,
                    iconURL: `https://crafatar.com/renders/head/${userLink.minecraft_uuid}?overlay`
                });

            interaction.editReply({ embeds: [embed] });

        } catch (error: any) {

            if (error.error === "server_econnrefused") {
                const embed = Embeds.apiServerOfflineEmbed();
                interaction.editReply({ embeds: [embed] });
                return;
            }

            interaction.editReply({ embeds: [Embeds.botErrorEmbed()] })
        }

    }
}