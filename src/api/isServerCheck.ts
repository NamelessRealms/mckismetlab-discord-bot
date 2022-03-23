import axios from "../api/axiosApi";

export function isServerCheck(): Promise<void> {
    return new Promise(async (resolve, reject) => {
        try {

            const response = await axios.get(process.env.API_SERVICE_URL + "/status");

            if (response.status === 200) {
                resolve();
            }

        } catch (error) {
            reject("Api 伺服器未上線! 退出執行!");
        }
    });
}
