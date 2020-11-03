//Print out the bot status

const status = (msg) => {
    msg.channel.send("It's alive!");
}

module.exports.status = {
    run: status
}