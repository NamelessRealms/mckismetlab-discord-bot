import { Client, TextChannel, Message } from "discord.js";
import ApiService from "../api/ApiService";

export async function manualVerifyReaction(client: Client): Promise<void> {

    const manualVerifyWhitelistsResponse = await ApiService.getWhitelistAllManualVerify();

    if (manualVerifyWhitelistsResponse.status === 200) {

        for (let whitelistVerify of manualVerifyWhitelistsResponse.data) {

            const channel = client.channels.cache.get(whitelistVerify.channel_id) as TextChannel;

            const message = await channel.messages.fetch().then((messages) => {
                return messages.get(whitelistVerify.message_id) as Message;
            });

            message.react("✅");
            message.react("❎");
        }
    }
}
