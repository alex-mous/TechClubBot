const Discord = require("discord.js");
const bot = new Discord.Client();
const http = require("http");
const fs = require("fs");

const TOKEN = process.env.TOKEN || require("./TOKEN.json").token; //Bot login token
bot.login(TOKEN);

const index = fs.readFileSync("index.html"); //Index file to serve

let mode = "regular"; //The bot's current mode

let warnedUsers = {}; //Users with warnings (in the format { username: attempts })

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
    if (mode == "regular") { //Regular mode
        let msgContentList = msg.content.toLowerCase().split(" ")
        if (msg.content.startsWith("!")) {
            let cmd = parseCommand(msg);
            generalCommand(cmd, msg);
        } else if ((msgContentList.includes("hello") || msgContentList.includes("hi") || msgContentList.includes("hey")) && msg.author.username !== "TechClubBot") {
            sayHi(msg);
        } else if ((msg.content.toLowerCase() == "lol" || msg.content.toLowerCase() == "xd") && msg.author.username !== "polarpiberry") {
            msg.reply(`WARNING :warning: you will be banned if you continue behavior like this!`);
        }
    } else if (mode == "vote") { //Voting mode
        if (msg.content.startsWith("!")) {
            checkPermissions(msg, "Admin").then(() => {
                let cmd = parseCommand(msg);
                voteCommand(cmd, msg);
            }).catch(() => {
                console.log("")
            })
        } else if (msg.author.username != "TechClubBot") {
            warnUser(msg);
        }
    }
})

/**
 * Welcome handler for new users, and assigns Member role
 */
bot.on("guildMemberAdd", (member) => {
    console.log("TechClubBot: new user added!");
    member.guild.channels.cache.find((ch) => { return ch.name == "welcome"}).send(`Welcome to the server, ${member.user.username}!`);
    member.roles.add("Member"); //Add the member role
});

bot.on("error", (e) => console.error(e));
bot.on("warn", (e) => console.warn(e));
bot.on("debug", (e) => console.log(e));

/**
 * Serve the webpage
 */
http.createServer((req, res) => {
    res.writeHead(200, {"Content-Type": "text/html"});
    res.end(index);
}).listen(process.env.PORT || 3000);



/* ========== Modes ========== */

/**
 * Run a regular command
 * 
 * @function generalCommand
 * @param {string} cmd Command
 * @param {Object} msg Message object
 */
let generalCommand = (cmd, msg) => {
    console.log("TechClubBot: running command " + cmd);
    switch (cmd) {
        case "ban":
            kickOrBan(msg, "ban");
            break;
        case "kick":
            kickOrBan(msg, "kick");
            break;
        case "hi":
            sayHi(msg);
            break;
        case "say":
            say(msg);
            break;
        case "status":
            msg.channel.send("It's alive!");
            break;
        case "help":
            msg.channel.send("Available commands:\n\
            `hi`\t\t\t\t\tOi, which oik is calling me now?\n\
            `say`\t\t\t\t\tSpeak up, little one. Did you hear me?!\n\
            `status`\t\t\t\t\tYou want to know my status? I'm truly honored\n\
            `help`\t\t\t\t\tHell hath no fury like an unspoken help\n\n\
            **Moderators Only**\n\
            `vote`\t\t\t\t\tCreate a vote/poll of the channel\n\
            `selfdestruct`\t\t\t\t\tSelf destruct the channel\n\
            `ban @USER`\t\t\t\t\tBan the user\n\
            `kick @USER`\t\t\t\t\tKick the user\n\
            `deleteall`\t\t\t\t\tDelete all messages on this channel\n");
            break;
        case "deleteall":
            deleteAll(msg);
            break;
        case "selfdestruct":
            msg.channel.send(`WARNING :warning: Self-destructing in...!`);
            let selfDestruct = (i) => {
                if (i>=0) {
                    msg.channel.send(`${i}...`);
                    setTimeout(() => { selfDestruct(i-1) }, 1500);
                } else {
                    deleteAll(msg);
                }
            }
            selfDestruct(10);
            break;
        case "vote":
            checkPermissions(msg, "Admin").then(() => {
                msg.channel.send("Welcome to Voting Mode!");
                voteCommand("help", msg);
                mode = "vote";
                console.log("TechClubRobot: vote started");
            }).catch(() => {
                msg.reply(`Only admins can do that :angry:`);
                console.warn("TechClubBot: vote stopped: insufficient permissions");
            })
            break;
        default:
            console.warn("TechClubBot: command not found");
            msg.reply("That's not implemented yet! Please go add it at https://github.com/polarpiberry/TechClubBot");
    }
}

