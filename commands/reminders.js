//Meeting and event reminders for users functions, such as add/change reminders

const sheets = require("simplegooglesheetsjs");
const googleAuth = require("../GOOGLE_AUTH.js");

const reminders = new sheets(); //Set up the user reminders

reminders.authorizeServiceAccount(googleAuth.GOOGLE_AUTH_EMAIL, googleAuth.GOOGLE_AUTH_KEY);
reminders.setSpreadsheet(googleAuth.GOOGLE_SHEET_ID).then(() => reminders.setSheet("Reminders"));

/**
 * Check for reminders to send to users
 * 
 * @param {Object} bot Discord bot
 * @param {Array<Object>} nextMeetings Upcoming meetings this month
 */
let checkReminders = async (bot, nextMeetings) => { 
    let date = new Date();
    nextMeetings.forEach((meeting) => {
        let meetingDate = new Date(`${meeting["Year"]}-${meeting["Month"]}-${meeting["Day"]} ${meeting["Time Start"]} -8:00`); //PST timezone
        let meetingStr = `Meeting from ${meeting["Time Start"]} to ${meeting["Time End"]} and is type ${meeting["Meeting Type"]}`;
        let hours = ((meetingDate-date)/(60*60*1000));
        console.log("Checking meetings... Next meeting (" + meetingStr + ") in " + hours + " hours");
        if (hours >= 23.75 && hours <= 24) { //23:15 to 24 hours before meeting
            console.log("INFO: meeting in 24 hours. Sending out reminders");
            let reminderLevel = meeting["Meeting Type"] == "L" ? 3 : 2;
            sendReminders(bot, reminderLevel, "about 24 hours", meetingStr);
        } else if (hours > 0.25 && hours < 0.5) { //0:15 to 0:30 hours before meeting
            console.log("INFO: meeting in 15-30 minutes hours. Sending out reminders");
            let reminderLevel = meeting["Meeting Type"] == "L" ? 3 : 1;
            sendReminders(bot, reminderLevel, "about 15-30 minutes", meetingStr);
        }
    });
}

/**
 * Send reminders to users who want them
 * 
 * @param {Object} bot Discord Bot
 * @param {number} reminderLevel Meeting reminder level
 * @param {string} msg Message to send to user about time (such as "24 hours")
 * @param {string} meetingStr String to represent meeting
 */
let sendReminders = async (bot, reminderLevel, msg, meetingStr) => {
    let users = await (reminders.getRows(2, await reminders.getLastRowIndex()));
    users = users.filter((u) => u["User ID"].length != "User ID"); //Remove headers (if any)
    users.forEach((user) => { //Iterate over each user
        if (reminderLevel <= parseInt(user["Reminder Type"])) { //Send out reminders to everyone with a higher level
            bot.users.fetch(user["User ID"]).then((u) => {
                u.send(`Reminder for meeting in ${msg}! ${meetingStr}`);
            }).catch(() => {
                console.log("ERR: couldn't fetch user for sending meeting reminder: ", u.username);
            });
        } else {
            console.log(`INFO: user not receiving alert based on preference of ${user["Reminder Type"]}`);
        }
        
    });
}

/**
 * Change the reminder level for a user
 * 
 * @param {Object} msg Message object
 * @param {number} level Level to set (0 for remove, 1 for all, 2 for right before)
 */
let changeReminderLevel = async (msg, level) => {
    let lastRow = await reminders.getLastRowIndex();
    let rows = await reminders.getRows(1, lastRow);
    for (let i=1; i<rows.length; i++) {
        if (rows[i]["User ID"] == msg.author.id) {
            reminders.setRow(i+1, {"User ID": msg.author.id, "Reminder Type": "" + level}).then(() => {
                console.log(`INFO: changed reminders for user ${msg.author.username} to level ${level}`);
                msg.reply(`Changed reminders level to ${level}`);
            });
            return;
        }
    }
    reminders.setRow(rows.length+1, {"User ID": msg.author.id, "Reminder Type": "" + level}).then(() => { //No user found - add a new row
        console.log(`INFO: set reminders for user ${msg.author.username} at level ${level}`);
        msg.reply(`Set reminders level to ${level}`);
    });
}

module.exports = {
    changereminders: {
        run: changeReminderLevel
    },
    reminderFunctions: {
        checkReminders
    }
}