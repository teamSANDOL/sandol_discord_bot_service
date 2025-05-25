const { Client, Events, GatewayIntentBits } = require('discord.js');

const USE_BOT = process.env.USE_BOT === 'TRUE';

async function runBot() {
    const TOKEN = process.env.DISCORD_BOT_TOKEN;

    const client = new Client({ intents: [GatewayIntentBits.Guilds] });

    client.once(Events.ClientReady, readyClient => {
        console.log(`${readyClient.user.tag}로 로그인 완료`);
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
