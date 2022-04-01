import { ClientEvents, Client, GuildMember } from "discord.js";
import LoggerUtil from "../../utils/LoggerUtil";
import IEvent from "../IEvent";

export default class GuildMemberRemoveEvent implements IEvent<"guildMemberRemove"> {

    public event: keyof ClientEvents = "guildMemberRemove";

    private _logger = new LoggerUtil("GuildMemberRemoveEvent");
    
    public execute(client: Client, member: GuildMember): void {
        this._logger.info(`${member.user.username} 離開了 DISCORD!`);
    }
}