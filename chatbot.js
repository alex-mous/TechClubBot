const { NlpManager } = require('node-nlp');
const fs = require("fs");
const https = require("https");

const manager = new NlpManager({ languages: ['en'], forceNER: true }); //Create the model manager
const model = fs.readFileSync('model.nlp', 'utf8');
manager.import(model); //Load the model

/**
 * Get the model's response from the str input
 * 
 * @param {string} str String input
 * @returns {string} Model's response
 */
module.exports.getResponse = async (str) => {
    let res = await manager.process(str);
    if (!res.answer) {
        return "I'm sorry, I'm not sure what you meant.";
    } else if (res.answer.startsWith("~")) { //Command
        switch (res.answer) { //Default should never happen
            case "~JOKE":
                return await getJoke();
        }
    }
    console.log("INFO: processed analysis for '" + str + "' and got: ", res);
    return res.answer;
}

/**
 * Get a joke
 */
const getJoke = async () => {
    return new Promise((resolve, reject) => {
        https.get("https://official-joke-api.appspot.com/jokes/random", (response) => {
            let res = "";

            response.on('data', (chunk) => res += chunk);

            response.on('end', () => {
                let joke = JSON.parse(res);
                if (joke) {
                    resolve(joke.setup + "\n" + joke.punchline);
                } else {
                    resolve("Sorry, I encountered an error while getting a joke");
                }
            });
        }).on("error", (err) => {
            console.error("ERR: error while getting joke: ", err);
            resolve("Sorry, a joke could not be found at the moment");
        });
    });
}