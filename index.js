import Discord from 'discord.js';
import config from './config.js';
import commands from './commands/index.js';

console.info(`discord.js version: ${Discord.version}`);

// Initialize Discord client
const client = new Discord.Client();

// Make commands part of client object
client.commands = commands;

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

client.once('ready', () => {
  console.info('Connected to Discord API');
  client.user.setActivity('everybody 😶', { type: 'WATCHING' });
});

// Capture client messages
client.on('message', (msg) => {
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
  const commandName = args.shift().toLowerCase();

  // Check what command is used
  const command = client.commands.get(commandName);
  if (command) {
    command.execute(msg, args);
  } else {
    msg.reply('unknown command');
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
