import axios from "../api/axiosApi";
import { IProfiles } from "../interface/IProfiles";
import BotMain from "../botMain";

const mojangUrl = "https://api.mojang.com/users/profiles";
const mojangPlayerNameUrl = "https://api.mojang.com/user/profiles";

export default class MojangApi {

    public static validateSpieler(playerName: string): Promise<IProfiles | undefined> {
        return new Promise(async (resolve, reject) => {
            try {

                const respone = await axios.get(mojangUrl + `/minecraft/${playerName}`);

                if (respone.status === 200) {
                    return resolve(respone.data)
                } else {
                    return resolve(undefined);
                }

            } catch (error) {
                BotMain.LOG.error(error);
            }
        });
    }

    public static getPlayerName(uuid: string): Promise<Array<{ name: string; changedToAt?: number; }> | undefined> {
        return new Promise(async (resolve, reject) => {
            try {

                const respone = await axios.get(mojangPlayerNameUrl + `/${uuid}/names`);

                if (respone.status === 200) {
                    return resolve(respone.data);
                } else {
                    return resolve(undefined);
                }

            } catch (error) {
                BotMain.LOG.error(error);
            }
        });
    }
}