/**
 * Run a voting command
 * 
 * @function voteCommand
 * @param {string} cmd Command
 * @param {Object} msg Message object
 */
let voteCommand = (cmd, msg) => {
    console.log("TechClubBot: running vote command " + cmd);
    switch (cmd) {
        case "start":
            msg.channel.send("@everyone Starting vote...\n\
WARNING :warning: anyone who sends more than 3 messages while in vote mode will be muted until the vote is over!");
            break;
        case "stop":
            break;
        case "results":
            break;
        case "status":
            voteCommand("cancel", msg);
            break;
        case "cancel":
            msg.channel.send("Exiting vote mode...");
            //TODO: restore muted users
            break;
        case "help":
            msg.channel.send("Available voting commands:\n\
            `start Option 1 ~ Option 2 ~ ... ~ Option N`                Start the vote with the various options\n\
            `stop`              End the vote\n\
            `status`            Progress of the vote\n\
            `results`           (After !stop) Results of vote\n\
            `cancel`            Exit vote mode\n\
            `help`              Print this help");
            break;
        default:
            msg.reply("That command doesn't exist. Are you sure it's correct?");
            console.log("TechClubRobot: voting command not implemented ", cmd);
    }
}




/* ========== Command Functions ========== */

/**
 * Run the command in the message and return
 * 
 * @function runCommand
 * @param {Object} msg Message object
 * @returns {string} Command
 */
let parseCommand = (msg) => {
    let command = msg.content.substring(msg.content.indexOf("!")+1);
    let end = command.indexOf(" ");
    end = end > 0 ? end : command.length;
    command = command.substring(0, end);
    return command;
}

/**
 * Warn and mute the user (if 0 attempts left and not an admin)
 * 
 * @function warnUser
 * @param {Object} msg Message object
 */
let warnUser = (msg) => {
    checkPermissions(msg, "Admin").then(() => { //Only caution non-admins
        console.log("TechClubBot: extra message from admin");
    }).catch(() => {
        let i = warnedUsers[msg.author.username] || 3;
        if (i > 1) {
            warnedUsers[msg.author.username] = i-1;
            msg.reply(`please refrain from texting during a vote. If you try ${i-1} more times, you will be muted for the duration of the vote`);
            console.log(`TechClubRobot: cautioned user ${msg.author.username} with attempts left: ${i-1}`);
        } else {
            let member = msg.guild.roles.cache.find((r) => { return r.name == "Member" });
            let muted = msg.guild.roles.cache.find((r) => { return r.name == "Muted" });
            msg.member.roles.remove(member);
            msg.member.roles.add(muted);
            msg.channel.send(`${msg.author.username} has been muted for texting too much during a vote`);
            console.log(`TechClubRobot: muted user ${msg.author.username}`);
        }
    })
}


/**
 * Delete all messages in this messages channel
 * 
 * @function deleteAll
 * @param {Object} msg Message object
 */
let deleteAll = (msg) => {
    checkPermissions(msg, "Admin").then(() =>  {
        console.log("TechClubBot: deleting all messages...");
        (async () => {
            let msgs;
            do {
                msgs = await msg.channel.messages.fetch({limit: 100});
                let res = await msg.channel.bulkDelete(msgs);
            } while (msgs.size >= 2);
        })();
    }).catch(() => {
        msg.reply(`Only admins can do that :angry:`);
        console.log("TechClubBot: insufficient user permissions to delete messages");
    })
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
        msg.reply(`Only admins can do that :angry:`);
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
        if (permissions)
            resolve();
        else
            reject();
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

/**
 * Repeat the message and delete it
 * 
 * @function say
 * @param {Object} msg Message object
 */
let say = (msg) => {
    msg.channel.send(`@${msg.author.username} says${msg.toString().substring(msg.toString().indexOf(" "))}`);
    
}