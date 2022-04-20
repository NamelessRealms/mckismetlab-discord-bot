import { Client } from "discord.js";
import { Socket } from "socket.io";
import { environment } from "../../environment/Environment";
import ApiService from "../../api/ApiService";
import IEventType from "../interface/IEventType";
import ISockerEvent from "../ISockerEvent";

export default class UserBoostEvent implements ISockerEvent<"GET_USER_BOOST"> {

    public event: keyof IEventType = "GET_USER_BOOST";

    public async execute(client: Client, socket: Socket, serverId: string, userUuid: string): Promise<void> {
        try {

            const userLink = await ApiService.getUserLink(userUuid);

            if(userLink === null) {
                socket.emit("GET_USER_BOOST", false);
                return;
            }

            const guild = client.guilds.cache.get(environment.guilds_id);
            if(guild === undefined) throw new Error("Guild get id error.");
            const member = guild.members.cache.get(userLink.discord_id);
            if(member === undefined) throw new Error("Member not null.");

            const boostRole = member.roles.cache.get("802168196924309506") !== undefined;
            socket.emit("GET_USER_BOOST", boostRole);

        } catch (error) {
            socket.emit("GET_USER_BOOST", false);
        }
    }

}