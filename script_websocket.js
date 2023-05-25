// either run via websocket with nodeJS or with ROS 
let doNodeJS = true;
let doROS = !doNodeJS;

// document objects
const boxVideos = document.getElementById('videos');
const video_rgb = document.createElement('video');
const video_map2d = document.createElement('video');

const span_human = document.createElement('span');
const span_walls = document.createElement('span');

const img_rgb = document.createElement('img');
const img_map2d = document.createElement('img');
const img_walls = document.createElement('img');


if (doNodeJS) {
    video_rgb.src = 'rgb.mp4#t=7';
    video_rgb.id = 'videoPlayer_rgb';
    video_rgb.controls = true;
    video_rgb.muted = false;
    video_rgb.height = 400; // in px
    // video_rgb.width = 640; // in px

    video_map2d.src = 'map2d.mp4#t=7';
    video_map2d.id = 'videoPlayer_map2d';
    video_map2d.controls = true;
    video_map2d.muted = false;
    video_map2d.height = 400; // in px
    // video_map2d.width = 640; // in px

    boxVideos.appendChild(video_rgb);
    boxVideos.appendChild(video_map2d);
}
else {

    img_rgb.id = 'img_rgb';
    img_rgb.style = 'height:400px; object-fit:contain';
    img_rgb.src = "";

    img_map2d.id = 'img_map2d';
    img_map2d.style = 'height:400px; object-fit:contain';
    img_map2d.src = "";

    img_walls.id = 'img_walls';
    img_walls.style = 'height:400px; object-fit:contain';
    img_walls.src = "";
}



// Prep doSonification 
var last_ts = 0;
var timest_msec_offset = -1;
let unique_ids_playing = [];

