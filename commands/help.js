//Print out the help page for the bot

const help = (msg) => {
    msg.channel.send("Available commands:\n\
            `hi`\t\t\t\t\tGreetings from the bot\n\
            `say`\t\t\t\t\tRepeat and delete the message\n\
            `status`\t\t\t\t\tMy status\n\
            `help`\t\t\t\t\tThis help!\n\
            `getminutes MEETING_#`\t\t\t\t\tGet the meeting minutes (meeting # is the number of meeting prior to the last meeting [e.g. 1 => meeting before last meeting]. No number or 0 for previous meeting)\n\
            `calendar MONTH_#`\t\t\t\t\tPrint out the meeting calendar and list for the month number (no month -> current month)\n\
            `changereminders ANNOYANCE_LEVEL`\t\t\t\t\tSet your annoyance level for DM meeting reminders (0 to 2 for 0 to 2 reminders before each general meeting, 3 for all reminders for general and leadership) \n\n\
            **Leadership Only**\n\
            `vote`\t\t\t\t\tCreate a vote/poll of the channel\n\
            `selfdestruct`\t\t\t\t\tSelf destruct the channel\n\
            `ban @USER`\t\t\t\t\tBan the user\n\
            `kick @USER`\t\t\t\t\tKick the user\n\
            `deleteall`\t\t\t\t\tDelete all messages on this channel\n\
            `setminutes DATE TYPE MINUTES`\t\t\t\t\tSet the meeting minutes\n\
            `addmeeting DAY|MONTH|YEAR|TYPE|TIME_START|TIME_END`\t\t\t\t\tSchedule a meeting (24-hour times!)\n\
            `removemeeting DAY|MONTH|YEAR|TYPE|TIME_START`\t\t\t\t\tUn-schedule a meeting (24-hour times!)\n");
}

module.exports.help = {
    run: help
}