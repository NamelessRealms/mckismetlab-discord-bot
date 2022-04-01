import { IManualVerifyUser } from "../interface/IManualVerifyUser";
import { IUserLink } from "../interface/IUserLink";

import ISponsorUser from "../interface/ISponsorUser";
import ITempVerifyWhitelistUser from "../interface/ITpmeVerifyWhitelistUser";
import IVerifyUser from "../interface/IVerifyUser";
import IViolationUser from "../interface/IViolationUser";
import IWhitelistUser from "../interface/IWhitelistUser";

import got from "got";
import Got from "./Got";

export default class ApiService {

    private static _apiUrl = process.env.API_SERVICE_URL;

    public static async login(): Promise<string> {
        try {

            const response = await got.post<{ access_token: string }>(this._apiUrl + "/oauth2/token", {
                json: {
                    grant_type: process.env.API_GRANT_TYPE,
                    username: process.env.API_USERNAME,
                    password: process.env.API_PASSWORD
                },
                responseType: "json"
            });

            if (response.statusCode !== 200) {
                throw new Error("Login api server failure.");
            }

            return response.body.access_token;

        } catch (error: any) {
            throw new Error("Login api server failure.");
        }
    }

    public static async getAllUserLink(): Promise<Array<IUserLink> | null> {
        try {

            const response = await got.get<Array<IUserLink>>(this._apiUrl + "/user/userLink", { responseType: "json" });

            if (response.statusCode === 200) {
                return response.body;
            }

            if (response.statusCode === 204) {
                return null;
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };

        } catch (error: any) {

            if (error.code === "ECONNREFUSED") {
                throw {
                    error: "server_econnrefused",
                    error_description: "Request Server Econnrefused."
                };
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };
        }
    }

    public static async getUserLink(id: string): Promise<IUserLink | null> {
        try {

            const response = await got.get<IUserLink>(this._apiUrl + "/user/userLink/" + id, {
                responseType: "json"
            });

            if (response.statusCode === 200) {
                return response.body;
            }

            if (response.statusCode === 204) {
                return null;
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };

        } catch (error: any) {

            if (error.code === "ECONNREFUSED") {
                throw {
                    error: "server_econnrefused",
                    error_description: "Request Server Econnrefused."
                };
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };

        }
    }

    public static async createUserLink(minecraft_uuid: string, discord_user_id: string): Promise<void> {
        try {

            const response = await Got.auth.post(this._apiUrl + "/user/userLink", {
                json: {
                    minecraft_uuid: minecraft_uuid,
                    discord_id: discord_user_id
                }
            });

            if (response.statusCode !== 201 && response.statusCode !== 304) {
                throw {
                    error: "server_error",
                    error_description: "Request Server Error"
                };
            }

        } catch (error: any) {

            if (error.code === "ECONNREFUSED") {
                throw {
                    error: "server_econnrefused",
                    error_description: "Request Server Econnrefused."
                };
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };

        }
    }

    public static async getSponsorUser(uuid: string): Promise<ISponsorUser | null> {
        try {

            const response = await got.get<ISponsorUser>(this._apiUrl + "/sponsor/user/" + uuid, {
                responseType: "json"
            });

            if (response.statusCode === 200) {
                return response.body;
            }

            if (response.statusCode === 204) {
                return null;
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };

        } catch (error: any) {

            if (error.code === "ECONNREFUSED") {
                throw {
                    error: "server_econnrefused",
                    error_description: "Request Server Econnrefused."
                };
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };

        }
    }

    public static async getAllSponsorUser(): Promise<Array<ISponsorUser> | null> {
        try {

            const response = await got.get<Array<ISponsorUser>>(this._apiUrl + "/sponsor/user", {
                responseType: "json"
            });

            if (response.statusCode === 200) {
                return response.body;
            }

            if (response.statusCode === 204) {
                return null;
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };

        } catch (error: any) {

            if (error.code === "ECONNREFUSED") {
                throw {
                    error: "server_econnrefused",
                    error_description: "Request Server Econnrefused."
                };
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };

        }
    }

    public static async updateSponsorUser(uuid: string, money: number): Promise<void> {
        try {

            const response = await Got.auth.patch(this._apiUrl + "/sponsor/user/" + uuid, {
                json: {
                    money: money
                }
            });

            if (response.statusCode !== 201 && response.statusCode !== 304) {
                throw {
                    error: "server_error",
                    error_description: "Request Server Error"
                };
            }

        } catch (error: any) {

            if (error.code === "ECONNREFUSED") {
                throw {
                    error: "server_econnrefused",
                    error_description: "Request Server Econnrefused."
                };
            }

            const { response } = error;

            if (response.statusCode === 400) {
                throw {
                    error: "not_replace_data",
                    error_description: "There are no replaceable resources, please add them first."
                }
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };

        }
    }