function doSonification(received_msg) {

    var JsonString = JSON.parse(received_msg);

    let JsonString_keys = Object.keys(JsonString);

    let unique_ids_current = new Array(JsonString_keys.length).fill('init');
    for (var iKeys = 0; iKeys < JsonString_keys.length; iKeys++) {
        unique_ids_current[iKeys] = JsonString[JsonString_keys[iKeys]]['unique_id'];
    }

    let diff = unique_ids_playing.filter(x => !unique_ids_current.includes(x));


    // console.log('unique_ids_current = ' + unique_ids_current);
    // console.log('unique_ids_playing = ' + unique_ids_playing);
    // // console.log(sonifiedObjects);

    // console.log('diff is ' + diff);

    // Stop sonified objects that are playing but are not in current frame
    for (var iDiff = 0; iDiff < diff.length; iDiff++) {
        let index = unique_ids_playing.indexOf(diff[iDiff]);

        // Just set the playing flag to false
        sonifiedObjects[unique_ids_playing[index]].playingFlag = false;

        // remove "playing" unique ids that are not in current frame
        unique_ids_playing.splice(index, 1);
    }

    // loop over objects detected in current json frame
    for (var iKeys = 0; iKeys < JsonString_keys.length; iKeys++) {
        let unique_id = JsonString[JsonString_keys[iKeys]]['unique_id'];
        let type_obj = JsonString[JsonString_keys[iKeys]]['type'];

        if (!unique_ids_playing.includes(unique_id)) { // if current unique Id is not in already playing unique ids 

            unique_ids_playing.push(unique_id); // adding it..

            if (type_obj.includes('wall')) {
                let randomNoteIdx_drone = Math.floor(0 + Math.random() * (baseNotePossibilities_drone.length - 0));
                let baseNoteFreq = baseNotePossibilities_drone[randomNoteIdx_drone];

                if (!sonifiedObjects.hasOwnProperty(unique_id)) { // only create a new sonification if it hasn't already been created
                    sonifiedObjects[unique_id] = new droneSonification(7, baseNoteFreq, "triangle", 1); // needs to be initialized with zero db volume for some reason.. 
                }
                sonifiedObjects[unique_id].panner.connect(freeverb);
            }
            else if (type_obj.includes('obstacle')) {
                let randomNoteIdx = Math.floor(0 + Math.random() * (baseNotePossibilities.length - 0));
                let baseNote = baseNotePossibilities[randomNoteIdx];
                let notePattern = [baseNote]; 

                // console.log('NOTE IS + ', notePattern);

                if (!sonifiedObjects.hasOwnProperty(unique_id)) { // only create a new sonification if it hasn't already been created
                    sonifiedObjects[unique_id] = new synthLoopSonification("sawtooth", notePattern, 0); // needs to be initialized with zero db volume for some reason.. 
                }
                sonifiedObjects[unique_id].panner.connect(freeverb);
            }
        }

        // setting the playing flag to true for this unique id.. 
        sonifiedObjects[unique_id].playingFlag = true;

        // UPDATE PANNERS 
        let T_map_cam_mat = JSON.parse(JsonString[JsonString_keys[iKeys]]['T_map_cam']);
        let center_3d_sel = [0, 0, 0];
        if (sonifiedObjects[unique_id] instanceof synthLoopSonification) {
            // center_3d_sel = JSON.parse(JsonString[JsonString_keys[iKeys]]['center_3d']);
            center_3d_sel = JSON.parse(JsonString[JsonString_keys[iKeys]]['nearest_3d']);
        }
        else if (sonifiedObjects[unique_id] instanceof droneSonification) {
            center_3d_sel = JSON.parse(JsonString[JsonString_keys[iKeys]]['nearest_3d']);
        }

        center_3d_sel.push(1); // in the Python script, I forgot to add the 1 at the end .. 
        let center_3d_new = [0, 0, 0];

        center_3d_new[0] = T_map_cam_mat[0][0] * center_3d_sel[0] + T_map_cam_mat[0][1] * center_3d_sel[1] + T_map_cam_mat[0][2] * center_3d_sel[2] + T_map_cam_mat[0][3] * center_3d_sel[3];
        center_3d_new[1] = T_map_cam_mat[1][0] * center_3d_sel[0] + T_map_cam_mat[1][1] * center_3d_sel[1] + T_map_cam_mat[1][2] * center_3d_sel[2] + T_map_cam_mat[1][3] * center_3d_sel[3];
        center_3d_new[2] = T_map_cam_mat[2][0] * center_3d_sel[0] + T_map_cam_mat[2][1] * center_3d_sel[1] + T_map_cam_mat[2][2] * center_3d_sel[2] + T_map_cam_mat[2][3] * center_3d_sel[3];

        let distance_comp = Math.sqrt(center_3d_new[0] * center_3d_new[0] + center_3d_new[1] * center_3d_new[1] + center_3d_new[2] * center_3d_new[2]);
        sonifiedObjects[unique_id].distance = distance_comp;
        
        if (sonifiedObjects[unique_id] instanceof synthLoopSonification) {
            console.log(distance_comp);
        }

        // do tha actual update
        sonifiedObjects[unique_id].panner.setPosition(center_3d_new[0], center_3d_new[1], center_3d_new[2]);

        if (sonifiedObjects[unique_id] instanceof synthLoopSonification) {
            // update playback rate!
            sonifiedObjects[unique_id].setPlaybackRate(distance_comp, [1, 4]);

            if (distance_comp > 4) { // just some very large value here but this can be a failsafe thing about the radius of the human workspace.. 
            // if (distance_comp > 400) { // just some very large value here but this can be a failsafe thing about the radius of the human workspace.. 
                    sonifiedObjects[unique_id].playingFlag = false; // this is not reupdating.. 
            }
            // IDEA ! ADD DISTANCE TO OBJECT ALSO AS A VARIABLE INSIDE THE CLASSES !!

        }
        else if (sonifiedObjects[unique_id] instanceof droneSonification) {
            // update harmonicity.. 
            sonifiedObjects[unique_id].setHarmonicity(distance_comp, [0.5, 1.5]);

            if (distance_comp > 1.5) { // just some very large value here but this can be a failsafe thing about the radius of the human workspace.. 
            // if (distance_comp > 400) { // just some very large value here but this can be a failsafe thing about the radius of the human workspace.. 
                    sonifiedObjects[unique_id].playingFlag = false;
            }
        }

        // console.log(sonifiedObjects);


        // // // I don't really care about this in the sonification.. 
        // //get timing info
        // const ts = parseFloat(JsonString[JsonString_keys[0]].ros_timestamp);
        // var ts_msec = parseInt(ts * 1000); //time stamp is given in seconds

        // if (timest_msec_offset == -1) {
        //     timest_msec_offset = ts_msec;
        // }

        // var elapsed_msec = ts_msec - timest_msec_offset;

        // console.log(elapsed_msec); // TOTAL AMOUNT OF TIME THAT PASSED
    }

    // I prepared my sonified objects.. Need to add the loop here




}


