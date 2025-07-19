const SERVICE_URL='http://meal-service:80/meal';

async function getMealsLatest(page=1){
    const response=await fetch(
        SERVICE_URL+'/meals/latest?'+new URLSearchParams({page}).toString(),
        {
            method:'GET',
            headers:{
                accept:'application/base64',
            },
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

async function getLatestMealList(){
    let arr=[];
    for(let i=1;;i++){
        const res=await getMealsLatest(i);
        if(res===null||res.status!='success')return null;
        arr.push(...res.data);
        if(res.meta.has_prev==false)break;
    }
    return arr;
}

module.exports={
    getLatestMealList,
};