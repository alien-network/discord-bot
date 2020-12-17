import { MessageEmbed } from 'discord.js';
import config from '../config.js';
import Command from '../models/command.js';

const name = 'announce';
const description = 'Write a announcement';
const usage = `- \`/announce message <message>\` Place an announcement in the <#${config.announcementsChannelId}> channel \n- \`/announce command <command>\` Announce a new command \n- \`/announce edit <message_id> [message/command] <message/command>\` Edit an announcement`;

const subcommands = ['message', 'command', 'edit'];

const execute = async (msg, args, commands) => {
  // Check if user is admin
  if (msg.author.id !== config.admin_user_id) return;

  // No arguments
  if (args.length === 0) return;

  // Get the subcommand ex: create, delete, invite, ...
  const subcommand = args[0];
  if (!subcommands.includes(subcommand)) {
    msg.reply('Unknown command option');
    return;
  }

  const announcementsChannel = await msg.client.channels.fetch(
    config.announcementsChannelId
  );
  if (args[0] === 'message') {
    announcementsChannel.send(args.slice(1).join(' '));
  } else if (args[0] === 'command') {
    const command = commands.get(args[1]);
    if (command) {
      const embed = new MessageEmbed()
        .setTitle(`✨ New bot command: \`/${command.name}\``)
        .setColor(0x370052)
        .setFooter(
          `Brought to you by ${msg.author.username}`,
          msg.author.avatarURL()
        )
        .setDescription(command.description)
        .addField('Usage: ', command.usage);
      announcementsChannel.send(embed);
    } else {
      msg.reply('Command not found');
    }
  } else if (args[0] === 'edit') {
    const messageId = args[1];
    const messages = await announcementsChannel.messages.fetch({
      around: messageId,
      limit: 1,
    });
    const message = messages.first();
    if (!message) {
      msg.reply('Message not found');
      return;
    }
    if (args[2] === 'message') {
      message.edit(args.slice(3).join(' '));
    } else if (args[2] === 'command') {
      const command = commands.get(args[3]);
      if (!command) {
        msg.reply(`Command ${args[3]} not found`);
        return;
      }
      const embed = new MessageEmbed()
        .setTitle(`✨ New bot command: \`/${command.name}\``)
        .setColor(0x370052)
        .setFooter(
          `Brought to you by ${msg.author.username}`,
          msg.author.avatarURL()
        )
        .setDescription(command.description)
        .addField('Usage: ', command.usage);
      message.edit(embed);
    } else {
      msg.reply('Unkown command option');
    }
  }
};

const announceCommand = new Command(name, description, usage);
announceCommand.subcommands = subcommands;
announceCommand.execute = execute;

export default announceCommand;
