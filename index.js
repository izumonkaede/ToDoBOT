require("dotenv").config();
const { Client, GatewayIntentBits, Partials } = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const TARGET_EMOJI = process.env.TARGET_EMOJI;
const FORWARD_CHANNEL_ID = process.env.FORWARD_CHANNEL_ID;


client.once("ready", () => {
    console.log("Bot is online!");
});

// サーバー全体監視
client.on("messageReactionAdd", async (reaction, user) => {
    try {
        if (user.bot) return;

        // パーシャルの補完
        if (reaction.partial) await reaction.fetch();
        if (reaction.message.partial) await reaction.message.fetch();

        // 指定の絵文字チェック
        const emojiName = reaction.emoji.name;
        if (emojiName !== TARGET_EMOJI) return;

        const forwardChannel = await client.channels.fetch(FORWARD_CHANNEL_ID);
        if (!forwardChannel) return;

        // メッセージ送信
        forwardChannel.send(
            `📌 **リアクション報告**\n` +
            `**チャンネル:** <#${reaction.message.channelId}>\n` +
            `**ユーザー:** ${user.tag}\n` +
            `**メッセージ:** ${reaction.message.content || "(埋め込み・画像など)"}\n` +
            `**リンク:** ${reaction.message.url}\n` +
            `**リアクション:** :${emojiName}:\n` +
            `**日時:** <t:${Math.floor(Date.now() / 1000)}:F>`
        );

    } catch (err) {
        console.error("Error:", err);
    }
});

client.login(process.env.DISCORD_TOKEN);
