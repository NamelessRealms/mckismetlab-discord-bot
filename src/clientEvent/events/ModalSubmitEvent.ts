import { Client } from "discord.js";
import { ModalSubmitInteraction } from "discord-modals";
import SubscriptionEvent from "../../subscription/SubscriptionEvent";

export default class ModalSubmitEvent {
    
    public event = "modalSubmit";

    execute(client: Client, modal: ModalSubmitInteraction) {
        switch(modal.customId) {
            case "WHITELIST_APPLY_MODAL_EDIT_MINECRAFT_NAME":
                SubscriptionEvent.emit("WHITELIST_APPLY_MODAL_EDIT_MINECRAFT_NAME", client, modal);
                return;
            case "ADD_ERROR_USER_MODAL_EDIT":
                SubscriptionEvent.emit("ADD_ERROR_USER_MODAL_EDIT", client, modal);
                break;
        }
    }
}