import { SlashCommandStringOption, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder } from "@discordjs/builders";
import { CommandInteraction, CacheType, MessageEmbed } from "discord.js";
import { environment } from "../../environment/Environment";
import SocketIo from "../../socket/SocketIo";
import LoggerUtil from "../../utils/LoggerUtil";
import WhitelistApply from "../../whitelist/WhitelistApply";
import WhitelistClear from "../../whitelist/WhitelistClear";
import SlashCommandBase from "../SlashCommandBase";

export default class ServerCommandCommand extends SlashCommandBase {

    private _logger = new LoggerUtil("ServerCommandCommand");

    public name: string = "server";
    public description: string = "交互伺服器功能";
    public defaultPermission: boolean | undefined = false;
    public options = [
        new SlashCommandSubcommandBuilder()
            .setName("run")
            .setDescription("傳送指令至伺服器CMD")
            .addStringOption(option =>
                option
                    .setName("指令")
                    .setDescription("輸入指令(不要有斜線)")
                    .setRequired(true)
            ),
        new SlashCommandSubcommandGroupBuilder()
            .setName("whitelist")
            .setDescription("白名單")
            .addSubcommand(option =>
                option
                    .setName("clear")
                    .setDescription("清除未達指定遊玩時間的玩家")
                    .addStringOption(option =>
                        option
                            .setName("伺服器")
                            .setDescription("選擇伺服器")
                            .setRequired(true)
                            .addChoices(
                                {
                                    name: "主服模組包伺服器",
                                    value: "mckismetlab-main-server"
                                },
                                {
                                    name: "測試伺服器",
                                    value: "mckismetlab-test-server"
                                }
                            )
                    )
                    .addIntegerOption(option =>
                        option
                            .setName("時間")
                            .setDescription("小時為單位 (預設8小時)")
                            .setRequired(false)
                    )
            )
            .addSubcommand(option =>
                option
                    .setName("apply")
                    .setDescription("設定白名單接受狀態")
                    .addBooleanOption(option =>
                        option
                            .setName("接受狀態")
                            .setDescription("選擇 True or False")
                            .setRequired(true)
                    )
            )
    ];
    public permissions(): { id: string; type: "USER" | "ROLE"; permission: boolean; }[] {
        return [
            {
                id: environment.admin.roleId,
                type: "ROLE",
                permission: true
            }
        ]
    }

    public async execute(interaction: CommandInteraction<CacheType>): Promise<void> {

        switch (interaction.options.getSubcommand()) {
            case "run":
                this._runServerCommand(interaction);
                break;
            case "clear":
                this._clearWhitelist(interaction);
                break;
            case "apply":
                this._setWhitelistStatus(interaction);
                break;
        }

    }

    private async _runServerCommand(interaction: CommandInteraction<CacheType>) {

        if (environment.minecraftServerCommandRun.channelId !== interaction.channelId) {
            interaction.reply({
                content: `不允許在此頻道使用 ${"`"}/${interaction.commandName}${"`"}`,
                ephemeral: true
            });
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        try {

            const commandText = interaction.options.getString("指令");

            if (commandText === null) {
                throw new Error("commandText not null.");
            }

            const serverReplyText = await SocketIo.emitSocket<string>("COMMAND_RUN", "mckismetlab-main-server", commandText.replace("/", ""));

            if (serverReplyText.length !== 0 || !serverReplyText === null) {
                if (serverReplyText.length < 3999) {
                    interaction.editReply({ content: serverReplyText });
                } else {
                    interaction.editReply({ content: "指令執行成功 (但回傳的內容太長，無法看到執行結果)" });
                }
            } else {
                interaction.editReply({ content: "指令執行成功，沒有回傳內容。" });
            }

        } catch (error: any) {
            if (error.error === "socket-no-online") {
                interaction.editReply({ content: "伺服器未上線，請稍後再嘗試。" });
                return;
            }
            interaction.editReply({ content: "(Discord) 指令執行發生錯誤!" });
        }

    }

    private _setWhitelistStatus(interaction: CommandInteraction) {
        const state = interaction.options.getBoolean("接受狀態");
        if (state === null) throw new Error("State not null");
        WhitelistApply.setWhitelistStatus(state);
        interaction.reply({ content: `白名單接受狀態: ${state ? "Yse" : "No"}`, ephemeral: true });
    }

    private async _clearWhitelist(interaction: CommandInteraction<CacheType>) {
        try {

            const serverId = interaction.options.getString("伺服器");

            if (serverId === null) {
                throw new Error("serverId not null.");
            }

            if (!SocketIo.checkSocketConnection(serverId)) {
                const embed = new MessageEmbed()
                    .setTitle("指定的伺服器未上線，請等待伺服器上線後再嘗試。")
                    .setColor("#FF0000");
                interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }

            WhitelistClear.clear(interaction, serverId);

        } catch (error: any) {
            this._logger.error(error);
            interaction.reply({ content: "執行發生錯誤!" });
        }
    }
}