//Repeat the message and delete it

/**
 * Say from the bot
 * 
 * @param {Object} msg Message object
 * @param {Array<string>} args Command args
 */
const say = (msg, args) => {
    if (args.length) {
        msg.channel.send(`${msg.author.toString()} says ${args.join(" ")}`);
        msg.delete();
    } else {
        console.warn("WARN: no message provided for say command");
    }
}

module.exports.say = {
    run: say,
    serverOnly: true
}