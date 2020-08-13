//sendJson
var sendJson;
var obj;
//monsterの情報
var monsterData = [];
//userの情報
var userData = [];
var userNoIndex;
var isNewUserData = false;
//itemの情報
var itemData = [];
var itemNum = 0;
var itemName;
var itemDataNum = 0;

//special
var specialData;
var peopleCountMax = 0;
var peopleCount = 0;
var result = "";
var Step3 = "";
var Step2 = "";
var Step1 = "";
var Step0 = "";
var nextStep = 1000;
var special = 0;

//itemDataの初期化
for(var i = 0; i < 8; i++){
    var json = {
        "itemNum":0,
        "itemName":"",
    };
    itemData[i] = json;
}

//Console.log
var broadcastNum =0;


//クラウドからモンスターの情報を受け取る
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// urlencodedとjsonは別々に初期化する
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.listen(3000);
console.log('MEC Server is Online [Port:3000]');

app.post('/', function(req, res) {
    // Cloudからのデータ取得
    if(monsterData[req.body.num] == null){
        var json = {
            "num":req.body.num,
            "name":req.body.name,
            "power":req.body.power,
            "defence":req.body.defence,
            "posXMonster":parseFloat(req.body.posXMonster),
            "posYMonster":parseFloat(req.body.posYMonster),
            "posZMonster":parseFloat(req.body.posZMonster),
            "action":parseFloat(req.body.action),
            "userCount":req.body.userCount,
            "currentHP":req.body.currentHP,
            "initialHP":req.body.initialHP,
        };

        monsterData[req.body.num] = json;
        console.log("MonsterData:");
        console.log(monsterData[req.body.num]);
    }
    res.send('');
});

var startPeople;
//Websocket接続を保存しておく
var connections = [];

//socket開始
var ws   = require ('ws').Server;
var wss = new ws ({port: 8080});
console.log('MEC Server is Online [Port:8080]');


