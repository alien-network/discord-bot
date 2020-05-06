const { MessageEmbed } = require('discord.js');

module.exports = {
  name: 'help',
  description: 'Get more info about other commands',
  usage: '- `/help <command>` Get more info about a specific command',
  async execute(msg, args, commands) {
    let commands_text = '';
    commands.forEach(element => {
      commands_text += '- `/' + element.name + '`\n';
    });
    if (args.length === 0) {
      const embed = new MessageEmbed()
        .setTitle('Help')
        .setColor(0x370052)
        .setDescription('To get more information about a certain command use `/help <command>`')
        .addField('Commands: ', commands_text);
      msg.reply(embed);
    } else {
      command = commands.get(args[0]);
      if (!command) {
        msg.reply('Unknown command');
        return;
      };
      const embed = new MessageEmbed()
        .setTitle('Command: `/' + command.name + '`')
        .setColor(0x370052)
        .setDescription(command.description)
        .addField('Usage: ', command.usage);
      msg.reply(embed);
    }
  }
}