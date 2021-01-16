/**
 * A command from a user
 * @typedef {Object} Command
 * @param {string} command Command name
 * @param {Array<string>} params Command parameters
 */

const Discord = require("discord.js");
const bot = new Discord.Client();
const http = require("http");

const chatbot = require("./chatbot.js"); //Load the chatbot module

let commands;
require("./commands.js").loadCommands((cmds) => commands = cmds); //Load the commands


const TOKEN = process.env.TOKEN || require("./TOKEN.json").token; //Bot login token

let botMode = "regular"; //The bot's current mode

/**
 * Event handler for startup of Bot
 */
bot.on('ready', () => {
    let checkCounter = 0; //Half-minute counter
    setInterval(() => { //Run functions that need periodic checking
        let date = new Date();
        checkCounter += 1;
        if (checkCounter%10 == 0 || checkCounter == 29) { //Run every 5 minutes or at 14.5 minutes
            commands.schedulingFunctions.getMeetings(date.getMonth()).then((meetings) => {
                commands.schedulingFunctions.getMeetings(date.getMonth()+1).then((meetings2) => {
                    if (checkCounter == 29) { //Every 14.5 minutes
                        console.log("Checking meetings and sending reminders:");
                        commands.reminderFunctions.checkReminders(bot, meetings.concat(meetings2), false); //Check meeting times and send reminders
                        checkCounter = 0;
                    } else {
                        console.log("Meetings:");
                        commands.reminderFunctions.checkReminders(bot, meetings.concat(meetings2), true); //Check meeting times
                    }

                });
            });
        }
    }, 30*1000); //0.5 minutes in ms

    bot.user.setUsername(process.env.BOT_USERNAME || "TechClubBot");
    bot.user.setPresence({
        status: "online",
        activity: {
            name: process.env.BOT_STATUS || "Do Not Disturb...",
            type: process.env.BOT_STATUS_TYPE || "PLAYING"
        }
    });
    console.log("INFO: bot ready");
});

/**
 * Welcome handler for new users, and assigns Member role
 */
bot.on("guildMemberAdd", (member) => {
    let name = member.guild.members.cache.get(member.user.id).nickname; //Select nickname
    if (!name) name = member.user.username; //Default to username if no nickname
    member.guild.channels.cache.find((ch) => {
        return ch.name == "welcome"
    }).send(`Welcome to the server, ${name}!`);
    //Send welcome message
    member.user.send("**Welcome to the BC Tech Club, " + name + "!**\n\
The Tech Club's purpose is to introduce and improve members' skills in CS/IT/Robotics/Electronics.\n\
\n\
**Meetings**\n\
-  Meetings occur weekly alternating on Tuesdays/Thursdays. Please send \"!calendar\" to view the meeting calendar and/or use \"!changereminders 2\" to sign up for meeting reminders.\
\n\
**Projects**\n\
-  The club runs club projects to further members' skills. Please DM a member of Leadership if you would like to join a project or want to know the current project.\
\n\
**Rules**\n\
-  Be respectful to the other members!\n\
-  No swearing in the server\n\
-  Don't use the server or channels for the purpose of harm to others\n\
-  Repeated violation of these rules will result in a suspension or ban at the leadership's digression.\n\
\n\
**Bot Commands**\n\
-  You can run commands either in this chat or in the server's channels\n\
-  Use \"!help\" to view the available commands");
    console.log("INFO: new user added!");
});

/**
 * Event handler for any new message
 */
bot.on("message", (msg) => {
    let msgContentList = msg.content.toLowerCase().split(" ");
    let cmd = getCommand(msgContentList);
    if (botMode == "regular") { //Regular mode
        if (cmd) {
            runCommand(cmd, msg);
        } else if (msg.author.id != bot.user.id && !msg.mentions.everyone && (msg.mentions.has(bot.user) || msg.guild == null)) { //Handle instances of bot mentions or DMs
            botReply(msg);
        } else if ((msgContentList.includes("hello") || msgContentList.includes("hi") || msgContentList.includes("hey")) && msg.author.username !== bot.user.username && msgContentList.length <= 5) { //Run the say hi function
            runCommand({command: "hi", params: msg.content.split(" ").slice(1)}, msg);
        }
    } else if (botMode == "vote") { //Voting mode
        if (cmd) {
            runVoteCommand(cmd, msg);
        }
    }
});


