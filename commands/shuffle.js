import { SlashCommandBuilder } from '@discordjs/builders';
import config from '../config.js';

const shuffleArray = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export default {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription(
      'Shuffle users to different voice channels. Useful for playing against eachother in random teams'
    )
    .addIntegerOption((option) =>
      option
        .setName('n_teams')
        .setDescription('The number of teams')
        .setRequired(true)
    ),
  async execute(interaction) {
    // Check if user is in the lobby
    if (interaction.member.voice.channelId !== config.shuffleLobbyId) {
      interaction.reply({
        content: `You must be in <#${config.shuffleLobbyId}> to shuffle`,
        ephemeral: true,
      });
      return;
    }

    const nTeams = interaction.options.getInteger('n_teams');

    // Maximum 10 teams
    if (nTeams > 10) {
      interaction.reply({
        content: 'Sorry a maximum of 10 teams is allowed',
        ephemeral: true,
      });
      return;
    }

    const shuffleCategory = await interaction.client.channels.fetch(
      config.shuffleCategoryId
    );

    interaction.reply(`Shuffling into ${nTeams} teams`);

    // Delete all shuffle channels except the lobby
    shuffleCategory.children.forEach((channel) => {
      if (channel.id === config.shuffleLobbyId) return;
      channel.delete();
    });

    const teamChannelsPromise = [];

    // Create team voice channels
    for (let i = 0; i < nTeams; i++) {
      const teamChannel = interaction.guild.channels.create(`team ${i + 1}`, {
        type: 'GUILD_VOICE',
        bitrate: 96000,
        parent: shuffleCategory,
      });
      teamChannelsPromise.push(teamChannel);
    }
    const teamChannels = await Promise.all(teamChannelsPromise);

    // Split and shuffle members
    const shuffleLobby = await interaction.client.channels.fetch(
      config.shuffleLobbyId
    );
    const splitLobbyMembers = Array.from(shuffleLobby.members.values());
    const shuffleLobbyMembers = shuffleArray(splitLobbyMembers);
    const shuffledMembers = [];
    for (let i = nTeams; i > 0; i -= 1) {
      shuffledMembers.push(
        shuffleLobbyMembers.splice(0, Math.ceil(shuffleLobbyMembers.length / i))
      );
    }

    // Move members to voice channels
    for (let i = 0; i < teamChannels.length; i++) {
      shuffledMembers[i].forEach((shuffledMember) => {
        shuffledMember.voice.setChannel(teamChannels[i]);
      });
    }
  },
};
