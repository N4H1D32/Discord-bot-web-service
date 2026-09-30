const express = require('express');
const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot 7/24 Aktivdir! 🚀');
});

app.listen(PORT, () => {
    console.log(`[HTTP SERVER] Server ${PORT} portunda işə düşdü.`);
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Əmrləri saxlamaq üçün Collection (Xəritə)
client.commands = new Collection();

// commands qovluğundakı bütün .js fayllarını avtomatik oxuyuruq
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('name' in command && 'execute' in command) {
            client.commands.set(command.name, command);
            console.log(`[ƏMR YÜKLƏNDİ]: ${command.name}`);
        }
    }
}

// Bot hazır olduqda
client.once('ready', () => {
    console.log(`\n[OK] ${client.user.tag} sistemi aktivdir! Mühərrik işləyir 🚗💨\n`);
    
    client.user.setActivity(config.status, { 
        type: ActivityType[config.statusType] || ActivityType.Playing 
    });
});

// Mesaj dinləyicisi
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Prefikssiz xüsusi sözlər (sa / as kimi) üçün yoxlama
    const msgClean = message.content.toLowerCase().trim();
    if (client.commands.has(msgClean)) {
        const cmd = client.commands.get(msgClean);
        if (cmd.prefixRequired === false) {
            return cmd.execute(message, []);
        }
    }

    // Normal prefiksli əmrlər
    if (!message.content.startsWith(config.prefix)) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    try {
        await command.execute(message, args);
    } catch (error) {
        console.error(`Error executing ${commandName}:`, error);
        await message.reply('Əmr icra edilərkən xəta baş verdi!');
    }
});

client.login(config.token);