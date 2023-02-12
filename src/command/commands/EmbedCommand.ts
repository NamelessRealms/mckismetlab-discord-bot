import { SlashCommandChannelOption, SlashCommandStringOption, ToAPIApplicationCommandOptions } from "@discordjs/builders";
import { CommandInteraction, CacheType, MessageEmbed, TextChannel } from "discord.js";
import { environment } from "../../environment/Environment";
import SlashCommandBase from "../SlashCommandBase";

export default class EmbedCommand extends SlashCommandBase {
    public name: string = "embed";
    public description: string = "嵌入式訊息";
    public defaultPermission: boolean | undefined = false;

    public options: ToAPIApplicationCommandOptions[] = [
        new SlashCommandStringOption()
            .setName("類型")
            .setDescription("Select Embed Type")
            .setRequired(true)
            .addChoices(
                {
                    name: "模組包",
                    value: "modpack"
                },
                {
                    name: "啟動器",
                    value: "launcher"
                },
                {
                    name: "規則",
                    value: "rules"
                }
            ),
        new SlashCommandChannelOption()
            .setName("頻道")
            .setDescription("傳送的頻道 @channel")
            .setRequired(true)
            .addChannelTypes(0, 5)
    ]
    public permissions(): { id: string; type: "USER" | "ROLE"; permission: boolean; }[] {
        return [
            {
                id: environment.admin.roleId,
                type: "ROLE",
                permission: true
            }
        ]
    }
    public execute(interaction: CommandInteraction<CacheType>): void {

        let embeds: Array<MessageEmbed> | null = null;

        const selectType = interaction.options.getString("類型");
        const channel = interaction.options.getChannel("頻道") as TextChannel;

        if (selectType === null) {
            throw new Error("selectType not null.");
        }

        if (channel === null) {
            throw new Error("channel not null.");
        }

        switch (selectType) {
            case "modpack":
                embeds = this._modpackEmbed(interaction);
                break;
            case "launcher":
                embeds = this._launcherEmbed(interaction);
                break;
            case "rules":
                embeds = this._rulesEmbed(interaction);
                break;
        }

        if (embeds !== null) {

            channel.send({
                embeds: embeds
            });

            interaction.reply({ content: "已成功嵌入式訊息", ephemeral: true });

            return;
        }

        interaction.reply({ content: "嵌入式訊息失敗", ephemeral: true });
    }

