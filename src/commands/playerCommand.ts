import { GuildMember, MessageEmbed, TextChannel } from "discord.js";
import { CommandOptionsType } from "../module/interface/ISlashCommand";
import { AppInteractions, Parametric, SlashCommandBase } from "../module/slashCommands";

import { getSocketMap } from "../api/socketApi";
import { dates } from "../utils/dates";
import { IUserClearTime } from "../interface/IUserClearTime";
import ApiServiceAxios from "../api/apiServiceAxios";
import MojangApi from "../api/mojangApi";

export default class PlayerCommand extends SlashCommandBase {

    public name: string = "player";
    public description: string = "查詢玩家資料";

    public expectedArgs(): Array<Parametric> {

        const autoClear = new Parametric()
            .setName("自動刪除訊息")
            .setDescription("30 秒後自動刪除訊息(預設自動刪除)")
            .setRequired(false)
            .setType(CommandOptionsType.Boolean)

        return [autoClear];
    }

    public async callback(appInteractions: AppInteractions, channelObject: TextChannel, member: GuildMember, args: Array<any>): Promise<void> {

        // const playerBind = (await axios.get(BotMain.CONFIG_DATA.apiServiceURL + `/userLink/${member.user.id}`)).data as IUserLink[];
        const playerBindResponse = await ApiServiceAxios.getUserLink(member.user.id);

        if (playerBindResponse.status === 204) {
            (await appInteractions.reply(member, "你的 Minecraft 帳號尚未綁定 Discord，無法使用玩家查詢資料功能。有任何問題歡迎回報給我 <@177388464948510720>")).delete(20000); // 20s
            return;
        }

        const socket = getSocketMap("mckismetlab-main-server");

        if (socket === undefined) {
            (await appInteractions.reply(member, "很抱歉我們玩家查詢資料系統未上線，請稍後再嘗試。")).delete(10000) // 10s
            return;
        }

        appInteractions.defer();

        // const userWhlistlist = (await axios.get(BotMain.CONFIG_DATA.apiServiceURL + `/serverWhitelist/${playerBind[0].minecraft_uuid}`)).data as IWhitelistUser[];
        const userWhlistlistResponse = await ApiServiceAxios.getServerWhitelist(playerBindResponse.data.minecraft_uuid);
        const playerData = await MojangApi.getPlayerName(playerBindResponse.data.minecraft_uuid);

        let playerName: string;

        if (playerData !== undefined) {
            playerName = playerData.pop()?.name as string;
        }

        const resPlayerTime = async (playerTime: Array<IUserClearTime>) => {

            socket.off("getPlayerTime", resPlayerTime);

            const userNickName = member.nickname !== null ? member.nickname : member.user.username;

            let embed = new MessageEmbed()
                .setTitle(`🎮 ${playerName} 玩家資料`)
                .setAuthor(userNickName, member.user.avatarURL() as string)
                .setThumbnail(`https://crafatar.com/renders/body/${playerBindResponse.data.minecraft_uuid}?overlay`)
                .setFooter(`MCKISMETLAB 無名伺服器 | 模組生存 ⚔ 冒險前進 | ${new dates().time()}`, channelObject.client.user?.avatarURL() as string)
                .setColor("RANDOM")
                .addFields(
                    {
                        name: "📋 白名單",
                        value: userWhlistlistResponse.status === 204 ? "▫ 沒在白名單內\n▫ 請自行去申請" : "▫ 有在白名單內\n▫ 可進行遊玩",
                        inline: true
                    },
                    {
                        name: "⏰ 遊玩時間:",
                        value: `▫ ${playerTime[0].hours.split(":")[0]} 時 ${playerTime[0].hours.split(":")[1]} 分 ${playerTime[0].hours.split(":")[2]} 秒`,
                        inline: true
                    }
                );

            if (args.length > 0) {
                if (!args[0]) {
                    (await appInteractions.deferUpdateMessage(embed));
                    return;
                }
            }

            (await appInteractions.deferUpdateMessage(embed)).delete(30000);
        };

        socket.on("getPlayerTime", resPlayerTime);

        socket.emit("task", {
            type: "getPlayerTime",
            players: [
                {
                    minecraft_uuid: playerBindResponse.data.minecraft_uuid
                }
            ]
        });
    }
}
