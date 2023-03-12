const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("playerheroes")
    .setDescription("Most played heroes of the player!")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Enter player nickname or ID!")
        .setRequired(true)
    ),
  async execute(interaction) {
    const playerNameOrId = interaction.options.getString("name");
    let playerId;
    try {
      // check if input is an ID
      if (!isNaN(playerNameOrId)) {
        playerId = playerNameOrId;
      } else {
        // input is a nickname, search for player ID
        const response = await axios.get(
          `https://api.opendota.com/api/search?q=${playerNameOrId}`
        );
        const playerIds = response.data;
        if (playerIds.length > 0) {
          playerId = playerIds[0].account_id;
        } else {
          return await interaction.reply(
            `Player with name or ID "${playerNameOrId}" not found!`
          );
        }
      }

      const responsePlayer = await axios.get(
        `https://api.opendota.com/api/players/${playerId}`
      );
      const playerHeroesResponse = await axios.get(
        `https://api.opendota.com/api/players/${playerId}/heroes`
      );
      const playerHeroes = playerHeroesResponse.data.slice(0, 5);

      const heroStatsResponse = await axios.get(
        "https://api.opendota.com/api/heroStats"
      );
      const heroData = heroStatsResponse.data.reduce(
        (obj, hero) => ({ ...obj, [hero.id]: hero }),
        {}
      );

      const embedData = playerHeroes.map((hero) => ({
        name: heroData[hero.hero_id].localized_name,
        value: `Games: ${hero.games}\nWins: ${hero.win}\nWinrate: ${(
          (hero.win / hero.games) *
          100
        ).toFixed(2)}%`,
        icon: `https://api.opendota.com${heroData[hero.hero_id].img}`,
      }));

      const embed = new EmbedBuilder()
        .setColor("#d90429")
        .setTitle(`Top 5 heroes for player ${responsePlayer.data.profile.personaname}`)
        .setURL(
          `https://www.opendota.com/players/${responsePlayer.data.profile.account_id}`
        )
        .addFields(
          embedData.map((data) => ({
            icon: data.icon,
            name: data.name,
            value: data.value,
            inline: true
          }))
        )
        .setImage(responsePlayer.data.profile.avatarfull)
        .setThumbnail(
          "https://upload.wikimedia.org/wikipedia/commons/c/ce/Dota-2-small-icon.png"
        );

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return await interaction.reply(
        "An error occured while fetching player data!"
      );
    }
  },
};

