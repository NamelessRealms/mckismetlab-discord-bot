export const environment = {
    // 公會ID
    guilds_id: "485422222131986442",

    // 白名單身份組ID
    roleWhitelist: {
        roleId: "485464302380253184"
    },

    waitWhitelistNoticesRole: {
        roleId: "979219917989621791"
    },

    // 頻道連結 channelId -> minecraftServerId
    chatChannelLink: [
        {
            discord_channel_id: "521686969001181184",
            minecraft_server_id: "mckismetlab-main-server"
        },
        {
            discord_channel_id: "650527027585351691",
            minecraft_server_id: "mckismetlab-deputy-server"
        }
    ],

    // 自動審核頻道記錄通知ID
    verifyDiscordNoticeChannelId: "804989486705803284",

    // 手動審核頻道記錄通知ID
    manualVerifyChannelId: "804990369950335007",

    // 贊助核頻道通知ID / 贊助者身份組ID / logsEmojiId
    sponsor: {
        noticeChannelId: "604180154176241664",
        roleId: "494845177119244288",
        logsEmoji: "logo"
    },

    // 伺服器私人記錄頻道ID
    serverPrivateMsg: {
        channelId: "804987369349971968"
    },

    // 伺服器指令執行記錄頻道ID
    serverCommandCarriedOut: {
        channelId: "804987711214714890"
    },

    // 伺服器指令執行頻道ID
    minecraftServerCommandRun: {
        channelId: "807540256589086740"
    },

    admin: {
        roleId: "485464854812164097"
    },

    whitelistApply: {
        channelId: "485678694678003716"
    },

    serverStatus: {
        channelId: "543793297269850133"
    },
    
    welcome: {
        channelId: "485695057526128641"
    },

    rule: {
        channelId: "604231523901767719"
    },

    generalMember: {
        roleId: "672078251056693298"
    }
}
