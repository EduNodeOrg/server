require('dotenv').config();
const {Client, IntentsBitField} = require("discord.js")

const myIntents = new IntentsBitField();

myIntents.add( IntentsBitField.Flags.Guilds,  IntentsBitField.Flags.GuildPresences, IntentsBitField.Flags.GuildMembers,         IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.DirectMessages);


const client = new Client({
    intents: myIntents
})

client.on("ready", (c) => {
console.log(`${c.user.tag} is online`);
})

client.on("messageCreate", (message) => {
console.log(message);
if (message.mentions.users.has(client.user.id)) { // this could be modified to make it have to *start* with or have only a ping
    message.reply("Hey!.")
  } 
});

client.login(
    process.env.DISCORD_TOKEN
);