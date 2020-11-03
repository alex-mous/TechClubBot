//This is an example command file - the description of the command should go into this first line

/**
 * This is the description of the command 
 * 
 * @param {Object} msg Message object - Discord message object
 * @param {Array<string>} args Array of arguments (text after the command split by spaces)
 */
const command = (msg, args) => {
    //Put your code in here
}

module.exports = { //This is where we export the 
    commandname: { //Command names must be all lowercase to work
        run: comamnd, //The run function is what will trigger your command method
        serverOnly: true/false/undefined/null, //If this is true, it will only allow the method to be run in a server (not in a DM)
        requiresAdmin: true/false/undefined/null //If this is true, it will only allow Leadership to run the method
    }
}