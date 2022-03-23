import { GuildMember, TextChannel } from "discord.js";
import { AppInteractions, Parametric } from "../slashCommands";

export interface ISlashCommand {

    name: string;
    description: string;
    everyoneUsePermission?: boolean;
    permissionType?: PermissionsType;
    requiredIdentityName?: string[];

    expectedArgs(): Array<Parametric>;
    callback(appInteractions: AppInteractions, channelObject: TextChannel, member: GuildMember, args: Array<any>): void;
}

export interface IAppCommandPermissions {
    id: string;
    type: PermissionsType;
    permission: boolean;
}

export interface ICommandOptionsArgs {
    name: string;
    description: string;
    type: number;
    required?: boolean;
    choices?: Array<{
        name: string;
        value: string | number;
    }>
}

export interface IRegisterDiscordAPICommandOptions {
    default_permission: boolean;
    commandOptions?: Array<ICommandOptionsArgs>;
}

export interface IOptions {
    guildId: string;
    token?: string;
    commandsDirPath: string;
}

export enum PermissionsType {
    Role = 1,
    User = 2
}

export enum CommandOptionsType {
    String = 3,
    Integer = 4,
    Boolean = 5,
    User = 6,
    channel = 7,
    roles = 8
}
