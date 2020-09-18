const Discord = require("discord.js");
const bot = new Discord.Client();
const http = require("http");
const fs = require("fs");

const TOKEN = process.env.TOKEN || require("./TOKEN.json").token; //Bot login token
bot.login(TOKEN);

const index = fs.readFileSync("index.html"); //Index file to serve

/**
 * Event handler for startup of Bot
 */
bot.on('ready', () => {
    console.log("TechClubRobot: Ready");
});

/**
 * Event handler for message posted in channel
 */
bot.on("message", (msg) => {
    console.log(`Message received: ${msg.content.toString()} from ${msg.author.username}`);
    let msgContentList = msg.content.toLowerCase().split(" ")
    if (msg.content.startsWith("!")) {
        runCommand(msg);
    } else if ((msgContentList.includes("hello") || msgContentList.includes("hi") || msgContentList.includes("hey")) && msg.author.username !== "TechClubBot") {
        sayHi(msg);
    } else if ((msg.content.toLowerCase() == "lol" || msg.content.toLowerCase() == "xd") && msg.author.username !== "polarpiberry") {
        msg.reply(`WARNING :warning: you will be banned if you continue behavior like this!`);
    }
})

/**
 * Serve the webpage
 */
http.createServer((req, res) => {
    res.writeHead(200, {"Content-Type": "text/html"});
    res.end(index);
}).listen(process.env.PORT || 3000);




/**
 * Run the command in the message and return
 * 
 * @function runCommand
 * @param {Object} msg Message object
 */
let runCommand = (msg) => {
    let command = msg.content.substring(msg.content.indexOf("!")+1);
    let end = command.indexOf(" ");
    end = end > 0 ? end : command.length;
    command = command.substring(0, end);
    console.log("TechClubBot: running command " + command);
    switch (command) {
        case "ban":
            kickOrBan(msg, "ban");
            break;
        case "kick":
            kickOrBan(msg, "kick");
            break;
        case "hi":
            sayHi(msg);
            break;
        case "status":
            msg.channel.send("It's alive!");
            break;
        case "help":
            msg.channel.send("Available commands:\n\
  `hi`\t\t\t\t\tOi, which oik is calling me now?\n\
  `say`\t\t\t\t\tSpeak up, little one. Did you hear me?!\n\
  `status`\t\t\t\t\tYou want to know my status? I'm truly honored\n\
  `help`\t\t\t\t\tHell hath no fury like an unspoken help\n\
  \n\
  **Moderators Only**\n\
  `vote`\t\t\t\t\tCreate a vote/poll of the channel\n\
  `selfdestruct\t\t\t\t\tSelf destruct the channel\n\
  `ban @USER`\t\t\t\t\tBan the user\n\
  `kick @USER`\t\t\t\t\tKick the user\n\
  `deleteall`\t\t\t\t\tDelete all messages on this channel\n\
 ");
            break;
        case "deleteall":
            deleteAll(msg);
            msg.reply("Deleting messages...");
            break;
        case "selfdestruct":
            msg.channel.send(`WARNING :warning: Self-destructing in...!`);
            let selfDestruct = (i) => {
                if (i>=0) {
                    msg.channel.send(`${i}...`);
                    setTimeout(() => { selfDestruct(i-1) }, 1000);
                } else {
                    deleteAll(msg);
                }
            }
            break;
        case "vote":
            msg.channel.send("Creating a vote!\n\
            \nAvailable commands:\n\
            \t\tstart Option 1 ~ Option 2 ~ ... ~ Option N\t\t\tStart the vote with the various options\n\
            \t\tstop\t\t\tStop the vote\n\
            \t\tstatus\t\t\tProgress of the vote\n\
            \t\tresults\t\t\t(After !stop) Results of vote\n\
            ");
            voteMode();
            break;
        default:
            console.log("TechClubBot: command not found");
            msg.reply("That's not implemented yet! Please go add it at https://github.com/polarpiberry/TechClubBot");
    }
}

/**
 * Delete all messages in this messages channel
 * 
 * @function deleteAll
 * @param {Object} msg Message object
 */
let deleteAll = async (msg) => {
    let msgs;
    do {
        msgs = await msg.channel.messages.fetch({limit: 100});
        let res = await msg.channel.bulkDelete(msgs);
        console.log("Deleting messages...", res, msgs.size);
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
    checkPermissions(msg, "Admin").then(() => {
        let usr = msg.mentions.members.first();
        console.log("TechClubBot: " + cmd + " requested for " + usr.username);
        if (usr && usr.username != "TechClubBot") {
            if (cmd == "kick") {
                msg.channel.send(`${usr} is now kicked from the server!`);
                usr.kick();
                return true;
            } else if (cmd == "ban") {
                msg.channel.send(`${usr} is now banned from the server!`);
                usr.ban();
                return true;
            }
        } else if (usr.username == "TechClubBot") {
            msg.reply("HA HA HA HA HA HA HA");
        } else {
            msg.reply("No user specified");
            return false;
        }
    }).catch(() => {
        console.log("TechClubBot: insufficient user permissions")
    });
}

/**
 * Check the permission
 * 
 * @function checkPermission
 * @param {Object} msg Message object
 * @param {String} requiredRole Required role to delete
 * @returns {Promise} Resolve/reject the permission
 */
let checkPermissions = (msg, requiredRole) => {
    return new Promise((resolve, reject) => {
        const permissions = msg.member.roles.cache.some((r) => { return requiredRole == r.name });
        if (permissions) {
            resolve();
        } else {
            msg.reply(`No no no no no no no! Only admins can do that :angry:`);
            reject();
        }
    });
}

/**
 * Say hello to the user
 * 
 * @function sayHi
 * @param {Object} msg Message object
 */
let sayHi = (msg) => {
    if (msg.mentions.members.size == 0) {
        msg.channel.send(`Hello there, General ${msg.author.username}!`);
    } else {
        msg.mentions.members.forEach((member) => {
            msg.channel.send(`Hello there, General ${member.user.username}!`);
        })
    }
}