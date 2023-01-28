import got from "got";
import MojangApi from "../api/MojangApi";
import LoggerUtil from "./LoggerUtil";

export default class Utils {

    private static readonly _logger = new LoggerUtil("Utils");

    public static async checkApiServer(): Promise<boolean> {
        try {
            const response = await got.get(process.env.API_SERVICE_URL + "/status");
            return response.statusCode === 200;
        } catch (error) {
            this._logger.error(error);
            return false;
        }
    }

    public static async getPlayerName(uuid: string): Promise<string | null> {
        // const playerNames = await MojangApi.getPlayerName(uuid);
        // return playerNames !== null ? playerNames[playerNames.length - 1] !== undefined ? playerNames.pop()?.name as string : null : null;
        return await MojangApi.getPlayerName(uuid);
    }
}