//Meeting scheduling commands, such as showing a meeting calendar, adding/removing meetings, etc.

const sheets = require("simplegooglesheetsjs");
const googleAuth = require("../GOOGLE_AUTH.js");

const calendarSheet = new sheets(); //Set up the calendar
calendarSheet.authorizeServiceAccount(googleAuth.GOOGLE_AUTH_EMAIL, googleAuth.GOOGLE_AUTH_KEY);
calendarSheet.setSpreadsheet(googleAuth.GOOGLE_SHEET_ID).then(() => calendarSheet.setSheet("Calendar"));

/**
 * Add a meeting as determined by msg (content of msg should be: "addmeeting DATE|TYPE|TIME_START|TIME_END")
 * Note: DAY, MONTH, YEAR should be integers. TYPE should be either G or L. TIME_START and TIME_END should be in the form HRS:MINS
 * 
 * @function addMeeting
 * @param {Object} msg Message
 */
const addMeeting = (msg) => {
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
    calendarSheet.getLastRowIndex().then((lastRow) => {
        calendarSheet.getRows(1,lastRow).then((r) => {
            calendarSheet.setRow(r.length+1, {"Day": content[0], "Month": content[1], "Year": content[2], "Meeting Type": content[3], "Time Start": content[4], "Time End": content[5]}).then(() => {
                console.log("INFO: Meeting scheduled!");
                msg.reply("meeting scheduled!");
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
const removeMeeting = (msg) => {
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
    calendarSheet.getLastRowIndex().then((lastRow) => {
        calendarSheet.getRows(1,lastRow).then((r) => {
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
                calendarSheet.deleteRow(removeList[0]).then(() => {
                    console.log("INFO: deleted row in calendar");
                    msg.reply("one meeting was removed");
                });
            } else {
                console.log("INFO: no matching meetings were found");
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
const showMeetingCalendar = async (msg) => {
    let weeks = "";
    let meetings = ["", ""]; //General and leadership meeting strings
    let mtgs = await getMeetings();
    if (mtgs) {
        meetings = [mtgs.filter((mtg) => mtg["Meeting Type"] == "G"), mtgs.filter((mtg) => mtg["Meeting Type"] == "L")];
        meetings = meetings.map((meeting) => {
            if (meeting.length > 0) {
                return meeting.reduce((prev, curr, i) => { //Get the string representation of the meetings
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

    let date = new Date(); //Today's date
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
 * Get all upcoming meetings
 * 
 * @async
 * @returns {Array<Object>} Array of meeting objects
 */
const getMeetings = async () => {
    let date = new Date(); //Date placeholder
    let mtgs = await (calendarSheet.getRows(2, await calendarSheet.getLastRowIndex()));
    mtgs = mtgs.filter((mtg) => mtg["Month"] == date.getMonth()+1 && mtg["Year"] == date.getFullYear()); //Filter for only meetings in this month and year
    mtgs = mtgs.sort((prev, curr) => { //Sort the meetings so that they are in order of day
        return prev["Day"] - curr["Day"];
    });
    return mtgs;
}

/**
 * Get the string representation of the meeting object for printing in the list
 * 
 * @function meetingString
 * @param {Object} meeting Meeting object
 * @returns {string} String of meeting
 */
const meetingString = (meeting) => {
    return (meeting["Day"] < 10 ? " " : "") + meeting["Day"]
        + "\t\t" + (meeting["Time Start"].length < 5 ? " " : "") + meeting["Time Start"]
        + "\t\t " + (meeting["Time End"].length < 5 ? " " : "") + meeting["Time End"];
}


module.exports = {
    addmeeting: {
        run: addMeeting,
        requiresAdmin: true
    },
    removemeeting: {
        run: removeMeeting,
        requiresAdmin: true
    },
    calendar: {
        run: showMeetingCalendar
    },
    schedulingFunctions: {
        getMeetings
    }
}