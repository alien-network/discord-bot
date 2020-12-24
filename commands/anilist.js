import { MessageEmbed } from 'discord.js';
import Command from '../models/command.js';
import getData from '../lib/anilist-api.js';

const name = 'anilist';
const description = 'AniList commands';
const usage = `
- \`/anilist [anime/manga/character] info <query>\` Info about an anime, manga or character 
- \`/anilist [anime/manga] characters <query>\` Characters that play in the anime or manga
- \`/anilist character media <query>\` Media the character has played in.
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
}

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
  }
};

const announceCommand = new Command(name, description, usage);
announceCommand.subcommands = subcommands;
announceCommand.execute = execute;

export default announceCommand;
