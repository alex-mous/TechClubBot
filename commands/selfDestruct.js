//Self-destruct the channel

/**
 * Self-destruct the channel
 * 
 * @param {Object} msg Message object
 */
const selfDestruct = (msg) => {
    msg.channel.send(`:warning: Self-destructing in...!`);
    let selfDestruct = (i) => { //Recursively delete messages
        if (i>=0) {
            msg.channel.send(`${i}...`);
            setTimeout(() => { selfDestruct(i-1) }, 1500);
        } else {
            console.log("INFO: deleting all messages...");
            (async () => {
                let msgs;
                let deleteSize = 100;
                do {
                    msgs = await msg.channel.messages.fetch({limit: deleteSize});
                    try {
                        await msg.channel.bulkDelete(msgs);
                    } catch (err) {
                        console.error("ERR: error while trying to delete messages: ", err);
                        if (deleteSize > 5) {
                            deleteSize /= 10;
                        } else {
                            break;
                        }
                    }
                } while (msgs.size >= 2);
            })();
        }
    }
    selfDestruct(10);
};

module.exports.selfdestruct = {
    run: selfDestruct,
    requiresAdmin: true,
    serverOnly: true,
}