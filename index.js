const Discord = require('discord.js');
const fs = require('fs');
const Keyv = require('keyv');

// Initialize Discord client
const client = new Discord.Client();

// Get all commands from folder
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

// Connect to redis
const keyv = new Keyv('redis://an-bot-db:6379', { namespace: 'alien-network' });
keyv.on('error', e => console.error('Keyv connection error:', e));

client.once('ready', () => {
  console.log('Ready!');
  client.user.setActivity('everybody 😶', { type: 'WATCHING' });
})

// Capture client messages
client.on('message', async msg => {
  if (!msg.content.startsWith('/') || msg.author.bot) return;
  console.log(`${msg.author.username}: ${msg.content}`);
  const args = msg.content.slice('/'.length).split(/ +/);
  const command = args.shift().toLowerCase();
  if (command === 'room') {
    client.commands.get('room').execute(msg, args, keyv);
  } else {
    msg.reply('unkown command');
  }
})

// Get discord token from environment variable
DISCORD_TOKEN = process.env.DISCORD_TOKEN

if (DISCORD_TOKEN) {
  client.login();
} else {
  console.log('Please set the DISCORD_TOKEN environment variable');
}
