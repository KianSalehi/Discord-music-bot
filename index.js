const { Client, Intents } = require('discord.js');
const ytdl = require('ytdl-core');
const { YTSearcher } = require('ytsearcher');
require('dotenv').config({path: __dirname + '/.env'})
const { createAudioResource, joinVoiceChannel, getVoiceConnection, createAudioPlayer } = require('@discordjs/voice');


const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES],
  });
  const searcher = new YTSearcher(process.env.YTAPI);
  

const queues = new Map();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.application.commands.create({
        name: 'play',
        description: 'Play a song',
        options: [{
          name: 'song',
          type: 'STRING',
          description: 'The URL or search term of the song',
          required: true
        }]
      })
      .then(console.log)
      .catch(console.error);
      client.application.commands.create({
        name: 'stop',
        description: 'Stop the music',
      })
      .then(console.log)
      .catch(console.error);
      client.application.commands.create({
        name: 'queue',
        description: 'Show the queue of songs',
      })
      .then(console.log)
      .catch(console.error);
      client.application.commands.create({
        name: 'skip',
        description: 'Skip to the next song',
      })
      .then(console.log)
      .catch(console.error);
  });

  client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    const serverQueue = queues.get(interaction.guild.id);
    if (interaction.commandName === 'play') {
      const searchString = interaction.options.getString('song');
      const videoResult = await searcher.search(searchString, { type: 'video' });
      const song = { title: videoResult.first.title, url: videoResult.first.url };
      if (!serverQueue) {
        const queue = {
          textChannel: interaction.channel,
          voiceChannel: interaction.member.voice.channel,
          connection: null,
          songs: [],
          playing: true,
        };
        queues.set(interaction.guild.id, queue);
        queue.songs.push(song);
        try {
            const connection = getVoiceConnection(interaction.guildId);
            if (!connection) {
              const voiceChannel = interaction.member.voice.channel;
              if (!voiceChannel) {
                return interaction.reply('You need to be in a voice channel to play music');
              }
          
              const player = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
              });
              queue.connection = player;
            }
          await playSong(interaction, queue.songs[0]);
        } catch (error) {
          console.error(error);
          queues.delete(interaction.guild.id);
          await interaction.reply('There was an error connecting to the voice channel!');
        }
    } else {
        serverQueue.songs.push(song);
        await interaction.reply(`**${song.title}** has been added to the queue!`);
      }
    } else if (interaction.commandName === 'stop') {
      if (serverQueue) {
        serverQueue.songs = [];
        serverQueue.connection.destroy();
        await interaction.reply('Music stopped!');
      } else {
        await interaction.reply('There is nothing playing.');
      }
    } else if (interaction.commandName === 'skip') {
      if (serverQueue && serverQueue.connection) {
        console.log(serverQueue)
        serverQueue.songs.shift();
        playSong(interaction, serverQueue.songs[0]);
        await interaction.reply('Skipped the current song!');
      } else {
        serverQueue.connection.destroy();
        await interaction.reply('There is nothing playing.');
      }
    } else if (interaction.commandName === 'queue') {
      if (serverQueue && serverQueue.songs.length > 0) {
        const queue = serverQueue.songs.map((song, index) => `${index + 1}. **${song.title}**`);
        await interaction.reply(`__**Song Queue:**__\n${queue.join('\n')}`);
      } else {
        await interaction.reply('There are no songs in the queue.');
      }
    }
  });
  
  
  
async function playSong(interaction, song) {

    const queue = queues.get(interaction.guildId);
    if (!song) {
      queue.voiceChannel.leave();
      queues.delete(interaction.guild.id);
      return;
    }
    const stream = ytdl(song.url, { filter: 'audioonly' });

    const audioResource = createAudioResource(stream);
    const audioPlayer = createAudioPlayer();
    queue.player = audioPlayer;
    queue.connection.subscribe(audioPlayer);

    console.log(queue.player)
    queue.player.play(audioResource);
    queue.player.on('error', (error) => {
        console.error(error);
        queue.songs.shift();
        playSong(interaction, queue.songs[0]);
    });
    queue.player
      .on('finish', () => {
        queue.songs.shift();
        playSong(interaction, queue.songs[0]);
      })
  }
  

  async function handleQueue(interaction, queue) {
    const serverQueue = queues.get(interaction.guild.id);
    if (!queue) {
      await serverQueue.voiceChannel.leave();
      queues.delete(interaction.guild.id);
      return;
    }
    serverQueue.songs.push(queue);
    await interaction.reply(`**${queue.title}** has been added to the queue!`);
    if (!serverQueue.playing) {
      serverQueue.playing = true;
      await playSong(interaction, serverQueue.songs[0]);
    }
  }
  client.login(process.env.DISCORDAPI);
