const Discord = require("discord.js");
const bot = new Discord.Client();
const http = require("http");
const fs = require("fs");

const TOKEN = process.env.TOKEN || require("./TOKEN.json").token;
bot.login(TOKEN);

/**
 * Event handler for startup of Bot
 */
bot.on('ready', () => {
    console.log("Ready");
});

/**
 * Event handler for message posted in channel
 */
bot.on("message", (msg) => {
    console.log(`Message received: ${msg.content.toString()} from ${msg.author.username}`);
    if (msg.content.startsWith("!")) {
        let command = msg.content.substring(msg.content.indexOf("!")+1);
        let end = command.indexOf(" ");
        end = end > 0 ? end : command.length;
        command = command.substring(0, end);
        runCommand(command, msg);
    } else if ((msg.content.toLowerCase().includes("hello") || msg.content.toLowerCase().includes("hi") || msg.content.toLowerCase().includes("hey")) && msg.author.username !== "TechClubBot") {
        msg.channel.send(`Hello, ${msg.author.username}!`);
    } else if ((msg.content.toLowerCase() == "lol" || msg.content.toLowerCase() == "xd") && msg.author.username !== "polarpiberry") {
        msg.reply(`WARNING :warning: You will be banned if you continue behavior like this!`);
    }
})

const index = fs.readFileSync("index.html");
http.createServer((req, res) => {
    res.writeHead(200, {"Content-Type": "text/html"});
    res.end(index);
}).listen(process.env.PORT || 3000);

/**
 * Run the command and return
 * @param {*} cmd 
 * @param {*} msg 
 */
let runCommand = (cmd, msg) => {
    console.log("Command requested: " + cmd);
    switch (cmd) {
        case "ban":
            kickOrBan(msg, "ban");
            break;
        case "kick":
            kickOrBan(msg, "ban");
            break;
        case "hi":
            msg.channel.send(`Hello there, ${msg.author.username}!`);
            break;
        case "help":
            msg.channel.send("Available commands:\n\
  `hi`\t\t\t\t\t\t\t\tOi, which oik is calling me now?\n\
  `say`\t\t\t\t\t\t\tSpeak up, little one. Did you hear me?!\n\
  `help`\t\t\t\t\t\tHell hath no fury like an unspoken help\n\
  \n\
  **Moderators Only**\n\
  `ban @USER`\t\t\t\t\t\tBan the user\n\
  `kick @USER`\t\t\t\t\t\tKick the user\n\
  `deleteall`\t\t\t\t\t\tDelete all messages on channel\n\
 ");
            break;
        case "deleteall":
            deleteAll(msg);
            msg.reply("Deleting messages...");
            break;
        default:
            msg.reply(`Unrecognized command: ${msg.content.toString()}`);
    }
}


let deleteAll = async (msg) => {
    let msgs;
    console.log(msg.channels);
    let channel = msg.guild.channels.find((ch) => {console.log(ch); return ch.name == "general"}) //TODO change to get channel name
    do {
        msgs = await channel.fetchMessages({limit: 100});
        msg.channel.bulkDelete(msgs)
    } while (msgs.size >= 2);
}

/**
 * Kick or ben the user from the server
 * 
 * @function kickOrBan
 * @param {Object} msg Message sent
 * @param {string} cmd Command (kick or ban)
 */
let kickOrBan = (msg, cmd) => {
    const permissions = msg.member.roles.cache.some((r) => { return ["Admin"].includes(r.name) });
    if (permissions) {
        let usr = msg.mentions.members.first();
        if (usr) {
            if (cmd == "kick") {
                msg.channel.send(`${usr} is now kicked from the server!`);
                usr.kick();
                return true;
            } else {
                msg.channel.send(`${usr} is now banned from the server!`);
                usr.ban();
                return true;
            }
        } else {
            msg.reply(`No user specified`);
            return false;
        }
    } else {
        msg.reply(`No no no no no no no! Only admins can do that :angry:`);
        return false;
    }
}