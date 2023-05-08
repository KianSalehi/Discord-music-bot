const dotenv = require('dotenv')
dotenv.config();
const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const { AudioPlayer } = require('./audioPlayer.js')
const client = new Discord.Client({ intents: [Discord.IntentsBitField.Flags.Guilds, Discord.IntentsBitField.Flags.GuildMessages, Discord.IntentsBitField.Flags.GuildVoiceStates] });
const audioPlayer = new AudioPlayer();


client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`)
})

client.on('message', async (message) => {
    console.log(message)
    if (message.content.startsWith(";p play")) {
        audioPlayer.playMusic(message);
    }
    if (message.content.startsWith(';p stop')) {
        console.log(message);
    }
})
client.login(process.env.DISCORD_TOKEN);
