const { REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {getCommandInfoByName,setCommandInfo,setCommandInfoJSON,deleteCommandInfo}=require('./database');

const StaticInfo=require('./sandolapi/staticinfo');

const commands=[
    {
        data:new SlashCommandBuilder()
            .setName('셔틀')
            .setDescription('셔틀버스 시간표 출력'),
        execute:async interaction=>{
            await interaction.deferReply();
            const images=await StaticInfo.getBusImagesBase64();
            if(images===null){
                await interaction.editReply({content:'API 서버 오류'});
                return;
            }
            await interaction.editReply({
                files:images.map((base64,i)=>{
                    return{
                        attachment:Buffer.from(base64,'base64'),
                        name:`${i}.jpeg`,
                    }
                })
            });
        }
    },
    {
        data:new SlashCommandBuilder()
            .setName('org')
            .setDescription('대학 조직 정보 조회')
            .addStringOption(option=>
                option.setName('orgname')
                    .setDescription('조회 할 조직의 이름')
                    .setAutocomplete(true)
            ),
        autocomplete:async interaction=>{
            const orgCache=StaticInfo.getOrganizationTreeCache();
            
            const focusedOption = interaction.options.getFocused(true);
            let focusValue=focusedOption.value;
            let choices=[];

            if(focusedOption.name=='orgname'&&orgCache!==null){
                choices=orgCache.unitList.map(x=>x?.unit?.name).filter(x=>typeof x=='string');
                focusValue=focusValue.trim();
            }
            
            const filtered = choices.filter(choice => choice.startsWith(focusValue)).concat(choices.filter(choice => choice.includes(focusValue))).filter((x,i,a)=>a.indexOf(x)==i).slice(0,25);
            await interaction.respond(
                filtered.map(choice => ({ name: choice, value: String(choices.indexOf(choice)) })),
            );
        },
        execute:async interaction=>{
            const orgCache=StaticInfo.getOrganizationTreeCache();
            if(orgCache===null){
                await interaction.reply({content:'API 서버 오류'});
            }else{
                const orgName = interaction.options.getString('orgname');
                const unitInfo=orgCache.unitList[Number(orgName)];
                if(unitInfo===undefined){
                    await interaction.reply({content:'잘못된 조직 값'});
                }else{
                    const embed=new EmbedBuilder()
                        .setTitle(unitInfo.unit.name)
                        .setAuthor({ name: unitInfo.path.join(' > ') });
                    if(typeof unitInfo.unit.url=='string'){
                        embed.setURL(unitInfo.unit.url);
                    }
                    if(typeof unitInfo.unit.phone=='string'){
                        embed.addFields(
                            { name: '전화번호', value: unitInfo.unit.phone },
                        )
                    }
                    await interaction.reply({embeds:[embed]});
                }
            }
        }
    },
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
    if(interaction.isChatInputCommand()){
        await command.execute(interaction);
    }else if(interaction.isAutocomplete()){
        await command.autocomplete(interaction);
    }
}

module.exports = {
    commands,
    depoly,
    onCommand,
};
