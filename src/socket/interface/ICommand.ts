export default interface ICommand {
    serverId: string;
    commandName: string;
    senderName: string;
    commandString: string;
    pos: string;
    level: string;
    op: boolean;
}