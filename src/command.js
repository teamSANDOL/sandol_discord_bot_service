const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const {getCommandInfoByName,setCommandInfo,setCommandInfoJSON,deleteCommandInfo}=require('./database');

const commands=[
    
];

async function depoly(TOKEN, APPLICATION_ID){
    const rest = new REST().setToken(TOKEN);

    console.log('명령어 업데이트');

    const res=await rest.get(Routes.applicationCommands(APPLICATION_ID));
    for(let i=0;i<res.length;i++){
        const command=res[i];
        const id=command.id;
        const name=command.name;
        if(!commands.some(x=>x.data.name==name)){
            await rest.delete(Routes.applicationCommand(APPLICATION_ID,id));
            deleteCommandInfo(id);
            console.log(` - ${name} (id: ${id}) (삭제)`);
        }
    }

    for(let i=0;i<commands.length;i++) {
        const command=commands[i];
        const name=command.data.name;
        const info=getCommandInfoByName(name);
        let id;
        const json=command.data.toJSON();
        let reason;
        if(info===undefined) {
            reason='신규';
            const res=await rest.post(
                Routes.applicationCommands(APPLICATION_ID),
                {
                    body:json,
                }
            );
            id=res.id;
            setCommandInfo(id,name,json);
        }else{
            id=info.id;
            if(info.json!==JSON.stringify(json)) {
                reason='업데이트';
                await rest.patch(
                    Routes.applicationCommand(APPLICATION_ID,id),
                    {
                        body:json,
                    }
                );
                setCommandInfoJSON(id,json);
            }
        }
        console.log(` - ${name} (id: ${id}) ${reason!==undefined?'('+reason+')':''}`);
    }

    console.log('명령어 업데이트 완료');
}

async function onCommand(interaction) {
    const command=commands.find(c=>c.data.name==interaction.commandName);
    if(command===undefined)return;

    await command.execute(interaction);
}

module.exports = {
    commands,
    depoly,
    onCommand,
};
