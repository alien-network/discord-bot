import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';
import config from '../config.js';
import anilist from '../lib/anilist-api.js';

export default {
  data: new SlashCommandBuilder()
    .setName('jellyfin')
    .setDescription('Commands related to Jellyfin')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('announce')
        .setDescription('Announce a new movie, serie or season on Jellyfin')
        .addIntegerOption((option) =>
          option.setName('id').setDescription('Id of the item on AniList').setRequired(true)
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

    const jellyfinAnnouncementsChannel = await interaction.client.channels.fetch(
      config.jellyfinAnnouncementsChannelId
    );
    if (subcommand === 'announce') {
      const query = `
      query ($id: Int) {
        Media (id: $id, type: ANIME) {
          id
          title {
            romaji
            english
            native
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
      const embed = new MessageEmbed()
        .setTitle(`${media.title.english} now available on Jellyfin!`)
        .setDescription(`Watch ${media.title.english} in super duper high quality on https://jellyfin.jdtech.dev`)
        .addField('Description: ', media.description
            .replace(/<br\s*[/]?>/gi, '')
            .replace(/<\s*[/]?i\s*[/]?>/gi, '*')
            .replace(/<\s*[/]?b\s*[/]?>/gi, '**'),
          true
        )
        //.addField('Epîsodes: ', media.episodes, true)
        .setThumbnail(media.coverImage.large)
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
      jellyfinAnnouncementsChannel.send({ embeds: [embed] });
      interaction.reply({
        content: `Command ${command.data.name} announced in <#${config.announcementsChannelId}>`,
        ephemeral: true,
      });
    }
  },
};
