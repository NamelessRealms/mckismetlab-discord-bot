// import { BOT_VERSION } from "../Version";

export const environment = {
    version: process.env.BOT_VERSION,
    serverList: [
        {
            name: "主服模組包伺服器",
            value: "mckismetlab-main-server"
        },
        {
            name: "測試伺服器",
            value: "mckismetlab-test-server"
        }
    ]
}
