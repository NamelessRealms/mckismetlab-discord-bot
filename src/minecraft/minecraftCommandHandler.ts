import { TextChannel } from "discord.js";
import { getSocketMap } from "../api/socketApi";
import { AppInteractions } from "../module/slashCommands";

import BotMain from "../botMain";

export function minecraftCommandHandler(appInteractions: AppInteractions, channelObject: TextChannel, command: string): void {

    if (BotMain.CONFIG_DATA.minecraftServerCommandRun.channelId !== channelObject.id) {
        appInteractions.deferUpdateMessage("不允許在此頻道使用 `/server`");
    }

    command = command.replace("/", "");

    const socket = getSocketMap("mckismetlab-main-server");

    if (socket !== undefined) {

        const listener = (command: string) => {

            appInteractions.deferUpdateMessage("指令傳送成功 => ...");

            if (command.length !== 0 || !command === null) {

                if (command.length < 3999) {
                    channelObject.send(command);
                } else {
                    channelObject.send("指令執行成功。(但回傳的內容太長，無法看到執行結果");
                }
            }

            socket.off("command", listener);
        };

        socket.on("command", listener);

        socket.emit("command", command);
    }
}
