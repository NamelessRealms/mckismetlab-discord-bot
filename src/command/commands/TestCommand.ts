import { SlashCommandStringOption, SlashCommandNumberOption } from "@discordjs/builders";
import { CacheType, CommandInteraction } from "discord.js";
import SlashCommandBase from "../SlashCommandBase";

export default class TestCommand extends SlashCommandBase {

    public name: string = "test";

    public description: string = "test command";

    public options = [
        new SlashCommandStringOption()
            .setName("test1")
            .setDescription("test description")
            .setRequired(true),
        new SlashCommandNumberOption()
            .setName("number")
            .setDescription("number description")
    ];
    
    public defaultPermission: boolean | undefined = false;

    public permissions(): Array<{ id: string, type: "USER" | "ROLE", permission: boolean }> {
        return [
            {
                id: "642615488005799977",
                type: "ROLE",
                permission: true
            }
        ]
    }

    public async execute(interaction: CommandInteraction<CacheType>): Promise<void> {
        await interaction.reply("Ping.");
    }
}