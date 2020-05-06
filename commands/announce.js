const { MessageEmbed } = require('discord.js');
const { admin_user_id, announcements_channel_id } = require('../config.json');

module.exports = {
  name: 'announce',
  description: 'Write a announcement',
  usage: '- `/announce message <message>` Place an announcement in the <#' + announcements_channel_id + '> channel \n- `/announce command <command>` Announce a new command \n- `/announce edit <message_id> [message/command] <message/command>` Edit an announcement',
  subcommands: ['message', 'command', 'edit'],
  async execute(msg, args, commands) {
    // Check if user is admin
    if (msg.author.id !== admin_user_id) return;

    // No arguments
    if (args.length === 0) return;

    // Get the subcommand ex: create, delete, invite, ...
    let subcommand = args[0];
    if (!this.subcommands.includes(subcommand)) {
      msg.reply('Unknown command option');
      return;
    };

    let announcements_channel = await msg.client.channels.fetch(announcements_channel_id);
    if (args[0] === 'message') {
      announcements_channel.send(args.slice(1).join(' '));
    } else if (args[0] === 'command') {
      const command = commands.get(args[1]);
      if (command) {
        const embed = new MessageEmbed()
          .setTitle('✨ New bot command: `/' + command.name + '`')
          .setColor(0x370052)
          .setFooter('Brought to you by ' + msg.author.username, msg.author.avatarURL())
          .setDescription(command.description)
          .addField('Usage: ', command.usage);
        announcements_channel.send(embed);
      } else {
        msg.reply('Command not found');
      }
    } else if (args[0] === 'edit') {
      const message_id = args[1];
      const messages = await announcements_channel.messages.fetch({ around: message_id, limit: 1 })
      const message = messages.first()
      if (!message) {
        msg.reply('Message not found');
        return;
      }
      if (args[2] === 'message') {
        message.edit(args.slice(3).join(' '))
      } else if (args[2] === 'command') {
        const command = commands.get(args[3]);
        if (!command) {
          msg.reply(`Command ${args[3]} not found`);
          return;
        }
        const embed = new MessageEmbed()
          .setTitle('✨ New bot command: `/' + command.name + '`')
          .setColor(0x370052)
          .setFooter('Brought to you by ' + msg.author.username, msg.author.avatarURL())
          .setDescription(command.description)
          .addField('Usage: ', command.usage);
        message.edit(embed);
      } else {
        msg.reply('Unkown command option');
      }
    }
  }
}