import { Client, TextChannel, Webhook } from "discord.js";
import { environment } from "./environment/Environment";

export default class MklWebhook {

    private static _webhooks: Map<string, Webhook> = new Map<string, Webhook>();
    private _client: Client;

    constructor(client: Client) {
        this._client = client;
    }

    public async initChatChannelWebhook() {

        for (let chatChannelLink of environment.chatChannelLink) {

            const channelId: string = chatChannelLink.discord_channel_id;
            const channel = await this._client.channels.fetch(channelId) as TextChannel;
            const webhooks = await channel.fetchWebhooks();
            const webhook = webhooks.find((hook) => hook.name === "mcKismetLab-Bot");

            if (webhook) {
                MklWebhook._webhooks.set(chatChannelLink.minecraft_server_id, webhook);
            } else {
                MklWebhook._webhooks.set(chatChannelLink.minecraft_server_id, await channel.createWebhook("mcKismetLab-Bot"));
            }
        }
    }

    public static getWebhook(serverId: string): Webhook | null {
        const webhook = this._webhooks.get(serverId);
        return webhook !== undefined ? webhook : null;
    }
}