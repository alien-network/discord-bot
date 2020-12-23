import { Collection } from 'discord.js';
import anilistCommand from './anilist.js';
import announceCommand from './announce.js';
import helpCommand from './help.js';
import roomCommand from './room.js';
import shuffleCommand from './shuffle.js';

const commands = new Collection();

commands.set(anilistCommand.name, anilistCommand);
commands.set(announceCommand.name, announceCommand);
commands.set(helpCommand.name, helpCommand);
commands.set(roomCommand.name, roomCommand);
commands.set(shuffleCommand.name, shuffleCommand);

export default commands;
