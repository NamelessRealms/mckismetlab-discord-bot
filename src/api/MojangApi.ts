import IProfiles from "../interface/IProfiles";
import got from "got";

const mojangUrl = "https://api.mojang.com/users/profiles";
const mojangPlayerNameUrl = "https://api.mojang.com/user/profiles";

export default class MojangApi {

    public static async validateSpieler(playerName: string): Promise<IProfiles | null> {

        const response = await got.get<IProfiles>(mojangUrl + `/minecraft/${playerName}`, {
            responseType: "json"
        });

        if (response.statusCode === 200) {
            return response.body;
        }

        return null;
    }

    /**
     * (已廢除) https://help.minecraft.net/hc/en-us/articles/8969841895693-Username-History-API-Removal-FAQ-
     * @param uuid minecraft player uuid
     * @returns minecraft player name
     */
    public static async getPlayerName(uuid: string): Promise<Array<{ name: string; changedToAt?: number; }> | null> {

        // const response = await got.get<Array<{ name: string; changedToAt?: number; }>>(mojangPlayerNameUrl + `/${uuid}/names`, {
        //     responseType: "json"
        // });

        // if (response.statusCode === 200) {
        //     return response.body;
        // }

        // return null;

        return [{ name: "無法顯示玩家ID", changedToAt: 0 }];
    }
}