wss.on ('connection', function (ws) {
    //配列にWebSocket接続を保存
    connections.push(ws);
    
    //切断時
    ws.on('close', function () {
        connections = connections.filter(function (conn, i) {
            connections.splice(i, 1);
            return (conn === ws) ? false : true;
        });
    });
    ws.on ('message', function (message) {
        if(userData.length == 0){
            setTimeout(itemSet, 5000);
        }
        obj = JSON.parse(message);
        // JavaScript
        userData.filter(function(item, index){
            if (item.id == obj.idUser){
                userNoIndex = index;
                return isNewUserData = true;
            }
        });

        

        //itemの処理
        itemData.filter(function(item, index){
            if (item.itemNum == obj.hitItemNum && obj.hitItemNum != 0){
                /*
                console.log("$$$$$$$$$$$");
                console.log("ARMarker:Item0%d",index);
                console.log("item.itemNum:"+item.itemNum);
                console.log("obj.hitItemNum:"+obj.hitItemNum);
                console.log("itemName:"+itemData[index].itemName);
                */
                obj.haveItem = itemData[index].itemName;

                //console.log("itemData:itemNum."+itemData[index].itemNum+" "+itemData[index].itemName+" Delete");
                itemData[index].itemNum = 0;
                itemData[index].itemName = "";
                //console.log("<<<<<<<<");
                //console.log("itemData:No."+itemDataNum);
                for(var i = 0; i < 8; i++){
                    //console.log(itemData[i]);
                }
                //console.log("<<<<<<<<");
                //console.log("$$$$$$$$$$$");

                return;
            }
        });

        //userData
        var json = {
            "id":obj.idUser,
            "name":obj.name,
            "hp":obj.hpUser,
            "posX":obj.posXUser,
            "posY":obj.posYUser,
            "posZ":obj.posZUser,
            "monsterNum":obj.entryMonsterNum,
            "haveItem":obj.haveItem,
            "specialPush":obj.specialPush,
        };
        
        if(obj.specialStart == 1){
            console.log("***********");
            console.log("Special　開始");
            console.log("***********");
            
            special = 1;
            startPeople = obj.name;
        }

        if(!isNewUserData){
            userData.push(json);
            console.log("\nEntryUser:");
            console.log(json);
            console.log("------");
        }else if(isNewUserData){
            userData[userNoIndex]=json;
            isNewUserData = false;
        }



        peopleCount = 0;
        //Specialの処理
        userData.filter(function(item, index){
            if(item.specialPush == 1 && peopleCount < peopleCountMax){
                console.log("peopleCount++");
                peopleCount++;
            }else if(item.specialPush == 0 && peopleCount > 0){
                console.log("peopleCount--");
                peopleCount--;
            }
        });


        if(peopleCount == peopleCountMax && userData.length != 0 && nextStep == 1000 && peopleCountMax != 0){
            nextStep = 3;
            console.log("*********");
            console.log("準備完了!!!!");
            console.log("*********");
            setTimeout(Step,500);
        }
        
        

        if(Step0 == "ClickUP" && peopleCountMax != 0  && peopleCount == 0 && result == ""){
            result = "成功";
            console.log("result:"+result);
            setTimeout(SpecialDamage, 3000);
        }



        var specialJson = {
            "start":special,
            "startPeople":startPeople,
            "peopleCountMax":peopleCountMax,
            "peopleCount":peopleCount,
            "result":result,   
            "Step3":Step3,   
            "Step2":Step2,   
            "Step1":Step1,   
            "Step0":Step0,   
        };
        specialData = specialJson;


        //ダメージ処理
        if(0 < obj.damage){
            if(monsterData[obj.entryMonsterNum].currentHP - obj.damage <= 0){
                monsterData[obj.entryMonsterNum].currentHP = 0;
            }else{
                monsterData[obj.entryMonsterNum].currentHP = monsterData[obj.entryMonsterNum].currentHP - obj.damage;
            }
        }
        if(obj.escape){
            userData.filter(function(item, index){
                console.log("escape:"+userData.id);
                if (item.id == obj.idUser){
                    userData.splice(index, 1);
                    return;
                }
            });
        }
        
        
        
        
        //送信データ
        var array = {
            //Monsterの情報
            "numMonster":obj.entryMonsterNum,
            "currentHPMonster": monsterData[obj.entryMonsterNum].currentHP,
            "posXMonster": monsterData[obj.entryMonsterNum].posXMonster,
            "posYMonster": monsterData[obj.entryMonsterNum].posYMonster,
            "posZMonster": monsterData[obj.entryMonsterNum].posZMonster,
            "action": monsterData[obj.entryMonsterNum].action,
            //他のユーザの情報
            "otherUserData":userData,
            "receiveNo":obj.sendNo,
            //アイテムの情報
            "itemData":itemData,
            //スペシャルの情報
            "specialData":specialData,
            //宛名
            "from":obj.idUser,
        }

        sendJson = JSON.stringify(array);

        /*
        console.log("-------------------------------");
        console.log('[Receive] From {UserName: %s}\n%s\n', obj.idUser,message);
        console.log("-------------------------------");
        */
        broadcast(sendJson);
        if(special == 1){
                special = 0;
            }
        });
});
function SpecialDamage(){
    if(result == "成功"){
        var specialDamage = userData.length * 100;
        if(monsterData[obj.entryMonsterNum].currentHP - specialDamage <= 0){
            monsterData[obj.entryMonsterNum].currentHP = 0;
        }else{
            monsterData[obj.entryMonsterNum].currentHP = monsterData[obj.entryMonsterNum].currentHP - specialDamage;
        }
        console.log("******************");
        console.log("Special 成功");
        console.log("SpecialDamage 発動");
        console.log(monsterData[obj.entryMonsterNum].name+"に"+specialDamage+"のダメージ");
        console.log("******************");
    }else if(result == "失敗"){
        console.log("******************");
        console.log("Special 失敗");
        console.log("******************");
    }

    var specialJson = {
        "start":special,
        "startPeople":startPeople,
        "peopleCountMax":peopleCountMax,
        "peopleCount":peopleCount,
        "result":result,   
        "Step3":Step3,   
        "Step2":Step2,   
        "Step1":Step1,   
        "Step0":Step0,   
    };
    specialData = specialJson;

    //送信データ
    var array = {
        //Monsterの情報
        "numMonster":obj.entryMonsterNum,
        "currentHPMonster": monsterData[obj.entryMonsterNum].currentHP,
        "posXMonster": monsterData[obj.entryMonsterNum].posXMonster,
        "posYMonster": monsterData[obj.entryMonsterNum].posYMonster,
        "posZMonster": monsterData[obj.entryMonsterNum].posZMonster,
        "action": monsterData[obj.entryMonsterNum].action,
        //他のユーザの情報
        "otherUserData":userData,
        "receiveNo":obj.sendNo,
        //アイテムの情報
        "itemData":itemData,
        //スペシャルの情報
        "specialData":specialData,
        //from
        "from":obj.idUser,
    }

    sendJson = JSON.stringify(array);
    broadcast(sendJson);

    specialData = void 0;
    peopleCountMax = 0;
    peopleCount = 0;
    result = "";
    Step3 = "";
    Step2 = "";
    Step1 = "";
    Step0 = "";
    nextStep = 1000;
    special = 0;
}


