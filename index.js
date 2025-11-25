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

// ----------- 環境変数から読み込み -----------
const TODO_EMOJI = process.env.TODO_EMOJI;                // Unicode絵文字 or 名前
const TODO_FORWARD_ID = process.env.TODO_FORWARD_ID;

const DP_EMOJI_ID = process.env.DP_EMOJI_ID;             // カスタム絵文字はIDで判定
const DP_FORWARD_ID = process.env.DP_FORWARD_ID;

client.once("ready", () => {
    console.log("Bot is online!");
});

// ----------- サーバー全体のリアクション監視 -----------
client.on("messageReactionAdd", async (reaction, user) => {
    try {
        if (user.bot) return;

        if (reaction.partial) await reaction.fetch();
        if (reaction.message.partial) await reaction.message.fetch();

        let forwardChannelId = null;

        // Unicode絵文字の場合
        if (reaction.emoji.name === TODO_EMOJI) {
            forwardChannelId = TODO_FORWARD_ID;
        }
        // カスタム絵文字の場合
        else if (reaction.emoji.id === DP_EMOJI_ID) {
            forwardChannelId = DP_FORWARD_ID;
        } else {
            return; // 対象外の絵文字 → 無視
        }

        const forwardChannel = await client.channels.fetch(forwardChannelId);
        if (!forwardChannel) {
            console.error("転送先チャンネルが見つからない:", forwardChannelId);
            return;
        }

        // メッセージ本体を送信
        await forwardChannel.send(`
**メモ**
**チャンネル:** <#${reaction.message.channelId}>
**ユーザー:** ${user.tag}
**メッセージ:** ${reaction.message.content || "(埋め込み・画像など)"}
**日時:** <t:${Math.floor(Date.now() / 1000)}:F>
        `);

        // 添付ファイルを送信（画像など）
        reaction.message.attachments.forEach(att => forwardChannel.send(att.url));

        // 埋め込みも転送
        reaction.message.embeds.forEach(embed => forwardChannel.send({ embeds: [embed] }));

    } catch (err) {
        console.error("Error:", err);
    }
});

client.login(process.env.DISCORD_TOKEN);
