import { MessageEmbed } from 'discord.js';
import Command from '../models/command.js';
import getData from '../lib/anilist-api.js';

const name = 'anilist';
const description =
  'Get information about your favorite anime, manga or character. Powered by AniList. ';
const usage = `
  - \`/anilist [anime/manga/character] info <query>\` Info about an anime, manga or character
  - \`/anilist [anime/manga] characters <media>\` Characters that play in the anime or manga
  - \`/anilist character media <character>\` Media (anime/manga) the character has played in
  `;

const subcommands = ['anime', 'manga', 'character'];

const filterCharacters = (characters, role) => {
  const roleCharacters = characters.filter(
    (character) => character.role === role
  );
  return roleCharacters;
};

const charactersString = (characters) => {
  let roleCharactersString = '';
  characters.every((character) => {
    const characterString = `[${character.node.name.full}](https://anilist.co/character/${character.node.id})\n`;
    if (roleCharactersString.length + characterString.length > 1024) {
      return false;
    }
    roleCharactersString += characterString;
    return true;
  });
  return roleCharactersString;
};

const filterMedia = (media, type) => {
  const typeMedia = media.filter((medium) => medium.type === type);
  return typeMedia;
};

const mediaString = (media) => {
  let typeMediaString = '';
  media.every((medium) => {
    const mediumString = `[${
      medium.title.romaji
    }](https://anilist.co/${medium.type.toLowerCase()}/${medium.id})\n`;
    if (typeMediaString.length + mediumString.length > 1024) {
      return false;
    }
    typeMediaString += mediumString;
    return true;
  });
  return typeMediaString;
};

