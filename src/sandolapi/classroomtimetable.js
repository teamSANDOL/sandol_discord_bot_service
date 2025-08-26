const SERVICE_URL='http://classroom-timetable-service:80/classroom-timetable';

async function getClassroomList(){
    const response=await fetch(
        SERVICE_URL+'/classrooms',
        {
            method:'GET',
        }
    );
    if(response.status!=200){
        return null;
    }

    try{
        const list=await response.json();
        list.sort((a,b)=>a.building.localeCompare(b.building));
        list.forEach(x=>x.classrooms.sort((a,b)=>a.localeCompare(b)));
        return list;
    }catch{
        return null;
    }
}

async function getClassroomTimetable(place,day=null){
    const params={place};
    if(day!==null)params.day=day;
    const response=await fetch(
        SERVICE_URL+'/classrooms/timetable?'+new URLSearchParams(params).toString(),
        {
            method:'GET',
        }
    );
    if(response.status!=200){
        return null;
    }

    try{
        return (await response.json()).sort((a,b)=>'월화수목금토일'.indexOf(a.day)*60*24+a.startTime-('월화수목금토일'.indexOf(b.day)*60*24+b.startTime));
    }catch{
        return null;
    }
}

async function getEmptyClassroomNow(date,minute=0,building){
    const endDate=new Date(date);
    endDate.setMinutes(endDate.getMinutes()+minute);
    if(endDate.getDate()>date.getDate()){
        endDate.setDate(date.getDate());
        endDate.setHours(23,59,59);
    }
    const params={
        day:'월화수목금토일'[date.getDay()]+'요일',
        start_time:`${date.getHours()}:${date.getMinutes()}`,
        end_time:`${endDate.getHours()}:${endDate.getMinutes()}`,
    };
    if(building!==undefined){
        params.building=building;
    }
    const response=await fetch(
        SERVICE_URL+'/classrooms/available/time?'+new URLSearchParams(params).toString(),
        {
            method:'GET',
        }
    );
    if(response.status!=200){
        return null;
    }

    try{
        return await response.json();
    }catch{
        return null;
    }
}

module.exports={
    getClassroomList,
    getClassroomTimetable,
    getEmptyClassroomNow,
};
