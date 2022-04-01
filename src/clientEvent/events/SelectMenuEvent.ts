import { ClientEvents, Client, Interaction, CacheType } from "discord.js";
import SubscriptionEvent from "../../subscription/SubscriptionEvent";
import IEvent from "../IEvent";

export default class SelectMenuEvent implements IEvent<"interactionCreate"> {
    public event: keyof ClientEvents = "interactionCreate";
    public execute(client: Client, interaction: Interaction<CacheType>) {

        if(!interaction.isSelectMenu()) return;

        SubscriptionEvent.emit("WHITELIST_APPLY_SELECT_SERVER", client, interaction);
    }
}