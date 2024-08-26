const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const db = require('../database.js');
//

module.exports = {
    data: new SlashCommandBuilder()
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers | PermissionFlagsBits.KickMembers | PermissionFlagsBits.BanMembers | PermissionFlagsBits.ManageRoles)
        .setDMPermission(false)
        .setName('moderation')
        .setDescription('Select A Moderation Action')
        //Start Subcommands
        .addSubcommand(subcommand =>
            subcommand
                .setName('warn')
                .setDescription('Warn A User')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('Select User')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Why Are You Warning This User?')
                        .setMinLength(25)
                        .setRequired(true))
        )
        //
        .addSubcommand(subcommand =>
            subcommand
                .setName('warnings')
                .setDescription('See A Users Warning History')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('Select User')
                        .setRequired(true))
        )
        //
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit-warning')
                .setDescription('Edit A Warning With The Provided Case ID')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('Select User')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('caseid')
                        .setDescription('The Unique Identifier For The Warning')
                        .setMinLength(6)
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('newreason')
                        .setDescription('Enter A New Reason')
                        .setRequired(true))
        )
        //
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete-warning')
                .setDescription('Delete A Warning With The Provided Case ID')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('Select User')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('caseid')
                        .setDescription('The Unique Identifier For The Warning')
                        .setMinLength(6)
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Enter A Reason Why You Removed The Warning')
                        .setRequired(false))
        )
        //
        .addSubcommand(subcommand =>
            subcommand
                .setName('kick')
                .setDescription('Kick A Troubled User')
                .addUserOption(option => option.setName('user').setDescription('Find A User').setRequired(true))
                .addStringOption(option => option.setName('reason').setDescription('Enter A Kick Reason').setRequired(false))//Optional, We Will Set A Fallback Message "No Reason Provided"
        )
        //
        .addSubcommand(subcommand =>
            subcommand
                .setName('ban')
                .setDescription('Ban A Troubled User')
                .addUserOption(option => option.setName('user').setDescription('Find A User').setRequired(true))
                .addStringOption(option => option.setName('reason').setDescription('Enter A Ban Reason').setRequired(false))//Optional, We Will Set A Fallback Message "No Reason Provided"
        )
        //
        .addSubcommand(subcommand =>
            subcommand
                .setName('unban')
                .setDescription('Unban The Reformed User')
                .addStringOption(option => option.setName('user-id').setDescription('ID Of User Who Has Been Banned').setRequired(true))
                .addStringOption(option => option.setName('reason').setDescription('Enter A UnBan Reason').setRequired(false))//Optional, We Will Set A Fallback Message "No Reason Provided"

        )
        //
        .addSubcommand(subcommand =>
            subcommand
                .setName('mute')
                .setDescription('Mute That Trouble Maker')
                .addUserOption(option => option.setName('user').setDescription('Find A User').setRequired(true))
                .addStringOption(option =>
                    option.setName('timeout-duration')
                        .setDescription('Select A Timeout Length')
                        .addChoices(
                            { name: '1 Minute', value: 'one-minute' },
                            { name: '5 Minutes', value: 'five-minute' },
                            { name: '10 Minutes', value: 'ten-minute' },
                            { name: '1 Hour', value: 'one-hour' },
                            { name: '1 Day', value: 'one-day' },
                            { name: '1 Week', value: 'one-week' },
                        )
                        .setRequired(true)
                )
                .addStringOption(option => option.setName('reason').setDescription('Why Is This User Being Muted?').setRequired(false))
        )
        //
        .addSubcommand(subcommand =>
            subcommand
                .setName('give-role')
                .setDescription('A New Role For Me?')
                .addUserOption(option =>
                    option.setName('user').setDescription('Select A User').setRequired(true))
                .addRoleOption(option =>
                    option.setName('role').setDescription('Select A Role To Add On The Selected User').setRequired(true))
        )
        //
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove-role')
                .setDescription('My Role Nooo')
                .addUserOption(option =>
                    option.setName('user').setDescription('Select A User').setRequired(true))
                .addRoleOption(option =>
                    option.setName('role').setDescription('Select A Role To Remove From The Selected User').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('purge')
                .setDescription('Purge Messages Max:100')
                .addIntegerOption(option => option.setName('purge').setDescription('Number Of Messages To Delete (Max 100)').setRequired(true))
        )
    //End Subcommands
    ,
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true })

        if (interaction.options.getSubcommand() === 'warn') {
            const moderationlogsID = await db.get(`loggedlogschannel_${interaction.guild.id}`) || []; // Spawn Empty Array In Database Incase No Data
            const channelIdIndex = moderationlogsID.findIndex(entry => entry.name === "Channel");
            let moderationChannelId;

            if (channelIdIndex !== -1) {
                moderationChannelId = moderationlogsID[channelIdIndex].value;
            } else {
                moderationChannelId = null;
            }
            const publicModerationChannel = interaction.guild.channels.cache.get(moderationChannelId)

            const user = interaction.options.getUser("user")//Selected User
            const reason = interaction.options.getString("reason")//Provided Reason
            function caseID(length) {
                let result = '';
                const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                const charactersLength = characters.length;
                let counter = 0;
                while (counter < length) {
                    result += characters.charAt(Math.floor(Math.random() * charactersLength));
                    counter += 1;
                }
                return result;
            }


            if (user.id === interaction.user.id) {
                interaction.editReply({ content: `You Cannot Warn Yourself 🤦🏻‍♂️` })
                return
            }
            if (interaction.guild && interaction.guild.members.cache.get(user.id)?.permissions.has(PermissionFlagsBits.Administrator) && interaction.guild.members.cache.get(user.id)?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                interaction.editReply({ content: `You Cannot Warn A Member Of Staff 🤦🏻‍♂️` });
                return;
            }
            if (user.bot) {
                interaction.editReply({ content: `Seriously, Your Warned ${user} For Being A Discord Bot, Congratz` })
                return
            }
            let realCaseID = caseID(6)
            const oldWarningLogs = await db.get(`loggedwarnings_${user.id}`) || [];// Spawn Empty Array In Database/ Get Current Values - To Add On Uploaded Project ${interaction.guild.id}
            const newWarning = { name: `${realCaseID}`, value: `${reason}` };//Log Warning ID And Contents
            oldWarningLogs.push(newWarning);

            await db.set(`loggedwarnings_${user.id}`, oldWarningLogs); // Save Warning To Databse

            const warnedEmbed = new EmbedBuilder().setColor('Red').setAuthor({ name: 'BotBuilder3000', iconURL: null, url: null })
                .addFields(
                    { name: `Case:`, value: `${realCaseID}`, inline: true },
                    { name: `User:`, value: `${user}`, inline: true },
                    { name: `Moderator: `, value: `${interaction.user.globalName ?? interaction.user.username}`, inline: false },
                    { name: `Warn Reason:`, value: `${reason}`, inline: false },
                )
                .setFooter({ text: `Users Warning Has Been Saved, To View /show-warnings user` }).setTimestamp()

            try {
                await user.send({ content: `You Have Been Warned In: **${interaction.guild.name}**`, embeds: [warnedEmbed], }); // Attempt To Send Warning To User's DM
            } catch (error) {
                if (error.code === 50007) {
                    console.log(`Unable to send message to user ${user.username} (${user.id}). DMs seem to be off.`); // Log DM failure
                } else throw error;
            }

            await interaction.editReply({ content: null, embeds: [warnedEmbed], files: [], components: [], ephemeral: true, tts: false, fetchReply: false })// Executing Command User They Warned User

            // Notify in the public moderation channel
            if (publicModerationChannel) {
                await publicModerationChannel.send({ embeds: [warnedEmbed] }); // Send To Public Channel
            }
        }

        if (interaction.options.getSubcommand() === 'warnings') {
            const user = interaction.options.getUser("user") || interaction.user; // Selected User

            const warningLogsArray = await db.get(`loggedwarnings_${user.id}`) || []; // Spawn Empty Array In Database

            if (!warningLogsArray.length) {
                interaction.editReply({ content: `No Warnings For ${user.globalName ?? user.username}` });
                return;
            } // User No Warnings o:

            const warningsPerPage = 6; // Number of items to show per page
            const totalPages = Math.ceil(warningLogsArray.length / warningsPerPage);
            let page = 1; // Default page is 1

            const updateWarningsEmbed = () => {
                const startIndex = (page - 1) * warningsPerPage;
                const endIndex = Math.min(startIndex + warningsPerPage, warningLogsArray.length);

                const warningsEmbed = new EmbedBuilder().setColor('Red').setAuthor({ name: 'BotBuilder3000', iconURL: null, url: null })
                    .setFooter({ text: `Viewing: ${user.globalName ?? user.username}'s Warnings | Page ${page}/${totalPages}` }).setTimestamp();

                for (let i = startIndex; i < endIndex; i++) {
                    const warning = warningLogsArray[i];
                    warningsEmbed.addFields({ name: `${warning.name || 'Invalid Case ID'}`, value: `${warning.value || 'Failed To Load Reason'}`, inline: true });
                }

                return warningsEmbed;
            };

            // Create navigation buttons
            const prevButton = new ButtonBuilder()
                .setCustomId('prev_page')
                .setStyle(ButtonStyle.Secondary)
                .setLabel('Previous')
                .setDisabled(page === 1);

            const nextButton = new ButtonBuilder()
                .setCustomId('next_page')
                .setStyle(ButtonStyle.Primary)
                .setLabel('Next')
                .setDisabled(page === totalPages);

            const paginatorButtons = new ActionRowBuilder().addComponents(prevButton, nextButton);
            const message = await interaction.editReply({ content: null, embeds: [updateWarningsEmbed()], files: [], components: [paginatorButtons], ephemeral: true, tts: false, fetchReply: false });

            const filter = (buttonInteraction) =>
                (buttonInteraction.customId === 'prev_page' || buttonInteraction.customId === 'next_page') &&
                buttonInteraction.user.id === interaction.user.id;

            const collector = message.createMessageComponentCollector({
                filter,
                time: 60000,
            });

            collector.on('collect', async (buttonInteraction) => {
                if (buttonInteraction.customId === 'prev_page' && page > 1) {
                    page--;
                } else if (buttonInteraction.customId === 'next_page' && page < totalPages) {
                    page++;
                }

                prevButton.setDisabled(page === 1);
                nextButton.setDisabled(page === totalPages);

                await buttonInteraction.update({ embeds: [updateWarningsEmbed()], components: [paginatorButtons] });
            });

            collector.on('end', () => {
                // Remove the buttons when the collector ends
                interaction.editReply({ components: [] });
            });
        }

        if (interaction.options.getSubcommand() === 'edit-warning') {
            const user = interaction.options.getUser("user"); // Selected User
            const caseID = interaction.options.getString("caseid"); // Provided Case ID
            const newReason = interaction.options.getString("newreason"); // New Reason Text
            const moderationlogsID = await db.get(`loggedlogschannel_${interaction.guild.id}`) || []; // Spawn Empty Array In Database Incase No Data
            const channelIdIndex = moderationlogsID.findIndex(entry => entry.name === "Channel");
            let moderationChannelId;

            if (channelIdIndex !== -1) {
                moderationChannelId = moderationlogsID[channelIdIndex].value;
            } else {
                moderationChannelId = null;
            }
            const publicModerationChannel = interaction.guild.channels.cache.get(moderationChannelId)

            const warningLogsArray = await db.get(`loggedwarnings_${user.id}`) || []; // Retrieve Warning Logs from Database

            const warningCaseIndex = warningLogsArray.findIndex(entry => entry.name === caseID);

            if (warningCaseIndex === -1) {
                interaction.editReply({ content: `The Warning With ID ${caseID} Cannot Be Found For ${user.username}.` });
                return;
            }

            // Update the reason for the warning case
            warningLogsArray[warningCaseIndex].value = newReason;

            // Update the database with the modified array
            await db.set(`loggedwarnings_${user.id}`, warningLogsArray);

            interaction.editReply({ content: `Updated ${user}\'s Warning Case ID: **${caseID}** Reason With: ${newReason}`, ephemeral: true });

            // Notify in the public moderation channel
            if (publicModerationChannel) {
                await publicModerationChannel.send({ content: `**${user.globalName ?? user.username}**'s Warning Case With ID **${caseID}** Has Had Its Reason Updated By A Member Of Staff.`, ephemeral: false });
            }
        }

        if (interaction.options.getSubcommand() === 'delete-warning') {
            const user = interaction.options.getUser("user")//Selected User
            const caseID = interaction.options.getString("caseid")//Provided Case
            const removalReason = interaction.options.getString("reason")//Provided Reason (Optional)

            const moderationlogsID = await db.get(`loggedlogschannel_${interaction.guild.id}`) || []; // Spawn Empty Array In Database Incase No Data
            const channelIdIndex = moderationlogsID.findIndex(entry => entry.name === "Channel");
            let moderationChannelId;

            if (channelIdIndex !== -1) {
                moderationChannelId = moderationlogsID[channelIdIndex].value;
            } else {
                moderationChannelId = null;
            }
            const publicModerationChannel = interaction.guild.channels.cache.get(moderationChannelId)

            const warningLogsArray = await db.get(`loggedwarnings_${user.id}`) || []; // Spawn Empty Array In Database

            if (!warningLogsArray.length) {
                interaction.editReply({ content: `# ${user.globalName ?? user.username} Has No Warnings, You Cant Delete Thin Air :joy:` });
                return;
            } // No Active Warnings, No Need To Delete Thin Air

            const warningCaseIndex = warningLogsArray.findIndex(entry => entry.name === caseID);

            if (warningCaseIndex === -1) {
                interaction.editReply({ content: `Warning case with ID ${caseID} not found for ${user.globalName ?? user.username}.` });
                return;
            }

            const deletedCase = warningLogsArray.splice(warningCaseIndex, 1)[0];
            const warningsLeft = warningLogsArray.length;
            // Update the database with the modified array
            await db.set(`loggedwarnings_${user.id}`, warningLogsArray);

            let removedReason;

            if (removalReason) {
                removedReason = `**${user}**'s Warning With The ID Of **${deletedCase.name}** Has Been Deleted By A Moderator With The Reason Of: ${removalReason}, Leaving Them With **${warningsLeft}** Warnings Remaining`;
            } else {
                removedReason = `**${user}**'s Warning With The ID Of **${deletedCase.name}** Has Been Deleted By A Moderator, They Have Remaining Total Of **${warningsLeft}** Warnings`;
            }
            try {
                await user.send({ content: `# Hello, ${user.username},\nYour Warning With The ID Of **${deletedCase.name}** Has Been Removed By A Administrator!\n# You Have ${warningsLeft} Warnings Remaining!` }); // Attempt To Send Warning To User's DM
            } catch (error) {
                if (error.code === 50007) {
                    console.log(`Unable to send message to user ${user.username} (${user.id}). DMs seem to be off.`); // Log DM failure
                } else throw error;
            }

            interaction.editReply({ content: `Deleted ${deletedCase.name} From ${user}'s Warnings`, embeds: [], files: [], components: [], ephemeral: true, tts: false, fetchReply: false });

            if (publicModerationChannel) {
                await publicModerationChannel.send({ content: `${removedReason}` })// Send To Public Channel
            }
        }

        if (interaction.options.getSubcommand() === 'kick') {
            const selectedMember = interaction.options.getMember('user');
            const providedReason = interaction.options.getString('reason');
            let reasonProvided;
            //Check If User Is A Bot
            if (selectedMember.user.bot) {
                return interaction.editReply({ content: `I Cannot Kick ${selectedMember}, As They Are A Bot` })
            }
            //End Check For Bot, Start Check For Kick Permission
            if (selectedMember.permissions.has(PermissionFlagsBits.KickMembers)) {
                return interaction.editReply({ content: `I Cannot Kick ${selectedMember}, As They Are A Member Of Staff` })
            }
            //End Permission Check, STart Reason Validation
            if (providedReason) {
                reasonProvided = providedReason;
            } else {
                reasonProvided = `No reason Provided`;
            }
            //End Reason Validation, Start Buttons
            const kickButton = new ButtonBuilder()// Kick User The User
                .setStyle(ButtonStyle.Secondary)
                .setLabel(`Confirm Kick`)
                .setCustomId('kick-user');

            const dontKickButton = new ButtonBuilder()// Kill The Command, Stops Kicking Process
                .setStyle(ButtonStyle.Secondary)
                .setLabel(`Cancel Kick`)
                .setCustomId('cancel-kick');
            //End Buttons, Start Embed
            let kickConfirmationEmbed = new EmbedBuilder().setAuthor({ name: 'BotBuilder3000', iconURL: null, url: null })
                .setColor('Red')
                .setTitle(`Kick Confirmation`)
                .setDescription(`
            You Are Kicking: ${selectedMember} With The Reason \n${reasonProvided}
                `).setFooter({ text: `Buttons Expire In 60 Seconds` })
            //End Embed, Start Initial Message
            const selectedOptions = new ActionRowBuilder().addComponents(kickButton, dontKickButton);
            const m = await interaction.editReply({ content: null, embeds: [kickConfirmationEmbed], files: [], components: [selectedOptions], ephemeral: true, tts: false, fetchReply: true })
            const filter = i => [
                'kick-user',
                'cancel-kick'
            ].includes(i.customId) && i.user.id === interaction.user.id;
            const collector = m.createMessageComponentCollector({
                filter,
                time: 60000 //1m Gives Enough Time To Kick Or Cancel
            });

            collector.on('collect', async (interaction) => {
                if (interaction.customId === 'kick-user') {

                    try {
                        await selectedMember.send({ content: `You Have Been Kicked From: **${interaction.guild.name}** Reason: ${reasonProvided}` }); // Attempt To Send Warning To User's DM
                    } catch (error) {
                        if (error.code === 50007) {
                            console.log(`Unable To Send Message To The User: ${selectedMember.username} (${selectedMember.id}). DMs Are Disabled!`); // Log DM failure
                        } else throw error;
                    }
                    let kickConfirmedEmbed = new EmbedBuilder().setAuthor({ name: 'BotBuilder3000', iconURL: null, url: null })
                        .setColor('Red')
                        .setTitle(`Kick Confirmed`)
                        .setDescription(`You Kicked: ${selectedMember} With The Reason \n${reasonProvided}`).setTimestamp()
                    await selectedMember.kick({ reason: providedReason })
                    await interaction.update({ content: null, embeds: [kickConfirmedEmbed], files: [], components: [], ephemeral: false, tts: false, fetchReply: false })
                    collector.stop()
                }
                if (interaction.customId === 'cancel-kick') {
                    await interaction.update({ content: `Canceled Kick ${interaction.user}`, embeds: [], files: [], components: [], ephemeral: false, tts: false, fetchReply: false })
                    collector.stop()
                }
            });

            collector.on('end', (collected, reason) => {
                if (reason === 'time') {
                    // Handle when the collector times out (optional)
                    m.edit({ content: 'Kick Expired, Rerun', components: [] });
                }
            });
        }

        if (interaction.options.getSubcommand() === 'ban') {
            const selectedMember = interaction.options.getMember('user');
            const providedReason = interaction.options.getString('reason');
            let reasonProvided;
            //Check If User Is A Bot
            if (selectedMember.user.bot) {
                return interaction.editReply({ content: `I Cannot Ban ${selectedMember}, As They Are A Bot` })
            }
            //End Check For Bot, Start Check For Ban Permission
            if (selectedMember.permissions.has(PermissionFlagsBits.BanMembers)) {
                return interaction.editReply({ content: `I Cannot Ban ${selectedMember}, As They Are A Member Of Staff` })
            }
            //End Permission Check, STart Reason Validation
            if (providedReason) {
                reasonProvided = providedReason;
            } else {
                reasonProvided = `No reason Provided`;
            }
            //End Reason Validation, Start Buttons
            const kickButton = new ButtonBuilder()// Ban User The User
                .setStyle(ButtonStyle.Secondary)
                .setLabel(`Confirm Ban`)
                .setCustomId('ban-user');

            const dontKickButton = new ButtonBuilder()// Kill The Command, Stops Banning Process
                .setStyle(ButtonStyle.Secondary)
                .setLabel(`Cancel Ban`)
                .setCustomId('cancel-ban');
            //End Buttons, Start Embed
            let kickConfirmationEmbed = new EmbedBuilder().setAuthor({ name: 'BotBuilder3000', iconURL: null, url: null })
                .setColor('Red')
                .setTitle(`Ban Confirmation`)
                .setDescription(`
            You Are Banning: ${selectedMember} With The Reason \n${reasonProvided}
                `).setFooter({ text: `Buttons Expire In 60 Seconds` })
            //End Embed, Start Initial Message
            const selectedOptions = new ActionRowBuilder().addComponents(kickButton, dontKickButton);
            const m = await interaction.editReply({ content: null, embeds: [kickConfirmationEmbed], files: [], components: [selectedOptions], ephemeral: true, tts: false, fetchReply: true })
            const filter = i => [
                'ban-user',
                'cancel-ban'
            ].includes(i.customId) && i.user.id === interaction.user.id;
            const collector = m.createMessageComponentCollector({
                filter,
                time: 60000 //1m Gives Enough Time To Kick Or Cancel
            });

            collector.on('collect', async (interaction) => {
                if (interaction.customId === 'ban-user') {

                    try {
                        await selectedMember.send({ content: `You Have Been Banned From: **${interaction.guild.name}** Reason: ${reasonProvided}` }); // Attempt To Send Warning To User's DM
                    } catch (error) {
                        if (error.code === 50007) {
                            console.log(`Unable To Send Message To The User: ${selectedMember.username} (${selectedMember.id}). DMs Are Disabled!`); // Log DM failure
                        } else throw error;
                    }
                    let kickConfirmedEmbed = new EmbedBuilder().setAuthor({ name: 'BotBuilder3000', iconURL: null, url: null })
                        .setColor('Red')
                        .setTitle(`Ban Confirmed`)
                        .setDescription(`You Banned: ${selectedMember} With The Reason \n${reasonProvided}`).setTimestamp()
                    await selectedMember.ban({ reason: providedReason })
                    await interaction.update({ content: null, embeds: [kickConfirmedEmbed], files: [], components: [], ephemeral: false, tts: false, fetchReply: false })
                    collector.stop()
                }
                if (interaction.customId === 'cancel-ban') {
                    await interaction.update({ content: `Canceled Ban ${interaction.user}`, embeds: [], files: [], components: [], ephemeral: false, tts: false, fetchReply: false })
                    collector.stop()
                }
            });

            collector.on('end', (collected, reason) => {
                if (reason === 'time') {
                    // Handle when the collector times out (optional)
                    m.edit({ content: 'Ban Expired, Rerun', components: [] });
                }
            });
        }

        if (interaction.options.getSubcommand() === 'unban') {
            const id = interaction.options.getString('user-id');
            const providedReason = interaction.options.getString('reason');
            let reasonProvided;

            if (providedReason) {
                reasonProvided = providedReason;
            } else {
                reasonProvided = `No reason Provided`;
            }
            //End ID, Start Buttons
            const confirmUnbanMessage = new ButtonBuilder()// Ban User The User
                .setStyle(ButtonStyle.Secondary)
                .setLabel(`Confirm Unban`)
                .setCustomId('unban-user');

            if (!/^\d+$/.test(id)) {
                return interaction.reply({ content: 'Invalid user ID. Please provide a valid user ID to unban.', ephemeral: true });
            }

            let unbanConfirmationMessage = new EmbedBuilder().setAuthor({ name: 'BotBuilder3000', iconURL: null, url: null })
                .setColor('Red')
                .setTitle('Confirmation Message To Unban:')
                .setDescription(`You Want To Unban <@${id}> For Reason: ${reasonProvided}`)

            const selectedOptions = new ActionRowBuilder().addComponents(confirmUnbanMessage);
            const m = await interaction.editReply({ content: null, embeds: [unbanConfirmationMessage], files: [], components: [selectedOptions], ephemeral: false, tts: false, fetchReply: false });

            const filter = i => [
                'unban-user'
            ].includes(i.customId) && i.user.id === interaction.user.id;
            const collector = m.createMessageComponentCollector({
                filter,
                time: 60000 //1m Gives Enough Time To Confirm
            });

            collector.on('collect', async (interaction) => {

                if (interaction.customId === 'unban-user') {
                    await interaction.update({ content: `You have Unbanned <@${id}> With Reason ${reasonProvided}`, embeds: [], files: [], components: [], ephemeral: false, tts: false, fetchReply: false })
                    await interaction.guild.members.unban(id, reasonProvided);
                    collector.stop()
                }
            });

            collector.on('end', (collected, reason) => {
                if (reason === 'time') {
                    // Handle when the collector times out (optional)
                    m.edit({ content: 'Ban Expired, Rerun', components: [] });
                }
            });
        }

        if (interaction.options.getSubcommand() === 'mute') {
            const selectedMember = interaction.options.getMember('user');
            const providedReason = interaction.options.getString('reason');
            const choices = interaction.options.getString('timeout-duration');
            let reasonProvided;

            //Check If User Is A Bot
            if (selectedMember.user.bot) {
                return interaction.editReply({ content: `I Cannot Mute ${selectedMember}, As They Are A Bot` })
            }
            //End Check For Bot, Start Check For Ban Permission
            if (selectedMember.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                return interaction.editReply({ content: `I Cannot Mute ${selectedMember}, As They Are A Member Of Staff` })
            }
            //End Permission Check, Start Reason Validation
            if (providedReason) {
                reasonProvided = providedReason;
            } else {
                reasonProvided = `No reason Provided`;
            }
            const guildID = interaction.guild.id; // Grab GuildID From The Member Atrib
            const loggedLoggingChannelId = await db.get(`loggedlogschannel_${guildID}`) || [];
            const loggingChannelIdIndex = loggedLoggingChannelId.findIndex(entry => entry.name === "Channel");
            let loggerChannelId;

            if (loggingChannelIdIndex !== -1) {
                loggerChannelId = loggedLoggingChannelId[loggingChannelIdIndex].value;
            } else {
                return;
            }

            if (choices === 'one-minute') {
                const oneMinuteInMilliSeconds = 60000
                const duration = Math.floor(oneMinuteInMilliSeconds)
                const durationInMinutes = Math.floor(duration / 60000);

                try {
                    await selectedMember.send({ content: `You have been timed out in ${interaction.guild.name},\nFor the duration of: ${durationInMinutes}M\nWith the reason of: **${reasonProvided}**` });
                } catch (error) {

                    if (error.code === 50007) {
                        console.log(`User ${selectedMember.user.username} (${selectedMember.user.id}) cannot receive DMs. Ignoring the warning message.`); // Probably send a message to the channel saying this or something iddk
                    } else {
                        throw error;
                    }
                }

                let mutedEmbed = new EmbedBuilder().setColor('Red').setTitle(`A User Has Been Muted [Timeout]`).setAuthor({ name: 'BotBuilder3000', iconURL: null, url: null })
                    .setDescription(`
            Muted: ${selectedMember.user.username} (${selectedMember.user.id}) 
            For: ${durationInMinutes}M
            Reason: ${reasonProvided}
            `)
                    .setFooter({ text: null, iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }), inline: true }).setTimestamp()

                await selectedMember.timeout(duration, reasonProvided)
                await interaction.editReply({ content: `Muted: ${selectedMember.user.username} (${selectedMember.user.id}) For ${durationInMinutes}M\nReason: ${reasonProvided}`, embeds: [], files: [], components: [], ephemeral: true, tts: false, fetchReply: false });
                await interaction.guild.channels.cache.get(loggerChannelId).send({ content: null, embeds: [mutedEmbed], files: [], ephemeral: false });
            } else if (choices === 'five-minute') {
                const fiveMinutesInMilliSeconds = 300000
                const duration = Math.floor(fiveMinutesInMilliSeconds)
                const durationInMinutes = Math.floor(duration / 60000);

                try {
                    await selectedMember.send({ content: `You have been timed out in ${interaction.guild.name},\nFor the duration of: ${durationInMinutes}M\nWith the reason of: **${reasonProvided}**` });
                } catch (error) {

                    if (error.code === 50007) {
                        console.log(`User ${selectedMember.user.username} (${selectedMember.user.id}) cannot receive DMs. Ignoring the warning message.`); // Probably send a message to the channel saying this or something iddk
                    } else {
                        throw error;
                    }
                }

                let mutedEmbed = new EmbedBuilder().setColor('Red').setTitle(`A User Has Been Muted [Timeout]`)
                    .setDescription(`
            Muted: ${selectedMember.user.username} (${selectedMember.user.id}) 
            For: ${durationInMinutes}M
            Reason: ${reasonProvided}
            `)
                    .setFooter({ text: null, iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }), inline: true }).setTimestamp()

                await selectedMember.timeout(duration, reasonProvided)
                await interaction.editReply({ content: `Muted: ${selectedMember.user.username} (${selectedMember.user.id}) For ${durationInMinutes}M\nReason: ${reasonProvided}`, embeds: [], files: [], components: [], ephemeral: true, tts: false, fetchReply: false });
                await interaction.guild.channels.cache.get(loggerChannelId).send({ content: null, embeds: [mutedEmbed], files: [], ephemeral: false });
            } else if (choices === 'ten-minute') {
                const tenMinutesInMilliSeconds = 600000
                const duration = Math.floor(tenMinutesInMilliSeconds)
                const durationInMinutes = Math.floor(duration / 60000);

                try {
                    await selectedMember.send({ content: `You have been timed out in ${interaction.guild.name},\nFor the duration of: ${durationInMinutes}M\nWith the reason of: **${reasonProvided}**` });
                } catch (error) {

                    if (error.code === 50007) {
                        console.log(`User ${selectedMember.user.username} (${selectedMember.user.id}) cannot receive DMs. Ignoring the warning message.`); // Probably send a message to the channel saying this or something iddk
                    } else {
                        throw error;
                    }
                }

                let mutedEmbed = new EmbedBuilder().setColor('Red').setTitle(`A User Has Been Muted [Timeout]`).setAuthor({ name: 'BotBuilder3000', iconURL: null, url: null })
                    .setDescription(`
            Muted: ${selectedMember.user.username} (${selectedMember.user.id}) 
            For: ${durationInMinutes}M
            Reason: ${reasonProvided}
            `)
                    .setFooter({ text: null, iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }), inline: true }).setTimestamp()

                await selectedMember.timeout(duration, reasonProvided)
                await interaction.editReply({ content: `Muted: ${selectedMember.user.username} (${selectedMember.user.id}) For ${durationInMinutes}M\nReason: ${reasonProvided}`, embeds: [], files: [], components: [], ephemeral: true, tts: false, fetchReply: false });
                await interaction.guild.channels.cache.get(loggerChannelId).send({ content: null, embeds: [mutedEmbed], files: [], ephemeral: false });
            } else if (choices === 'one-hour') {
                const oneHourInMilliSeconds = 3600000
                const duration = Math.floor(oneHourInMilliSeconds)
                const durationInMinutes = Math.floor(duration / 3600000);

                try {
                    await selectedMember.send({ content: `You have been timed out in ${interaction.guild.name},\nFor the duration of: ${durationInMinutes}H\nWith the reason of: **${reasonProvided}**` });
                } catch (error) {

                    if (error.code === 50007) {
                        console.log(`User ${selectedMember.user.username} (${selectedMember.user.id}) cannot receive DMs. Ignoring the warning message.`); // Probably send a message to the channel saying this or something iddk
                    } else {
                        throw error;
                    }
                }

                let mutedEmbed = new EmbedBuilder().setColor('Red').setTitle(`A User Has Been Muted [Timeout]`).setAuthor({ name: 'BotBuilder3000', iconURL: null, url: null })
                    .setDescription(`
            Muted: ${selectedMember.user.username} (${selectedMember.user.id}) 
            For: ${durationInMinutes}H
            Reason: ${reasonProvided}
            `)
                    .setFooter({ text: null, iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }), inline: true }).setTimestamp()

                await selectedMember.timeout(duration, reasonProvided)
                await interaction.editReply({ content: `Muted: ${selectedMember.user.username} (${selectedMember.user.id}) For ${durationInMinutes}H\nReason: ${reasonProvided}`, embeds: [], files: [], components: [], ephemeral: true, tts: false, fetchReply: false });
                await interaction.guild.channels.cache.get(loggerChannelId).send({ content: null, embeds: [mutedEmbed], files: [], ephemeral: false });
            } else if (choices === 'one-day') {
                const oneDayInMilliSeconds = 86400000
                const duration = Math.floor(oneDayInMilliSeconds)
                const durationInMinutes = Math.floor(duration / (1000 * 60 * 60 * 24));

                try {
                    await selectedMember.send({ content: `You have been timed out in ${interaction.guild.name},\nFor the duration of: ${durationInMinutes}D\nWith the reason of: **${reasonProvided}**` });
                } catch (error) {

                    if (error.code === 50007) {
                        console.log(`User ${selectedMember.user.username} (${selectedMember.user.id}) cannot receive DMs. Ignoring the warning message.`); // Probably send a message to the channel saying this or something iddk
                    } else {
                        throw error;
                    }
                }

                let mutedEmbed = new EmbedBuilder().setColor('Red').setTitle(`A User Has Been Muted [Timeout]`).setAuthor({ name: 'BotBuilder3000', iconURL: null, url: null })
                    .setDescription(`
            Muted: ${selectedMember.user.username} (${selectedMember.user.id}) 
            For: ${durationInMinutes}D
            Reason: ${reasonProvided}
            `)
                    .setFooter({ text: null, iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }), inline: true }).setTimestamp()

                await selectedMember.timeout(duration, reasonProvided)
                await interaction.editReply({ content: `Muted: ${selectedMember.user.username} (${selectedMember.user.id}) For ${durationInMinutes}D\nReason: ${reasonProvided}`, embeds: [], files: [], components: [], ephemeral: true, tts: false, fetchReply: false });
                await interaction.guild.channels.cache.get(loggerChannelId).send({ content: null, embeds: [mutedEmbed], files: [], ephemeral: false });
            } else if (choices === 'one-week') {
                const oneWeekInMilliSeconds = 604800000
                const duration = Math.floor(oneWeekInMilliSeconds)
                const durationInMinutes = Math.floor(duration / (1000 * 60 * 60 * 24 * 7));

                try {
                    await selectedMember.send({ content: `You have been timed out in ${interaction.guild.name},\nFor the duration of: ${durationInMinutes}W\nWith the reason of: **${reasonProvided}**` });
                } catch (error) {

                    if (error.code === 50007) {
                        console.log(`User ${selectedMember.user.username} (${selectedMember.user.id}) cannot receive DMs. Ignoring the warning message.`); // Probably send a message to the channel saying this or something iddk
                    } else {
                        throw error;
                    }
                }

                let mutedEmbed = new EmbedBuilder().setColor('Red').setTitle(`A User Has Been Muted [Timeout]`).setAuthor({ name: 'BotBuilder3000', iconURL: null, url: null })
                    .setDescription(`
            Muted: ${selectedMember.user.username} (${selectedMember.user.id}) 
            For: ${durationInMinutes}W
            Reason: ${reasonProvided}
            `)
                    .setFooter({ text: null, iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }), inline: true }).setTimestamp()

                await selectedMember.timeout(duration, reasonProvided)
                await interaction.editReply({ content: `Muted: ${selectedMember.user.username} (${selectedMember.user.id}) For ${durationInMinutes}W\nReason: ${reasonProvided}`, embeds: [], files: [], components: [], ephemeral: true, tts: false, fetchReply: false });
                await interaction.guild.channels.cache.get(loggerChannelId).send({ content: null, embeds: [mutedEmbed], files: [], ephemeral: false });

            }
        }

        if (interaction.options.getSubcommand() === 'give-role') {
            const guildID = interaction.guild.id;
            const loggedLoggingChannelId = await db.get(`loggedlogschannel_${guildID}`) || [];
            const loggingChannelIdIndex = loggedLoggingChannelId.findIndex(entry => entry.name === "Channel");
            let loggerChannelId;

            if (loggingChannelIdIndex !== -1) {
                loggerChannelId = loggedLoggingChannelId[loggingChannelIdIndex].value;
            } else {
                return;
            }

            const role = interaction.options.getRole('role');
            const target = interaction.options.getMember('user') || interaction.member;

            if (interaction.guild.members.me.roles.highest.position <= role.position) {
                let ERROR = new EmbedBuilder().setColor('Red').setAuthor({ name: 'BotBuilder3000', iconURL: null, url: null })
                .setDescription(`I Cannot Give The Role  [${role}], As It Is Equal Or Higher To The Roles I Have Been Assigned To!`)
                return interaction.editReply({ content: '```diff\n-ERROR:\n```', embeds: [ERROR] })
            }

            if (target.roles.cache.get(role.id)) {
                let whoops = new EmbedBuilder().setColor('Red').setAuthor({ name: 'BotBuilder3000', iconURL: null, url: null })
                .setDescription(`# Chill Buddy \n${target} Already Has ${role}!`)
                return interaction.editReply({ content: `WOAH:`, embeds: [whoops] })
            }

            let roleAddedEmbed = new EmbedBuilder().setTitle('Assigned A Role').setColor('Red').setAuthor({ name: 'BotBuilder3000', iconURL: null, url: null })
                .addFields(
                    { name: `User:`, value: `${target}` },
                    { name: `Role:`, value: `${role}` },
                    { name: `Role Colour:`, value: `[#${role.color.toString(16).padStart(6, '0')}](https://www.color-hex.com/color/${role.color.toString(16).padStart(6, '0')} "Color-hex")` },
                    { name: `Moderator:`, value: `${interaction.user.globalName ?? interaction.user.username}` },
                ).setFooter({ text: `\u200b`, iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }), inline: true }).setTimestamp()

            await interaction.editReply({ embeds: [roleAddedEmbed] }).catch((e) => console.log(e));
            await target.roles.add(role).catch(console.error);
            await interaction.client.guilds.cache.get(guildID).channels.cache.get(loggerChannelId).send({ content: null, embeds: [roleAddedEmbed], files: [] });
        }

        if (interaction.options.getSubcommand() === 'remove-role') {
            const guildID = interaction.guild.id;
            const loggedLoggingChannelId = await db.get(`loggedlogschannel_${guildID}`) || [];
            const loggingChannelIdIndex = loggedLoggingChannelId.findIndex(entry => entry.name === "Channel");
            let loggerChannelId;

            if (loggingChannelIdIndex !== -1) {
                loggerChannelId = loggedLoggingChannelId[loggingChannelIdIndex].value;
            } else {
                return;
            }

            const role = interaction.options.getRole('role');
            const target = interaction.options.getMember('user') || interaction.member;

            if (interaction.guild.members.me.roles.highest.position <= role.position) {
                let ERROR = new EmbedBuilder().setColor('Red').setDescription(`I Cannot Remove The Role [${role}], As It Is Equal Or Higher To The Roles I Have Been Assigned To!`)
                return interaction.editReply({ content: '```diff\n-ERROR:\n```', embeds: [ERROR] })
            }


            let roleRemovedEmbed = new EmbedBuilder().setTitle('Remove A Role').setColor('Red').setAuthor({ name: 'BotBuilder3000', iconURL: null, url: null })
                .addFields(
                    { name: `User:`, value: `${target}` },
                    { name: `Role:`, value: `${role}` },
                    { name: `Role Colour:`, value: `[#${role.color.toString(16).padStart(6, '0')}](https://www.color-hex.com/color/${role.color.toString(16).padStart(6, '0')} "Color-hex")` },
                    { name: `Moderator:`, value: `${interaction.user.globalName ?? interaction.user.username}` },
                ).setFooter({ text: `\u200b`, iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }), inline: true }).setTimestamp()

            await interaction.editReply({ content: null, embeds: [roleRemovedEmbed], files: [], components: [], ephemeral: true, tts: false, fetchReply: false }).catch((e) => console.log(e));
            await target.roles.remove(role).catch(console.error);
            await interaction.client.guilds.cache.get(guildID).channels.cache.get(loggerChannelId).send({ content: null, embeds: [roleRemovedEmbed], files: [] });
        }

        if (interaction.options.getSubcommand() === 'purge') {
            const intergerInput = interaction.options.getInteger('purge');

            if (!interaction.guild.members.me.permissions.has([PermissionFlagsBits.ManageMessages])) {
                return interaction.editReply({ content: "Missing Permission `ManageMessages`!" });
            }

            if (intergerInput > 100) {
                return interaction.editReply({ content: "Invalid number, make sure it's equal to or below 100" });
            }

            let deleteAmount = Math.min(intergerInput, 100);

            try {
                const fetched = await interaction.channel.messages.fetch({ limit: deleteAmount });
                await interaction.channel.bulkDelete(fetched, true);
                await interaction.editReply({ content: `**Deleted ${fetched.size} Messages**`, ephemeral: true });
            } catch (error) {
                console.error('Error deleting messages:', error);
                await interaction.editReply({ content: `Something went wrong: ${error}`, ephemeral: true });
            }
        }
    },
};