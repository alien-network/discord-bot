const { MessageEmbed } = require('discord.js');
const { admin_user_id, announcements_channel_id } = require('../config.json');

module.exports = {
  name: 'announce',
  description: 'Write a announcement',
  usage: '- `/announce message <message>` Place an announcement in the <#' + announcements_channel_id + '> channel \n- `/announce command <command>` Announce a new command',
  async execute(msg, args, commands) {
    if (msg.author.id !== admin_user_id) return;
    let announcements_channel = await msg.client.channels.fetch(announcements_channel_id);
    if (args[0] === 'message') {
      announcements_channel.send(args.slice(1).join(' '));
    } else if (args[0] === 'command') {
      command = commands.get(args[1]);
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
    }
  }   
}