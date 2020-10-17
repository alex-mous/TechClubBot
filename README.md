# TechClubBot
## Bellevue College Tech Club Discord Bot

### Introduction

This is the Discord bot for the Bellevue College Tech Club. Join the bot development server here: [https://discord.gg/cF7R349](https://discord.gg/cF7R349) and see the Bot's webpage here: [http://techclubbot.herokuapp.com/](http://techclubbot.herokuapp.com/)

* * *

### Installation

To add the Bot to your own Discord server, please contact mee for the OAuth access.

* * *

### Usage

Access the follow bot help page with !help. All voting commands, as well as those under the Admin Only heading require the "Admin" role.

#### General Commands

| Command        | Description                                                 |
|----------------|-------------------------------------------------------------|
| `hi`           | Greetings from the bot                                      |
| `say`          | Speak up, little one!                                       |
| `status`       | My status                                                   |
| `help`         | Show the help                                               |
| `getminutes MEETING_#`    | Get the meeting minutes (meeting # is the number of meeting prior to the last meeting [e.g. 1 => meeting before last meeting]. No number or 0 for previous meeting) |
| `calendar` | Print out the meeting calendar and list |
| *Admins Only*  | Commands below can be run by users with the role Admin only |
| `vote`         | Create a vote/poll of the channel (enter Voting Mode)       |
| `selfdestruct` | Self destruct the channel                                   |
| `ban @USER`    | Ban @USER                                                   |
| `kick @USER`   | Kick @USER                                                  |
| `deleteall`    | Delete all messages in channel                              |
| `setminutes DATE TYPE MINUTES` | Set the meeting minutes                     |
| `addmeeting DAY|MONTH|YEAR|TYPE|TIME_START|TIME_END` | Schedule a meeting |
| `removemeeting DAY|MONTH|YEAR|TYPE|TIME_START` | Un-schedule a meeting |

#### Voting Mode Commands

| Command                                   | Description                                                 |
|-------------------------------------------|-------------------------------------------------------------|
| *Admins Only*                             | Commands below can be run by users with the role Admin only |
| `start Option 1\|Option 2\|...\|Option N` | Start the vote with the various options                     |
| `cancel`                                  | Cancel the vote before it starts                            |
| `help`                                    | Show the help                                               |

* * *

### License

Copyright 2020 Alex Mous

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
