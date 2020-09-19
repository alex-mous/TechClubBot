const Discord = require("discord.js");
const bot = new Discord.Client();
const http = require("http");
const fs = require("fs");

const TOKEN = process.env.TOKEN || require("./TOKEN.json").token; //Bot login token
bot.login(TOKEN);

const index = fs.readFileSync("index.html"); //Index file to serve

let mode = "regular"; //The bot's current mode

let warnedUsers = {}; //Users with warnings (in the format { username: attempts })
let vote = {
    options: {},
    voters: []
}; //Hold the current vote


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
            msg.reply(`:warning: Please do not continue behavior like this`);
            warnUser(msg, 10);
        }
    } else if (mode == "vote") { //Voting mode
        if (msg.content.startsWith("!")) {
            checkPermissions(msg, "Admin").then(() => {
                let cmd = parseCommand(msg);
                voteCommand(cmd, msg);
            }).catch((err) => {
                msg.reply(`:no_entry: Only admins can do that`);
                console.log("TechClubBot: someone tried to control a vote without permission");
            })
        }
    }
});

/**
 * Welcome handler for new users, and assigns Member role
 */
bot.on("guildMemberAdd", (member) => {
    console.log("TechClubBot: new user added!");
    let memberRole = member.guild.roles.cache.find((r) => { return r.name == "Member" });
    member.guild.channels.cache.find((ch) => { return ch.name == "welcome"}).send(`Welcome to the server, ${member.user.username}!`);
    member.roles.add(memberRole); //Add the member role
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
            `hi`\t\t\t\t\tGreetings from the bot\n\
            `say`\t\t\t\t\tSpeak up, little one!\n\
            `status`\t\t\t\t\tMy status\n\
            `help`\t\t\t\t\tHelp me!\n\n\
            **Admins Only**\n\
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
            msg.channel.send(`:warning: Self-destructing in...!`);
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
                msg.channel.send("**Welcome to Voting Mode!**\n\
:warning: **Once the vote starts, you will have 60 seconds to cast your vote**\n\
:warning: **To vote, react with an emoji to one of the options**\n\
:warning: **Only your first reaction will be counted, so choose wisely**\n\
*You will be muted once you have voted and will be unmuted again once the vote is complete*");
                voteCommand("help", msg);
                mode = "vote";
                console.log("TechClubRobot: vote started");
            }).catch(() => {
                msg.reply(`:no_entry: Only admins can do that`);
                console.warn("TechClubBot: vote stopped: insufficient permissions");
            })
            break;
        default:
            console.warn("TechClubBot: command not found");
            msg.reply(":grey_question: That's not implemented yet! Please go add it at https://github.com/polarpiberry/TechClubBot");
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
            runVote(msg);
            break;
        case "cancel":
            mode = "regular";
            console.log("TechClubBot: voting mode cancelled");
            msg.channel.send("Vote mode cancelled");
            break;
        case "help":
            msg.channel.send("Available voting commands:\n\
            `start Option 1|Option 2|...|Option N`                Start the vote with the various options\n\
            `cancel`            Exit vote mode\n\
            `help`              Print this help");
            break;
        default:
            msg.reply("That command doesn't exist. Are you sure it's correct?");
            console.warn("TechClubRobot: voting command not implemented ", cmd);
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
    return command.toLowerCase();
}

/**
 * Warn and mute the user (if 0 attempts left and not an Admin)
 * 
 * @function warnUser
 * @param {Object} msg Message object
 * @param {number} maxNo Maximum number of attempts
 */
let warnUser = (msg, maxNo) => {
    checkPermissions(msg, "Admin").then(() => { //Only caution non-admins
        console.log("TechClubBot: extra message from admin");
    }).catch(() => {
        let i = maxNo;
        if (warnedUsers[msg.author.username]) {
            i = warnedUsers[msg.author.username].left;
        }
        if (i > 1) {
            warnedUsers[msg.author.username] = { left: i-1 };
            msg.reply(`:warning: If you try ${i-1} more times, you will be kicked from the server`);
            console.log(`TechClubRobot: cautioned user ${msg.author.username} with attempts left: ${i-1}`);
        } else {
            msg.member.kick();
            console.log(`TechClubRobot: kicked user ${msg.author.username}`);
            msg.channel.send(`:x: ${msg.author.username} has been kicked for texting too much during a vote`);
        }
    })
}

/**
 * Run a vote
 * 
 * @function runVote
 * @param {Object} msg Message object to run vote off of (!start command)
 */
let runVote = (msg) => {
    try {
        let options = msg.content.substring(msg.content.indexOf(" ")+1).split("|");
        if (options.length > 1) {
            msg.channel.send("@everyone Starting vote...\nPlace your votes below:\n  ");
            msg.channel.updateOverwrite(msg.channel.guild.roles.everyone, { SEND_MESSAGES: false }); //Prevent sending of messages
            const filter = (_, usr) => { return !vote.voters[usr.username]; }; //Filter to only those who haven't yet voted
            options.forEach((opt, i) => { //Initialize the votes
                vote.options[opt] = 0;
                msg.channel.send(`**${opt}**\n `).then((tempMsg) => {
                    let collector = tempMsg.createReactionCollector(filter, { time: 60000 });
                    collector.on("collect", (_, usr) => { //Collect votes
                        console.log(`Collected a reaction from ${usr.tag}`);
                        vote.voters[usr.username] = true;
                        vote.options[opt] += 1;
                    });
                });
            });
            setTimeout(() => { //Wait until end of vote and print out results
                msg.channel.updateOverwrite(msg.channel.guild.roles.everyone, { SEND_MESSAGES: true });
                msg.channel.send(`:warning: **Vote Closed** - Results`);
                let winner = "";
                for (let opt in vote.options) {
                    if (winner && vote.options[opt] > vote.options[winner]) {
                        winner = opt;
                    } else if (winner && vote.options[opt] == vote.options[winner]) {
                        winner = "tied";
                    } else if (!winner) {
                        winner = opt;
                    }
                    msg.channel.send(`\n**${opt}** received ${vote.options[opt]} votes`);
                }
                msg.channel.send(`:checkered_flag: The winner is **${winner}**`); //print winner and check for ties
                msg.channel.send("*Exited Voting Mode...*");
                let memberRole = msg.guild.roles.cache.find((r) => { return r.name == "Member" });
                let mutedRole = msg.guild.roles.cache.find((r) => { return r.name == "Muted" });
                for (let user in warnedUsers) {
                    if (warnedUsers[user].muted) {
                        msg.member.roles.add(memberRole);
                        msg.member.roles.remove(mutedRole);
                    }
                }
                mode = "regular";
            }, 61000);
        } else {
            msg.channel.send("Incorrectly formatted query. Must be in the form `!vote OPTION 1|OPTION 2|OPTION N`");
        }
    } catch {
        msg.channel.send("Incorrectly formatted query. Must be in the form `!vote OPTION 1 ~ OPTION 2 ~ OPTION N`");
    }
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
        msg.reply(`:no_entry: Only admins can do that`);
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
        msg.reply(`:no_entry: Only admins can do that`);
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
        msg.channel.send(`:hand_splayed: Hello, ${msg.author.username}!`);
    } else {
        msg.mentions.members.forEach((member) => {
            msg.channel.send(`:hand_splayed: Hello there, General ${member.user.username}!`);
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
    msg.channel.send(`@${msg.author.username} says${msg.content.substring(msg.content.indexOf(" "))}`);
    msg.delete();
}
