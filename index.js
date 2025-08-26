process.env.TZ='Asia/Seoul';

const { Client, Events, GatewayIntentBits } = require('discord.js');
const Command = require('./src/command');

const express = require('express');
const app = express();

const USE_BOT = process.env.USE_BOT === 'TRUE';

async function runBot() {
    const TOKEN = process.env.DISCORD_BOT_TOKEN;
    const APPLICATION_ID = process.env.DISCORD_APPLICATION_ID;

    await Command.depoly(TOKEN, APPLICATION_ID);

    const client = new Client({ intents: [GatewayIntentBits.Guilds] });

    client.once(Events.ClientReady, readyClient => {
        console.log(`${readyClient.user.tag}로 로그인 완료`);
    });

    client.on(Events.InteractionCreate, async interaction => {
        await Command.onCommand(interaction);
    });

    try {
        await client.login(TOKEN);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}

if(USE_BOT) runBot();
else console.log(`USE_BOT = ${USE_BOT}(${process.env.USE_BOT}) 봇을 사용하지 않습니다`);

app.use('/discord-bot', require('./src/api'));

app.listen(80, () => {
    console.log('HTTP 서버 시작');
});
