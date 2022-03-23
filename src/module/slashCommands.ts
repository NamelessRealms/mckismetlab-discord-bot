import { APIMessage, Client, Guild, GuildMember, MessageEmbed, MessageTarget, TextChannel } from "discord.js";
import { CommandOptionsType, IAppCommandPermissions, ICommandOptionsArgs, IOptions, IRegisterDiscordAPICommandOptions, ISlashCommand, PermissionsType } from "./interface/ISlashCommand";
import BotMain from "../botMain";

import * as fs from "fs-extra";
import * as path from "path";

import got from "got";

export class SlashCommands {

    private _commands = new Map<string, SlashCommandBaseTreeBase | SlashCommandBase>();
    private _client: Client;
    private _guildId: string;
    private _token: string;
    private _commandsDirPath: string;
    private _discordAPIUrl: string = "https://discord.com/api/v9";

    private _loadCommandsArray = new Array<any>();

    /**
     * Creates an instance of slash commands.
     * @param {Client} client
     * @param {IOptions} options
     * @memberof SlashCommands
     */
    constructor(client: Client, options: IOptions) {

        if (options.guildId === undefined) {
            throw new Error("guildId not null.");
        }

        if (options.token === undefined) {
            throw new Error("token not null.");
        }

        if (options.commandsDirPath === undefined) {
            throw new Error("commandsDirPath not null.");
        }

        this._client = client;
        this._guildId = options.guildId;
        this._token = options.token;
        this._commandsDirPath = options.commandsDirPath;

        this._loadCommands();
        this._onCommand();
    }

    private async _loadCommands(): Promise<void> {

        let success = 0;
        let failure = 0;

        const guild = await this._client.guilds.fetch(this._guildId);
        const applicationsCommands: Array<any> = await this._getApplications().commands.get();
        const readDirs = fs.readdirSync(this._commandsDirPath);

        for (let readDir of readDirs) {

            const filePath = path.join(this._commandsDirPath, readDir);
            const isDir = fs.statSync(filePath).isDirectory();

            if (isDir) {

                const readdirDirFiles = fs.readdirSync(filePath);

                const findCommandTreeObject = (): SlashCommandBaseTreeBase | undefined => {
                    for (let readDirDirFile of readdirDirFiles) {
                        const commandRequire = require(`${filePath}/${readDirDirFile}`).default;
                        const commandClass = new commandRequire();

                        if (commandClass instanceof SlashCommandBaseTreeBase) {
                            return commandClass;
                        }
                    }
                }

                const commandTreeObject = findCommandTreeObject();
                if (commandTreeObject !== undefined) {

                    const treeSubCommands = commandTreeObject.getSubCommands();
                    const subCommandsJson = new Array<any>();

                    for (let treeSubCommand of treeSubCommands) {

                        if (treeSubCommand instanceof SlashCommandBase) {

                            const expectedArgsJson = this._expectedArgs(treeSubCommand);

                            subCommandsJson.push({
                                name: treeSubCommand.name,
                                description: treeSubCommand.description,
                                type: 1,
                                options: expectedArgsJson
                            });

                            BotMain.LOG.info(`[\x1b[36mload command\x1b[0m] Command success. /${commandTreeObject.name} ${treeSubCommand.name}`);

                            success++;
                        } else {
                            failure++;
                        }
                    }

                    const options = {
                        default_permission: commandTreeObject.everyoneUsePermission !== undefined ? commandTreeObject.everyoneUsePermission : true,
                        commandOptions: subCommandsJson
                    }

                    let discordAPICommandJson = undefined;
                    let permissionsJson = undefined;

                    // add command array
                    discordAPICommandJson = this._discordAPICommandJson(commandTreeObject.name, commandTreeObject.description, options);

                    if (commandTreeObject.requiredIdentityName !== undefined) {
                        permissionsJson = this._permissionsJson(commandTreeObject, guild);
                    }

                    this._loadCommandsArray.push({
                        commandJson: discordAPICommandJson,
                        permissionsJson: permissionsJson
                    });

                    // add commands map
                    this._commands.set(commandTreeObject.name, commandTreeObject);
                }

            } else {

                const commandRequire = require(`${this._commandsDirPath}/${readDir}`).default;
                const commandClass = new commandRequire();

                if (commandClass instanceof SlashCommandBase) {

                    const expectedArgsJson = this._expectedArgs(commandClass);
                    const options: IRegisterDiscordAPICommandOptions = {
                        default_permission: commandClass.everyoneUsePermission !== undefined ? commandClass.everyoneUsePermission : true,
                        commandOptions: expectedArgsJson.length > 0 ? expectedArgsJson : undefined
                    };

                    BotMain.LOG.info(`[\x1b[36mload command\x1b[0m] Command success. /${commandClass.name}`);

                    let discordAPICommandJson = undefined;
                    let permissionsJson = undefined;

                    // add command array
                    discordAPICommandJson = this._discordAPICommandJson(commandClass.name, commandClass.description, options);

                    if (commandClass.requiredIdentityName !== undefined) {
                        permissionsJson = this._permissionsJson(commandClass, guild);
                    }

                    this._loadCommandsArray.push({
                        commandJson: discordAPICommandJson,
                        permissionsJson: permissionsJson
                    });

                    // add commands map
                    this._commands.set(commandClass.name, commandClass);

                    success++;
                } else {
                    failure++;
                }
            }
        }

        // register discord api commands
        await this._registerDiscordAPICommands();

        // delete redundant app commands
        this._deleteRedundantAppCommands(applicationsCommands);

        BotMain.LOG.info(`[\x1b[36mload command\x1b[0m] Register ${success} Success, ${failure} Failure.`);
    }

