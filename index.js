const Discord = require('discord.js');
const fs = require('fs');
const Keyv = require('keyv');
const { bot_channel_id, redis } = require('./config.json');

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
const keyv = new Keyv('redis://' + redis.host + ':' + redis.port, { namespace: 'alien-network' });
keyv.on('error', e => console.error('Keyv connection error:', e));

client.once('ready', () => {
  console.info('Connected to Discord API');
  client.user.setActivity('everybody 😶', { type: 'WATCHING' });
})

// Capture client messages
client.on('message', async msg => {
  // Check if command and not from a bot
  if (!msg.content.startsWith('/') || msg.author.bot) return;

  // Check if user is using the bot channel
  if (msg.channel instanceof Discord.GuildChannel && msg.channel.id !== bot_channel_id) {
    msg.author.send('Please use the <#' + bot_channel_id + '> channel for bot commands');
    msg.delete();
    return;
  }

  console.log(`${msg.author.username}: ${msg.content}`);
  const args = msg.content.slice('/'.length).split(/ +/);
  const command = args.shift().toLowerCase();

  // Check what command is used
  if (command === 'help') {
    client.commands.get('help').execute(msg, args, client.commands);
  } else if (command === 'announce') {
    client.commands.get('announce').execute(msg, args, client.commands);
  } else if (command === 'room') {
    client.commands.get('room').execute(msg, args, keyv);
  } else if (command === 'shuffle') {
    client.commands.get('shuffle').execute(msg, args);
  } else {
    msg.reply('unkown command');
  }
})

// Get discord token from environment variable
DISCORD_TOKEN = process.env.DISCORD_TOKEN

if (DISCORD_TOKEN) {
  client.login();
} else {
  console.error('Please set the DISCORD_TOKEN environment variable');
}
