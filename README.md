# LegoGPT

## TO SET UP / CLONE:

First create a .env file in the root folder, this file contains all global-data for the bot.
The file should contain fields containing the bot-token and client-id's.

**The file should look something like this:**

```
BOT_TOKEN=[]
CLIENT_ID[]
APP_ID=[]
PUBLIC_KEY=[]
```

Then make sure the arguments replacing the [] brackets are the actual data needed.
Some commands may not work if you dont have the google engine keys or openai keys.

### NEXT: 

In the terminal make sure to run the following command:

`npm install discord.js dotenv openai`

This will install the required libraries for the bot to work.

### LASTLY:

You need to deploy the slash commands, run this command in the terminal:

`npm run deploy`

You will also need to run this again if you edit the slash commands whatsoever.
This command refreshes all slash commands.

### EXTRA:

Make sure the bot has the `admin` & `bot` permissions to be safe.

Also make sure to let the bot allow all presences such as the `Presence Intent`, `Server Members Intent`, and `Message Content Intent`

To deploy commands then start the bot at the same time then run the `npm run deploy-start`


### TO RUN:

In the terminal use the following command to run the bot:

`npm start`

## NEED HELP?

If you have any questions at all, please feel free to try to dm me on discord `legomaster_01` or through another source.
These questions can be about the bot, how to clone the bot, or literally anything of the sorts.
