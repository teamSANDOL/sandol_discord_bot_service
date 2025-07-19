const SERVICE_URL='http://static-info-service:80/static-info';

async function getBusImagesBase64(){
    const response=await fetch(
        SERVICE_URL+'/bus/images',
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
        return (await response.json())?.image_base64_list??null;
    }catch{
        return null;
    }
}

module.exports={
    getBusImagesBase64,
};