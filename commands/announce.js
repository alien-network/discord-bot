import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';
import config from '../config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Write an announcement')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('message')
        .setDescription('Announce a message')
        .addStringOption((option) =>
          option.setName('m').setDescription('Message').setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('command')
        .setDescription('Announce a command')
        .addStringOption((option) =>
          option.setName('c').setDescription('Command').setRequired(true)
        )
    ),
  async execute(interaction) {
    // Check if user is admin
    if (interaction.member.id !== config.adminUserId) {
      interaction.reply({
        content: 'You are not an administrator',
        ephemeral: true,
      });
      return;
    }

    // Get the subcommand ex: message, command, ...
    const subcommand = interaction.options.getSubcommand();

    const announcementsChannel = await interaction.client.channels.fetch(
      config.announcementsChannelId
    );
    if (subcommand === 'message') {
      announcementsChannel.send(interaction.options.getString('m'));
      interaction.reply({
        content: `Message sent in <#${config.announcementsChannelId}>`,
        ephemeral: true,
      });
    } else if (subcommand === 'command') {
      const command = interaction.client.commands.get(
        interaction.options.getString('c')
      );
      if (!command) {
        interaction.reply({
          content: 'Command not found',
          ephemeral: true,
        });
        return;
      }
      const embed = new MessageEmbed()
        .setTitle(`✨ New bot command: \`/${command.data.name}\``)
        .setColor(0x370052)
        .setFooter(
          `Brought to you by ${interaction.member.displayName}`,
          interaction.member.user.displayAvatarURL()
        )
        .setDescription(command.data.description);
      announcementsChannel.send({ embeds: [embed] });
      interaction.reply({
        content: `Command ${command.data.name} announced in <#${config.announcementsChannelId}>`,
        ephemeral: true,
      });
    }
  },
};
