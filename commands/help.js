import { MessageEmbed } from 'discord.js';
import Command from '../models/command.js';

const name = 'help';
const description = 'Get more info about other commands';
const usage = '- `/help <command>` Get more info about a specific command';

const execute = (msg, args, commands) => {
  let commandsText = '';
  commands.forEach((command) => {
    commandsText += `- \`/${command.name}\`\n`;
  });
  if (args.length === 0) {
    const embed = new MessageEmbed()
      .setTitle('Help')
      .setColor(0x370052)
      .setDescription(
        'To get more information about a certain command use `/help <command>`'
      )
      .addField('Commands: ', commandsText);
    msg.reply(embed);
  } else {
    const command = commands.get(args[0]);
    if (!command) {
      msg.reply('Unknown command');
      return;
    }
    const embed = new MessageEmbed()
      .setTitle(`Command: \`/${command.name}\``)
      .setColor(0x370052)
      .setDescription(command.description)
      .addField('Usage: ', command.usage);
    msg.reply(embed);
  }
};

const helpCommand = new Command(name, description, usage);
helpCommand.execute = execute;

export default helpCommand;