    private _modpackEmbed(interaction: CommandInteraction<CacheType>): Array<MessageEmbed> {

        const modpackName = "Chroma Endless";
        const modpackVersion = "1.0.6";
        const modpackURL = "https://www.curseforge.com/minecraft/modpacks/chroma-endless";
        const modpackImgURL = "https://media.forgecdn.net/avatars/627/26/638021459665750880.jpeg";
        const serverIP = "play.mckismetlab.net";

        const deputyCat = true;
        const deputyModpackName = "Nomifactory (GTCEu Port)";
        const deputyModpackVersion = "1.4.2";
        const deputyModpackURL = "https://www.curseforge.com/minecraft/modpacks/nomi-ceu";
        const deputyModpackImgURL = "https://media.forgecdn.net/avatars/511/500/637830283066849322.png";
        const deputyServerIP = "deputy.mckismetlab.net";

        const mainAddedModsArray: Array<{ modName: string; modVersion: string, modURL: string }> = [
            // {
            //     modName: "Item Blacklist",
            //     modVersion: "1.4.3",
            //     modURL: "https://www.curseforge.com/minecraft/mc-mods/item-blacklist/files/2776296"
            // }
            // {
            //     modName: "DupeFix",
            //     modVersion: "3.1.6",
            //     modURL: "https://www.curseforge.com/minecraft/mc-mods/dupefix-project/files/3424173"
            // }
        ];

        const deputyAddedModsArray: Array<{ modName: string; modVersion: string, modURL: string }> = [
            {
                modName: "Item Blacklist",
                modVersion: "1.4.3",
                modURL: "https://www.curseforge.com/minecraft/mc-mods/item-blacklist/files/2776296"
            }
        ];

        const addedMods = (addMods: Array<{ modName: string; modVersion: string, modURL: string }>) => {

            let addedModsStr: string = "";

            for (let addMod of addMods) {
                addedModsStr += `▫ 模組名稱: ${addMod.modName}\n▫ 模組版本: ${addMod.modVersion}\n▫ 模組下載: [點擊下載](${addMod.modURL})\n\n`;
            }

            return addedModsStr;
        }

        const modpackFields = () => {
            if (mainAddedModsArray.length >= 0) {
                return [
                    {
                        name: "➡ 模組包資訊",
                        value: `▫ 模組包名稱: ${modpackName}\n▫ 模組包版本: ${modpackVersion}\n▫ 模組包主頁: [主頁連結](${modpackURL})\n▫ 伺服器IP: ${serverIP}`
                    },
                    {
                        name: `➡ 玩家必須額外加裝 ${mainAddedModsArray.length} 個模組才能進入伺服器`,
                        value: addedMods(mainAddedModsArray)
                    }
                ]
            } else {
                return [{
                    name: "➡ 模組包資訊",
                    value: `▫ 模組包名稱: ${modpackName}\n▫ 模組包版本: ${modpackVersion}\n▫ 模組包主頁: [主頁連結](${modpackURL})\n▫ 伺服器IP: ${serverIP}`
                }]
            }
        }

        const deputyModpackFields = () => {
            if (deputyAddedModsArray.length >= 0) {
                return [
                    {
                        name: "➡ 模組包資訊",
                        value: `▫ 模組包名稱: ${deputyModpackName}\n▫ 模組包版本: ${deputyModpackVersion}\n▫ 模組包主頁: [主頁連結](${deputyModpackURL})\n▫ 伺服器IP: ${deputyServerIP}`
                    },
                    {
                        name: `➡ 玩家必須額外加裝 ${deputyAddedModsArray.length} 個模組才能進入伺服器`,
                        value: addedMods(deputyAddedModsArray)
                    }
                ]
            } else {
                return [{
                    name: "➡ 模組包資訊",
                    value: `▫ 模組包名稱: ${deputyModpackName}\n▫ 模組包版本: ${deputyModpackVersion}\n▫ 模組包主頁: [主頁連結](${deputyModpackURL})\n▫ 伺服器IP: ${deputyServerIP}`
                }]
            }
        }

        const embed = new MessageEmbed()
            .setTitle("MCKISMETLAB // 主伺服器模組包資訊")
            // .setDescription(`➡ 模組包資訊:\n▫ 模組包名稱: ${modpackName}\n▫ 模組包版本: ${modpackVersion}\n▫ 模組包主頁: [主頁連結](${modpackURL})\n▫ 伺服器IP: ${serverIP}\n\n🔸 其他注意事項:\n🔸 玩家必須額外加裝 ${addedModsArray.length} 個模組才能進入伺服器\n${addedMods()}`)
            .addFields(modpackFields())
            .setFooter({
                text: "MCKISMETLAB 無名伺服器 | 模組生存 ⚔ 冒險前進",
                iconURL: interaction.client.user?.avatarURL() as string
            })
            .setThumbnail(modpackImgURL)
            .setColor("#7289DA");

        const deputyEmbed = new MessageEmbed()
            .setTitle("MCKISMETLAB // 副伺服器模組包資訊")
            .addFields(deputyModpackFields())
            .setFooter({
                text: "MCKISMETLAB 無名伺服器 | 模組生存 ⚔ 冒險前進",
                iconURL: interaction.client.user?.avatarURL() as string
            })
            .setThumbnail(deputyModpackImgURL)
            .setColor("#7289DA");

        if (!deputyCat) return [embed];
        return [embed, deputyEmbed];
    }

    private _launcherEmbed(interaction: CommandInteraction<CacheType>): Array<MessageEmbed> {

        let embed = new MessageEmbed()
            .setTitle("📦 **下載 無名啟動器 (BETA)**")
            .setDescription("準備好遊玩無名伺服器了嗎? 你是不是還在煩惱每次我們更換模組包都要自己手動安裝😤還有各種額外的模組都也要自己手動安裝。無名伺服器歡迎你使用我們自己推出的啟動器讓你方便快速啟動遊戲，無需自己安裝模組包，在這裡可以找到! 我們本服啟動器下載連結。\n\n⚠ *無名啟動器只有這裡是我們上傳的位置連結，如果你是從其他地方下載本服啟動器，其中可能包含病毒，會發生帳號被盜 / 電腦損壞其他的任何損失，對此我們概不負責。*\n\n" + "*⚠ 目前本服啟動器已知的問題，無名啟動器目前尚未簽章，這可能會發生各家的瀏覽器 / 作業系統自我保護機制 / 防毒軟體 視為病毒，從下面訊息下載連結是安全的，請務必不要從其他地方下載本服無名啟動器。*\n\n" + "🔗 **無名啟動器下載:** [點擊下載](https://mckismetlab.net/launcher)\n📑 **無名啟動器版本日誌:** [點我查看](https://github.com/mckismetlab/mckismetlab-launcher/releases)\n\n📬 問題回報說明越清楚越好，能使我 Quasi 處理效率提升，[問題回報連結](https://github.com/mckismetlab/mckismetlab-launcher/issues/new/choose)。\n\u200b")
            .setColor("#7289DA")
            .setFooter({
                text: "MCKISMETLAB 無名伺服器 | 模組生存 ⚔ 冒險前進",
                iconURL: interaction.client.user?.avatarURL() as string
            });

        return [embed];
    }

