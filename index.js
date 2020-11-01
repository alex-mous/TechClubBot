const Discord = require("discord.js");
const bot = new Discord.Client();
const http = require("http");
const sheets = require("simplegooglesheetsjs");

const TOKEN = process.env.TOKEN || require("./TOKEN.json").token; //Bot login token
const GOOGLE_AUTH_EMAIL = process.env.GOOGLE_AUTH_EMAIL || require("./GOOGLE_AUTH.json").client_email; //Google Service Account credentials
const GOOGLE_AUTH_KEY = (process.env.GOOGLE_AUTH_KEY && process.env.GOOGLE_AUTH_KEY.replace(/\\n/gm, '\n')) || require("./GOOGLE_AUTH.json").private_key;
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID || require("./GOOGLE_SHEET_ID.json").id; //Google Sheet Email

let minutes = new sheets(); //Set up the minutes
let calendar = new sheets(); //Set up the calendar
minutes.authorizeServiceAccount(GOOGLE_AUTH_EMAIL, GOOGLE_AUTH_KEY);
minutes.setSpreadsheet(GOOGLE_SHEET_ID).then(() => minutes.setSheet("Minutes"));
calendar.authorizeServiceAccount(GOOGLE_AUTH_EMAIL, GOOGLE_AUTH_KEY);
calendar.setSpreadsheet(GOOGLE_SHEET_ID).then(() => calendar.setSheet("Calendar"));


let mode = "regular"; //The bot's current mode

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
 * Welcome handler for new users, and assigns Member role
 */
bot.on("guildMemberAdd", (member) => {
    console.log("TechClubBot: new user added!");
    //let memberRole = member.guild.roles.cache.find((r) => { return r.name == "Member" });
    member.guild.channels.cache.find((ch) => { return ch.name == "welcome"}).send(`Welcome to the server, ${member.user.username}!`);
    //member.roles.add(memberRole); //Add the member role
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
        }
    } else if (mode == "vote") { //Voting mode
        if (msg.content.startsWith("!")) {
            checkPermissions(msg, "Leadership").then(() => {
                let cmd = parseCommand(msg);
                voteCommand(cmd, msg);
            }).catch(() => {
                msg.reply(`:no_entry: Only admins can do that`);
                console.log("TechClubBot: someone tried to control a vote without permission");
            })
        }
    }
});

bot.on("error", (e) => console.error(e));
bot.on("warn", (e) => console.warn(e));
bot.on("debug", (e) => console.log(e));

bot.login(TOKEN); //Set up the Discord Bot



/**
 * Serve the error page
 */
http.createServer((req, res) => {
    res.writeHead(401);
    res.end();
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
:warning: **Once the vote starts, you will not be allowed to send messages in the channel**\n\
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
 * Run a vote
 * 
 * @function runVote
 * @param {Object} msg Message object to run vote off of (!start command)
 */
let runVote = async (msg) => {
    try {
        let options = msg.content.substring(msg.content.indexOf(" ")+1).split("|");
        if (options.length > 1) {
            let voteTimeMs = 60000;
            msg.channel.send("@everyone Starting vote...\nPlace your votes below:\n  ");
            const filter = (_, usr) => { return !vote.voters[usr.username]; }; //Filter to only those who haven't yet voted
            msg.channel.updateOverwrite(msg.channel.guild.roles.everyone, { SEND_MESSAGES: false });
            options.forEach((opt) => { //Initialize the votes
                vote.options[opt] = 0;
                msg.channel.send(`**${opt}**\n `).then((tempMsg) => {
                    let collector = tempMsg.createReactionCollector(filter, { time: voteTimeMs });
                    collector.on("collect", (_, usr) => { //Collect votes
                        console.log(`Collected a reaction from ${usr.tag}`);
                        vote.voters[usr.username] = true;
                        vote.options[opt] += 1;
                    });
                });
            });
            let timerMsg = await msg.channel.send("**" + voteTimeMs/1000 + " seconds remaining...**");
            let timerInterval = setInterval(() => { //Send time left warning every 5 seconds
                voteTimeMs -= 5000;
                if (voteTimeMs > 30000) {
                    timerMsg.edit("**" + voteTimeMs/1000 + " seconds remaining...**");
                } else if (voteTimeMs > 15000) {
                    timerMsg.edit("**:warning: Only " + voteTimeMs/1000 + " seconds remaining!**");
                } else if (voteTimeMs > 0) {
                    timerMsg.edit("**:no_entry: Only " + voteTimeMs/1000 + " seconds remaining!**\n**Place your vote now if you haven't done so already!**");
                } else {
                    timerMsg.delete();
                }
            }, 5000);
            setTimeout(() => { //Wait until end of vote and print out results
                msg.channel.send(`:warning: **Vote Closed** - Results`);
                msg.channel.updateOverwrite(msg.channel.guild.roles.everyone, { SEND_MESSAGES: true });
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
                mode = "regular";
                clearInterval(timerInterval); //Remove the timer
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
    let meetings = ["", ""]; //General and leadership meeting strings
    let date = new Date(); //Date placeholder
    let mtgs = await (calendar.getRows(2, await calendar.getLastRowIndex()));
    mtgs = mtgs.filter((mtg) => mtg["Month"] == date.getMonth()+1 && mtg["Year"] == date.getFullYear()); //Filter for only meetings in this month and year
    if (mtgs) {
        mtgs = mtgs.sort((prev, curr) => { //Sort the meetings so that they are in order of day
            return prev["Day"] - curr["Day"];
        });
        meetings = [mtgs.filter((mtg) => mtg["Meeting Type"] == "G"), mtgs.filter((mtg) => mtg["Meeting Type"] == "L")];
        meetings = meetings.map((meeting) => {
            if (meeting.length > 0) {
                return meeting.reduce((prev, curr, i) => { //Get the string representation of the meetings
                    console.log(prev, curr);
                    if (i >= 1) {
                        return prev + "\n" + meetingString(curr);
                    } else {
                        return prev;
                    }
                }, meetingString(meeting[0]));
            } else {
                return "";
            }
        });
        
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
**General Meeting List:**```\n\
Day\tStart Time\t  End Time\n" + meetings[0] + "\
    ```\n\
**Leadership Meeting List:**```\n\
Day\tStart Time\t  End Time\n" + meetings[1] + "\
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
    return (meeting["Day"] < 10 ? " " : "") + meeting["Day"]
        + "\t\t" + (meeting["Time Start"].length < 5 ? " " : "") + meeting["Time Start"]
        + "\t\t " + (meeting["Time End"].length < 5 ? " " : "") + meeting["Time End"];
}
