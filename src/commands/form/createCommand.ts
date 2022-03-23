import { GuildMember, TextChannel } from "discord.js";
import { CommandOptionsType } from "../../module/interface/ISlashCommand";
import { AppInteractions, Parametric, SlashCommandBase } from "../../module/slashCommands";
import GoogleFormHandler from "../../whitelist/googleFormHandler";

export default class CreateCommand extends SlashCommandBase {

    public name: string = "create";
    public description: string = "創建表單申請按鈕";

    public expectedArgs(): Array<Parametric> {

        const channelIdParameters = new Parametric()
            .setName("頻道")
            .setDescription("想要傳送的頻道 @channel")
            .setRequired(true)
            .setType(CommandOptionsType.channel);

        return [channelIdParameters];
    }

    public async callback(appInteractions: AppInteractions, channelObject: TextChannel, member: GuildMember, args: Array<any>): Promise<void> {

        const channel = await channelObject.client.channels.fetch(args[0]);
        GoogleFormHandler.createFormButtonMessage(channel as TextChannel);
        appInteractions.callbackMessage("已成功創建表單申請按鈕");
    }
}