    /**
     *
     *
     * @private
     * @memberof SlashCommands
     */
    private _onCommand(): void {

        (this._client as any).ws.on("INTERACTION_CREATE", async (interaction: any) => {

            if (interaction.type !== 2) {
                return;
            }

            const command = interaction.data.name.toLowerCase();
            let commandObject = this._commands.get(command);
            let options = new Array<{ value: any, type: number, name: string }>();

            if ("options" in interaction.data) {

                for (let option of interaction.data.options) {

                    if (option.type === 1) {

                        const subCommandName = option.name;
                        const subCommandObject = (commandObject as SlashCommandBaseTreeBase).getSubCommand(subCommandName);

                        if (subCommandObject !== undefined) {

                            commandObject = subCommandObject;

                            if ("options" in option) {
                                options = options.concat(option.options);
                            }

                        }

                    } else if (option.type === 3 || option.type === 4 || option.type === 5 || option.type === 6 || option.type === 7 || option.type === 8) {

                        options.push(option);

                    }

                }

            }

            if (commandObject !== undefined) {

                let args: Array<any> = new Array<any>();

                if (options) {
                    for (let option of options) {
                        const { value } = option;
                        args.push(value);
                    }
                }

                const channelId = interaction.channel_id;
                const channelObject = await this._client.channels.fetch(channelId) as TextChannel;
                const member = channelObject.members.get(interaction.member.user.id) as GuildMember;

                let appInteractionsOptions = {
                    discordAPIUrl: this._discordAPIUrl,
                    token: this._token,
                    interaction: interaction,
                }

                commandObject.callback(new AppInteractions(this._client, appInteractionsOptions), channelObject, member, args);
            }
        });

    }

    private _expectedArgs(commandClass: SlashCommandBase): Array<ICommandOptionsArgs> {

        const expectedArgsJson = new Array<ICommandOptionsArgs>();
        const expectedArgs = commandClass.expectedArgs();
        if (expectedArgs.length > 0) {
            for (let parametric of expectedArgs) {
                expectedArgsJson.push(parametric.getJson());
            }
        }

        return expectedArgsJson;
    }

    private _permissionsJson(commandClass: SlashCommandBase, guild: Guild): any {

        if (commandClass === undefined) {
            throw new Error("(method) permissions (parameter) commandClass not null.");
        }

        if ((commandClass.everyoneUsePermission !== undefined ? commandClass.everyoneUsePermission : true) === true) {
            throw new Error("(method) permissions (property) everyoneUsePermission must be false.");
        }

        if (commandClass.permissionType === undefined) {
            throw new Error("(method) permissions (property) permissionType not null.");
        }

        if (commandClass.requiredIdentityName === undefined) {
            throw new Error("(method) permissions (property) requiredIdentityName not null.");
        }

        if (commandClass.requiredIdentityName.length <= 0) {
            throw new Error("(method) permissions (property) requiredIdentityId not <= 0.");
        }

        const permissions = new Array<IAppCommandPermissions>();

        for (let requiredIdentityName of commandClass.requiredIdentityName) {

            const role = guild.roles.cache.find((role) => role.name === requiredIdentityName);

            if (role) {
                permissions.push({
                    id: role.id,
                    type: commandClass.permissionType,
                    permission: true
                });
            }
        }

        return { commandName: commandClass.name, permissions: permissions };
    }

