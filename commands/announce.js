import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder } from 'discord.js';
import config from '../config.js';
import anilist from '../lib/anilist-api.js';
import tmdb from '../lib/tmdb-api.js';

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
        .setName('anilist')
        .setDescription('Announce a new movie, serie or season on Jellyfin')
        .addIntegerOption((option) =>
          option
            .setName('id')
            .setDescription('Id of the item on AniList')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('tmdb')
        .setDescription('Announce a new episode on Jellyfin')
        .addIntegerOption((option) =>
          option
            .setName('id')
            .setDescription('Id of the movie or show')
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName('season_number')
            .setDescription('Season number')
            .setRequired(false)
        )
        .addIntegerOption((option) =>
          option
            .setName('episode_number')
            .setDescription('Episode number')
            .setRequired(false)
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
      const embed = new EmbedBuilder()
        .setTitle(`✨ New bot command: \`/${command.data.name}\``)
        .setColor(0x370052)
        .setFooter({
          text: `Brought to you by ${interaction.member.displayName}`,
          iconUrl: interaction.member.user.displayAvatarURL(),
        })
        .setDescription(command.data.description);
      announcementsChannel.send({ embeds: [embed] });
      interaction.reply({
        content: `Command ${command.data.name} announced in <#${config.announcementsChannelId}>`,
        ephemeral: true,
      });
    } else if (subcommand === 'anilist') {
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
      let { description } = media;
      if (media.description.length > 1024) {
        description = `${media.description.substring(0, 1023)}…`;
      }
      const embed = new EmbedBuilder()
        .setTitle(`${media.title.english} now available on Jellyfin!`)
        .setImage(media.coverImage.large)
        .setDescription(
          `Watch ${media.title.english} on https://jellyfin.jdtech.dev`
        )
        .addFields(
          { name: 'Description', value: description.replace(/<br\s*[/]?>/gi, '').replace(/<\s*[/]?i\s*[/]?>/gi, '*').replace(/<\s*[/]?b\s*[/]?>/gi, '**')}, 
          { name: 'Episodes', value: media.episodes ? media.episodes.toString() : 'N/A', inline: true}
        )
        .setColor(media.coverImage.color)
        .setFooter({
          text: 'Powered by AniList',
          iconURL: 'https://anilist.co/img/icons/android-chrome-512x512.png',
        });
      jellyfinAnnouncementsChannel.send({ embeds: [embed] });
      interaction.reply({
        content: `Announcement sent in <#${config.jellyfinAnnouncementsChannelId}>`,
        ephemeral: true,
      });
    } else if (subcommand === 'tmdb') {
      const jellyfinAnnouncementsChannel =
        await interaction.client.channels.fetch(
          config.jellyfinAnnouncementsChannelId
        );
      let tvId = interaction.options.getInteger('id')
      let seasonNumber = interaction.options.getInteger('season_number')
      let episodeNumber = interaction.options.getInteger('episode_number')
      const configurationData = await tmdb.getConfiguration();
      const tvShowData = await tmdb.getTvShow(tvId);
      let embed;
      if (!seasonNumber && !episodeNumber) {
        embed = new EmbedBuilder()
          .setTitle(`${tvShowData.name} is now available on Jellyfin!`)
          .setImage(`${configurationData.images.secure_base_url}original${tvShowData.poster_path}`)
          .setDescription(tvShowData.overview)
          .setColor('#0d253f')
          .setFooter({
            text: 'Powered by TMDB',
            iconURL: 'https://www.themoviedb.org/assets/2/favicon-43c40950dbf3cffd5e6d682c5a8986dfdc0ac90dce9f59da9ef072aaf53aebb3.png',
          });
      } else {
        const seasonData = await tmdb.getSeason(tvId, seasonNumber);
        const episodeData = await tmdb.getEpisode(tvId, seasonNumber, episodeNumber);
        embed = new EmbedBuilder()
          .setTitle(`${tvShowData.name} ${seasonData.name} Episode ${episodeNumber} is now available on Jellyfin!`)
          .setImage(`${configurationData.images.secure_base_url}original${episodeData.still_path}`)
          .setThumbnail(`${configurationData.images.secure_base_url}original${seasonData.poster_path}`)
          .setDescription(episodeData.overview)
          .setColor('#0d253f')
          .setFooter({
            text: 'Powered by TMDB',
            iconURL: 'https://www.themoviedb.org/assets/2/favicon-43c40950dbf3cffd5e6d682c5a8986dfdc0ac90dce9f59da9ef072aaf53aebb3.png',
          });
      }
      jellyfinAnnouncementsChannel.send({ embeds: [embed] });
      interaction.reply({
        content: `Announcement sent in <#${config.jellyfinAnnouncementsChannelId}>`,
        ephemeral: true,
      });
    }
  },
};
