import { CommandInteraction, CacheType, MessageEmbed } from "discord.js";
import { environment } from "../../environment/Environment";
import SlashCommandBase from "../SlashCommandBase";

export default class InfoCommand extends SlashCommandBase {
    public name: string = "info";
    public description: string = "BOT Info";
    public defaultPermission: boolean | undefined = true;
    public permissions(): { id: string; type: "USER" | "ROLE"; permission: boolean; }[] {
        return [];
    }
    public async execute(interaction: CommandInteraction<CacheType>): Promise<void> {

        const embed = new MessageEmbed()
            .setTitle("mcKismetLab Bot Info")
            .setColor("#7289DA")
            .addFields([
                {
                    name: "Version",
                    value: environment.version,
                    inline: true
                },
                {
                    name: "Author",
                    value: "Quasi#4867",
                    inline: true
                }
            ]);

        interaction.reply({ embeds: [embed] });
    }

}