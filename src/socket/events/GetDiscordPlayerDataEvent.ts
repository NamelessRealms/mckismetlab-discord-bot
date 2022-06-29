import { Client } from "discord.js";
import { Socket } from "socket.io-client";
import ApiService from "../../api/ApiService";
import { environment } from "../../environment/Environment";
import IEventType from "../interface/IEventType";
import ISockerEvent from "../ISockerEvent";

export default class GetDiscordPlayerDataEvent implements ISockerEvent<"GET_DISCORD_PLAYER_DATA"> {

    public event: keyof IEventType = "GET_DISCORD_PLAYER_DATA";

    public async execute(client: Client, socket: Socket, id: string) {

        const userLink = await ApiService.getUserLink(id);

        if (userLink === null) {
            socket.emit(this.event, { error: "account_not_binding", error_description: "玩家 Minecraft 帳號尚未與 Discord 帳號綁定" });
            return;
        }

        try {

            const guild = client.guilds.cache.get(environment.guilds_id);
            if(guild === undefined) throw new Error("guild not null.");
            const member = guild.members.cache.get(userLink.discord_id);
            if(member === undefined) throw new Error("member not null.");

            

        } catch (error) {
            socket.emit(this.event, { error: "discord_error", error_description: "Discord 內部發生錯誤" });
        }
    }
}