import { TextChannel, GuildMember, Role } from "discord.js";
import axios from "../api/axiosApi";
import { isServerCheck } from "../api/isServerCheck";
import { IProfiles } from "../interface/IProfiles";
import { IUserLink } from "../interface/IUserLink";
import BotMain from "../botMain";
import { CommandOptionsType, PermissionsType } from "../module/interface/ISlashCommand";
import { AppInteractions, Parametric, SlashCommandBase } from "../module/slashCommands";
import { dates } from "../utils/dates";
import ApiServiceAxios from "../api/apiServiceAxios";
import ISponsorUser from "../interface/ISponsorUser";
import MojangApi from "../api/mojangApi";

export default class SponsorCommand extends SlashCommandBase {

    public name: string = "sponsor";
    public description: string = "公告贊助者玩家";

    public everyoneUsePermission: boolean = false;
    public permissionType: PermissionsType = PermissionsType.Role;
    public requiredIdentityName: string[] = ["🔋 伺服主 // 兼伺服管理員"];

    public expectedArgs(): Array<Parametric> {

        const playerIdArg = new Parametric()
            .setName("遊戲id")
            .setDescription("Minecraft ID")
            .setRequired(true)
            .setType(CommandOptionsType.String)

        const moneyArg = new Parametric()
            .setName("金額")
            .setDescription("輸入金額")
            .setRequired(true)
            .setType(CommandOptionsType.Integer);

        const publicMoneyArg = new Parametric()
            .setName("公開金額")
            .setDescription("是否公開金額(預設不公開)")
            .setRequired(false)
            .setType(CommandOptionsType.Boolean);

        const anonymousArg = new Parametric()
            .setName("匿名")
            .setDescription("是否匿名(預設不匿名)")
            .setRequired(false)
            .setType(CommandOptionsType.Boolean);

        return [playerIdArg, moneyArg, publicMoneyArg, anonymousArg];
    }

    public async callback(appInteractions: AppInteractions, channelObject: TextChannel, member: GuildMember, args: any[]): Promise<void> {
        try {

            await isServerCheck();

            const playerId = args[0];
            const money = args[1];
            const publicMoney = args[2] !== undefined ? args[2] : false;
            const anonymous = args[3] !== undefined ? args[3] : false;

            const profilesPlayer = await MojangApi.validateSpieler(playerId) as IProfiles;

            if (profilesPlayer === undefined) {
                (await appInteractions.callbackMessage("公告失敗，遊戲ID錯誤")).delete(5000);
                return;
            }

            const userLinkResponse = await ApiServiceAxios.getUserLink(profilesPlayer.id);

            const noticeChannelId = BotMain.CONFIG_DATA.sponsor.noticeChannelId;
            const roleId = BotMain.CONFIG_DATA.sponsor.roleId;

            if (userLinkResponse.status === 200) {

                const role = channelObject.guild.roles.cache.get(roleId);
                const member = channelObject.guild.members.cache.get(userLinkResponse.data.discord_id) as GuildMember;

                member.roles.add(role as Role);
            }

            const sponsorUserResponse = await ApiServiceAxios.getSponsorUser(profilesPlayer.id);

            if (sponsorUserResponse.status === 200) {
                await ApiServiceAxios.updateSponsorUser(profilesPlayer.id, money);
            } else {
                await ApiServiceAxios.createSponsorUser(profilesPlayer.id, money);
            }

            const logsEmoji = BotMain.CONFIG_DATA.sponsor.logsEmoji;
            const customEmoji = channelObject.client.emojis.cache.find((emoji) => emoji.name === logsEmoji);
            const channel = channelObject.guild.channels.cache.get(noticeChannelId) as TextChannel;

            if (publicMoney && anonymous) {
                channel.send(`📢 贊助伺服器相關公告 💰 @everyone (${new dates().fullYearTime()})\n\n🎉 感謝 **匿名玩家** 贊助了 mcKismetLab 無名伺服器 $${money}NTD，伺服器 ${customEmoji} 又重新充滿活力 😊\n\n${customEmoji} mcKismetLab 無名伺服器 | 模組生存 ⚔ 冒險前進`);
            } else if (publicMoney && !anonymous) {
                channel.send(`📢 贊助伺服器相關公告 💰 @everyone (${new dates().fullYearTime()})\n\n🎉 感謝 ${profilesPlayer.name} 贊助了 mcKismetLab 無名伺服器 $${money}NTD，伺服器 ${customEmoji} 又重新充滿活力 😊\n\n${customEmoji} mcKismetLab 無名伺服器 | 模組生存 ⚔ 冒險前進`);
            } else if (!publicMoney && !anonymous) {
                channel.send(`📢 贊助伺服器相關公告 💰 @everyone (${new dates().fullYearTime()})\n\n🎉 感謝 ${profilesPlayer.name} 贊助了 mcKismetLab 無名伺服器，伺服器 ${customEmoji} 又重新充滿活力 😊\n\n${customEmoji} mcKismetLab 無名伺服器 | 模組生存 ⚔ 冒險前進`);
            } else if (!publicMoney && anonymous) {
                channel.send(`📢 贊助伺服器相關公告 💰 @everyone (${new dates().fullYearTime()})\n\n🎉 感謝 **匿名玩家** 贊助了 mcKismetLab 無名伺服器，伺服器 ${customEmoji} 又重新充滿活力 😊\n\n${customEmoji} mcKismetLab 無名伺服器 | 模組生存 ⚔ 冒險前進`);
            }

            appInteractions.callbackMessage(`已成功公告贊助者玩家 ${profilesPlayer.name}`);

        } catch (error) {
            appInteractions.callbackMessage(error as any);
        }
    }
}
