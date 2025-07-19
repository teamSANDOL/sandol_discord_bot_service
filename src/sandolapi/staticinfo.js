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

async function getOrganizationTree(){
    const response=await fetch(
        SERVICE_URL+'/organization/tree',
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

let organizationTreeCache=null;

async function organizationTreeParse(){
    const tree=await getOrganizationTree();
    let unitList=[];
    function unitParse(path,group){
        if(group.type=='unit'){
            unitList.push({
                path:path.slice(0,-1),
                unit:group,
            });
        }else{
            for(const name in group.subunits){
                unitParse([...path,name],group.subunits[name]);
            }
        }
    }
    unitParse([],tree);

    organizationTreeCache={
        tree:tree,
        unitList:unitList,
    };

    setTimeout(organizationTreeParse,1000*60);
}

organizationTreeParse();

function getOrganizationTreeCache(){
    return organizationTreeCache;
}

module.exports={
    getBusImagesBase64,
    getOrganizationTree,
    getOrganizationTreeCache,
};