const execute = async (msg, args) => {
  // No arguments
  if (args.length === 0) return;

  // Get the subcommand ex: create, delete, invite, ...
  const subcommand = args[0].toLowerCase();
  if (!subcommands.includes(subcommand)) {
    msg.reply('Unknown command option');
    return;
  }

  const searchQuery = args.slice(2).join(' ');

  if (subcommand === 'anime' || subcommand === 'manga') {
    let shorthand = '';
    if (subcommand === 'anime') {
      shorthand = '(A)';
    } else if (subcommand === 'manga') {
      shorthand = '(M)';
    }

    if (args[1] === 'info') {
      const query = `
      query ($searchQuery: String, $type: MediaType) {
        Media (search: $searchQuery, type: $type) {
          id
          title {
            romaji
          }
          description (asHtml: false)
          status
          nextAiringEpisode {
            airingAt
          }
          episodes
          averageScore
          coverImage {
            large
            color
          }
        }
      }
      `;

      const variables = {
        searchQuery,
        type: subcommand.toUpperCase(),
      };

      const media = await getData(query, variables).then(
        (data) => data.data.Media
      );

      if (media === null) {
        msg.reply('media not found');
        return;
      }

      // Next airing episode text
      let nextEpisodeDateText = null;
      if (media.nextAiringEpisode) {
        const nextEpisodeDate = new Date(
          media.nextAiringEpisode.airingAt * 1000
        );
        nextEpisodeDateText = `\nNext episode airing at: ${nextEpisodeDate.getDate()}/${nextEpisodeDate.getMonth()}/${nextEpisodeDate.getFullYear()} ${nextEpisodeDate.getHours()}:${nextEpisodeDate.getMinutes()}`;
      }

      const embed = new MessageEmbed()
        .setTitle(`${shorthand} ${media.title.romaji}`)
        .setURL(`https://anilist.co/${subcommand}/${media.id}`)
        .setDescription(
          media.description
            .replace(/<br\s*[/]?>/gi, '')
            .replace(/<\s*[/]?i\s*[/]?>/gi, '*')
            .replace(/<\s*[/]?b\s*[/]?>/gi, '**')
        )
        .addField(
          'Status: ',
          `${media.status} ${
            media.nextAiringEpisode ? nextEpisodeDateText : ''
          }`,
          true
        )
        .addField('Episodes: ', media.episodes, true)
        .addField('Average score: ', `${media.averageScore}%`, true)
        .setThumbnail(media.coverImage.large)
        .setColor(media.coverImage.color)
        .setFooter(
          'Powered by AniList',
          'https://anilist.co/img/icons/android-chrome-512x512.png'
        );

      msg.channel.send(embed);
    } else if (args[1] === 'characters') {
      const query = `
      query ($searchQuery: String, $type: MediaType) {
        Media (search: $searchQuery, type: $type) {
          title {
            romaji
          }
          coverImage {
            large
            color
          }
          characters (sort: ID) {
            pageInfo {
              total
            }
            edges {
              node {
                id
                name {
                  full
                }
              }
              role
            }
          }
        }
      }
      `;

      const variables = {
        searchQuery,
        type: subcommand.toUpperCase(),
      };

      const media = await getData(query, variables).then(
        (data) => data.data.Media
      );

      if (media === null) {
        msg.reply('media not found');
        return;
      }

      const characters = media.characters.edges;

      const embed = new MessageEmbed()
        .setTitle(`${shorthand} ${media.title.romaji} characters`)
        .setThumbnail(media.coverImage.large)
        .setColor(media.coverImage.color)
        .setFooter(
          'Powered by AniList',
          'https://anilist.co/img/icons/android-chrome-512x512.png'
        );

      const backgroundCharacters = filterCharacters(characters, 'BACKGROUND');
      const mainCharacters = filterCharacters(characters, 'MAIN');
      const supportingCharacters = filterCharacters(characters, 'SUPPORTING');

      const backgroundCharactersString = charactersString(backgroundCharacters);
      const mainCharactersString = charactersString(mainCharacters);
      const supportingCharactersString = charactersString(supportingCharacters);

      if (backgroundCharacters.length > 0) {
        embed.addField('Background characters: ', backgroundCharactersString);
      }

      if (mainCharacters.length > 0) {
        embed.addField('Main characters: ', mainCharactersString);
      }

      if (supportingCharacters.length > 0) {
        embed.addField('Supporting characters: ', supportingCharactersString);
      }

      msg.channel.send(embed);
    }
  } else if (subcommand === 'character') {
    if (args[1] === 'info') {
      const query = `
      query ($searchQuery: String) {
        Character (search: $searchQuery) {
          id
          name {
            full
          }
          description
          image {
            large
          }
        }
      }    
      `;
      const variables = {
        searchQuery,
      };

      const character = await getData(query, variables).then(
        (data) => data.data.Character
      );

      if (character === null) {
        msg.reply('character not found');
        return;
      }

      const embed = new MessageEmbed()
        .setTitle(`(C) ${character.name.full}`)
        .setURL(`https://anilist.co/character/${character.id}`)
        .setThumbnail(character.image.large)
        .setDescription(
          character.description
            .replace(/<br\s*[/]?>/gi, '')
            .replace(/<\s*[/]?i\s*[/]?>/gi, '*')
            .replace(/<\s*[/]?b\s*[/]?>/gi, '**')
        )
        .setFooter(
          'Powered by AniList',
          'https://anilist.co/img/icons/android-chrome-512x512.png'
        );

      msg.channel.send(embed);
    } else if (args[1] === 'media') {
      const query = `
      query ($searchQuery: String) {
        Character (search: $searchQuery) {
          id
          name {
            full
          }
          image {
            large
          }
          media (sort: ID) {
            nodes {
              id
              title {
                romaji
              }
              type
            }
          }
        }
      }
      `;
      const variables = {
        searchQuery,
      };

      const character = await getData(query, variables).then(
        (data) => data.data.Character
      );

      if (character === null) {
        msg.reply('character not found');
        return;
      }

      const media = character.media.nodes;

      const embed = new MessageEmbed()
        .setTitle(`(C) ${character.name.full} media`)
        .setURL(`https://anilist.co/character/${character.id}`)
        .setThumbnail(character.image.large)
        .setFooter(
          'Powered by AniList',
          'https://anilist.co/img/icons/android-chrome-512x512.png'
        );

      const animeMedia = filterMedia(media, 'ANIME');
      const mangaMedia = filterMedia(media, 'MANGA');

      const animeMediaString = mediaString(animeMedia);
      const mangaMediaString = mediaString(mangaMedia);

      if (animeMedia.length > 0) {
        embed.addField('Anime: ', animeMediaString);
      }

      if (mangaMedia.length > 0) {
        embed.addField('Manga: ', mangaMediaString);
      }

      msg.channel.send(embed);
    }
  }
};

const announceCommand = new Command(name, description, usage);
announceCommand.subcommands = subcommands;
announceCommand.execute = execute;

export default announceCommand;
