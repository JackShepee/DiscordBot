const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("player")
    .setDescription("Find player stats by his nickname or ID!")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Enter player nickname or ID!")
        .setRequired(true)
    ),
  async execute(interaction) {
    const playerNameOrId = interaction.options.getString("name");
    try {
      // Check whether the argument is a number (i.e. player ID)
      const isPlayerId = !isNaN(playerNameOrId);
      
      // Search for the player based on the argument
      const searchUrl = isPlayerId
        ? `https://api.opendota.com/api/players/${playerNameOrId}`
        : `https://api.opendota.com/api/search?q=${playerNameOrId}`;

      const searchResponse = await axios.get(searchUrl);
      
      // Get the player ID from the response (either directly or from the first search result)
      const playerId = isPlayerId ? playerNameOrId : searchResponse.data[0]?.account_id;
      
      if (playerId) {
        const playerResponse = await axios.get(
          `https://api.opendota.com/api/players/${playerId}`
        );
        const statsResponse = await axios.get(
          `https://api.opendota.com/api/players/${playerId}/wl`
        );
        const recentMatchesResponse = await axios.get(
          `https://api.opendota.com/api/players/${playerId}/recentMatches`
        );

        const player = playerResponse.data;
        const stats = statsResponse.data;
        const recentMatches = recentMatchesResponse.data;

        // Use the player name from the response if available, otherwise use the argument
        const playerName = player.personaname || playerNameOrId;

        const embed = new EmbedBuilder()
          .setColor("d90429")
          .setTitle(player.profile.personaname || playerName)
          .setURL(player.profile.profileurl)
          .setDescription(`https://www.opendota.com/players/${player.profile.account_id}`)
          .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/c/ce/Dota-2-small-icon.png')
          .addFields(
            {
              name: "Player stats",
              value: `Wins: ${stats.win}, Loses: ${
                stats.lose
              }, Winrate: ${Math.round(
                (stats.win / (stats.win + stats.lose)) * 100
              )}%`,
            },
            {
              name: "Recent match:",
              value: `https://www.opendota.com/matches/${recentMatches[0].match_id}`,
            }
          )
          .setImage(player.profile.avatarfull);

        return await interaction.reply({ embeds: [embed] });
      } else {
        return await interaction.reply(`Player "${playerNameOrId}" not found`);
      }
    } catch (error) {
      console.error(error);
      return await interaction.reply(
        "An error occurred while fetching player data!"
      );
    }
  },
};
