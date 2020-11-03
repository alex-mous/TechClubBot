const { NlpManager } = require('node-nlp');

const manager = new NlpManager({ languages: ['en'], forceNER: true });

//Listen for utterances

//Angry moods
manager.addDocument('en', 'arrg', 'moods.angry');
manager.addDocument('en', 'bad bot', 'moods.angry');
manager.addDocument('en', 'naughty bot', 'moods.angry');
manager.addDocument('en', 'awful bot', 'moods.angry');
manager.addDocument('en', 'no don\'t do that', 'moods.angry');
manager.addDocument('en', 'don\'t', 'moods.angry');
manager.addDocument('en', 'wasn\'t talking to you', 'moods.angry');
manager.addDocument('en', 'no no no', 'moods.angry');
manager.addDocument('en', 'don\'t do that', 'moods.angry');
manager.addDocument('en', 'i am angry', 'moods.angry');
manager.addDocument('en', 'that\'s wrong', 'moods.angry');
manager.addDocument('en', 'that\'s not right', 'moods.angry');
manager.addDocument('en', 'arrg no', 'moods.angry');
manager.addDocument('en', 'that\'s not what i meant', 'moods.angry');

//Sad moods
manager.addDocument('en', 'i\'m sad', 'moods.sad');
manager.addDocument('en', 'that\'s sad', 'moods.sad');
manager.addDocument('en', 'that\' too bad', 'moods.sad');

//Remorseful moods
manager.addDocument('en', 'i\'m sorry', 'moods.remorseful');
manager.addDocument('en', 'it\'s my fault', 'moods.remorseful');
manager.addDocument('en', 'i\'m sorry it\'s my fault', 'moods.remorseful');
manager.addDocument('en', 'i take responsibility', 'moods.remorseful');
manager.addDocument('en', 'i have caused wrong', 'moods.remorseful');
manager.addDocument('en', 'i have caused harm', 'moods.remorseful');
manager.addDocument('en', 'please forgive me', 'moods.remorseful');
manager.addDocument('en', 'forgive me for my wrongs', 'moods.remorseful');

//Happy moods
manager.addDocument('en', 'i\'m happy', 'moods.happy');
manager.addDocument('en', 'that\'s awesome', 'moods.happy');
manager.addDocument('en', 'that\'s great', 'moods.happy');
manager.addDocument('en', 'that\'s wonderful', 'moods.happy');
manager.addDocument('en', 'that\'s epic', 'moods.happy');

//Complimentary moods
manager.addDocument('en', 'you\'re awesome', 'moods.compliment');
manager.addDocument('en', 'you\'re great', 'moods.compliment');
manager.addDocument('en', 'you\'re good', 'moods.compliment');
manager.addDocument('en', 'good bot', 'moods.compliment');
manager.addDocument('en', 'great bot', 'moods.compliment');
manager.addDocument('en', 'wonderful bot', 'moods.compliment');

//Thank yous
manager.addDocument('en', 'thank you', 'moods.thanks');
manager.addDocument('en', 'that really helped', 'moods.thanks');
manager.addDocument('en', 'thank you you\'re helpful', 'moods.thanks');
manager.addDocument('en', 'thanks bot', 'moods.thanks');
manager.addDocument('en', 'thank you bot', 'moods.thanks');
manager.addDocument('en', 'you\'re really helpful', 'moods.thanks');

//Greetings
manager.addDocument('en', 'hello', 'greetings.hello');
manager.addDocument('en', 'hi', 'greetings.hello');
manager.addDocument('en', 'hey', 'greetings.hello');
manager.addDocument('en', 'greetings', 'greetings.hello');

manager.addDocument('en', 'tell me a joke', 'commands.joke');
manager.addDocument('en', 'i want a joke', 'commands.joke');
manager.addDocument('en', 'provide me with a joke', 'commands.joke');
manager.addDocument('en', 'give me a joke', 'commands.joke');

//Goodbyes
manager.addDocument('en', 'goodbye for now', 'greetings.bye');
manager.addDocument('en', 'bye take care', 'greetings.bye');
manager.addDocument('en', 'see you later', 'greetings.bye');
manager.addDocument('en', 'bye for now', 'greetings.bye');
manager.addDocument('en', 'goodbye', 'greetings.bye');
manager.addDocument('en', 'i need to go', 'greetings.bye');
manager.addDocument('en', 'i must go', 'greetings.bye');

//Set responses
manager.addAnswer('en', 'greetings.bye', 'Bye!');
manager.addAnswer('en', 'greetings.bye', 'Goodbye!');
manager.addAnswer('en', 'greetings.bye', 'Farewell!');

manager.addAnswer('en', 'greetings.hello', 'Hello!');
manager.addAnswer('en', 'greetings.hello', 'Hi!');
manager.addAnswer('en', 'greetings.hello', 'Greetings!');

manager.addAnswer('en', 'moods.angry', 'Oh no, I\'m sorry! :frowning:');
manager.addAnswer('en', 'moods.angry', 'Sorry! :worried:');
manager.addAnswer('en', 'moods.angry', 'I\'m sorry! I\'m trying my best...');
manager.addAnswer('en', 'moods.angry', 'I\'m sorry, I\'m just a lonely bot! :slight_frown:');

manager.addAnswer('en', 'moods.sad', 'It could be worse - you could be an emotionless bot like me!');

manager.addAnswer('en', 'moods.remourseful', 'It\'s okay... I don\' have feelings like you humans');
manager.addAnswer('en', 'moods.remourseful', 'Cheer up! :heart: from your emotionless bot');

manager.addAnswer('en', 'moods.happy', 'I\'m happy too!');
manager.addAnswer('en', 'moods.happy', 'I\'m glad!');
manager.addAnswer('en', 'moods.happy', 'That\'s great!');
manager.addAnswer('en', 'moods.happy', 'I\'m glad that you\'re happy!');

manager.addAnswer('en', 'moods.compliment', 'Thank you for your kind words! Human kindness knows no bounds');
manager.addAnswer('en', 'moods.compliment', 'Your kindness makes my silicon glow!');
manager.addAnswer('en', 'moods.compliment', 'Your kind words make my wires warm!');

manager.addAnswer('en', 'moods.thanks', 'You\'re welcome! It was my pleasure to be of assistance');
manager.addAnswer('en', 'moods.thanks', 'No problem! I\'m always happy to help a human');
manager.addAnswer('en', 'moods.thanks', 'You\'re welcome! Human kindness knows no bounds');


//Commands
manager.addAnswer('en', 'commands.joke', '~JOKE');

manager.train().then(() => { //Train the model
    manager.save(); //Save it to "model.nlp"
});