//Log all messages
bot.on("error", (e) => console.error(e));
bot.on("warn", (e) => console.warn(e));
//bot.on("debug", (e) => console.log(e));



bot.login(TOKEN);



/**
 * Serve the error page
 */
http.createServer((req, res) => {
    res.writeHead(401);
    res.end();
}).listen(process.env.PORT || 3000);



/* ========== Modes ========== */



/**
 * Get a command from the message (if any)
 * 
 * @param {Object} msgContentList List of words in message
 * @returns {Command} Returns a Command
 */
const getCommand = (msgContentList) => {
    let command = {command: null, params: []};
    msgContentList.forEach((word) => {
        if (word.startsWith("!")) {
            if (!command.command) {
                command.command = word.substring(1);
            } else {
                msg.reply(":warning: Only the first command will be used")
            }
        } else if (command.command) { //Parse words after the command as parameters
            command.params.push(word);
        }
    });
    return command.command ? command : null; //Only return Command if there is a command
}

/**
 * Run a command
 * 
 * @param {Command} cmd Command object
 * @param {Object} msg Message object
 */
let runCommand = async (cmd, msg) => {
    console.log(`INFO: attempting to run command ${cmd.command}`);
    let cmdFn = commands[cmd.command];
    if (!cmdFn) {
        console.warn("WARN: command not found");
        msg.reply(":grey_question: That's not implemented yet! Please go add it at https://github.com/polarpiberry/TechClubBot");
        return;
    }
    if (cmdFn.serverOnly && msg.guild == null) { //Server only and running in DM
        console.warn("WARN: trying to run server only command in DM")
        msg.reply("Sorry, you can't run that command in a DM");
        return;
    }
    if (cmdFn.requiresAdmin) {
        try {
            await checkPermissions(msg, "Leadership");
        } catch {
            msg.reply(`:no_entry: Only admins can do that`);
            console.warn("WARN: insufficient permissions to run command");
            return;
        }
    }

    if (cmd.command == "vote") { //Change the mode if entering voting mode
        botMode = "vote";
    }

    cmdFn.run(msg, cmd.params); //Run the command if all checks passed
}

/**
 * Run a command during voting mode
 * 
 * @param {Command} cmd Command object
 * @param {Object} msg Message object
 */
let runVoteCommand = async (cmd, msg) => {
    console.log(`INFO: attempting to run voting command ${cmd.command}`);
    let cmdFn = commands["voteCommands"][cmd.command];
    if (!cmdFn) {
        console.warn("WARN: command not found");
        msg.reply(":grey_question: That command is not implemented. Please use help");
        return;
    }
    if (msg.guild == null) { //Trying to run in DM
        console.warn("WARN: trying to run voting command in DM")
        msg.reply("Sorry, you can't run a vote command in a DM");
        return;
    }
    try {
            await checkPermissions(msg, "Leadership");
    } catch {
        msg.reply(`:no_entry: Only admins can do that`);
        console.warn("WARN: insufficient permissions to run command");
        return;
    }

    if (cmd.command == "cancel") { //Exit out of vote mode
        botMode = "regular";
    }

    cmdFn.run(msg, cmd.params); //Run the command if all checks passed
}

/**
 * Handle a message mentioning the bot
 * 
 * @param {Object} msg Message object
 */
const botReply = (msg) => {
    chatbot.getResponse(msg.content).then((res) => {
        if (res) {
            msg.reply(res);
        } else {
            msg.reply("I'm sorry, but I'm not sure exactly what you mean.");
        }
    });
}

/**
 * Check the permission of the user sending the message
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