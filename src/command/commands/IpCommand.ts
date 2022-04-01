import { CommandInteraction, CacheType, MessageEmbed } from "discord.js";
import SlashCommandBase from "../SlashCommandBase";

export default class IpCommand extends SlashCommandBase {
    public name: string = "ip";
    public description: string = "伺服器 IP 位址";
    public defaultPermission: boolean | undefined = true;
    public permissions(): { id: string; type: "USER" | "ROLE"; permission: boolean; }[] {
        return [];
    }
    public async execute(interaction: CommandInteraction<CacheType>): Promise<void> {

        const embed = new MessageEmbed()
            .setAuthor({ name: "伺服器IP: mckismetlab.net", iconURL: interaction.client.user?.avatarURL() as string })
            .setColor("#7289DA");

        interaction.reply({ embeds: [embed] });
    }

}