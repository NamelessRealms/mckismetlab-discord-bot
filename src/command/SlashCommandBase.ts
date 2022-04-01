import { SlashCommandBuilder } from "@discordjs/builders";
import { CacheType, Client, CommandInteraction } from "discord.js";

export default abstract class SlashCommandBase extends SlashCommandBuilder {

    public abstract name: string;
    public abstract description: string;

    public abstract defaultPermission: boolean | undefined;

    public abstract permissions(): Array<{ id: string, type: "USER" | "ROLE", permission: boolean }>

    public abstract execute(interaction: CommandInteraction): void;

}