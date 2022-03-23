import { TextChannel, GuildMember } from "discord.js";
import { minecraftCommandHandler } from "../minecraft/minecraftCommandHandler";
import { CommandOptionsType, PermissionsType } from "../module/interface/ISlashCommand";
import { AppInteractions, Parametric, SlashCommandBase } from "../module/slashCommands";

export default class ServerCommand extends SlashCommandBase {

    public name: string = "server";
    public description: string = "伺服器指令發送";

    public everyoneUsePermission: boolean = false;
    public permissionType: PermissionsType = PermissionsType.Role;
    public requiredIdentityName: string[] = ["⚖ 管理員 // 伺服詢問人員"];

    public expectedArgs(): Array<Parametric> {

        const serverCommandArgs = new Parametric()
            .setName("指令")
            .setDescription("輸入指令(不要有斜線)")
            .setRequired(true)
            .setType(CommandOptionsType.String);

        return [serverCommandArgs];
    }

    public callback(appInteractions: AppInteractions, channelObject: TextChannel, member: GuildMember, args: any[]): void {

        appInteractions.defer();
        minecraftCommandHandler(appInteractions, channelObject, args[0]);

    }

}
