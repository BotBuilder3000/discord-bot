const Discord = require("discord.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('invite')
		.setDescription('INVITE ME!'),
	async execute(interaction) {
		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setURL(`https://discord.com/api/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=8&scope=bot%20applications.commands`)
					.setLabel('INVITE ME')
					.setStyle(ButtonStyle.Link)
					.setEmoji('✨')
					.setDisabled(false),
			)
		let invite = new Discord.EmbedBuilder().setTitle("Invite Me To Your Server! ").setColor("#2F3136")
			.setDescription("# Executed Invitation").addFields({ name: "**Click Below To Invite Me To Your Server**", value: "**Once I Have Been Added You Can Use Me, If I Break Seek Support!**" })
			.setFooter({ text: `Command Request By: ${interaction.member.user.username} | [BotBuilder3000](https://github.com/BotBuilder3000/discord-bot.git) Was Here` }).setTimestamp()
		return interaction.reply({ embeds: [invite], components: [row] });
	},
};


