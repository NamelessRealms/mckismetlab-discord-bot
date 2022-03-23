import { PermissionsType } from "../../module/interface/ISlashCommand";
import { SlashCommandBaseTreeBase } from "../../module/slashCommands";
import CreateCommand from "./createCommand";
import StatusCommand from "./statusCommand";

export default class Form extends SlashCommandBaseTreeBase {

    public name: string = "form";
    public description: string = "白名單表單";

    public everyoneUsePermission: boolean = false;
    public permissionType: PermissionsType = PermissionsType.Role;
    public requiredIdentityName: string[] = ["⚖ 管理員 // 伺服詢問人員"];

    constructor() {
        super();
        super.addSubCommand(new StatusCommand());
        super.addSubCommand(new CreateCommand());
    }
}
