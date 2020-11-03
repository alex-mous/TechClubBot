//Meeting minutes functions, such as add/remove mintues

const sheets = require("simplegooglesheetsjs");
const googleAuth = require("../GOOGLE_AUTH.js");

const minutes = new sheets(); //Set up the minutes

minutes.authorizeServiceAccount(googleAuth.GOOGLE_AUTH_EMAIL, googleAuth.GOOGLE_AUTH_KEY);
minutes.setSpreadsheet(googleAuth.GOOGLE_SHEET_ID).then(() => minutes.setSheet("Minutes"));

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

module.exports = {
    setminutes: {
        run: setMinutes,
        requiresAdmin: true
    },
    getminutes: {
        run: getMinutes
    }
}