/**
 * Kick or ban the user from the server
 * 
 * @param {Object} msg Message sent
 * @param {string} cmd Command (kick or ban)
 * @param {string} reason Reason for kick or ban
 */
let kickOrBan = (msg, cmd, reason) => {
    let usr = msg.mentions.members.first();
    if (!usr) {
        console.warn("WARN: no username specified for kick/ban");
        msg.reply(":warning: you need to specify at least one person to kick or ban");
        return;
    }
    if (usr.roles.cache.some((r) => { return "Leadership" == r.name })) {
        console.warn("WARN: someone tried to kick/ban the leadership");
        msg.reply("HA HA HA you can't ban a member of Leadership");
        return;
    }
    console.log("INFO: " + cmd + " requested for " + usr.user.username);
    if (!usr.user.username.includes("TechClubBot")) {
        if (cmd == "kick") {
            usr.kick(reason).then(() => {
                msg.channel.send(`${usr} is now kicked from the server!`);
            }).catch((err) => {
                console.error("ERR: failed to kick user: ", err);
                msg.reply("Failed to kick " + usr.user.username);
            });
        } else if (cmd == "ban") {
            usr.ban({ reason }).then(() => {
                msg.channel.send(`${usr} is now banned from the server!`);
            }).catch((err) => {
                console.error("ERR: failed to ban user: ", err);
                msg.reply("Failed to ban " + usr.user.username);
            });
        }
    } else {
        msg.reply("HA HA HA HA HA HA HA");
    }
}


module.exports = {
    kick: {
        run: (msg, args) => kickOrBan(msg, "kick", args.slice(1).join(" ")),
        requiresAdmin: true
    },
    ban: {
        run: (msg, args) => kickOrBan(msg, "ban", args.slice(1).join(" ")),
        requireAdmin: true
    }
}