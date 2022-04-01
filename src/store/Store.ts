import * as path from "path";
import * as fs from "fs-extra";
import GlobalPath from "../GlobalPath";

interface IBotData {
    date: string;
    serverStatus: {
        channelId: string | null,
        messageId: string | null
    },
    whitelist: {
        apply: {
            messageId: string | null,
            state: boolean
        }
    }
}

export default class Store {

    private _botConfigPath = path.join(GlobalPath.botConfigDirPath(), "config.json");
    private _botConfigData: IBotData;

    constructor() {

        if(!fs.existsSync(GlobalPath.botConfigDirPath())) {
            fs.ensureDirSync(GlobalPath.botConfigDirPath());
        }

        if(!fs.existsSync(this._botConfigPath)) {
            fs.writeJsonSync(this._botConfigPath, {
                serverStatus: {
                    channelId: null,
                    messageId: null,
                },
                whitelist: {
                    apply: {
                        messageId: null,
                        state: false
                    }
                }
            }, "utf-8");
        }

        this._botConfigData = fs.readJSONSync(this._botConfigPath);
    }

    public save() {
        this._botConfigData.date = new Date().toLocaleString();
        fs.writeJSONSync(this._botConfigPath, this._botConfigData, "utf-8");
    }

    public getServerStatusChannelId() {
        return this._botConfigData.serverStatus.channelId;
    }

    public setServerStatusChannelId(channelId: string) {
        this._botConfigData.serverStatus.channelId = channelId;
    }

    public getServerStatusMessageId() {
        return this._botConfigData.serverStatus.messageId;
    }

    public setServerStatusMessageId(messageId: string) {
        this._botConfigData.serverStatus.messageId = messageId;
    }

    public getWhitelistApplyMessageId() {
        return this._botConfigData.whitelist.apply.messageId;
    }

    public setWhitelistApplyMessageId(messageId: string) {
        this._botConfigData.whitelist.apply.messageId = messageId
    }

    public getWhitelistApplyState() {
        return this._botConfigData.whitelist.apply.state;
    }

    public setWhitelistApplyState(state: boolean) {
        this._botConfigData.whitelist.apply.state = state
    }
}