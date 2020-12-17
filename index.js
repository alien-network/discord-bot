import Discord from 'discord.js';
import Keyv from 'keyv';
import config from './config.js';
import * as commands from './commands/index.js';

console.info(`discord.js version: ${Discord.version}`);

// Initialize Discord client
const client = new Discord.Client();

// Shutdown function for clean shutdown
const shutdown = () => {
  console.info('Shutting down...');
  client.destroy();
  process.exit();
};

// Receive SIGINT
process.once('SIGINT', () => {
  shutdown();
});

// Receive SIGTERM
process.once('SIGTERM', () => {
  shutdown();
});

// Get all commands from folder
client.commands = new Discord.Collection();
for (const command in commands) {
  client.commands.set(commands[command].name, commands[command]);
}

// Connect to redis
const keyv = new Keyv(`redis://${config.redis.host}:${config.redis.port}`, {
  namespace: 'alien-network',
});
keyv.on('error', (e) => console.error('Keyv connection error:', e));

client.once('ready', () => {
  console.info('Connected to Discord API');
  client.user.setActivity('everybody 😶', { type: 'WATCHING' });
});

// Capture client messages
client.on('message', async (msg) => {
  // Check if command and not from a bot
  if (!msg.content.startsWith('/') || msg.author.bot) return;

  // Check if user is using the bot channel
  if (
    msg.channel instanceof Discord.GuildChannel &&
    msg.channel.id !== config.botChannelId
  ) {
    msg.author.send(
      `Please use the <#${config.botChannelId}> channel for bot commands`
    );
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
});

// Get discord token from environment variable
const { DISCORD_TOKEN } = process.env;

if (DISCORD_TOKEN) {
  client.login();
} else {
  console.error('Please set the DISCORD_TOKEN environment variable');
  shutdown();
}
