export interface IUserPlayer {
    status: string;
    minecraftName: string;
    minecraftUuid: string;
    discordName: string;
    discordId: string;
    serverId: string;
    autoAuditResults: string;
    description: string;
    exUserlink_database: boolean;
    exServerWhitelist_database: boolean;
    exManualVerifyWhitelist: boolean;
    exViolationRecord: boolean;
    manualVerifyChannelID: string;
    manualVerifyMessageID: string;
}
