/**
 * Say hello to the user
 * 
 * @param {Object} msg Message object
 * @param {Array<string>} args Arguments of command
 */
const sayHi = (msg, args) => {
    if (!msg.mentions.members || msg.mentions.members.size == 0) {
        let names = args.filter((name) => (/[A-Z]/.test(name.charAt(0))) && name.length >= 2); //Check if any of the arguments start with a capital letter and is more than two characters (generally a name)
        if (names.length) {
            names.forEach((name) => {
                msg.channel.send(`:wave: Hello, ${name}!`);
            });
        } /*else { //Just welcome the user //Disabled for now
            let name = msg.guild.members.cache.get(msg.author.id).nickname; //Select nickname
            if (!name) name = msg.author.username; //Default to username if no nickname
            msg.channel.send(`:wave: Hello, ${name}!`);
        }*/ 
    } else { //Send Hellos to all mentioned members
        msg.mentions.members.forEach((member) => {
            let name = msg.guild.members.cache.get(member.id).nickname; //Select nickname of user
            if (!name) name = msg.author.username; //Default to username if no nickname
            msg.channel.send(`:wave: Hello, ${member.user.username}!`);
        })
    }
}

module.exports.hi = {
    run: sayHi,
    serverOnly: true
}