import { Client } from "discord.js";

export default class SubscriptionEvent {

    private static _subscriptionMap = new Map<string, Array<SubscriptionEvent>>();

    private _event: string;
    private _id: string | null;
    public _callback?: (client: Client, ...args: Array<any>) => void;
    public _once: boolean = false;

    constructor(event: string, id?: string) {
        this._event = event;
        this._id = id !== undefined ? id : null;
    }

    public static emit(event: string, client: Client, ...args: Array<any>): void {
        const eventCallbacks = this._subscriptionMap.get(event);
        if (eventCallbacks === undefined) return;
        eventCallbacks.forEach((value) => {
            if (value._callback === undefined) return;
            value._callback(client, ...args);
            if (value._once) value.delete();
        });
    }

    public subscription(callback: (client: Client, ...args: Array<any>) => void) {
        this._on(callback);
    }

    public subscriptionOnce(callback: (client: Client, ...args: Array<any>) => void) {
        this._on(callback);
        this._once = true;
    }

    private _on(callback: (client: Client, ...args: Array<any>) => void) {

        const eventClasslist = SubscriptionEvent._subscriptionMap.get(this._event);

        if (eventClasslist === undefined) {
            SubscriptionEvent._subscriptionMap.set(this._event, new Array(this));
            this._callback = callback;
            return;
        }
        
        // TODO:
        if (this._id !== null) {
            for(let eventClass of eventClasslist) {
                if (eventClass._id !== null) {
                    if (eventClass._event === this._event && eventClass._id === this._id) {
                        return;
                    }
                }
            }
        }

        eventClasslist.push(this);
        SubscriptionEvent._subscriptionMap.delete(this._event);
        SubscriptionEvent._subscriptionMap.set(this._event, eventClasslist);
        this._callback = callback;
    }

    public delete() {
        let eventsClass = SubscriptionEvent._subscriptionMap.get(this._event);
        if (eventsClass === undefined) return;
        eventsClass = eventsClass.filter((value) => value !== this);
        SubscriptionEvent._subscriptionMap.delete(this._event);
        if(eventsClass.length > 0) SubscriptionEvent._subscriptionMap.set(this._event, eventsClass);
    }
}