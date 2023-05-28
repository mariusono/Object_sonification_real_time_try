// Get some libraries.. 
const fs = require('fs');
const path = require('path')

// PATH WHERE I HAVE MY JSON FILES

// const DatasetPath = '/Users/mariusonofrei/UNIVERSITY/Univr_Sonification/Object_sonification_via_websocket_data/1_corridoioAltair_newHumanWs/jsons/human_workspace_jsons'
// const DatasetPath = '/Users/mariusonofrei/UNIVERSITY/Univr_Sonification/Object_sonification_via_websocket_data/1_corridoioAltair_smoothMap2d/jsons/human_workspace_jsons'


const DatasetPath = './1_corridoioAltair_smoothMap2d/jsons/human_workspace_jsons'



// const TfMatricesPath = '1_corridoioAltair_newjsons/tf_saved'
// Set up a port
// import websocket.server library
WebSocketServer = require('ws').Server;

// define port value
var port = 9090;

// open up websocketserver at port
wss = new WebSocketServer({ port: port });

// just state what port u are listening to
console.log('listening on port: ' + port);

// Defining a sleep function .. what for ? 
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function readAndSendData(websocket) {

    const jsonsInDir = fs.readdirSync(DatasetPath).filter(file => path.extname(file) === '.json');
    jsonsInDir.sort((a,b)=>Number(a.split('_')[0]) - Number(b.split('_')[0]));
    
    console.log(jsonsInDir)

    // const tf_jsonsInDir = fs.readdirSync(TfMatricesPath).filter(file => path.extname(file) === '.json');
    // tf_jsonsInDir.sort((a,b)=>Number(a.split('_')[0]) - Number(b.split('_')[0]));
    
    // console.log(tf_jsonsInDir)

    //jsonsInDir.forEach(file => handleSingleFile(file));
    var last_ts = 0.0;
    var event_cnt = 0;
    
     for (let file of jsonsInDir) {
        const fileData = fs.readFileSync(path.join(DatasetPath, file));
        const JsonString = JSON.parse(fileData.toString());
        let JsonString_keys = Object.keys(JsonString);


        console.log(JsonString);

        const ts = parseFloat(JsonString[JsonString_keys[0]].ros_timestamp); 

        console.log('Json file: '+file);

        console.log('Time Stamp: '+ts+' of type: '+typeof(ts));

        var ts_msec=parseInt(ts * 1000); //time stamp is given in seconds
        const date = new Date(ts_msec); //ts*0.000001 
        
        const datevalues = [
        date.getFullYear(),
        date.getMonth()+1,
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
        date.getMilliseconds()
        ];

        const elapsed_msec=(ts_msec-last_ts) //(ts-last_ts)*0.000001;
        
        last_ts = ts_msec;
        // console.log('Decoded: seconds - '+ date.getSeconds() + ', msec - '+date.getMilliseconds()+', msec to wait - '+elapsed_msec);
        
        if(event_cnt>0){ // only start waiting after receiving the second file..
            await sleep(Math.round(elapsed_msec));
            // await sleep(Math.round(3000));
        }

        console.log('Ros Timestamp: %d, converted to time %s, elapsed msec %d ', ts, datevalues, elapsed_msec);
        
        //message=JSON.stringify({ciao: "mondo", d: 19, e: false});
        message=JSON.stringify(JsonString);
        websocket.send(message);


        // console.log(message);

        // var JsonString_read = JSON.parse(message);

        // console.log(JsonString_read);

        // console.log(JsonString_read['0']['T_map_cam']);
        // console.log(JsonString_read['0']['T_map_cam'][0][3]);
        // // console.log(JSON.parse(JsonString_read['0']['T_map_cam']));

        
        event_cnt+=1;
     }
    }




// Websocket event on "connection" !  
wss.on('connection', function connection(ws) {
   
	ws.on('message', function(message) {
		console.log('message: ' + message);
		ws.send('echo: ' + message);
	});

	console.log('new client connected!');
	ws.send('connected!');
    //message=JSON.stringify({ciao: "mondo", d: 19, e: false});
     
    // sendData(ws);
    readAndSendData(ws);
});



