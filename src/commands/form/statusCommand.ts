import { GuildMember, TextChannel } from "discord.js";
import { CommandOptionsType } from "../../module/interface/ISlashCommand";
import { AppInteractions, Parametric, SlashCommandBase } from "../../module/slashCommands";

import * as fs from "fs-extra";
import { getDynamicConfigPath } from "../../utils/config";

export default class StatusCommand extends SlashCommandBase {

    public name: string = "status";
    public description: string = "更改表單狀態";

    public expectedArgs(): Array<Parametric> {

        const statusParameter = new Parametric()
            .setName("狀態")
            .setDescription("選擇表單狀態")
            .setRequired(true)
            .setType(CommandOptionsType.Boolean)

        return [statusParameter]
    }

    public callback(appInteractions: AppInteractions, channelObject: TextChannel, member: GuildMember, args: Array<any>): void {

        const dynamicConfigPath = getDynamicConfigPath();
        const dynamicConfigJson = fs.readJSONSync(dynamicConfigPath);

        dynamicConfigJson.googleForm.status = args[0];

        fs.writeFileSync(dynamicConfigPath, JSON.stringify(dynamicConfigJson, null, 2), "utf-8");

        appInteractions.callbackMessage(`設定白名單狀態: ${args[0] ? "開放" : "關閉"}`);
    }
}
