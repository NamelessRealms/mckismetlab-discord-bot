import { Client } from "discord.js";
import { manualVerifyReaction } from "./manualVerifyReaction";

export function reactionHandler(client: Client, isDev: boolean): void {

    // manual verify reaction
    manualVerifyReaction(client);
}