    public static async createSponsorUser(uuid: string, money: number): Promise<void> {
        try {

            const response = await Got.auth.post(this._apiUrl + "/sponsor/user", {
                json: {
                    minecraft_uuid: uuid,
                    money: money
                }
            });

            if (response.statusCode !== 201 && response.statusCode !== 304) {
                throw {
                    error: "server_error",
                    error_description: "Request Server Error"
                };
            }

        } catch (error: any) {

            if (error.code === "ECONNREFUSED") {
                throw {
                    error: "server_econnrefused",
                    error_description: "Request Server Econnrefused."
                };
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };

        }
    }

    public static async getWhitelistAwaitVerify(discordUserId: string): Promise<IVerifyUser | null> {
        try {

            const response = await got.get<IVerifyUser>(this._apiUrl + "/whitelist/awaitVerify/" + discordUserId, {
                responseType: "json"
            });

            if (response.statusCode === 200) {
                return response.body;
            }

            if (response.statusCode === 204) {
                return null;
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };
        } catch (error: any) {

            if (error.code === "ECONNREFUSED") {
                throw {
                    error: "server_econnrefused",
                    error_description: "Request Server Econnrefused."
                };
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };

        }
    }

    public static async deleteWhitelistAwaitVerify(discordUserId: string): Promise<void> {
        try {

            const response = await Got.auth.delete(this._apiUrl + "/whitelist/awaitVerify/" + discordUserId);

            if (response.statusCode !== 204) {
                throw {
                    error: "server_error",
                    error_description: "Request Server Error"
                };
            }

        } catch (error: any) {

            if (error.code === "ECONNREFUSED") {
                throw {
                    error: "server_econnrefused",
                    error_description: "Request Server Econnrefused."
                };
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };

        }
    }

    public static async getWhitelistAllManualVerify(): Promise<Array<IManualVerifyUser> | null> {
        try {

            const response = await got.get<Array<IManualVerifyUser>>(this._apiUrl + "/whitelist/manualVerify", {
                responseType: "json"
            });

            if (response.statusCode === 200) {
                return response.body;
            }

            if (response.statusCode === 204) {
                return null;
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };

        } catch (error: any) {

            if (error.code === "ECONNREFUSED") {
                throw {
                    error: "server_econnrefused",
                    error_description: "Request Server Econnrefused."
                };
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };

        }
    }

    public static async getWhitelistManualVerifyDcId(discordUserId: string): Promise<IManualVerifyUser | null> {
        try {

            const response = await got.get<IManualVerifyUser>(this._apiUrl + "/whitelist/manualVerify/" + discordUserId, {
                responseType: "json"
            });

            if (response.statusCode === 200) {
                return response.body;
            }

            if (response.statusCode === 204) {
                return null;
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };

        } catch (error: any) {

            if (error.code === "ECONNREFUSED") {
                throw {
                    error: "server_econnrefused",
                    error_description: "Request Server Econnrefused."
                };
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };

        }
    }

    public static async getWhitelistManualVerify(channelId: string, messageId: string): Promise<IManualVerifyUser | null> {
        try {

            const response = await got.get<IManualVerifyUser>(this._apiUrl + "/whitelist/manualVerify/" + channelId + "/" + messageId, {
                responseType: "json"
            });

            if (response.statusCode === 200) {
                return response.body;
            }

            if (response.statusCode === 204) {
                return null;
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };

        } catch (error: any) {

            if (error.code === "ECONNREFUSED") {
                throw {
                    error: "server_econnrefused",
                    error_description: "Request Server Econnrefused."
                };
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };

        }
    }

    public static async createWhitelistManualVerify(body: any): Promise<void> {
        try {

            const response = await Got.auth.post(this._apiUrl + "/whitelist/manualVerify", {
                json: body
            });

            if (response.statusCode !== 201 && response.statusCode !== 304) {
                throw {
                    error: "server_error",
                    error_description: "Request Server Error"
                };
            }

        } catch (error: any) {

            if (error.code === "ECONNREFUSED") {
                throw {
                    error: "server_econnrefused",
                    error_description: "Request Server Econnrefused."
                };
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };

        }
    }

    public static async deleteWhitelistManualVerify(channelId: string, messageId: string): Promise<void> {
        try {

            const response = await Got.auth.delete(this._apiUrl + "/whitelist/manualVerify/" + channelId + "/" + messageId);

            if (response.statusCode !== 204) {
                throw {
                    error: "server_error",
                    error_description: "Request Server Error"
                };
            }

        } catch (error: any) {

            if (error.code === "ECONNREFUSED") {
                throw {
                    error: "server_econnrefused",
                    error_description: "Request Server Econnrefused."
                };
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };

        }
    }

