import { TextChannel, GuildMember, MessageEmbed } from "discord.js";
import { isSocketOnline } from "../../api/socketApi";
import { CommandOptionsType } from "../../module/interface/ISlashCommand";
import { AppInteractions, Parametric, SlashCommandBase } from "../../module/slashCommands";
import ClearWhitelist from "../../whitelist/clearWhitelist";

interface IUserClear {
    minecraft_uuid: string;
}

export default class ClearCommand extends SlashCommandBase {

    public name: string = "clear";
    public description: string = "清除未達指定遊玩時間的玩家";

    public expectedArgs(): Array<Parametric> {

        const selectServerArg = new Parametric()
            .setName("伺服器")
            .setDescription("選擇伺服器")
            .setRequired(true)
            .setType(CommandOptionsType.String)
            .addChoices({
                name: "主服模組包伺服器",
                value: "mckismetlab-main-server"
            })
            .addChoices({
                name: "測試伺服器",
                value: "mckismetlab-test-server"
            });

        const timeHHArg = new Parametric()
            .setName("時間")
            .setDescription("小時為單位，預設8小時")
            .setRequired(false)
            .setType(CommandOptionsType.Integer);

        return [selectServerArg, timeHHArg];
    }

    public async callback(appInteractions: AppInteractions, channelObject: TextChannel, member: GuildMember, args: Array<any>): Promise<void> {

        const serverId = args[0];
        const timeHH = args[1];

        if (!isSocketOnline(serverId)) {

            let embad = new MessageEmbed()
                .setTitle("指定的伺服器未上線，請等待伺服器上線後再嘗試")
                .setColor("#FF0000");

            (await appInteractions.callbackMessage(embad)).delete(10000);

            return;
        }

        appInteractions.callbackMessage("白名單清除系統開始...(請你等待幾秒中)");

        ClearWhitelist.clear(channelObject, timeHH, serverId);
    }
}
