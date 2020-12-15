export default {
  name: 'room',
  description: 'Your own private voice channel in the server. Invite your friends and have a private conversation, of course you can also kick them 😉',
  usage: '- `/room create` Create your room \n- `/room delete` Delete your room \n- `/room invite <@user>` Invite @user to your room \n- `/room kick <@user>` Kick @user from your room \n- `/room rename <name>` Rename your room \n- `/room invisible [true/false]` Make your room invisible/visible for other users',
  subcommands: ['create', 'delete', 'invite', 'kick', 'rename', 'invisible'],
  async execute(msg, args, keyv) {
    // No arguments
    if (args.length === 0) return;

    // Get the subcommand ex: create, delete, invite, ...
    let subcommand = args[0];
    if (!this.subcommands.includes(subcommand)) {
      msg.reply('Unknown command option');
      return;
    };

    // Check if user has a room
    let room_id = await keyv.get('room-' + msg.author.id);
    if (room_id) {
      let room = await msg.client.channels.fetch(room_id);
      // Create subcommand
      if (subcommand === 'create') {
        msg.reply('You already have a room');
        return;
      }
      // Delete subcommand
      if (subcommand === 'delete') {
        room.delete();
        keyv.delete('room-' + msg.author.id);
        msg.reply('Your room has been deleted');
        return;
      }
      // Rename subcommand
      if (subcommand === "rename") {
        const name = args.slice(1).join(' ');
        room.setName(name);
        msg.reply('Your room has been renamed to "' + name + '"');
        return;
      }
      // Invite subcommand
      if (subcommand === 'invite') {
        let user = getUserFromMention(msg, args[1]);
        if (user) {
          if (user === msg.author) {
            msg.reply('Why would you invite yourself to your own room 🤔');
            return;
          }
          room.createOverwrite(user, {
            VIEW_CHANNEL: true,
            CONNECT: true
          });
          user.send('You now have access to <@' + msg.author.id + '>\'s room');
          msg.reply(user.username + ' now has access to join your room');
        } else {
          msg.reply('Not a valid user');
        }
        return;
      }
      // Kick subcommand
      if (subcommand === 'kick') {
        let user = getUserFromMention(msg, args[1]);
        if (user) {
          if (user === msg.author) {
            msg.reply('Nice try 😉');
            return;
          }
          room.permissionOverwrites.get(user.id).delete();
          msg.guild.member(user).voice.kick();
          user.send('You have been kicked from <@' + msg.author.id + '>\'s room');
          msg.reply(user.username + ' has been kicked from your room');
        } else {
          msg.reply('Not a valid user');
        }
        return;
      }
      // Invisible subcommand
      if (subcommand === 'invisible') {
        if (args[1].toLowerCase() === 'true') {
          room.updateOverwrite(msg.guild.roles.everyone.id, {
            VIEW_CHANNEL: false
          });
          msg.reply('Your room is now invisible');
        } else if (args[1].toLowerCase() === 'false') {
          room.updateOverwrite(msg.guild.roles.everyone.id, {
            VIEW_CHANNEL: null
          });
          msg.reply('Your room is now visible');
        } else {
          msg.reply('Invalid option please use true or false');
        }
        return;
      }
    } else {
      // Create cubcommand
      if (subcommand === 'create') {
        let rooms;
        let rooms_id = await keyv.get('rooms_category_id');
        if (rooms_id) {
          rooms = await msg.client.channels.fetch(rooms_id);
        } else {
          rooms = await msg.guild.channels.create('🔒 Rooms', { type: 'category' });
          keyv.set('rooms_category_id', rooms.id);
        }
        let room = await msg.guild.channels.create(msg.author.username + '\'s room', {
          type: 'voice', bitrate: 96000, parent: rooms, permissionOverwrites: [
            {
              id: msg.guild.roles.everyone.id,
              deny: ['CONNECT']
            }, {
              id: msg.author.id,
              allow: ['VIEW_CHANNEL', 'CONNECT']
            }
          ]
        });
        keyv.set('room-' + msg.author.id, room.id);
        msg.reply('I have created your private room \nInvite someone with `/room invite @user`');
        return;
      }
      msg.reply('You don\'t have a room');
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