import Discord from 'discord.js';
import config from './config.js';
import commands from './commands/index.js';

console.info(`discord.js version: ${Discord.version}`);

// Initialize Discord client
const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_VOICE_STATES,
  ],
});

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
  client.user.setActivity(config.activity, { type: config.activityType });
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.channel.id !== config.botChannelId) {
    interaction.reply({
      content: `Please use the <#${config.botChannelId}> channel for bot commands`,
      ephemeral: true,
    });
    return;
  }

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: 'There was an error while executing this command!',
      ephemeral: true,
    });
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
