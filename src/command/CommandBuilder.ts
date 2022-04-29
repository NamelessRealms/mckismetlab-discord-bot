import { REST } from "@discordjs/rest";
import { Client, CommandInteraction } from "discord.js";
import { Routes } from "discord-api-types/v9";
import LoggerUtil from "../utils/LoggerUtil";
import SlashCommandBase from "./SlashCommandBase";

export default class CommandBuilder {

    private _logger = new LoggerUtil("CommandBuilder");
    private _client: Client;
    private _guildId: string;

    constructor(client: Client, guildId: string) {
        this._client = client;
        this._guildId = guildId;
    }

    public async register(commands: Array<SlashCommandBase>): Promise<void> {

        if (this._client.token === null) {
            throw new Error("Bot not ready.");
        }

        if (this._client.user === null) {
            throw new Error("Bot client user not null.");
        }

        try {

            const rest = new REST({ version: '9' }).setToken(this._client.token);
            // register command
            const response = await rest.put(Routes.applicationGuildCommands(this._client.user.id, this._guildId), { body: commands });

            const permissions = new Array<{
                id: string,
                permissions: Array<{
                    id: string,
                    type: "USER" | "ROLE",
                    permission: boolean
                }>
            }>();

            commands.forEach(async (command) => {
                const findResponseCommand = (response as Array<{ name: string, id: string }>).find(item => item.name === command.name);
                if (findResponseCommand !== undefined) {
                    const commandPermissions = command.permissions();
                    if (commandPermissions.length > 0) {
                        permissions.push({
                            id: findResponseCommand.id,
                            permissions: commandPermissions
                        });
                    }
                }
            });

            // register command permission
            // await this._client.guilds.cache.get(this._guildId)?.commands.permissions.set({ fullPermissions: permissions });

            // const guild = this._client.guilds.cache.get(this._guildId);
            // if(guild !== undefined) {
            //     for(let permission of permissions) {
            //         const command = await guild.commands.fetch(permission.id);
            //         command.permissions.add({ permissions: permission.permissions });
            //     }
            // }

            // listener interactionCreate event
            this._client.on("interactionCreate", (interaction) => {
                if (!interaction.isCommand()) return;
                this._logger.info(`${interaction.user.tag} Run Command /${interaction.commandName}`);
                commands.forEach((command) => {
                    if (command.name === interaction.commandName) {
                        command.execute(interaction);
                        return;
                    }
                });
            });

            this._logger.info("Successfully registered application commands.");

        } catch (error) {
            this._logger.error(error);
        }
    }
}