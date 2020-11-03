//Load the commands from the commands directory

const fs = require("fs");

/**
 * Load the commands and return them
 * 
 * @param {*} onLoad On load callback function - calls with parameter of object of available commands
 */
const loadCommands = (onLoad) => {
    let cmds = {};
    fs.readdir("./commands/", (err, fnames) => { //Load the commands
        if (err) {
            console.log("ERR: couldn't read commands");
            return;
        }
        fnames.forEach((fn) => {
            cmds = {...cmds, ...require("./commands/" + fn)}; //Add command to list of commands (Note: no two commands may have the same name, and nested commands (such as vote.cancel) remain nested)
        });
        onLoad(cmds);
    });
};

module.exports = { loadCommands };