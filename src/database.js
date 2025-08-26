const sqlite3=require('better-sqlite3');
const db=sqlite3('./data/discord-bot.db');

const packageVersion=process.env.npm_package_version;

if(packageVersion===undefined){
    throw new Error('패키지 버전 값을 읽을 수 없음');
}

function databaseUpdate(){
    const databaseIsEmpty=db.prepare(`SELECT count(*) as tableCount FROM sqlite_master WHERE type = 'table';`).get().tableCount==0;
    const databaseVersion=databaseIsEmpty?'init':db.prepare(`SELECT value FROM data WHERE key = 'version';`).get().value;

    console.log(`데이터베이스 버전: ${databaseVersion}`);

    switch(databaseVersion){
        case 'init':{
            db.exec(
`CREATE TABLE "data" (
	"key"	TEXT NOT NULL,
	"value"	TEXT NOT NULL,
	PRIMARY KEY("key")
) WITHOUT ROWID;

CREATE TABLE "command_info" (
	"id"	INTEGER NOT NULL,
	"name"	INTEGER NOT NULL UNIQUE,
	"json"	BLOB NOT NULL,
	PRIMARY KEY("id")
) WITHOUT ROWID;`
            );
        }
        default:
    }

    db.prepare(`INSERT INTO data(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value;`).run(['version',packageVersion]);
}

databaseUpdate();

const stmtSelectCommandInfo=db.prepare(`SELECT * FROM command_info;`);
const stmtSelectCommandInfoById=db.prepare(`SELECT * FROM command_info WHERE id = ?;`);
const stmtSelectCommandInfoByName=db.prepare(`SELECT * FROM command_info WHERE name = ?;`).safeIntegers(true);
const stmtUpsertCommandInfo=db.prepare(`INSERT INTO command_info(id,name,json) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,json=excluded.json;`);
const stmtUpsertCommandInfoName=db.prepare(`INSERT INTO command_info(id,name) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name;`);
const stmtUpsertCommandInfoJSON=db.prepare(`UPDATE command_info SET json=jsonb(?) WHERE id=?;`);
const stmtDeleteCommandInfo=db.prepare(`DELETE FROM command_info WHERE id = ?;`);

function getCommandInfo(){
    return stmtSelectCommandInfo.all();
}

function getCommandInfoById(id){
    return stmtSelectCommandInfoById.get(id);
}

function getCommandInfoByName(name){
    const res=stmtSelectCommandInfoByName.get(name);
    res.id=String(res.id);
    return res;
}

function setCommandInfo(id,name,json){
    stmtUpsertCommandInfo.run(id,name,JSON.stringify(json));
}

function setCommandInfoName(id,name){
    stmtUpsertCommandInfoName.run(id,name);
}

function setCommandInfoJSON(id,json){
    stmtUpsertCommandInfoJSON.run(id,JSON.stringify(json));
}

function deleteCommandInfo(id){
    stmtDeleteCommandInfo.run(id);
}

module.exports={
    getCommandInfo,
    getCommandInfoById,
    getCommandInfoByName,
    setCommandInfo,
    setCommandInfoName,
    setCommandInfoJSON,
    deleteCommandInfo,
};
