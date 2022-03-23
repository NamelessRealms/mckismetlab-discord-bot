import { IManualVerifyUser } from "../interface/IManualVerifyUser";
import { IUserLink } from "../interface/IUserLink";

import ISponsorUser from "../interface/ISponsorUser";
import ITpmeVerifyWhitelistUser from "../interface/ITpmeVerifyWhitelistUser";
import IVerifyUser from "../interface/IVerifyUser";
import IViolationUser from "../interface/IViolationUser";
import IWhitelistUser from "../interface/IWhitelistUser";
import axios from "./axiosApi";

export default class ApiServiceAxios {

    private static _token: string | undefined;
    private static _apiUrl = process.env.API_SERVICE_URL;

    public static login(): Promise<string> {
        return new Promise(async (resolve, reject) => {

            const response = await axios.post(this._apiUrl + "/oauth2/token", {
                grant_type: process.env.API_GRANT_TYPE,
                username: process.env.API_USERNAME,
                password: process.env.API_PASSWORD
            });

            const token = response.data.access_token;

            this._token = token;
            // expiresIn = moment(new Date(response.data.expires_in)).format();

            return resolve(token);
        });
    }

    public static getAllUserLink(): Promise<{ data: Array<IUserLink>, status: number }> {
        return new Promise(async (resolve, reject) => {

            const response = await axios({
                method: "GET",
                url: this._apiUrl + "/user/userLink"
            });

            if (response.status === 200) {
                return resolve({
                    data: response.data,
                    status: response.status
                });
            } else {
                return reject();
            }
        });
    }

    public static getUserLink(id: string): Promise<{ data: IUserLink, status: number }> {
        return new Promise(async (resolve, reject) => {

            const response = await axios({
                method: "GET",
                url: this._apiUrl + "/user/userLink/" + id
            });

            if (response.status !== 200 && response.status !== 204) {
                return reject();
            }

            return resolve({
                data: response.data,
                status: response.status
            });
        });
    }

    public static createUserLink(minecraft_uuid: string, discord_user_id: string): Promise<void> {
        return new Promise(async (resolve, reject) => {

            const response = await axios({
                method: "POST",
                url: this._apiUrl + "/user/userLink",
                headers: {
                    Authorization: this._token
                },
                data: {
                    minecraft_uuid: minecraft_uuid,
                    discord_id: discord_user_id
                }
            });

            if (response.status !== 201) {
                return reject();
            }

            resolve();
        });
    }

    public static getSponsorUser(uuid: string): Promise<{ data: ISponsorUser, status: number }> {
        return new Promise(async (resolve, reject) => {

            const response = await axios({
                method: "GET",
                url: this._apiUrl + "/sponsor/user/" + uuid
            });

            if (response.status !== 200 && response.status !== 204) {
                return reject();
            }

            return resolve({
                data: response.data,
                status: response.status
            });
        });
    }

    public static getAllSponsorUser(): Promise<{ data: Array<ISponsorUser>, status: number }> {
        return new Promise(async (resolve, reject) => {

            const response = await axios({
                method: "GET",
                url: this._apiUrl + "/sponsor/user"
            });

            if (response.status !== 200 && response.status !== 204) {
                return reject();
            }

            return resolve({
                data: response.data,
                status: response.status
            });
        });
    }

    public static updateSponsorUser(uuid: string, money: number): Promise<void> {
        return new Promise(async (resolve, reject) => {

            const response = await axios({
                method: "PATCH",
                url: this._apiUrl + "/sponsor/user/" + uuid,
                headers: {
                    Authorization: this._token
                },
                data: {
                    money: money
                }
            });

            if (response.status !== 201) {
                return reject();
            }

            resolve();
        });
    }

    public static createSponsorUser(uuid: string, money: number): Promise<void> {
        return new Promise(async (resolve, reject) => {

            const response = await axios({
                method: "POST",
                url: this._apiUrl + "/sponsor/user",
                headers: {
                    Authorization: this._token
                },
                data: {
                    minecraft_uuid: uuid,
                    money: money
                }
            });

            if (response.status !== 201) {
                return reject();
            }

            resolve();
        });
    }

    public static getWhitelistAwaitVerify(discordUserId: string): Promise<{ data: IVerifyUser, status: number }> {
        return new Promise(async (resolve, reject) => {

            const response = await axios({
                method: "GET",
                url: this._apiUrl + "/whitelist/awaitVerify/" + discordUserId
            });

            if (response.status !== 200 && response.status !== 204) {
                return reject();
            }

            return resolve({
                data: response.data,
                status: response.status
            });
        });
    }

    public static deleteWhitelistAwaitVerify(discordUserId: string): Promise<void> {
        return new Promise(async (resolve, reject) => {

            const response = await axios({
                method: "DELETE",
                url: this._apiUrl + "/whitelist/awaitVerify/" + discordUserId,
                headers: {
                    Authorization: this._token
                }
            });

            if (response.status !== 204) {
                return reject();
            }

            resolve();
        });
    }

    public static getWhitelistAllManualVerify(): Promise<{ data: Array<IManualVerifyUser>, status: number }> {
        return new Promise(async (resolve, reject) => {

            const response = await axios({
                method: "GET",
                url: this._apiUrl + "/whitelist/manualVerify"
            });

            if (response.status !== 200 && response.status !== 204) {
                return reject();
            }

            return resolve({
                data: response.data,
                status: response.status
            });
        });
    }

