const Discord = require("discord.js");
const bot = new Discord.Client();
const http = require("http");
const fs = require("fs");
const sheets = require("simplegooglesheetsjs");
const { removeListener } = require("process");

const TOKEN = process.env.TOKEN || require("./TOKEN.json").token; //Bot login token
const GOOGLE_AUTH_EMAIL = process.env.GOOGLE_AUTH_EMAIL || require("./GOOGLE_AUTH.json").client_email; //Google Service Account credentials
const GOOGLE_AUTH_KEY = process.env.GOOGLE_AUTH_KEY.replace(/\\n/gm, '\n') || require("./GOOGLE_AUTH.json").private_key; //Google Service Account credentials
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID || require("./GOOGLE_SHEET_ID.json").id; //Google Sheet Email

bot.login(TOKEN); //Set up the Discord Bot

let minutes = new sheets(); //Set up the minutes
let calendar = new sheets(); //Set up the calendar
minutes.authorizeServiceAccount(GOOGLE_AUTH_EMAIL, GOOGLE_AUTH_KEY);
minutes.setSpreadsheet(GOOGLE_SHEET_ID).then(() => minutes.setSheet("Minutes"));
calendar.authorizeServiceAccount(GOOGLE_AUTH_EMAIL, GOOGLE_AUTH_KEY);
calendar.setSpreadsheet(GOOGLE_SHEET_ID).then(() => calendar.setSheet("Calendar"));


const index = fs.readFileSync("index.html"); //Index file to serve

let mode = "regular"; //The bot's current mode

let warnedUsers = {}; //Users with warnings (in the format { username: attempts })

