//Voting commands and mode

let voteStats = { //Hold the current vote stats
    options: {},
    voters: []
};

/**
 * Initialize a message
 * 
 * @param {Object} msg Message object
 */
const initializeVote = (msg) => {
    msg.channel.send("**Welcome to Voting Mode!**\n\
    :warning: **Once the vote starts, you will have 60 seconds to cast your vote**\n\
    :warning: **Once the vote starts, you will not be allowed to send messages in the channel**\n\
    :warning: **To vote, react with an emoji to one of the options**\n\
    :warning: **Only your first reaction will be counted, so choose wisely**\n\
    *You will be muted once you have voted and will be unmuted again once the vote is complete*");
    voteHelp(msg);
    console.log("INFO: vote started");
}

/**
 * Print out voting help
 * 
 * @param {Object} msg Message object
 */
let voteHelp = (msg) => {
    msg.channel.send("Available voting commands:\n\
        `start Option 1|Option 2|...|Option N`                Start the vote with the various options\n\
        `cancel`            Exit vote mode\n\
        `help`              Print this help");
}

/**
 * Start a vote
 * 
 * @param {Object} msg Message object to run vote off of (!start command)
 */
const startVote = async (msg) => {
    try {
        let options = msg.content.substring(msg.content.indexOf(" ")+1).split("|");
        if (options.length > 1) {
            let voteTimeMs = 60000;
            msg.channel.send("@everyone Starting vote...\nPlace your votes below:\n  ");
            const filter = (_, usr) => { return !voteStats.voters[usr.username]; }; //Filter to only those who haven't yet voted
            msg.channel.updateOverwrite(msg.channel.guild.roles.everyone, { SEND_MESSAGES: false });

            options.forEach((opt) => { //Initialize the votes
                voteStats.options[opt] = 0;
                msg.channel.send(`**${opt}**\n `).then((tempMsg) => {
                    let collector = tempMsg.createReactionCollector(filter, { time: voteTimeMs });
                    collector.on("collect", (_, usr) => { //Collect votes
                        console.log(`Collected a reaction from ${usr.tag}`);
                        voteStats.voters[usr.username] = true;
                        voteStats.options[opt] += 1;
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
                for (let opt in voteStats.options) {
                    if (winner && voteStats.options[opt] > voteStats.options[winner]) {
                        winner = opt;
                    } else if (winner && voteStats.options[opt] == voteStats.options[winner]) {
                        winner = "tied";
                    } else if (!winner) {
                        winner = opt;
                    }
                    msg.channel.send(`\n**${opt}** received ${voteStats.options[opt]} votes`);
                }
                msg.channel.send(`:checkered_flag: The winner is **${winner}**`); //print winner and check for ties
                msg.channel.send("*Use cancel to exit Voting Mode...*");
                mode = "regular";
                clearInterval(timerInterval); //Remove the timer
            }, 61000);
        } else {
            msg.channel.send("Incorrectly formatted query. Must be in the form `!vote OPTION 1|OPTION 2|OPTION N`");
        }
    } catch {
        
    }
}

/**
 * Exit vote mode
 * 
 * @param {Object} msg Message object
 */
const cancelVote = (msg) => {
    msg.channel.send("*Exited voting mode...*");
}

module.exports = {
    vote: {
        run: initializeVote,
        requiresAdmin: true
    },
    voteCommands: {
        start: {
            run: startVote
        },
        cancel: {
            run: cancelVote
        },
        help: {
            run: voteHelp
        }
    }
};