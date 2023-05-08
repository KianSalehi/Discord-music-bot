class AudioPlayer{
    constructor (){
        let guild = {}
        let isPlaying = false;
    }
    PlayMusic = async (message)=>{
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply ('You need to be in a voice channel to play music')
        }
        const songUrl = message.content.slice(6)
        guild[message.guild].push(songUrl);
        message.channel.send(`Added ${songUrl} to the queue`)
        if (!isPlaying){
            isPlaying = true;
            try {
                playSong(queue.shift(), message.member.voice.channel);
                
            } catch (error) {
                message.reply('Something didnt work, please try again.')
                throw error
            }
        }
    }
    
    playSong = async (songUrl, voiceChannel)=>{
        // Join the voice channel
        const connection = await voiceChannel.join();
        // Play the song
        const dispatcher = connection.play(ytdl(songUrl, { filter: 'audioonly' }));
        dispatcher.on('finish', () => {
        // If there are more songs in the queue, play the next song
        if (queue.length > 0) {
          playSong(queue.shift(), voiceChannel);
        } else {
          // If there are no more songs in the queue, leave the voice channel
          voiceChannel.leave();
          isPlaying = false;
        }
      });
    }
    
    stopMusic= async (message) =>{
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply ('You need to be in a voice channel to play music')
        }
    
        const connection = await voiceChannel.join();
    
    
    }
}

module.exports = {AudioPlayer}