    public static getWhitelistManualVerifyDcId(discordUserId: string): Promise<{ data: IManualVerifyUser, status: number }> {
        return new Promise(async (resolve, reject) => {

            const response = await axios({
                method: "GET",
                url: this._apiUrl + "/whitelist/manualVerify/" + discordUserId
            });

            if (response.status !== 200 && response.status !== 204) {
                return reject();
            }

            return resolve({
                data: response.data,
                status: response.status
            });
        });
    }

    public static getWhitelistManualVerify(channelId: string, messageId: string): Promise<{ data: IManualVerifyUser, status: number }> {
        return new Promise(async (resolve, reject) => {

            const response = await axios({
                method: "GET",
                url: this._apiUrl + "/whitelist/manualVerify/" + channelId + "/" + messageId
            });

            if (response.status !== 200 && response.status !== 204) {
                return reject();
            }

            return resolve({
                data: response.data,
                status: response.status
            });
        });
    }

    public static createWhitelistManualVerify(body: any): Promise<void> {
        return new Promise(async (resolve, reject) => {

            const response = await axios({
                method: "POST",
                url: this._apiUrl + "/whitelist/manualVerify",
                headers: {
                    Authorization: this._token
                },
                data: body
            });

            if (response.status !== 201) {
                return reject();
            }

            resolve();
        });
    }

    public static deleteWhitelistManualVerify(channelId: string, messageId: string): Promise<void> {
        return new Promise(async (resolve, reject) => {

            const response = await axios({
                method: "DELETE",
                url: this._apiUrl + "/whitelist/manualVerify/" + channelId + "/" + messageId,
                headers: {
                    Authorization: this._token
                }
            });

            if (response.status !== 204) {
                return reject();
            }

            resolve();
        });
    }

    public static getServerWhitelist(uuid: string): Promise<{ data: IWhitelistUser, status: number }> {
        return new Promise(async (resolve, reject) => {

            const response = await axios({
                method: "GET",
                url: this._apiUrl + "/whitelist/serverWhitelist/" + uuid
            });

            if (response.status !== 200 && response.status !== 204) {
                return reject();
            }

            return resolve({
                data: response.data,
                status: response.status
            });
        });
    }

    public static getAllServerWhitelist(): Promise<{ data: Array<IWhitelistUser>, status: number }> {
        return new Promise(async (resolve, reject) => {

            const response = await axios({
                method: "GET",
                url: this._apiUrl + "/whitelist/serverWhitelist"
            });

            if (response.status !== 200 && response.status !== 204) {
                return reject();
            }

            return resolve({
                data: response.data,
                status: response.status
            });
        });
    }

    public static createServerWhitelist(body: any): Promise<void> {
        return new Promise(async (resolve, reject) => {

            const response = await axios({
                method: "POST",
                url: this._apiUrl + "/whitelist/serverWhitelist",
                headers: {
                    Authorization: this._token
                },
                data: body
            });

            if (response.status !== 201) {
                return reject();
            }

            resolve();
        });
    }

    public static deleteServerWhitelist(uudid: string): Promise<void> {
        return new Promise(async (resolve, reject) => {

            const response = await axios({
                method: "DELETE",
                url: this._apiUrl + "/whitelist/serverWhitelist/" + uudid,
                headers: {
                    Authorization: this._token
                }
            });

            if (response.status !== 204) {
                return reject();
            }

            resolve();
        });
    }

    public static getViolation(id: string): Promise<{ data: IViolationUser[], status: number }> {
        return new Promise(async (resolve, reject) => {

            const response = await axios({
                method: "GET",
                url: this._apiUrl + "/violation/user/" + id
            });

            if (response.status !== 200 && response.status !== 204) {
                return reject();
            }

            return resolve({
                data: response.data,
                status: response.status
            });
        });
    }

    public static createTpmeVerifyWhitelist(body: any): Promise<void> {
        return new Promise(async (resolve, reject) => {

            const response = await axios({
                method: "POST",
                url: this._apiUrl + "/whitelist/tpmeVerifyWhitelist",
                headers: {
                    Authorization: this._token
                },
                data: body
            });

            if (response.status !== 201) {
                return reject();
            }

            resolve();
        });
    }

    public static getTpmeVerifyWhitelist(): Promise<{ data: ITpmeVerifyWhitelistUser[], status: number }> {
        return new Promise(async (resolve, reject) => {

            const response = await axios({
                method: "GET",
                url: this._apiUrl + "/whitelist/tpmeVerifyWhitelist"
            });

            if (response.status !== 200 && response.status !== 204) {
                return reject();
            }

            return resolve({
                data: response.data,
                status: response.status
            });
        });
    }

    public static deleteTpmeVerifyWhitelist(discordUserId: string): Promise<void> {
        return new Promise(async (resolve, reject) => {

            const response = await axios({
                method: "DELETE",
                url: this._apiUrl + "/whitelist/tpmeVerifyWhitelist/" + discordUserId,
                headers: {
                    Authorization: this._token
                }
            });

            if (response.status !== 204) {
                return reject();
            }

            resolve();
        });
    }
}
