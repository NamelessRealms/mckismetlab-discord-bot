import got, { Got as IGot } from "got";
import LoggerUtil from "../utils/LoggerUtil";
import ApiService from "./ApiService";

export default class Got {

    private static _logger = new LoggerUtil("Got");
    private static _token = "";

    public static get auth(): IGot {

        const instance = got.extend({
            hooks: {
                beforeRequest: [
                    async (options) => {
                        options.headers["Authorization"] = this._token;
                    }
                ],
                afterResponse: [
                    
                    async (response, retryWithMergedOptions) => {

                        if(response.statusCode === 400 || response.statusCode === 401) {

                            this._logger.info("Token 過期!");

                            const token = await ApiService.login();

                            if(token === undefined) {
                                return response;
                            }

                            const updatedOptions = {
                                headers: {
                                    Authorization: token
                                }
                            };

                            this._token = token;

                            this._logger.info("Token 已更新!")

                            return retryWithMergedOptions(updatedOptions);
                        }
                        
                        return response;
                    }

                ]
            }
        });

        return instance;
    }
}