    // private _registerDiscordAPICommandPermissions(commandId: string, permissions: Array<IAppCommandPermissions>): Promise<void> {
    //     return new Promise(async (resolve, reject) => {

    //         // axios
    //         // await axios({
    //         //     method: "PUT",
    //         //     url: `${this._discordAPIUrl}/applications/${this._client.user?.id}/guilds/${this._guildId}/commands/${commandId}/permissions`,
    //         //     headers: { Authorization: `Bot ${this._token}` },
    //         //     data: {
    //         //         permissions: permissions
    //         //     }
    //         // });

    //         // got
    //         const url = `${this._discordAPIUrl}/applications/${this._client.user?.id}/guilds/${this._guildId}/commands/${commandId}/permissions`;
    //         await got(url, {
    //             headers: { Authorization: `Bot ${this._token}` },
    //             method: "PUT",
    //             json: {
    //                 permissions: permissions
    //             }
    //         });

    //         resolve();
    //     });
    // }

    private _discordAPICommandJson(commandName: string, description: string, options: IRegisterDiscordAPICommandOptions): any {

        let data;

        if (options.commandOptions === undefined) {

            data = {
                name: commandName,
                description: description,
                default_permission: options.default_permission
            }

        } else {

            data = {
                name: commandName,
                description: description,
                default_permission: options.default_permission,
                options: options.commandOptions
            }

        }

        return data;
    }

    private _registerDiscordAPICommands(): Promise<void> {
        return new Promise(async (resolve, reject) => {

            const commands = new Array<any>();
            for (let loadCommand of this._loadCommandsArray) {
                commands.push(loadCommand.commandJson);
            }

            const response = await this._getApplications().commands.put({ data: commands });

            const commandPermissions = new Array<any>();
            for (let loadCommand of this._loadCommandsArray) {
                const permissionsJson = loadCommand.permissionsJson;
                if (permissionsJson !== undefined) {
                    const findCommand = response.find((command: any) => command.name === permissionsJson.commandName);
                    if (findCommand !== undefined) {
                        commandPermissions.push({
                            id: findCommand.id,
                            permissions: permissionsJson.permissions
                        });
                    }
                }
            }

            // TODO: 
            // const url = `${this._discordAPIUrl}/applications/${this._client.user?.id}/guilds/${this._guildId}/commands/permissions`;
            // await got(url, {
            //     headers: { Authorization: `Bot ${this._token}` },
            //     method: "PUT",
            //     json: commandPermissions
            // });

            resolve();
        });
    }

    private _deleteDiscordAPICommand(commandId: string): Promise<void> {
        return new Promise(async (resolve, reject) => {

            await this._getApplications().commands(commandId).delete();

            resolve();
        });
    }

    private _deleteRedundantAppCommands(appCommands: Array<any>): Promise<void> {
        return new Promise((resolve, reject) => {

            for (let appCommand of appCommands) {
                const isCommand = this._commands.get(appCommand.name);
                if (isCommand === undefined) {
                    this._deleteDiscordAPICommand(appCommand.id);
                }
            }

            resolve();
        });
    }

    private _getApplications() {
        return (this._client as any).api.applications(this._client.user?.id).guilds(this._guildId);
    }
}

/**
 *
 *
 * @export
 * @class AppInteractions
 */
export class AppInteractions {

    private _discordAPIUrl;
    private _token;
    private _client;
    private _interaction;

    constructor(client: Client, options: {
        discordAPIUrl: string,
        token: string,
        interaction: any,
    }) {
        this._client = client;
        this._discordAPIUrl = options.discordAPIUrl;
        this._token = options.token;
        this._interaction = options.interaction;
    }

    public async reply(member: GuildMember, response: string): Promise<AppInteractions> {

        let data: { content: string } = {
            content: `<@${member.user.id}>, ${response}`
        }

        this._getAppInteractionsCallback().post({
            data: {
                type: 4,
                data
            }
        });


        return this;
    }

    public async callbackMessage(response: string | MessageEmbed): Promise<AppInteractions> {

        let data: { content: string | MessageEmbed } | { files: object[] | null } = {
            content: response
        }

        // check for embeds
        if (typeof response === "object") {
            data = await this._createAPIMessage(response);
        }

        this._getAppInteractionsCallback().post({
            data: {
                type: 4,
                data
            }
        });

        return this;
    }

    public defer(): void {
        this._getAppInteractionsCallback().post({
            data: {
                type: 5
            }
        });
    }

