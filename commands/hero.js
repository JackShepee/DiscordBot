const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("hero")
    .setDescription("Find short information about heroes!")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Name of the hero")
        .setRequired(true)
    ),
  async execute(interaction) {
    const heroName = interaction.options.getString("name");
    try {
      const response = await axios.get(
        "https://api.opendota.com/api/heroStats"
      );
      const hero = response.data.find(
        (h) => h.localized_name.toLowerCase() === heroName.toLowerCase()
      );
      if (hero) {
        const embed = new EmbedBuilder()
          .setColor("d90429")
          .setTitle(hero.localized_name)
          .setURL(
            `https://www.dota2.com/hero/${hero.localized_name
              .split(" ")
              .join("")}`
          )
          .setDescription(`Hero id: ${hero.id}`)
          .setThumbnail(`https://cdn.cloudflare.steamstatic.com/${hero.icon}`)
          .addFields(
            {
              name: "Prefered roles of hero",
              value: `${hero.roles.toString()}`,
            },
            {
              name: "Primary attribute and range",
              value: `${hero.primary_attr.toUpperCase()}, ${hero.attack_type}`,
            },
            {
              name: "Pro games stats",
              value: `Pro bans: ${hero.pro_ban}, Pro picks: ${
                hero.pro_pick
              }, Wins in pro games: ${hero.pro_win}, Winrate: ${Math.round(
                (hero.pro_win / hero.pro_pick) * 100
              )}%`,
            }
          )
          .setImage(`https://cdn.cloudflare.steamstatic.com/${hero.img}`);

        return await interaction.reply({ embeds: [embed] });
      } else {
        return await interaction.reply(`Hero ${hero.localized_name} not found`);
      }
    } catch (error) {
      console.error(error);
      return await interaction.reply(
        "An error occured while fetching hero data"
      );
    }
  },
};
