const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("player")
    .setDescription("Find player stats by his nickname!")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Enter player nickname!")
        .setRequired(true)
    ),
  async execute(interaction) {
    const playerName = interaction.options.getString("name");
    try {
      const response = await axios.get(
        `https://api.opendota.com/api/search?q=${playerName}`
      );
      const playerIds = response.data;
      if (playerIds.length > 0) {
        const playerId = playerIds[0].account_id;
        const responsePlayer = await axios.get(
          `https://api.opendota.com/api/players/${playerId}`
        );
        const responseStats = await axios.get(
          `https://api.opendota.com/api/players/${playerId}/wl`
        );
        const responseRecentMatches = await axios.get(
          `https://api.opendota.com/api/players/${playerId}/recentMatches`
        );
        const player = responsePlayer.data;
        const playerStats = responseStats.data;
        const playerRecentMatches = responseRecentMatches.data;
        const embed = new EmbedBuilder()
          .setColor("d90429")
          .setTitle(player.profile.personaname)
          .setURL(player.profile.profileurl)
          .setDescription(`https://www.opendota.com/players/${player.profile.account_id}`)
          .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/c/ce/Dota-2-small-icon.png')
          .addFields(
            {
              name: "Player stats",
              value: `Wins: ${playerStats.win}, Loses: ${
                playerStats.lose
              }, Winrate: ${Math.round(
                (playerStats.win / (playerStats.win + playerStats.lose)) * 100
              )}%`,
            },
            {
              name: "Recent match:",
              value: `https://www.opendota.com/matches/${playerRecentMatches[0].match_id}`,
            }
          )
          .setImage(player.profile.avatarfull);

        return await interaction.reply({ embeds: [embed] });
      } else {
        return await interaction.reply(`Игрок с именем "${playerName}" не найден`);
      }
    } catch (error) {
      console.error(error);
      return await interaction.reply(
        "An error occured while fetching player data!"
      );
    }
  },
};