    public async deferUpdateMessage(response: string | MessageEmbed): Promise<AppInteractions> {

        let data: { content: string | MessageEmbed } | { files: object[] | null } = {
            content: response
        }

        // check for embeds
        if (typeof response === "object") {
            data = await this._createAPIMessage(response);
        }

        // axios
        // await axios({
        //     method: "PATCH",
        //     url: `${this._discordAPIUrl}/webhooks/${this._client.user?.id}/${this._interaction.token}/messages/@original`,
        //     headers: { Authorization: `Bot ${this._token}` },
        //     data
        // });

        // got
        const url = `${this._discordAPIUrl}/webhooks/${this._client.user?.id}/${this._interaction.token}/messages/@original`;
        await got(url, {
            method: "PATCH",
            headers: { Authorization: `Bot ${this._token}` },
            json: data
        });

        return this;
    }

    public delete(timeout: number): void {

        setTimeout(async () => {

            // got
            const url = `${this._discordAPIUrl}/webhooks/${this._client.user?.id}/${this._interaction.token}/messages/@original`;
            await got(url, {
                method: "DELETE",
                headers: { Authorization: `Bot ${this._token}` }
            });

        }, timeout | 0);

    }

    private _getAppInteractionsCallback() {
        return (this._client as any).api.interactions(this._interaction.id, this._interaction.token).callback;
    }

    private async _createAPIMessage(content: any) {
        const { data, files } = await APIMessage.create(this._client.channels.resolve(this._interaction.channel_id) as MessageTarget, content).resolveData().resolveFiles();
        return { ...data, files };
    }
}

/**
 *
 *
 * @export
 * @class Parametric
 */
export class Parametric {

    private _name: string | undefined;
    private _description: string | undefined;
    private _type: CommandOptionsType | undefined;
    private _required: boolean | undefined;
    private _choices: Array<{ name: string, value: string | number }> = new Array<{ name: string, value: string | number }>();

    public setName(name: string): this {
        this._name = name;
        return this;
    }

    public setDescription(description: string): this {
        this._description = description;
        return this;
    }

    public setType(type: CommandOptionsType): this {
        this._type = type;
        return this;
    }

    public setRequired(required: boolean): this {
        this._required = required;
        return this;
    }

    public addChoices(choices: { name: string, value: string | number }): this {
        this._choices.push(choices);
        return this;
    }

    public getJson(): ICommandOptionsArgs {

        if (this._name === undefined) {
            throw new Error("name not null.");
        }

        if (this._description === undefined) {
            throw new Error("description not null.");
        }

        if (this._type === undefined) {
            throw new Error("type not null.");
        }

        if (this._required === undefined) {
            throw new Error("required not null.");
        }

        if (this._choices.length !== 0) {
            return {
                name: this._name,
                description: this._description,
                type: this._type,
                required: this._required,
                choices: this._choices
            }
        }

        return {
            name: this._name,
            description: this._description,
            type: this._type,
            required: this._required
        }
    }
}

/**
 *
 *
 * @export
 * @abstract
 * @class SlashCommandBase
 * @implements {ISlashCommand}
 */
export abstract class SlashCommandBase implements ISlashCommand {

    public abstract name: string;
    public abstract description: string;
    public everyoneUsePermission?: boolean | undefined;
    public permissionType?: PermissionsType | undefined;
    public requiredIdentityName?: string[] | undefined;

    public expectedArgs(): Parametric[] {
        return [];
    }

    public abstract callback(appInteractions: AppInteractions, channelObject: TextChannel, member: GuildMember, args: Array<any>): void;

}

/**
 *
 *
 * @export
 * @abstract
 * @class SlashCommandBaseTreeBase
 * @extends {SlashCommandBase}
 */
export abstract class SlashCommandBaseTreeBase extends SlashCommandBase {

    public abstract description: string;

    private _commandMap: Map<string, ISlashCommand> = new Map<string, ISlashCommand>();

    public callback(appInteractions: AppInteractions, channelObject: TextChannel, member: GuildMember, args: Array<any>): void {
        appInteractions.callbackMessage(`${this.name} command.`);
    }

    public addSubCommand(command: ISlashCommand): void {
        this._commandMap.set(command.name, command);
    }

    public getSubCommand(commandName: string): ISlashCommand | undefined {
        return this._commandMap.get(commandName);
    }

    public getSubCommands(): Array<ISlashCommand> {

        let array = new Array<ISlashCommand>();

        for (let [key, value] of this._commandMap) {
            array.push(value);
        }

        return array;
    }
}

