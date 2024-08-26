const fs = require('fs');
const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder } = require('discord.js');
const { token } = require('./config.json');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages
  ],
  partials: [Partials.Channel, Partials.Message],
});

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

client.on("ready", () => {
    setInterval(() => {
    const statuses = [
      `https://github.com/BotBuilder3000/discord-bot.git`
    ];
    const Activity = [
      0,
      1,
      2,
      3,
      5,
    ];
    const s = statuses[Math.floor(Math.random() * statuses.length)];
    const a = Activity[Math.floor(Math.random() * Activity.length)];
    client.user.setPresence({ activities: [{ name: `${s}`, type: a }], status: 'online' }); // Other status 'offline' 'dnd' 'idle' 'invisible'
  }, 20000);
})
//
client.commands = new Collection();
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}
for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else { client.on(event.name, (...args) => event.execute(...args)); }
}

// Slash Commands 
client.on('interactionCreate', async interaction => {
  console.log(`${interaction.user.username} in #${interaction.channel.name} from ${interaction.guild.name} triggered an interaction (Slash Command: ${interaction.commandName}) .`);
  if (!interaction.isCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return; try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    const errorStack = error.stack;
    const fileLineRegex = /at .* \((.*?):(\d+):\d+\)/;
    const match = fileLineRegex.exec(errorStack);
    let errorLocation = "Unknown location";
    if (match) {
      const [, filePath, lineNumber] = match;
      const fileName = filePath.split(/[\\/]/).pop(); // Extracts the file name from the file path
      errorLocation = `Error in file ${fileName}, line ${lineNumber}`;
    }

    const errorString = `Error: ${errorLocation}: ${error.toString()}`;
    const errorEmbed = new EmbedBuilder().setColor('Yellow').setTitle(`Error`)
      .setDescription('```diff\n-An Error has occurred in one or more commands!\n``` Click to see the error ||\n```yaml\n' + errorString + '\n```||')

    if (interaction.deferred) {//Send Message If The Command Has "interaction.deferReply()"
      return interaction.editReply({
        embeds: [errorEmbed], ephemeral: true
      });
    } else {
      return interaction.reply({// Send Message If Regular "interaction.reply"
        embeds: [errorEmbed], ephemeral: true
      });
    }
  }
});


client.login(token);