function WebSocketTest() {

    if (doNodeJS) {
        video_rgb.play();
        video_map2d.play();

        var ws = new WebSocket("ws://localhost:9998/echo");

        ws.onmessage = function (evt) {
            let received_msg = evt.data;
            // console.log(received_msg);
            doSonification(received_msg);

            var JsonString = JSON.parse(received_msg);
            let JsonString_keys = Object.keys(JsonString);

            span_human_html = "<h2><i>Human workspace info:</i></h2>"; // init html string
            for (var iKeys = 0; iKeys < JsonString_keys.length; iKeys++) {
                span_human_html+="<b>unique_id: </b>"+JsonString[JsonString_keys[iKeys]]['unique_id']
                                //+"</br> <b>Timestamp: </b>"+JsonString[JsonString_keys[iKeys]]['timestamp']
                                +"</br> <b>center_3d: </b>"+JsonString[JsonString_keys[iKeys]]['center_3d']
                                +"</br> <b>type: </b>"+JsonString[JsonString_keys[iKeys]]['type']+"</br></br>";
            }       
            document.getElementById("span_human").innerHTML = span_human_html; // print on html
        }

        ws.onclose = function () {

            // websocket is closed.
            alert("Connection is closed...");
        };
    }
    else if (doROS) {
        var ros = new ROSLIB.Ros({ url: 'ws://localhost:9090' });

        ros.on('connection', function () {
            console.log('Connected to websocket server.');
        });

        ros.on('error', function (error) {
            console.log('Error connecting to websocket server: ', error);
        });

        ros.on('close', function () {
            console.log('Connection to websocket server closed.');
        });

        // Subscribing to json ROS Topics
        var json_human_workspace_sub = new ROSLIB.Topic({ ros: ros, name: '/out/json_human_workspace', messageType: 'std_msgs/String' });

        json_human_workspace_sub.subscribe(
            function (message) {
                console.log('Received humanws message:' + message.data);
                json_human_workspace_sub.subscribe(function (message) { 
                    doSonification(message.data); 

                    let JsonString = JSON.parse(message.data);
                    let JsonString_keys = Object.keys(JsonString);
                    span_human_html = "<h2><i>Human workspace info:</i></h2>"; // init html string
                    for (var iKeys = 0; iKeys < JsonString_keys.length; iKeys++) {
                        span_human_html+="<b>unique_id: </b>"+JsonString[JsonString_keys[iKeys]]['unique_id']
                                        //+"</br> <b>Timestamp: </b>"+JsonString[JsonString_keys[iKeys]]['timestamp']
                                        +"</br> <b>center_3d: </b>"+JsonString[JsonString_keys[iKeys]]['center_3d']
                                        +"</br> <b>type: </b>"+JsonString[JsonString_keys[iKeys]]['type']+"</br></br>";
                    }       
                    document.getElementById("span_human").innerHTML = span_human_html; // print on html
            
                })
            }
        );

        var json_walls_equations_sub = new ROSLIB.Topic({ ros: ros, name: '/out/json_walls_equations', messageType: 'std_msgs/String' });
        json_walls_equations_sub.subscribe(function (message) {
            console.log(message.data)
            var JsonString = JSON.parse(message.data);
            let JsonString_keys = Object.keys(JsonString);

            span_walls_html = "<h2><i>Wall detection info:</i></h2>"; // init html string
            for (var iKeys = 0; iKeys < JsonString_keys.length; iKeys++) {
                span_walls_html += "<b>wall_type: </b>" + JsonString[JsonString_keys[iKeys]]['wall_type']
                    + "</br> <b>equation: </b>" + JsonString[JsonString_keys[iKeys]]['a'] + "x + " + JsonString[JsonString_keys[iKeys]]['b'] + "y + " + JsonString[JsonString_keys[iKeys]]['c'] + "z + " + JsonString[JsonString_keys[iKeys]]['d'] + " = 0"
                    + "</br> <b>shortest_distance: </b>" + JsonString[JsonString_keys[iKeys]]['shortest_distance']
                    + "</br> <b>num_points: </b>" + JsonString[JsonString_keys[iKeys]]['num_points']
                    + "</br> <b>plane_center_x: </b>" + JsonString[JsonString_keys[iKeys]]['plane_center_x']
                    + "</br> <b>plane_center_y: </b>" + JsonString[JsonString_keys[iKeys]]['plane_center_y']
                    + "</br> <b>plane_center_z: </b>" + JsonString[JsonString_keys[iKeys]]['plane_center_z'] + "</br></br>";
            }
            document.getElementById("span_walls").innerHTML = span_walls_html; // print on html
        });

        // Reference: https://roboticsknowledgebase.com/wiki/tools/roslibjs/
        // rosrun image_transport republish raw in:=camera/rgb/image_rect_color out:=camera/rgb
        var img_rgb_sub = new ROSLIB.Topic({ ros: ros, name: '/camera/rgb/compressed', messageType: 'sensor_msgs/CompressedImage' });
        img_rgb_sub.subscribe(function (message) {
            document.getElementById('img_rgb').src = "data:image/jpg;base64," + message.data;
        });

        // rosrun image_transport republish raw in:=out/map2d_img1 out:=out/map2d
        var img_map2d_sub = new ROSLIB.Topic({ ros: ros, name: '/out/map2d/compressed', messageType: 'sensor_msgs/CompressedImage' });
        img_map2d_sub.subscribe(function (message) {
            document.getElementById('img_map2d').src = "data:image/jpg;base64," + message.data;
        });

        // rosrun image_transport republish raw in:=out/walls_img out:=out/walls
        var img_map2d_sub = new ROSLIB.Topic({ ros: ros, name: '/out/walls/compressed', messageType: 'sensor_msgs/CompressedImage' });
        img_map2d_sub.subscribe(function (message) {
            document.getElementById('img_walls').src = "data:image/jpg;base64," + message.data;
        });
    }
}

