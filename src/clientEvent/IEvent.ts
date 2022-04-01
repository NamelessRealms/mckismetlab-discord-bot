import * as Discord from "discord.js";
import { ModalSubmitInteraction } from "discord-modals";

export default interface Event<Key extends keyof Discord.ClientEvents> {

    event: keyof Discord.ClientEvents;

    execute(client: Discord.Client, ...args: Discord.ClientEvents[Key]): any;

}