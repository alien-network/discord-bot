module.exports = {
  name: 'room',
  description: 'Create and manage your private room',
  async execute(msg, args, keyv) {
    let subcommand = args[0];
    if (args.length === 0) {
      msg.reply('your own private room where you can invite other people');
    } else if (subcommand === 'create') {
      let rooms;
      let rooms_id = await keyv.get('rooms_category_id');
      if (rooms_id) {
        rooms = await msg.client.channels.fetch(rooms_id);
      } else {
        rooms = await msg.guild.channels.create('rooms', { type: 'category' });
        keyv.set('rooms_category_id', rooms.id);
      }
      let room_id = await keyv.get('room-' + msg.author.id);
      if (room_id) {
        msg.reply('you already have a room');
      } else {
        let room = await msg.guild.channels.create(msg.author.username + '\'s room', {
          type: 'voice', bitrate: 96000, parent: rooms, permissionOverwrites: [
            {
              id: msg.guild.roles.everyone.id, 
              deny: ['CONNECT']
            }
          ]
        });
        keyv.set('room-' + msg.author.id, room.id);
        msg.reply('I have created your private room \nInvite someone with `/room invite @user`')
      }
    } else if (subcommand === 'delete') {
      let room_id = await keyv.get('room-' + msg.author.id);
      if (room_id) {
        let room = await msg.client.channels.fetch(room_id);
        room.delete();
        keyv.delete('room-' + msg.author.id);
        msg.reply('your room has been deleted');
      } else {
        msg.reply('you don\'t have a room');
      }
    } else if (subcommand === "rename") {
      let room_id = await keyv.get('room-' + msg.author.id);
      if (room_id) {
        let room = await msg.client.channels.fetch(room_id);
        room.setName(args.slice(1).join(' '));
      } else {
        msg.reply('you don\'t have a room');
      }
    } else if (subcommand === 'invite') {
      let room_id = await keyv.get('room-' + msg.author.id);
      if (room_id) {
        let room = await msg.client.channels.fetch(room_id);
        let user = getUserFromMention(msg, args[1]);
        if (user) {
          room.createOverwrite(user, {
            CONNECT: true
          });
          user.send('You now have access to <@' + msg.author.id + '>\'s room');
          msg.reply(user.username + ' now has access to join your room');
        } else {
          msg.reply('not a valid user');
        }
      } else {
        msg.reply('you don\'t have a room');
      }
    } else if (subcommand === "kick") {
      let room_id = await keyv.get('room-' + msg.author.id);
      if (room_id) {
        let room = await msg.client.channels.fetch(room_id);
        let user = getUserFromMention(msg, args[1]);
        if (user) {
          room.permissionOverwrites.get(user.id).delete();
          console.log(user);
          msg.guild.member(user).voice.kick();
          user.send('You have been kicked from <@' + msg.author.id + '>\'s room');
          msg.reply(user.username + ' has been kicked from your room');
        } else {
          msg.reply('not a valid user');
        }
      } else {
        msg.reply('you don\'t have a room');
      }
    } else {
      msg.reply('unknown command arguments');
    }
  }
}

function getUserFromMention(msg, mention) {
  if (!mention) return;

  if (mention.startsWith('<@') && mention.endsWith('>')) {
    mention = mention.slice(2, -1);

    if (mention.startsWith('!')) {
      mention = mention.slice(1);
    }

    return msg.client.users.cache.get(mention);
  } else {
    return;
  }
}