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
    console.log(cmd);
    switch (cmd) {
        case "ban":
            if (msg.mentions.users.size > 0) {
                let banUser = msg.mentions.users.first();
                msg.channel.send(`Three people must react with any emoji to this message to ban ${banUser.username}`);
            } else {
                msg.channel.send(`Please specify a user!`);
            }
            break;
        case "kick":
                if (msg.mentions.users.size > 0) {
                    console.log(msg.member.roles.cache.some((r) => {console.log(r);return ["Admin"].includes(r)}));
                    /*if (msg.member.roles.find("name", "Admin")) {
                        let kickUser = msg.mentions.users.first();
                        console.log(kickUser.username);
                        msg.channel.send(`${kickUser} is now kicked from the server!`);
                        kickUser.kick();
                    } else {
                        msg.reply(`Sorry, you don't have permission to do that :smug:`);
                    }*/
                    msg.reply(`Sorry, you don't have permission to do that :angry:`);
                } else {
                    msg.reply(`Please specify a user!`);
                }
                break;
        case "hi":
            msg.channel.send(`Hello there, ${msg.author.username}!`);
            break;
        case "help":
            msg.channel.send("Available commands:\n\
  `help`\t\t\t\t\t\tDisplay this help\n\
  `ban @USER`\t\t\t\t\t\tBan the user\n\
  `kick @USER`\t\t\t\t\t\tKick the user\n\
  `deleteall`\t\t\t\t\t\tDelete all messages on channel");
            break;
        default:
            msg.reply(`Unrecognized command: ${msg.content.toString()}`);
    }
}


let banUser = (user) => {

}
