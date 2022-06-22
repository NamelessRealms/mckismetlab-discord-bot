import ICommand from "./ICommand";
import IGetUserBoost from "./IGetUserBoost";
import IMessage from "./IMessage";
import IMessagePrivate from "./IMessagePrivate";

export default interface IEventType {
    MESSAGE_CREATE: [message: IMessage];

    MESSAGE_PRIVATE_CREATE: [message: IMessagePrivate];

    COMMAND_CREATE: [command: ICommand];

    GET_USER_BOOST: [user: IGetUserBoost];
}