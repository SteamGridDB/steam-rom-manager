const { request } = require("https");

const getLatestRelease = () =>
  new Promise((resolve) => {
    const req = request(
      {
        hostname: "api.github.com",
        port: 443,
        path: "/repos/steamgriddb/steam-rom-manager/releases/latest",
        method: "GET",
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "steamgriddb/steam-rom-manager",
        },
      },
      (resp) => {
        let output = "";
        resp.on("data", (chunk) => (output += chunk));
        resp.on("end", () => resolve(JSON.parse(output)));
      },
    );
    req.end();
  });

const formatDiscordMD = (body) => {
  // Normalize \r\n
  body = body.replace(/\r\n/gm, "\n");
  // Strip out main header (should just be the version, which is shown already)
  body = body.replace(/^#{2} [\d\.]*/g, "");
  // Replace rest of the ## with underlined bold text followed by a :
  body = body.replace(/^#{2} (.*)/gm, "**__$1__:**");
  // Make ### bold
  body = body.replace(/^#{3} (.*)/gm, "\n**$1**");
  // Replace checkboxes
  body = body.replace(/^[\*|-] \[ \]/gm, "☐");
  body = body.replace(/^[\*|-] \[x\]/gm, "\\☑"); // escape so Discord doesn't turn it into a huge emoji
  // Replace list items with •
  body = body.replace(/^[\*|-] /gm, "• ");
  // Replace triple newlines that may have been created with doubles
  body = body.replace(/\n\n\n/gm, "\n\n");
  return body;
};

(async () => {
  // Get latest GitHub release
  const ghbody = await getLatestRelease();

  // https://discord.com/developers/docs/resources/webhook#execute-webhook
  const discordHookData = {
    username: "Steam ROM Manager",
    avatar_url: "https://i.imgur.com/9isYw2q.png",
    content: "<@&912746542492966922>",
    allowed_mentions: {
      parse: ["roles"],
    },
    // https://discord.com/developers/docs/resources/channel#embed-object
    embeds: [
      {
        color: 2657830,
        description: formatDiscordMD(ghbody.body),
        timestamp: ghbody.published_at,
        url: ghbody.html_url,
        author: {
          name: `Release ${ghbody.tag_name}`,
          url: "https://github.com/SteamGridDB/steam-rom-manager/releases/latest",
        },
      },
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 5,
            label: `Download ${ghbody.tag_name}`,
            url: ghbody.html_url,
          },
          {
            type: 2,
            style: 5,
            label: "Full Changelog",
            url: `https://github.com/SteamGridDB/steam-rom-manager/blob/master/CHANGELOG.md#${ghbody.name.replace(/\./g, "")}`, // scroll to version
          },
          {
            type: 2,
            style: 5,
            label: "Read Me",
            url: "https://github.com/SteamGridDB/steam-rom-manager/blob/master/README.md",
          },
        ],
      },
    ],
  };

  // Send Discord hook, edits message if MSG_EDIT_ID env variable is a message
  const discordReq = request({
    hostname: "discord.com",
    port: 443,
    path: `/api/webhooks/${process.env.DISCORD_HOOK_ID}/${process.env.DISCORD_HOOK_TOKEN}${process.env.MSG_EDIT_ID ? `/messages/${process.env.MSG_EDIT_ID}` : ""}`,
    method: process.env.MSG_EDIT_ID ? "PATCH" : "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  discordReq.write(JSON.stringify(discordHookData));
  discordReq.end();
})();