let vote = { //Hold the current vote
    options: {},
    voters: []
};

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
        } else if ((msgContentList.includes("hello") || msgContentList.includes("hi") || msgContentList.includes("hey")) && msg.author.username !== "TechClubBot" && msgContentList.length <= 5) { //Run the say hi function
            sayHi(msg);
        } else if ((msgContentList[0] == "lol" || msgContentList[0] == "xd") && msg.author.username !== "polarpiberry" && msgContentList.length <= 2) {
            msg.reply(`:warning: Please do not continue behavior like this`);
            warnUser(msg, 10);
        }
    } else if (mode == "vote") { //Voting mode
        if (msg.content.startsWith("!")) {
            checkPermissions(msg, "Leadership").then(() => {
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
    //let memberRole = member.guild.roles.cache.find((r) => { return r.name == "Member" });
    member.guild.channels.cache.find((ch) => { return ch.name == "welcome"}).send(`Welcome to the server, ${member.user.username}!`);
    //member.roles.add(memberRole); //Add the member role
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
            `help`\t\t\t\t\tHelp me!\n\
            `getminutes MEETING_#`\t\t\t\t\tGet the meeting minutes (meeting # is the number of meeting prior to the last meeting [e.g. 1 => meeting before last meeting]. No number or 0 for previous meeting)\n\
            `calendar`\t\t\t\t\tPrint out the meeting calendar and list\n\n\
            **Leadership Only**\n\
            `vote`\t\t\t\t\tCreate a vote/poll of the channel\n\
            `selfdestruct`\t\t\t\t\tSelf destruct the channel\n\
            `ban @USER`\t\t\t\t\tBan the user\n\
            `kick @USER`\t\t\t\t\tKick the user\n\
            `deleteall`\t\t\t\t\tDelete all messages on this channel\n\
            `setminutes DATE TYPE MINUTES`\t\t\t\t\tSet the meeting minutes\n\
            `addmeeting DAY|MONTH|YEAR|TYPE|TIME_START|TIME_END`\t\t\t\t\tSchedule a meeting\n\
            `removemeeting DAY|MONTH|YEAR|TYPE|TIME_START`\t\t\t\t\tUn-schedule a meeting\n");
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
            checkPermissions(msg, "Leadership").then(() => {
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
        case "setminutes":
            checkPermissions(msg, "Leadership").then(() => {
                setMinutes(msg);
            }).catch(() => {
                msg.reply(`:no_entry: Only admins can do that`);
                console.warn("TechClubBot: no minutes set: insufficient permissions");
            });
            break;
        case "getminutes":
            getMinutes(msg);
            break;
        case "addmeeting":
            checkPermissions(msg, "Leadership").then(() => {
                addMeeting(msg); //To schedule a meeting
            }).catch((e) => {
                console.log(e)
                msg.reply(`:no_entry: Only admins can do that`);
                console.warn("TechClubBot: no meeting added: insufficient permissions");
            });
            break;
        case "removemeeting":
            checkPermissions(msg, "Leadership").then(() => {
                removeMeeting(msg); //To unschedule a meeting
            }).catch(() => {
                msg.reply(`:no_entry: Only admins can do that`);
                console.warn("TechClubBot: no meeting removed: insufficient permissions");
            });
            break;
        case "calendar":
            showMeetingCalendar(msg);
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
    checkPermissions(msg, "Leadership").then(() => { //Only caution non-admins
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
                let mutedRole = msg.guild.roles.cache.find((r) => { return r.name == "Muted" });
                for (let user in warnedUsers) {
                    if (warnedUsers[user].muted) {
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
    checkPermissions(msg, "Leadership").then(() =>  {
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
    if (!msg.mentions.members.first()) {
        msg.reply(":warning: you need to specify at least one person to kick or ban");
        return;
    }
    if (msg.mentions.members.first() && msg.mentions.members.first().roles.cache.some((r) => { return "Leadership" == r.name })) {
        msg.reply("HA HA HA you can't ban a member of Leadership");
        return;
    }
    checkPermissions(msg, "Leadership").then(() => {
        let usr = msg.mentions.members.first();
        console.log("TechClubBot: " + cmd + " requested for ", usr);
        if (usr && usr.user.username.toLowerCase() != "techclubbot") {
            if (cmd == "kick") {
                msg.channel.send(`${usr} is now kicked from the server!`);
                usr.kick();
                return true;
            } else if (cmd == "ban") {
                msg.channel.send(`${usr} is now banned from the server!`);
                usr.ban();
                return true;
            }
        } else if (usr.user.username.toLowerCase() == "techclubbot") {
            msg.reply("HA HA HA HA HA HA HA");
        } else {
            msg.reply("No user specified");
            return false;
        }
    }).catch((e) => {
        console.log("Error: ", e)
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

/**
 * Set the meeting minutes for a meeting today
 * 
 * @function setMinutes
 * @param {Object} msg Message of meeting minutes
 */
let setMinutes = (msg) => {
    let content = msg.content.split(" ");
    if (content.length < 4) {
        msg.reply("Please specify a date, a meeting type, and the minutes");
        return;
    }
    minutes.getLastRowIndex().then((lastRow) => {
        minutes.getRows(1,lastRow).then((r) => {
            minutes.setRow(r.length+1, {"Date": content[1], "Meeting Type": content[2], "Minutes":  content.slice(3).join(" ")}).then(() => {
                console.log("TechClubBot: minutes set!");
                msg.reply("Minutes set!");
            });
        });
    });
}

/**
 * Get the meeting minutes for a meeting
 * 
 * @function getMinutes
 * @param {Object} msg Message
 */
let getMinutes = (msg) => {
    let content = msg.content.split(" ");
    let num;
    if (content.length < 2) {
        num = 0;
    } else {
        num = parseInt(content[1]);
        if (isNaN(num) || num < 0) {
            msg.reply("Please specify a valid meeting number (positive integer)");
            return;
        }
    }
    minutes.getLastRowIndex().then((lastRow) => {
        minutes.getRows(1,lastRow).then((r) => {
            if (r.length <= num) {
                msg.reply("There's no meeting that far back!");
                return;
            }
            msg.channel.send("Meeting Date: " + r[r.length-num-1]["Date"]);
            msg.channel.send("Meeting Type: " + r[r.length-num-1]["Meeting Type"]);
            msg.channel.send("Meeting Minutes: " + r[r.length-num-1]["Minutes"]);
        });
    });
}

/*
            `addmeeting DAY|MONTH|YEAR|TYPE|TIME_START|TIME_END`\t\t\t\t\tSchedule a meeting\n\
            `removemeeting DAY|MONTH|YEAR|TYPE|TIME_START`\t\t\t\t\tUn-schedule a meeting\n");
*/
/**
 * Add a meeting as determined by msg (content of msg should be: "addmeeting DATE|TYPE|TIME_START|TIME_END")
 * Note: DAY, MONTH, YEAR should be integers. TYPE should be either G or L. TIME_START and TIME_END should be in the form HRS:MINS
 * 
 * @function addMeeting
 * @param {Object} msg Message
 */
let addMeeting = (msg) => {
    let content = msg.content.substring(msg.content.indexOf(" "));
    if (!content) {
        msg.reply("Please include meeting details");
        return;
    }
    content = content.replace(" ", "").split("|");
    if (content.length < 6) {
        msg.reply("Please include all required fields: DAY|MONTH|YEAR|TYPE|TIME_START|TIME_END");
        return;
    }
    calendar.getLastRowIndex().then((lastRow) => {
        calendar.getRows(1,lastRow).then((r) => {
            calendar.setRow(r.length+1, {"Day": content[0], "Month": content[1], "Year": content[2], "Meeting Type": content[3], "Time Start": content[4], "Time End": content[5]}).then(() => {
                console.log("TechClubBot: Meeting scheduled!");
                msg.reply("Meeting scheduled!");
            });
        });
    });
}

/**
 * Remove a meeting as determined by msg (content of msg should be: "removemeeting DATE|TYPE|TIME_START")
 * 
 * @function removeMeeting
 * @param {Object} msg Message
 */
let removeMeeting = (msg) => {
    let content = msg.content.substring(msg.content.indexOf(" "));
    if (!content) {
        msg.reply("Please include meeting details");
        return;
    }
    content = content.replace(" ", "").split("|");
    if (content.length < 5) {
        msg.reply("Please include all required fields: DAY|MONTH|YEAR|TYPE|TIME_START");
        return;
    }
    calendar.getLastRowIndex().then((lastRow) => {
        calendar.getRows(1,lastRow).then((r) => {
            let removeList = [];
            r.forEach((row, i) => { //Get a list of indexes of rows to remove
                if (row["Day"] == content[0]
                    && row["Month"] == content[1]
                    && row["Year"] == content[2]
                    && row["Meeting Type"] == content[3]
                    && row["Time Start"] == content[4]) {
                    removeList.push(i);
                    console.log("Match found: ", row, content);
                } else {
                    console.log("Match not found: ", row, content);
                }
            });
            if (removeList.length > 0) {
                calendar.deleteRow(removeList[0]).then(() => {
                    console.log("TechClubBot: deleted row in calendar");
                    msg.reply("one meeting was removed");
                });
            } else {
                console.log("TechClubBot: no matching meetings were found");
                msg.reply("no matching meetings were found");
            }
        });
    });
}

/**
 * Print the meeting calendar to the channel msg was sent in
 * 
 * @function showMeetingCalendar
 * @param {Object} msg Message
 */
let showMeetingCalendar = async (msg) => {
    let weeks = "";
    let meetings = "";
    let date = new Date(); //Date placeholder
    let mtgs = await (calendar.getRows(2, await calendar.getLastRowIndex()));
    mtgs = mtgs.filter((mtg) => mtg["Month"] == date.getMonth()+1 && mtg["Year"] == date.getFullYear());
    if (mtgs.length > 1) {
        meetings = mtgs.reduce((prev, curr, i) => {
            if (i==1) {
                return meetingString(prev) + "\n" + meetingString(curr) + "\n";
            } else {
                return prev + meetingString(curr) + "\n";
            }
        });
    } else if (mtgs.length == 1) {
        meetings = meetingString(mtgs[0]);
    }

    //Next create the weeks
    let mtgsReversed = {};
    mtgs.forEach((mtg) => {
        if (!mtgsReversed[mtg["Day"]]) {
            mtgsReversed[mtg["Day"]] = mtg;
        } else {
            mtgsReversed[mtg["Day"]]["Meeting Type"] = "*";
        }
    })
    let last = new Date(date.getFullYear(), date.getMonth()+1, 0).getDate(); //Last day of month
    let day = 1; //Day counter
    for (let w=0; w<5; w++) { //Weeks in month
        for (let i=0; i<7; i++) { //Days in week
            let curr = new Date(date.getFullYear(), date.getMonth(), day); //Get current day from day counter
            if (i == curr.getDay() && (day <= last)) { //If it's actually in the month, add it
                if (mtgsReversed[day]) {
                    weeks += "║ " + mtgsReversed[day]["Meeting Type"] + " ";
                } else {
                    weeks += "║   ";
                }
                day++;
            } else { //Otherwise increment I and add an X
                weeks += "║ X ";
            }
        }
        weeks += "║\n";
        if (w < 4) {
            weeks += "║═══╬═══╬═══╬═══╬═══╬═══╬═══║\n";
        }
    }
    
    let cal = "**Meeting Calendar for " + date.toLocaleString('default', { month: 'long' }) + "**\n```\n\
╔═══╦═══╦═══╦═══╦═══╦═══╦═══╗\n\
║ Su║ M ║ Tu║ W ║ Th║ F ║ Sa║\n\
║═══╬═══╬═══╬═══╬═══╬═══╬═══║\n" + weeks + "\
╚═══╩═══╩═══╩═══╩═══╩═══╩═══╝\n\
Legend:\n\tG - General Meeting\n\tL - Leadership Meeting\n\t* - Multiple\n```\n\
**Meeting List:**```\n\
Day\tType\tStart Time\tEnd Time\n" + meetings + "\
    ```\n\
    ";
    msg.channel.send(cal);
}

/**
 * Get the string representation of the meeting object for printing in the list
 * 
 * @function meetingString
 * @param {Object} meeting Meeting object
 * @returns {string} String of meeting
 */
let meetingString = (meeting) => {
    return (meeting.Day < 10 ? " " : "") + meeting.Day + "\t   " + meeting["Meeting Type"] + "\t\t" + meeting["Time Start"] + "\t\t " + meeting["Time End"]
}