function Step(){
    if(nextStep == 3){
        Step3 = "3";
        nextStep = 2
        setTimeout(Step,1000);
    }else if(nextStep == 2){
        Step2 = "2";
        nextStep = 1;
        setTimeout(Step,1000);
    }else if(nextStep == 1){
        Step1 = "1";
        nextStep = 0
        setTimeout(Step,1000);
    }else if(nextStep == 0){
        Step0 = "ClickUP";
        console.log("**********");
        console.log("Click UP!!!");
        console.log("**********");
        
        setTimeout(specialCheck, 500);
    }
    var specialJson = {
        "start":special,
        "startPeople":startPeople,
        "peopleCountMax":peopleCountMax,
        "peopleCount":peopleCount,
        "result":result,   
        "Step3":Step3,   
        "Step2":Step2,   
        "Step1":Step1,   
        "Step0":Step0,   
    };
    specialData = specialJson;

    //送信データ
    var array = {
        //Monsterの情報
        "numMonster":obj.entryMonsterNum,
        "currentHPMonster": monsterData[obj.entryMonsterNum].currentHP,
        "posXMonster": monsterData[obj.entryMonsterNum].posXMonster,
        "posYMonster": monsterData[obj.entryMonsterNum].posYMonster,
        "posZMonster": monsterData[obj.entryMonsterNum].posZMonster,
        "action": monsterData[obj.entryMonsterNum].action,
        //他のユーザの情報
        "otherUserData":userData,
        "receiveNo":obj.sendNo,
        //アイテムの情報
        "itemData":itemData,
        //スペシャルの情報
        "specialData":specialData,
        //
        "from":obj.idUser,
    }

    sendJson = JSON.stringify(array);
    //console.log("[Broad Cast from Step]");
    broadcast(sendJson);
}

function specialCheck(){
    if(result == ""){
        result = "失敗";
        console.log("result:"+result);
        setTimeout(SpecialDamage, 1000);
        var specialJson = {
            "start":special,
            "startPeople":startPeople,
            "peopleCountMax":peopleCountMax,
            "peopleCount":peopleCount,
            "result":result,   
            "Step3":Step3,   
            "Step2":Step2,   
            "Step1":Step1,   
            "Step0":Step0,   
        };
        specialData = specialJson;
    
        //送信データ
        var array = {
            //Monsterの情報
            "numMonster":obj.entryMonsterNum,
            "currentHPMonster": monsterData[obj.entryMonsterNum].currentHP,
            "posXMonster": monsterData[obj.entryMonsterNum].posXMonster,
            "posYMonster": monsterData[obj.entryMonsterNum].posYMonster,
            "posZMonster": monsterData[obj.entryMonsterNum].posZMonster,
            "action": monsterData[obj.entryMonsterNum].action,
            //他のユーザの情報
            "otherUserData":userData,
            "receiveNo":obj.sendNo,
            //アイテムの情報
            "itemData":itemData,
            //スペシャルの情報
            "specialData":specialData,
            //from
            "from":obj.idUser,
        }
    
        sendJson = JSON.stringify(array);
        broadcast(sendJson);
    
    }
}
//ブロードキャストを行う
function broadcast(message) {
    connections.forEach(function (con, i) {
        if(connections[i] != null){
            con.send(message);
            if(special == 1){
                Step3 = "";
                Step2 = "";
                Step1 = "";
                Step0 = "";
                peopleCountMax++;
            }
        }
    });

    special = 0;
    broadcastNum++;
    //console.log("################");
    //console.log('[BroadCast]:%d, itemDataNo:%d\n %s',broadcastNum,itemDataNum,message);
    //console.log("################");
};