    private _rulesEmbed(interaction: CommandInteraction<CacheType>): Array<MessageEmbed> {

        const gameChannel = interaction.guild?.channels.cache.get("661526275726245921")?.toString();
        const exclusiveCoordinationRoomChannel = interaction.guild?.channels.cache.get("805431146786717727")?.toString();

        let embed_1 = new MessageEmbed()
            .setTitle("🛡 **伺服器規則，最近修訂日期：2021 年 4 月 10 日。**")
            .setDescription("📜 本伺服器的規則非常簡單，只要遵守我們列出的規則以及 Discord [社群守則](https://discord.com/guidelines) 與 [服務條款](https://discord.com/terms)就沒有任何懲處。\n\u200b")
            .addFields(
                {
                    name: "➡ 請你配合 Discord 服務條款和社群守則。",
                    value: "▫ 你必須年滿13歲才能使用 Discord，並遵守所有其他條款和守則。\n\u200b",
                },
                {
                    name: "➡ 請勿有任何垃圾訊息。",
                    value: "▫ 這包括毫無用意的重複訊息、相同的一句話文字已相同的方式發送公共頻道。\n\u200b"
                },
                {
                    name: "➡ 請留意各個頻道的討論主題。",
                    value: `▫ 發言請與Minecraft遊戲內容相關，與遊戲內容較無關聯但想討論別的遊戲，可使用 ${gameChannel} 頻道。\n\u200b`
                },
                {
                    name: "➡ 請勿發送令人感到不舒服、害怕的內容，種族、性別歧視。",
                    value: "▫ 這包括在公共聊天頻道做人身攻擊、罵人嗆人、講髒話、騷擾、性暗示以及可能有引戰疑慮之話題等等。\n\u200b"
                },
                {
                    name: "➡ 請勿使用不適當的名稱和頭像。",
                    value: "▫ 這包括使用髒話、人身攻擊字言、淫穢、不雅圖片以及冒充他人名稱行為。\n\u200b"
                },
                {
                    name: "➡ 請勿有政治或宗教話題。",
                    value: "▫ 這些複雜的話題導致有爭議和會使令人反感。\n\u200b"
                },
                {
                    name: "➡ 除非明確同意，否則不允許發送廣告到公共頻道。",
                    value: "▫ 這包括任何其他伺服器IP、其他社交平台、社群的連結、廣告的連結，但這不限於自己的Discord邀請連結、網路上Minecraft相關遊戲教學內容連結。\n\u200b"
                },
                {
                    name: "➡ 請勿發送、分享成人內容、血腥或虐待動物的圖片/影片。",
                    value: "▫ 這包括性暗示、血腥圖片影片或任何不當行為，使用馬賽克等方式不影響判定。\n\u200b"
                },
                // {
                //     name: "➡ 未經管理員同意，請勿共享檔案。",
                //     value: "▫ 為了我們玩家的安全，除非獲得管理員許可同意並進行了檔案檢查，否則我們不允許你上傳檔案到頻道上。\n\u200b"
                // },
                {
                    name: "➡ 請勿發送惡意連結/檔案。",
                    value: "▫ 這包括偽造的病毒連結/檔案、偽造的無名啟動器連結/檔案。\n\u200b"
                },
                {
                    name: "➡ 請勿冒充他人用戶，尤其是冒充管理員。",
                    value: "▫ 所有伺服器團隊都有相關的執行等級、身份組，如果沒有該有的身份組或是他們不是伺服器團隊的人，並應立即向管理員舉報，並且你不需理會。\n\u200b"
                },
                {
                    name: "➡ 請勿毫無問題重複的@提及我們伺服器團隊人員。",
                    value: "▫ 這會影響我們團隊人員的心情，除非你有需要幫助或有理由才可對@提及我們但請你要附圖，否則請不要重複提及，我們可以不用理會你。\n\u200b"
                },
                {
                    name: "➡ 請勿在伺服器中使用模組/原版漏洞(BUG)進行遊戲。",
                    value: "▫ 這會影響其他人不公評遊玩遊戲破壞遊戲平衡，遇到違例者時，應可以馬上截圖或紀錄證據並向管理員舉報，且散播模組漏洞、共犯、知情不報都零容忍將直接永久禁止登入伺服器。\n\u200b"
                },
                {
                    name: "➡ 請勿在伺服器中使用不當的模組、外掛、修改遊戲資料程式。",
                    value: "▫ 這會影響其他人不公評遊玩遊戲破壞遊戲平衡以及伺服器平衡，且散播外掛資料程式、共犯、知情不報都零容忍將直接永久禁止登入伺服器。\n\u200b"
                },
                {
                    name: "➡ 請勿在伺服器中惡意做出不當的行為。",
                    value: "▫ 這包括惡意殺人、惡作劇、騷擾或欺凌其他玩家及詐騙、偷取、搶奪他人之財物，意圖針對他人進行釣魚、入侵或進行分散式阻斷服務攻擊(DDOS)伺服器。\n\u200b"
                },
                {
                    name: "➡ 請勿在伺服器中刻意製造伺服器負擔的行為。",
                    value: "▫ 這包括在狹小的空間聚集過多的生物、製造過多的掉落物、放置過量已知道會造成伺服器負擔的方塊以及在非必要的地方開啟區塊載入(ChunkLoad)。\n\u200b"
                },
                {
                    name: "➡ 請勿在伺服器中影響其他玩家遊玩體驗。",
                    value: "▫ 為了我們玩家遊玩體驗，盡量不要在伺服器人數高的狀態下高速移動跑圖/前中後期玩家請勿強制贈送任何東西給其他玩家或刻意丟到玩家旁邊，這嚴重破壞前期玩家的遊玩體驗，除非玩家對方有向你要，才能允許贈送任何東西給玩家對方。\n\u200b"
                },
                {
                    name: "➡ 請確保伺服器中你的設施有正常運作。",
                    value: "▫ 在做任何自動化設施或自動生怪設施時，請確認不會爆倉以及累積過多怪物。"
                })
            .setColor("#FFBB00");

        let embed_2 = new MessageEmbed()
            .setTitle("📜 注意，懲處的標準 ⚠")
            .setDescription("🛡 懲處的標準包括警告乙次(勸導)，警告貳次(永久禁止登入伺服器)，玩家不遵守規則或不聽從管理員勸導後將被管理員採取進一步懲處，我們的懲處決定是最終判決，請勿與我們爭論 🤐。\n\n📝 本服管理員可不須經過伺服主同意執行最終判決懲處。\n\n⁉ 如果你認為自己的懲處不公平，請與管理員聯繫說明。\n\n⚖ 請確保遵守這些規則，因為會影響你和我們社群、遊玩伺服器的品質。")
            .setColor("#FFFF33");

        let embed_3 = new MessageEmbed()
            .setTitle("⚠ 玩家需注意的內容 ⁉")
            .setDescription(`📝 玩家進入伺服器、Discord社群伺服器就視同同意以上規則，如玩家不遵守規則不聽從管理員勸導將已懲處的標準做進一步懲處。\n\n🤬 私人恩怨請勿在公共頻道公審其他玩家，讓其他玩家擁有良好的聊天與遊戲環境，有任何類似的討論需求請改用自已的區域個人頻道、生活圈個人頻道、私人訊息等非公開的方式，我們並不會處理你們的私人恩怨，請玩家多加留意。\n\n📸 玩家遇到違規者時，應可以馬上截圖或紀錄證據並向管理員舉報，請確保有足夠的證據才不會影響到你的權利。\n\n👨‍✈️ 較大嚴重的違規我們將通知舉報人及被舉報人進行雙方了解溝通並有 ${exclusiveCoordinationRoomChannel}，並且被舉報人將被通知當天暫時移除白名單雙方溝通完畢等待管理員判斷完畢在做進一步的處理，${exclusiveCoordinationRoomChannel} 只有伺服主、管理員、雙方可討論、文字輸入其他人事可看但不行進入任何的討論、文字輸入。\n\n📝 本服管理員可不須經過伺服主同意執行最終判決懲處，請玩家多加留意。\n\u200b`)
            .setColor("#FFFF33")
            .setFooter({
                text: "MCKISMETLAB 無名伺服器 | 模組生存 ⚔ 冒險前進",
                iconURL: interaction.client.user?.avatarURL() as string
            });

        return [embed_1, embed_2, embed_3];
    }
}