import config from '../config.js';
import Command from '../models/command.js';

const name = 'shuffle';
const description =
  'Shuffle users to different voice channels. Useful for playing against eachother in random teams';
const usage = `
  - \`/shuffle <n_teams>\` Shuffle all connected users in <#${config.shuffleLobbyId}> to n different voice channels`;

const shuffleArray = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const execute = async (msg, args) => {
  // Check if user is in the lobby
  if (msg.member.voice.channelID !== config.shuffleLobbyId) {
    msg.reply('You must be in the lobby to shuffle');
    return;
  }

  // No arguments
  if (args.length === 0) {
    msg.reply('Missing argument <n_teams>');
    return;
  }

  const nTeams = Number(args[0]);

  if (Number.isNaN(nTeams)) {
    msg.reply('n_teams must be a number');
    return;
  }

  // Maximum 10 teams
  if (nTeams > 10) {
    msg.reply('Sorry a maximum of 10 teams is allowed');
    return;
  }

  const shuffleCategory = await msg.client.channels.fetch(
    config.shuffleCategoryId
  );

  msg.reply(`Shuffling into ${nTeams} teams`);

  // Delete all shuffle chennels except the lobby
  shuffleCategory.children.forEach((channel) => {
    if (channel.id === config.shuffleLobbyId) return;
    channel.delete();
  });

  const teamChannelsPromise = [];

  // Create team voice channels
  for (let i = 0; i < nTeams; i++) {
    const teamChannel = msg.guild.channels.create(`team ${i + 1}`, {
      type: 'voice',
      bitrate: 96000,
      parent: shuffleCategory,
    });
    teamChannelsPromise.push(teamChannel);
  }
  const teamChannels = await Promise.all(teamChannelsPromise);

  // Split and shuffle members
  const shuffleLobby = await msg.client.channels.fetch(config.shuffleLobbyId);
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
};

const shuffleCommand = new Command(name, description, usage);
shuffleCommand.execute = execute;

export default shuffleCommand;
