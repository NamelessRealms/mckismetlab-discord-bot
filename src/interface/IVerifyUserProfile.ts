import { VerifyNoticeStatus } from "./enum/verifyNoticeStatus";

export default interface IVerifyUserProfile {
    status: VerifyNoticeStatus;
    minecraftName: string;
    minecraftUuid: string;
    discordUserName: string;
    discordUserId: string;
    serverId: string;
    autoAuditResults: string;
    description: string;
    isDbUserlink: boolean;
    isDbServerWhitelist: boolean;
    isDbManualVerifyWhitelist: boolean;
    isDbViolationRecord: boolean;
    manualVerifyChannelId: string;
    manualVerifyMessageId: string;
}
