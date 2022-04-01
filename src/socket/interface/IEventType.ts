import ICommand from "./ICommand";
import IMessage from "./IMessage";
import IMessagePrivate from "./IMessagePrivate";

export default interface IEventType {
    messageCreate: [message: IMessage];

    messagePrivateCreate: [message: IMessagePrivate];

    commandCreate: [command: ICommand];

    userBoostGet: [userUuid: string];
}