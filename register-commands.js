import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { commandsArray } from './commands/index.js';
import config from './config.js';

const { DISCORD_TOKEN } = process.env;

const rest = new REST({ version: '9' }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');
    console.log(commandsArray);

    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commandsArray }
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();
