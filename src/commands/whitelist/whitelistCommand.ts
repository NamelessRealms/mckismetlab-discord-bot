import { PermissionsType } from "../../module/interface/ISlashCommand";
import { SlashCommandBaseTreeBase } from "../../module/slashCommands";
import ClearCommand from "./clearCommand";

export default class WhitelistCommand extends SlashCommandBaseTreeBase {

    public name: string = "whitelist";
    public description: string = "白名單系統指令";

    public everyoneUsePermission: boolean = false;
    public permissionType: PermissionsType = PermissionsType.Role;
    public requiredIdentityName: string[] = ["⚖ 管理員 // 伺服詢問人員"];

    constructor() {
        super();
        super.addSubCommand(new ClearCommand());
    }
}
