// Imports
require("dotenv").config();
const { getResponse, CONTEXTS }= require('./ai_model.js');
const { Client, GatewayIntentBits, Partials } = require('discord.js');

// Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.User
    ]
});

// constants
const cooldowns = {};
const allHistory = {};

const COOLDOWN_MS = 10000;
const MAX_MESSAGE_LENGTH = 250;
const HISTORY_LENGTH = 10;
const CHARACTER_LENGTH = 2000;

// messages sent faster than the cooldown will not be responded to by the ai but still logged for context
// messages over the max length wont have ai respond to it or get logged to its context
// history farther back than the history length will be deleted, as well as beyond the character length
// bot ignores messages from other bots including itself for responses

// Message listener
client.on("messageCreate", async (message) => {
    try {
        if (message.author.id === client.user.id) return; // ignore messages from itself

        // data
        const mentionRegex = new RegExp(`<@!?${client.user.id}>`, "g");
        const channelId = message.channel.id;

        let repliedText = null;
        let repliedMsg = null;

        const now = Date.now();
        const userId = message.author.id;

        // clean message text (remove mention if present)
        let cleanedText = mentionRegex.test(message.content)
            ? message.content.replace(mentionRegex, "").trim()
            : message.content;

        // fetch replied message text (if it exists)
        if (message.reference) {
            try {
                repliedMsg = await message.channel.messages.fetch(message.reference.messageId);
                repliedText = repliedMsg?.content || null;
            } catch { repliedText = null; }
        }

        // Initialize channel history if it doesn't exist
        if (!allHistory[channelId]) allHistory[channelId] = [];

        // Add current message to history
        if (!(message.content.length > MAX_MESSAGE_LENGTH)) {
            allHistory[channelId].push({
                username: message.author.username, // username
                text: cleanedText, // text
                repliedText: repliedText // replied
            });
        }

        // determine if bot should respond
        let shouldRespond = (
            message.guild === null // dm
            || message.mentions.has(client.user) // mentions bot
            || repliedMsg?.author?.id === client.user.id) // replied to bot
            //&& !message.author.bot; // not if user is a bot
        if (!shouldRespond) return;

        // defaults
        if (!cleanedText) cleanedText = "Hello";

        if (!cooldowns[userId] || now - cooldowns[userId] > COOLDOWN_MS) {
            // add cooldown
            cooldowns[userId] = now;
        } else {
            // cooldown still active
            const remaining = ((COOLDOWN_MS - (now - cooldowns[userId])) / 1000).toFixed(1);
            try { await message.reply(`⚠️ On cooldown for ${remaining}s`);
            } catch {}
            return;
        }

        // limit message length
        if (message.content.length > MAX_MESSAGE_LENGTH && shouldRespond) {
            try { await message.reply(`⚠️ Character limit of ${MAX_MESSAGE_LENGTH} characters exceeded`);
            } catch {}
            return;
        }

        // send thinking message
        let thinkingMsg = null;
        try { thinkingMsg = await message.reply("🤔 Thinking...");
        } catch { return; }

        // build channel history string
        let channelHistory = allHistory[channelId]
            .map(entry => `${entry.username}: ${entry.text}${entry.repliedText ? `\nReplied to: ${entry.repliedText}` : ''}`)
            .join("\n");

        try {
            // summarize history if it gets too large
            if (allHistory[channelId].length > HISTORY_LENGTH || channelHistory.length > CHARACTER_LENGTH) {
                try {
                    // get last few messages from the history
                    allHistory[channelId] = allHistory[channelId].slice(-HISTORY_LENGTH);
                    channelHistory = allHistory[channelId]
                        .map(entry => `${entry.username}: ${entry.text}${entry.repliedText ? `\nReplied to: ${entry.repliedText}` : ''}`)
                        .join("\n");

                    const summarized = await getResponse(`${channelHistory}\n ${message.author.username}: ${cleanedText}`, CONTEXTS.SUMMARIZE_CONTEXT, 'gpt-5-nano'); // compress using ai
                    console.log("⚠️ Summary created: " + summarized);

                    // reset this channel's history only
                    allHistory[channelId] = [
                        {
                            username: "Summary",
                            text: summarized,
                            repliedText: null
                        }
                    ];

                    // remake channel history string
                    channelHistory = allHistory[channelId]
                        .map(entry => `${entry.username}: ${entry.text}${entry.repliedText ? `\nReplied to: ${entry.repliedText}` : ''}`)
                        .join("\n");

                } catch (err) {
                    // shift history by 1 if compression doesnt work
                    if (allHistory[channelId].length > HISTORY_LENGTH || channelHistory.length > CHARACTER_LENGTH) allHistory[channelId].shift();
                    console.error("Failed to compress history:", err);
                }
            }

            // get main ai response
            const aiResponse = await getResponse(`${channelHistory}\n ${message.author.username}: ${cleanedText}`, CONTEXTS.BASE_CONTEXT, 'gpt-5-mini');
            if (thinkingMsg) await thinkingMsg.delete();

            try { await message.reply(aiResponse);
            } catch { return; }

            // add ai response to history
            allHistory[channelId].push({
                username: client.user.username,
                text: aiResponse,
                repliedText: cleanedText
            });

        } catch (err) {
            // ai couldnt respond
            if (thinkingMsg) await thinkingMsg.delete();
            try { await message.reply("⚠️ Something went wrong."); } catch { return; }
            console.error(err);
        }
    } catch(err) {}
});

// Ready event
client.once('clientReady', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    //fetchGuilds(client);
});

// Login
client.login(process.env.BOT_TOKEN);