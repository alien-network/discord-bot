import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';
import config from '../config.js';
import anilist from '../lib/anilist-api.js';

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
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('jellyfin')
        .setDescription('Announce a new movie, serie or season on Jellyfin')
        .addIntegerOption((option) =>
          option
            .setName('id')
            .setDescription('Id of the item on AniList')
            .setRequired(true)
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
    } else if (subcommand === 'jellyfin') {
      const jellyfinAnnouncementsChannel =
        await interaction.client.channels.fetch(
          config.jellyfinAnnouncementsChannelId
        );
      const query = `
      query ($id: Int) {
        Media (id: $id, type: ANIME) {
          id
          type
          title {
            english
          }
          description (asHtml: false)
          episodes
          coverImage {
            large
            color
          }
        }
      }`;
      const variables = {
        id: interaction.options.getInteger('id'),
      };
      const data = await anilist.getData(query, variables);
      const media = data.data.Media;
      console.log(media);
      let { description } = media;
      if (media.description.length > 1024) {
        description = `${media.description.substring(0, 1023)}…`;
      }
      const embed = new MessageEmbed()
        .setTitle(`${media.title.english} now available on Jellyfin!`)
        .setImage(media.coverImage.large)
        .setDescription(
          `Watch ${media.title.english} in super duper high quality on https://jellyfin.jdtech.dev`
        )
        .addField(
          'Description',
          description
            .replace(/<br\s*[/]?>/gi, '')
            .replace(/<\s*[/]?i\s*[/]?>/gi, '*')
            .replace(/<\s*[/]?b\s*[/]?>/gi, '**')
        )
        .addField(
          'Epîsodes',
          media.episodes ? media.episodes.toString() : 'N/A',
          true
        )
        .setColor(media.coverImage.color)
        .setFooter(
          'Powered by AniList',
          'https://anilist.co/img/icons/android-chrome-512x512.png'
        );
      jellyfinAnnouncementsChannel.send({ embeds: [embed] });
      interaction.reply({
        content: `Announcement sent in <#${config.jellyfinAnnouncementsChannelId}>`,
        ephemeral: true,
      });
    }
  },
};
