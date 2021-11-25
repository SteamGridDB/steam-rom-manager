const { request } = require('https');

const getLatestRelease = () => new Promise((resolve) => {
  const req = request({
    hostname: 'api.github.com',
    port: 443,
    path: '/repos/steamgriddb/steam-rom-manager/releases/latest',
    method: 'GET',
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'steamgriddb/steam-rom-manager'
    }
  }, (resp) => {
    let output = '';
    resp.on('data', (chunk) => output += chunk);
    resp.on('end', () => resolve(JSON.parse(output)));
  });
  req.end();
});

(async () => {
  // Get latest GitHub release
  const ghbody = await getLatestRelease();

  // https://discord.com/developers/docs/resources/webhook#execute-webhook
  const discordHookData = {
    username: 'Steam ROM Manager',
    avatar_url: 'https://i.imgur.com/9isYw2q.png',
    content: '',
    allowed_mentions: {
      parse: []
    },
    // https://discord.com/developers/docs/resources/channel#embed-object
    embeds: [
      {
        title: ghbody.name,
        color: 2657830,
        description: ghbody.body,
        timestamp: ghbody.published_at,
        url: ghbody.html_url,
        author: {
          name: 'Latest Release',
          url: 'https://github.com/SteamGridDB/steam-rom-manager/releases'
        }
      }
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 5,
            label: 'Full Changelog',
            url: 'https://github.com/SteamGridDB/steam-rom-manager/blob/master/CHANGELOG.md'
          },
          {
            type: 2,
            style: 5,
            label: 'Read Me',
            url: 'https://github.com/SteamGridDB/steam-rom-manager/blob/master/README.md'
          }
        ]
      }
    ]
  };


  // Send Discord hook, edits message if MSG_EDIT_ID env variable is a message
  const discordReq = request({
    hostname: 'discord.com',
    port: 443,
    path: `/api/webhooks/${process.env.DISCORD_HOOK_ID}/${process.env.DISCORD_HOOK_TOKEN}${process.env.MSG_EDIT_ID ? `/messages/${process.env.MSG_EDIT_ID}` : ''}`,
    method: process.env.MSG_EDIT_ID ? 'PATCH' : 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  discordReq.write(JSON.stringify(discordHookData));
  discordReq.end();
})();
