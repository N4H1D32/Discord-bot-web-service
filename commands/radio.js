const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus, 
    StreamType 
} = require('@discordjs/voice');
const ytdl = require('@distube/ytdl-core');
const YouTube = require('youtube-sr').default;

// YouTube bloklamalarından keçmək üçün xüsusi agent konfiqurasiyası
const agent = ytdl.createAgent([
    {
        name: 'ANDROID',
        version: '19.02.39',
        client: 'ANDROID'
    }
]);

module.exports = {
    name: 'radio',
    description: 'Səs kanalında mahnı oxudur',
    prefixRequired: true,
    async execute(message, args) {
        const member = await message.guild.members.fetch(message.author.id).catch(() => null);
        const voiceChannel = member?.voice?.channel;

        if (!voiceChannel) {
            return message.reply('🔊 **Radio açmaq üçün əvvəlcə bir səs kanalına daxil olmalısınız!**');
        }

        const query = args.join(' ').trim();
        if (!query) {
            return message.reply('📻 **Zəhmət olmasa mahnının adını və ya YouTube URL-ni yazın!**');
        }

        const statusMsg = await message.reply('🔍 **Mahnı axtarılır və yüklənir...**');

        try {
            let videoUrl = query;
            let videoTitle = query;

            if (!ytdl.validateURL(query)) {
                const searchResult = await YouTube.searchOne(query);
                if (!searchResult) {
                    return statusMsg.edit('❌ **Axtarışa uyğun heç bir mahnı tapılmadı!**');
                }
                videoUrl = searchResult.url;
                videoTitle = searchResult.title;
            } else {
                const info = await ytdl.getBasicInfo(query, { agent });
                videoTitle = info.videoDetails.title;
            }

            // Audio axınını Android müştəri identifikasiyası ilə çəkirik
            const stream = ytdl(videoUrl, {
                filter: 'audioonly',
                quality: 'highestaudio',
                highWaterMark: 1 << 25,
                agent: agent
            });

            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
                selfDeaf: true
            });

            const player = createAudioPlayer();
            const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });

            player.play(resource);
            connection.subscribe(player);

            await statusMsg.edit(`📻 **Radio Aktivdir!**\n🎶 Oxunur: **${videoTitle}**\n🔊 Kanal: **${voiceChannel.name}**`);

            // Connection təkrar söndürülərkən çökməsin deyə təhlükəsiz destroy
            const safeDestroy = () => {
                try {
                    if (connection.state.status !== 'destroyed') {
                        connection.destroy();
                    }
                } catch (e) {
                    // Xətanı sakitcə yaxalayır
                }
            };

            player.on(AudioPlayerStatus.Idle, () => {
                safeDestroy();
                message.channel.send('🎵 **Mahnı bitdi, radio söndürüldü.**');
            });

            player.on('error', error => {
                console.error("Audio Player Xətası:", error.message);
                safeDestroy();
                message.channel.send('⚠️ **Səs oxudularkən xəta baş verdi!**');
            });

        } catch (error) {
            console.error("Radio Xətası:", error);
            return statusMsg.edit('❌ **Səs kanalına qoşularkən və ya mahnı yüklənərkən xəta baş verdi!**');
        }
    }
};