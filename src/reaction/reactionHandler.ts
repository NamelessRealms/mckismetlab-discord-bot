import { Client } from "discord.js";
import { manualVerifyReaction } from "./ManualVerifyReaction";

export function reactionHandler(client: Client, isDev: boolean): void {

    // manual verify reaction
    manualVerifyReaction(client);
}
