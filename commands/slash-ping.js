const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setDMPermission(false)
		.setName('ping')
		.setDescription('Websocket Connection')
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),
	async execute(interaction) {
		await interaction.deferReply()


		let embed = new EmbedBuilder().setColor('Red').setAuthor({ name: 'BotBuilder3000', iconURL: null, url: null })
			.setDescription(`Websocket Connection: ${interaction.client.ws.ping.toLocaleString()}ms`)
		return interaction.editReply({ embeds: [embed] }).catch((e) => console.log(e));
	},
};