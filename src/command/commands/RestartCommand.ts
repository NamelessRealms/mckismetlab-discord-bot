import { SlashCommandStringOption, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder, ToAPIApplicationCommandOptions } from "@discordjs/builders";
import { CommandInteraction, CacheType, MessageEmbed, GuildMember } from "discord.js";
import ApiService from "../../api/ApiService";
import { environment } from "../../environment/Environment";
import LoggerUtil from "../../utils/LoggerUtil";
import WhitelistClear from "../../whitelist/WhitelistClear";
import SlashCommandBase from "../SlashCommandBase";

enum RestartTypeEnum {
    WHITELIST_MINECRAFT_SERVER = "whitelist_minecraft_server"
}

enum WhitelistMinecraftServerEnum {
    SERVER = "server"
}

export default class RestartCommand extends SlashCommandBase {

    private readonly _logger = new LoggerUtil("RestartCommand");
    public name: string = "restart";
    public description: string = "Restart Tools";
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
        // new SlashCommandSubcommandGroupBuilder()
        //     .setName("type")
        //     .setDescription("Select Restart Type")
        //     .addSubcommand(option =>
        //         option
        //             .setName(RestartTypeEnum.WHITELIST_MINECRAFT_SERVER)
        //             .setDescription("restart discord role link minecraft server whitelist")
        //             .addStringOption(option =>
        //                 option
        //                     .setName(WhitelistMinecraftServerEnum.SERVER)
        //                     .setDescription("Select Server")
        //                     .setRequired(true)
        //                     .addChoices(...environment.serverList)
        //             )
        //     )
        new SlashCommandSubcommandBuilder()
            .setName(RestartTypeEnum.WHITELIST_MINECRAFT_SERVER)
            .setDescription("restart discord role link minecraft server whitelist")
            .addStringOption(option =>
                option
                    .setName(WhitelistMinecraftServerEnum.SERVER)
                    .setDescription("Select Server")
                    .setRequired(true)
                    .addChoices(...environment.serverList)
            )
    ]

    public async execute(interaction: CommandInteraction<CacheType>): Promise<void> {

        const restartType = interaction.options.getSubcommand() as RestartTypeEnum | null;

        if (restartType === null) {
            this.replyError(interaction);
            return;
        }

        switch (restartType) {
            case RestartTypeEnum.WHITELIST_MINECRAFT_SERVER:
                this.restartDiscordRoleLinkMinecraftServerWhitelist(interaction);
                break;
            default:
                this.replyError(interaction);
        }
    }

    private replyError(interaction: CommandInteraction) {
        interaction.reply({
            content: "Run Error !!!",
            ephemeral: true
        });
    }

    private async restartDiscordRoleLinkMinecraftServerWhitelist(interaction: CommandInteraction) {

        const serverId = interaction.options.getString(WhitelistMinecraftServerEnum.SERVER);

        if (serverId === null) {
            this.replyError(interaction);
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        const serverWhitelist = await WhitelistClear.getServerWhitelist(serverId);

        // if(serverWhitelist === null) {
        //     interaction.editReply("Server whitelist not player.");
        //     return;
        // }

        const guild = interaction.guild;
        if (guild === null) { this.replyError(interaction); return; }
        const roles = await guild.roles.fetch(environment.roleWhitelist.roleId);
        if (roles === null) { this.replyError(interaction); return; }
        const discordWhitelistRoleUsers = Array.from(roles.members).map(member => member[1]);

        const roleWhitelist = guild.roles.cache.get(environment.roleWhitelist.roleId);
        if (roleWhitelist === undefined) { this.replyError(interaction); return; }

        for (let discordWhitelistRoleUser of discordWhitelistRoleUsers) {

            if (discordWhitelistRoleUser.user.bot) continue;

            const userLink = await ApiService.getUserLink(discordWhitelistRoleUser.user.id);

            if (userLink === null) continue;

            if (serverWhitelist !== null) {
                const findWhitelist = serverWhitelist.find(whitelist => whitelist.minecraft_uuid === userLink.minecraft_uuid);
                if (findWhitelist !== undefined) continue;
            }

            const member = guild.members.cache.get(userLink.discord_id);
            if (member === undefined) { this._logger.error(`Get user error. dcId: ${userLink.discord_id}`); continue; };

            await member.roles.remove(roleWhitelist)
                .then(() => {
                    this._logger.info(`Remove Role ok! dcId: ${userLink.discord_id}`);
                })
                .catch(() => {
                    this._logger.error(`Remove user role error. dcId: ${userLink.discord_id}`);
                });
        }

        const embed = new MessageEmbed()
            .setAuthor({
                name: "✅ Restart discord role link minecraft server whitelist ok!",
            });

        await interaction.editReply({ embeds: [embed] });
    }
}