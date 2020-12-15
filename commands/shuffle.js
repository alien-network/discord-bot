import config from '../config.js';

export default {
  name: 'shuffle',
  description: 'Shuffle users to different voice channels. Useful for playing against eachother in random teams',
  usage: '- `/shuffle <n_teams>` Shuffle all connected users in <#' + config.shuffle_lobby_id + '> to n different voice channels',
  async execute(msg, args) {
    // Check if user is in the lobby
    if (msg.member.voice.channelID != config.shuffle_lobby_id) {
      msg.reply('You must be in the lobby to shuffle');
      return;
    }

    // No arguments
    if (args.length === 0) {
      msg.reply('Missing argument <n_teams>');
      return;
    }

    const n_teams = Number(args[0]);

    if (isNaN(n_teams)) {
      msg.reply('n_teams must be a number');
      return;
    }

    // Maximum 10 teams
    if (n_teams > 10) {
      msg.reply('Sorry a maximum of 10 teams is allowed');
      return;
    }

    const shuffle_category = await msg.client.channels.fetch(config.shuffle_category_id);
    
    msg.reply(`Shuffling into ${n_teams} teams`);

    // Delete all shuffle chennels except the lobby
    shuffle_category.children.forEach(channel => {
      if (channel.id == config.shuffle_lobby_id) return;
      channel.delete();
    })

    let team_channels = Array();

    // Create team voice channels
    for (let i = 0; i < n_teams; i++) {
      let team_channel = await msg.guild.channels.create(`team ${i+1}`, {
        type: 'voice', bitrate: 96000, parent: shuffle_category
      });
      team_channels.push(team_channel);
    }

    // Split and shuffle members
    const shuffle_lobby = await msg.client.channels.fetch(config.shuffle_lobby_id);
    let split_lobby_members = Array.from(shuffle_lobby.members.values());
    let shuffle_lobby_members = shuffle_array(split_lobby_members);
    let shuffled_members = [];
    for (let i = n_teams; i > 0; i--) {
      shuffled_members.push(shuffle_lobby_members.splice(0, Math.ceil(shuffle_lobby_members.length / i)));
    }
    
    // Move members to voice channels
    for (let i = 0; i < team_channels.length; i++) {
      shuffled_members[i].forEach(shuffled_member => {
        shuffled_member.voice.setChannel(team_channels[i]);
      })
    }
  }
}

function shuffle_array(a) {
  for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}