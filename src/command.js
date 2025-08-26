const { REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {getCommandInfoByName,setCommandInfo,setCommandInfoJSON,deleteCommandInfo}=require('./database');

const StaticInfo=require('./sandolapi/staticinfo');
const Meal=require('./sandolapi/meal');
const ClassroomTimetable=require('./sandolapi/classroomtimetable');

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
    {
        data:new SlashCommandBuilder()
            .setName('식단')
            .setDescription('식단 출력'),
        execute:async interaction=>{
            await interaction.deferReply();
            const meals=await Meal.getLatestMealList();
            if(meals===null){
                await interaction.editReply({content:'API 서버 오류'});
                return;
            }
            const restaurant={};
            meals.forEach(meal=>{
                const restaurantId=meal.restaurant_id;
                if(restaurant[restaurantId]===undefined)restaurant[restaurantId]=[meal];
                else restaurant[restaurantId].push(meal);
            });
            let embeds=[];
            const MEAL_TYPE=['breakfast', 'brunch', 'lunch', 'dinner'];
            for(const restaurantId in restaurant){
                const meals=restaurant[restaurantId];
                meals.sort((a,b)=>MEAL_TYPE.indexOf(a.meal_type)-MEAL_TYPE.indexOf(b.meal_type));
                const restaurantName=meals[0].restaurant_name;
                const lastUpdateDate=new Date(meals.reduce((a,c)=>Math.max(a,new Date(c.updated_at).getTime()),0));

                const embed=new EmbedBuilder()
                    .setTitle(restaurantName)
                    .setTimestamp(lastUpdateDate);
                meals.forEach((meal)=>{
                    embed.addFields({ 
                        name: ['조식','브런치','중식','석식'][MEAL_TYPE.indexOf(meal.meal_type)],
                        value: meal.menu.map(x=>'> '+x).join('\n'), 
                        inline: false
                    });
                });
                embeds.push(embed);
            }
            await interaction.editReply({embeds:embeds});
        }
    },
    {
        data:new SlashCommandBuilder()
            .setName('timetable')
            .setDescription('강의실 시간표 조회')
            .addStringOption(option=>
                option.setName('building')
                    .setDescription('조회 할 강의실 건물의 이름')
                    .setRequired(true)
                    .setAutocomplete(true)
            )
            .addStringOption(option=>
                option.setName('classroom')
                    .setDescription('조회 할 강의실의 이름')
                    .setRequired(true)
                    .setAutocomplete(true)
            )
            .addStringOption(option=>
                option.setName('day')
                    .setDescription('조회 할 요일')
                    .addChoices(
                        { name: '월요일', value: '0' },
                        { name: '화요일', value: '1' },
                        { name: '수요일', value: '2' },
                        { name: '목요일', value: '3' },
                        { name: '금요일', value: '4' },
                        { name: '토요일', value: '5' },
                        { name: '일요일', value: '6' },
				    )
            ),
        autocomplete:async interaction=>{
            const classroomList=await ClassroomTimetable.getClassroomList();
            
            const focusedOption = interaction.options.getFocused(true);
            let focusValue=focusedOption.value;
            let choices=[],filtered=[];

            if(focusedOption.name=='building'){
                choices=classroomList.map(x=>x.building);
                focusValue=focusValue.trim();
                filtered = choices.filter(choice => choice.toLowerCase().startsWith(focusValue.toLowerCase())).concat(choices.filter(choice => choice.toLowerCase().includes(focusValue.toLowerCase()))).filter((x,i,a)=>a.indexOf(x)==i).slice(0,25);
            }else if(focusedOption.name=='classroom'){
                let buildingIndex=interaction.options.getString('building');
                if(buildingIndex===null){
                    await interaction.respond([
                        {
                            name:'building을 먼저 선택해야 합니다.',
                            value:'null',
                        }
                    ]);
                    return;
                }
                buildingIndex=Number(buildingIndex);
                choices=classroomList?.[buildingIndex]?.classrooms??[];
                focusValue=focusValue.trim();
                if(focusValue.search(/[가-힣]/)==-1){
                    filtered = choices.filter(choice => choice.toLowerCase().startsWith(focusValue.toLowerCase())).slice(0,25);
                }else{
                    filtered = choices.filter(choice => choice.toLowerCase().startsWith(focusValue.toLowerCase())).concat(choices.filter(choice => choice.toLowerCase().includes(focusValue.toLowerCase()))).filter((x,i,a)=>a.indexOf(x)==i).slice(0,25);
                }
            }
            
            await interaction.respond(
                filtered.map(choice => ({ name: choice, value: String(choices.indexOf(choice)) })),
            );
        },
        execute:async interaction=>{
            await interaction.deferReply();
            const classroomList=await ClassroomTimetable.getClassroomList();
            if(classroomList===null){
                await interaction.editReply({content:'API 서버 오류'});
            }else{
                const buildingIndex = interaction.options.getString('building');
                const classroomIndex = interaction.options.getString('classroom');
                const dayIndex = interaction.options.getString('day');
                const buildingInfo=classroomList[buildingIndex];
                if(buildingInfo===undefined){
                    await interaction.editReply('잘못된 building 입력');
                }else if(buildingInfo.classrooms[classroomIndex]===undefined){
                    await interaction.editReply('잘못된 classroom 입력');
                }else{
                    const placeName = buildingInfo.building+buildingInfo.classrooms[classroomIndex];
                    const timetable=await ClassroomTimetable.getClassroomTimetable(placeName,dayIndex===null?null:['월요일','화요일','수요일','목요일','금요일','토요일','일요일'][Number(dayIndex)]);
                    if(dayIndex===null){
                        await interaction.editReply(`${placeName} 시간표\n▪️▪️ :regional_indicator_m: :regional_indicator_t: :regional_indicator_w: :regional_indicator_t: :regional_indicator_f: :regional_indicator_s: :regional_indicator_s:\n${
                            (()=>{
                                const nums=['0️⃣',':one:',':two:',':three:',':four:',':five:',':six:',':seven:',':eight:',':nine:'];
                                const colors=['🟧','🟦','🟥','🟫','🟪','🟩','🟨'];
                                let str='';
                                for(let i=1;i<=14;i++){
                                    if(i!=1)str+='\n';
                                    str+=i.toString().padStart(2,'x').replace('x','▪️').replace(/\d/g,n=>nums[n])+' ';
                                    for(let j=0;j<7;j++){
                                        if(j!=0)str+=' ';
                                        str+=colors?.[timetable.findIndex(x=>'월화수목금토일'.indexOf(x.day)==j&&x.periodStart<=i&&i<=x.periodEnd)%colors.length]??'▪️';
                                    }
                                }
                                return str;
                            })()
                        }`);
                    }else{
                        function timeToStr(n){
                            return String(Math.floor(n/60))+':'+String(n%60).padStart(2,'0');
                        }
                        let embeds=timetable.map(x=>{
                            const embed=new EmbedBuilder()
                                .setTitle(x.cs)
                                .setDescription(`${timeToStr(x.startTime)} ~ ${timeToStr(x.endTime)} (${x.periodStart} ~ ${x.periodEnd})`)
                                .setAuthor({name:x.prof});
                            return embed;
                        });
                        await interaction.editReply({content:`${placeName} ${['월요일','화요일','수요일','목요일','금요일','토요일','일요일'][Number(dayIndex)]} 시간표`,embeds:embeds});
                    }
                }
            }
        }
    },
    {
        data:new SlashCommandBuilder()
            .setName('emptyroom')
            .setDescription('현재 빈 강의실 조회')
            .addNumberOption(option=>
                option.setName('minute')
                    .setDescription('비어 있는 시간')
                    .setRequired(false)
                    .setMinValue(0)
                    .setMaxValue(60*24)
            )
            .addStringOption(option=>
                option.setName('building')
                    .setDescription('조회 할 강의실 건물의 이름')
                    .setRequired(false)
                    .setAutocomplete(true)
            ),
        autocomplete:async interaction=>{
            const classroomList=await ClassroomTimetable.getClassroomList();
            
            const focusedOption = interaction.options.getFocused(true);
            let focusValue=focusedOption.value;
            let choices=[],filtered=[];

            if(focusedOption.name=='building'){
                choices=classroomList.map(x=>x.building);
                focusValue=focusValue.trim();
                filtered = choices.filter(choice => choice.toLowerCase().startsWith(focusValue.toLowerCase())).concat(choices.filter(choice => choice.toLowerCase().includes(focusValue.toLowerCase()))).filter((x,i,a)=>a.indexOf(x)==i).slice(0,25);
            }
            
            await interaction.respond(
                filtered.map(choice => ({ name: choice, value: String(choices.indexOf(choice)) })),
            );
        },
        execute:async interaction=>{
            await interaction.deferReply();
            const classroomList=await ClassroomTimetable.getClassroomList();
            if(classroomList===null){
                await interaction.editReply({content:'API 서버 오류'});
            }else{
                const buildingIndex = interaction.options.getString('building');
                const emptyMinute = interaction.options.getNumber('minute');
                const buildingName=classroomList?.[buildingIndex]?.building??undefined;
                const emptyBuildingList=await ClassroomTimetable.getEmptyClassroomNow(new Date(),emptyMinute,buildingName);

                let emptyClassroomList=[];
                emptyBuildingList.forEach(({building,empty_classrooms})=>{
                    emptyClassroomList.push(...empty_classrooms.map(x=>({building,classroom:x})));
                });
                await interaction.editReply({content:emptyClassroomList.map(x=>x.building+' '+x.classroom).join('\n')});
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
            console.log(id)
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
