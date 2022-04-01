import { MessageEmbed } from "discord.js";

export default class Embeds {

    public static apiServerOfflineEmbed() {

        const embed = new MessageEmbed()
            .setDescription("很抱歉，API Server 未在線上，請稍後再嘗試。\n如果你在遇到問題，請聯繫我 <@177388464948510720> 伺服器架設者。")
            .setColor("#2894FF");

        return embed;
    }

    public static botErrorEmbed() {

        const embed = new MessageEmbed()
            .setDescription("很抱歉，Bot出現了問題，請稍後再嘗試。如果你在遇到問題，請聯繫我 <@177388464948510720> 伺服器架設者。")
            .setColor("#2894FF");

        return embed;
    }
}