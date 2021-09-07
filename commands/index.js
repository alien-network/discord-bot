import { Collection } from 'discord.js';
import announceCommand from './announce.js';
import shuffleCommand from './shuffle.js';

export const commandsArray = [];
const commands = new Collection();

commands.set(announceCommand.data.name, announceCommand);
commands.set(shuffleCommand.data.name, shuffleCommand);

commands.forEach((command) => {
  commandsArray.push(command.data.toJSON());
});

export default commands;