    public static async getServerWhitelist(uuid: string): Promise<Array<IWhitelistUser> | null> {
        try {

            const response = await got.get<Array<IWhitelistUser>>(this._apiUrl + "/whitelist/serverWhitelist/" + uuid, {
                responseType: "json"
            });

            if (response.statusCode === 200) {
                return response.body;
            }

            if (response.statusCode === 204) {
                return null;
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };

        } catch (error: any) {

            if (error.code === "ECONNREFUSED") {
                throw {
                    error: "server_econnrefused",
                    error_description: "Request Server Econnrefused."
                };
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };

        }
    }

    public static async getAllServerWhitelist(): Promise<Array<IWhitelistUser> | null> {
        try {

            const response = await got.get<Array<IWhitelistUser>>(this._apiUrl + "/whitelist/serverWhitelist", {
                responseType: "json"
            });

            if (response.statusCode === 200) {
                return response.body;
            }

            if (response.statusCode === 204) {
                return null;
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };

        } catch (error: any) {

            if (error.code === "ECONNREFUSED") {
                throw {
                    error: "server_econnrefused",
                    error_description: "Request Server Econnrefused."
                };
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };

        }
    }

    public static async createServerWhitelist(body: any): Promise<void> {
        try {

            const response = await Got.auth.post(this._apiUrl + "/whitelist/serverWhitelist", {
                json: body
            });

            if (response.statusCode !== 201 && response.statusCode !== 304) {
                throw {
                    error: "server_error",
                    error_description: "Request Server Error"
                };
            }

        } catch (error: any) {

            if (error.code === "ECONNREFUSED") {
                throw {
                    error: "server_econnrefused",
                    error_description: "Request Server Econnrefused."
                };
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };

        }
    }

    public static async deleteServerWhitelist(uuid: string): Promise<void> {
        try {

            const response = await Got.auth.delete(this._apiUrl + "/whitelist/serverWhitelist/" + uuid);

            if (response.statusCode !== 204) {
                throw {
                    error: "server_error",
                    error_description: "Request Server Error"
                };
            }

        } catch (error: any) {

            if (error.code === "ECONNREFUSED") {
                throw {
                    error: "server_econnrefused",
                    error_description: "Request Server Econnrefused."
                };
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };

        }
    }

    public static async getViolation(id: string): Promise<Array<IViolationUser> | null> {
        try {

            const response = await got.get<Array<IViolationUser>>(this._apiUrl + "/violation/user/" + id);

            if (response.statusCode === 200) {
                return response.body;
            }

            if (response.statusCode === 204) {
                return null;
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };

        } catch (error: any) {

            if (error.code === "ECONNREFUSED") {
                throw {
                    error: "server_econnrefused",
                    error_description: "Request Server Econnrefused."
                };
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };

        }
    }

    public static async createTempVerifyWhitelist(body: any): Promise<void> {
        try {

            const response = await Got.auth.post(this._apiUrl + "/whitelist/tpmeVerifyWhitelist", {
                json: body
            });

            if (response.statusCode !== 201 && response.statusCode !== 304) {
                throw {
                    error: "server_error",
                    error_description: "Request Server Error"
                };
            }

        } catch (error: any) {

            if (error.code === "ECONNREFUSED") {
                throw {
                    error: "server_econnrefused",
                    error_description: "Request Server Econnrefused."
                };
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };

        }
    }

    public static async getAllTempVerifyWhitelist(): Promise<Array<ITempVerifyWhitelistUser> | null> {
        try {

            const response = await got.get<Array<ITempVerifyWhitelistUser>>(this._apiUrl + "/whitelist/tpmeVerifyWhitelist", {
                responseType: "json"
            });

            if (response.statusCode === 200) {
                return response.body;
            }

            if (response.statusCode === 204) {
                return null;
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };

        } catch (error: any) {

            if (error.code === "ECONNREFUSED") {
                throw {
                    error: "server_econnrefused",
                    error_description: "Request Server Econnrefused."
                };
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };

        }
    }

    public static async deleteTempVerifyWhitelist(discordUserId: string): Promise<void> {
        try {

            const response = await Got.auth.delete(this._apiUrl + "/whitelist/tpmeVerifyWhitelist/" + discordUserId);

            if (response.statusCode !== 204) {
                throw {
                    error: "server_error",
                    error_description: "Request Server Error"
                };
            }

        } catch (error: any) {

            if (error.code === "ECONNREFUSED") {
                throw {
                    error: "server_econnrefused",
                    error_description: "Request Server Econnrefused."
                };
            }

            throw {
                error: "server_error",
                error_description: "Request Server Error"
            };

        }
    }
}