function itemSet(){
    var itemCount = 0;
    for(var i = 0; i < 8; i++){
        if(itemData[i] != null && itemData[i].itemNum != 0){
            itemCount++;
        }
    }
    if(itemCount < 8){
        var randomItemMarker = Math.floor( Math.random() * 8);
        var randomItem = Math.floor( Math.random() * 100);
           
        if(0 <= randomItem && randomItem < 20){
            itemName = "attack";
        }else if(20 <= randomItem && randomItem < 40){
            itemName = "HP";
        }else if(40 <= randomItem && randomItem < 60){
            itemName = "shield";
        }else if(60 <= randomItem && randomItem < 85){
            itemName = "bullet";
        }else if(85 <= randomItem && randomItem < 90){
            itemName = "skull";
        }else if(90 <= randomItem && randomItem < 100){
            itemName = "special";
        }
           
        if(itemData[randomItemMarker].itemNum == 0){
            itemNum++;
            var json = {
                "itemNum":itemNum,
                "itemName":"special",
            };
            itemData[randomItemMarker] = json;
        }else{
            for(var i = 0; i < 8; i++){
                if(itemData[i].itemNum == 0){
                    itemNum++;
                    var json = {
                        "itemNum":itemNum,
                        "itemName":"special",
                    };
                    itemData[i] = json;
                    break;
                }
            }
        }

        itemDataNum++;
        //console.log("<<<<<<<<");
        //console.log("itemData:No."+itemDataNum);
        for(var i = 0; i < 8; i++){
            //console.log(itemData[i]);
        }
       // console.log("<<<<<<<<");

        //送信データ
        var array = {
            //Monsterの情報
            "numMonster":obj.entryMonsterNum,
            "currentHPMonster": monsterData[obj.entryMonsterNum].currentHP,
            "posXMonster": monsterData[obj.entryMonsterNum].posXMonster,
            "posYMonster": monsterData[obj.entryMonsterNum].posYMonster,
            "posZMonster": monsterData[obj.entryMonsterNum].posZMonster,
            "action": monsterData[obj.entryMonsterNum].action,
            //他のユーザの情報
            "otherUserData":userData,
            "receiveNo":obj.sendNo,
            //アイテムの情報
            "itemData":itemData,
            //スペシャルの情報
            "specialData":specialData,
            //
            "from":obj.idUser,
        }

        sendJson = JSON.stringify(array);
        broadcast(sendJson);
    }
    setTimeout(itemSet, 5000);
}


var i = 0;
var isConnect=false;
//CloudSocket開始
var cloudws   = require ('ws').Server;
var cloudwss = new cloudws ({port: 7000});
console.log("------");

cloudwss.on ('connection', function (cloudws) {
    console.log('Connect to Cloud Server [Port:7000]');
    console.log("------");
    isConnect = true;
    cloudws.on('error', function(error){
        isConnect = false;
        console.log("Cloud Server Connection Error:" + error.toString());
    });
    cloudws.on('close', function(){
        isConnect = false;
        console.log('Cloud Server Connection Closed');
    });

    cloudws.on ('message', function (message) {
        //console.log(message);
        var objCloud = JSON.parse(message);
        if(monsterData[objCloud.entryMonsterNum] != null){
        //受信データ
            monsterData[objCloud.entryMonsterNum].posXMonster = objCloud.posXMonster;
            monsterData[objCloud.entryMonsterNum].posYMonster = objCloud.posYMonster;
            monsterData[objCloud.entryMonsterNum].posZMonster = objCloud.posZMonster;
            monsterData[objCloud.entryMonsterNum].action = objCloud.action;
            
        }
        i++;
        console.log("[monsterMove]:%d\nmonsterNum:%d, posXMonster:%s, posYMonster:%s, posZMonster:%s, action:%s",i,objCloud.entryMonsterNum,monsterData[objCloud.entryMonsterNum].posXMonster,monsterData[objCloud.entryMonsterNum].posYMonster,monsterData[objCloud.entryMonsterNum].posZMonster,monsterData[objCloud.entryMonsterNum].action),
        //cloudws.send(sendJson);
        console.log("");
        console.log("------");
    });

    function cloudSendData(){
        if(isConnect){
        if(monsterData.length != 0 && userData.length != 0){
            cloudws.send(sendJson);
        }
    }
        setTimeout(cloudSendData, 1000);
    }
    cloudSendData();
});
