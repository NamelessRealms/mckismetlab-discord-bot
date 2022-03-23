import axios from "axios";
import BotMain from "../botMain";
import ApiServiceAxios from "./apiServiceAxios";

axios.interceptors.request.use((config) => {

    // 中文編碼
    // config.url = encodeURI(config.url as string);

    // config.headers = {
    //     "Content-Type": "application/json",
    //     "Authorization": token
    // };

    config.timeout = 20000;

    return config;

}, (error) => {
    return new Promise(async (resolve, reject) => {
        return reject(error);
    });
});

axios.interceptors.response.use((response) => {
    return response;
}, (error) => {
    return new Promise(async (resolve, reject) => {

        if (error && error.response) {
            switch (error.response.data.error) {
                case "invalid_grant":

                    BotMain.LOG.warn("[\x1b[36maxios\x1b[0m] Token 過期!");

                    /**
                    * login api service
                    * save token
                    */
                    const resToken = await ApiServiceAxios.login();

                    error.response.config.headers = {
                        "Authorization": resToken
                    }

                    BotMain.LOG.info("[\x1b[36maxios\x1b[0m] Token 已更新!");

                    return resolve(await axios(error.response.config));
            }
        }

        if (error.response === undefined) {
            return reject(error);
        }

    });
});

export default axios;
