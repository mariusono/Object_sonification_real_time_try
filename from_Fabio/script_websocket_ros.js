// WEBSOCKET PART
var last_ts = 0;
var timest_msec_offset = -1;

let unique_ids_playing = [];

function WebSocketTest() {
    console.log('Running WebSocketTest()...');

    // Connecting to ROS
    // Some reference: http://wiki.ros.org/roslibjs/Tutorials/BasicRosFunctionality
    var ros = new ROSLIB.Ros({url : 'ws://localhost:9090'});

    ros.on('connection', function() {
       console.log('Connected to websocket server.');
    });

    ros.on('error', function(error) {
       console.log('Error connecting to websocket server: ', error);
    });

    ros.on('close', function() {
       console.log('Connection to websocket server closed.');
    });

    // Subscribing to json ROS Topics
    var json_human_workspace_sub= new ROSLIB.Topic({ros:ros, name:'/out/json_human_workspace', messageType:'std_msgs/String'});

    json_human_workspace_sub.subscribe(function(message) {
        console.log('Received humanws message:' + message.data);
       
        var JsonString = JSON.parse(message.data);
        let JsonString_keys = Object.keys(JsonString);

        span_human_html = "<h2><i>Human workspace info:</i></h2>"; // init html string
        let unique_ids_current = new Array(JsonString_keys.length).fill('init');
        for (var iKeys = 0; iKeys < JsonString_keys.length; iKeys++) {
            unique_ids_current[iKeys] = JsonString[JsonString_keys[iKeys]]['unique_id'];
            span_human_html+="<b>unique_id: </b>"+JsonString[JsonString_keys[iKeys]]['unique_id']
                            //+"</br> <b>Timestamp: </b>"+JsonString[JsonString_keys[iKeys]]['timestamp']
                            +"</br> <b>center_3d: </b>"+JsonString[JsonString_keys[iKeys]]['center_3d']
                            +"</br> <b>type: </b>"+JsonString[JsonString_keys[iKeys]]['type']+"</br></br>";
        }       
        document.getElementById("span_human").innerHTML = span_human_html; // print on html


        let diff = unique_ids_playing.filter(x => !unique_ids_current.includes(x));

        console.log('unique_ids_current = ' + unique_ids_current);
        console.log('unique_ids_playing = ' + unique_ids_playing);
        // console.log(sonifiedObjects);

        console.log('diff is ' + diff);

        // Stop sonified objects that are playing but are not in current frame
        for (var iDiff = 0; iDiff < diff.length; iDiff++){
            let index = unique_ids_playing.indexOf(diff[iDiff]);

            if (sonifiedObjects[unique_ids_playing[index]] instanceof synthLoopSonification){
                sonifiedObjects[unique_ids_playing[index]].synth.volume.rampTo(-Infinity, 0.1);
                sonifiedObjects[unique_ids_playing[index]].loop.stop();
                sonifiedObjects[unique_ids_playing[index]].panner.disconnect(freeverb);
            }
            if (sonifiedObjects[unique_ids_playing[index]] instanceof droneSonification){
                sonifiedObjects[unique_ids_playing[index]].oscillators.forEach((o, index) => { // this can be added in the class.. 
                    o.volume.rampTo(-Infinity, 1);
                    o.stop();
                });
                sonifiedObjects[unique_ids_playing[index]].panner.disconnect(freeverb);
            }              

            console.log(unique_ids_playing[index]);
            console.log(sonifiedObjects[unique_ids_playing[index]]);
            console.log('Removed..!');

            // delete sonifiedObjects[unique_ids_playing[index]]; // maybe I shouldn't do this.. I lose track of indexes.. ? 

            // remove "playing" unique ids that are not in current frame
            unique_ids_playing.splice(index,1);

        }

        // console.log(sonifiedObjects);
        
        // loop over objects detected in current json frame
        for (var iKeys = 0; iKeys < JsonString_keys.length; iKeys++) {
            let unique_id = JsonString[JsonString_keys[iKeys]]['unique_id'];
            let type_obj = JsonString[JsonString_keys[iKeys]]['type'];

            if (!unique_ids_playing.includes(unique_id)) {
                if (type_obj.includes('wall')){
                    let randomNoteIdx_drone = Math.floor(0 + Math.random() * (baseNotePossibilities_drone.length - 0));
                    let baseNoteFreq = baseNotePossibilities_drone[randomNoteIdx_drone];
                    if (!sonifiedObjects.hasOwnProperty(unique_id)){ // only create a new sonification if it hasn't already been created
                        sonifiedObjects[unique_id] = new droneSonification(7, baseNoteFreq, "triangle", 1); // needs to be initialized with zero db volume for some reason.. 
                    }
                    // let baseNoteFreq_drone = Math.floor(30 + Math.random() * (61 - 30));
                    // sonifiedObjects[unique_id] = new droneSonification(10, Math.floor(30 + Math.random() * (61 - 30)), "triangle", 1); // needs to be initialized with zero db volume for some reason.. 

                    sonifiedObjects[unique_id].panner.connect(freeverb);
                    // sonifiedObjects[unique_id].oscillators.forEach((o, index) => { // this can be added in the class.. 
                    //     o.volume.rampTo(sonifiedObjects[unique_id].volumesArray[index], 2);
                    // });                    
                }
                else if (type_obj.includes('obstacle')){
                    let randomNoteIdx = Math.floor(0 + Math.random() * (baseNotePossibilities.length - 0));
                    let baseNote = baseNotePossibilities[randomNoteIdx];
                    let notePattern = [baseNote]; // major third, perfect fifth, octave

                    console.log('NOTE IS + ',notePattern);

                    if (!sonifiedObjects.hasOwnProperty(unique_id)){ // only create a new sonification if it hasn't already been created
                        sonifiedObjects[unique_id] = new synthLoopSonification("sawtooth",notePattern,0); // needs to be initialized with zero db volume for some reason.. 
                    }

                    sonifiedObjects[unique_id].panner.connect(freeverb);
                    // sonifiedObjects[unique_id].synth.volume.rampTo(-Infinity, 0.1); // NOT NEEDED I THINK
                }
                unique_ids_playing.push(unique_id);
            }
            
            let T_map_cam_mat = JSON.parse(JsonString[JsonString_keys[iKeys]]['T_map_cam']);
            let center_3d_sel = [0,0,0];
            if (sonifiedObjects[unique_id] instanceof synthLoopSonification)
            {
                center_3d_sel = JSON.parse(JsonString[JsonString_keys[iKeys]]['center_3d']);
            }
            else if (sonifiedObjects[unique_id] instanceof droneSonification)
            {
                center_3d_sel = JSON.parse(JsonString[JsonString_keys[iKeys]]['nearest_3d']);
            }

            center_3d_sel.push(1); // in the Python script, I forgot to add the 1 at the end .. 
            let center_3d_new = [0, 0, 0];

            center_3d_new[0] = T_map_cam_mat[0][0] * center_3d_sel[0] + T_map_cam_mat[0][1] * center_3d_sel[1] + T_map_cam_mat[0][2] * center_3d_sel[2] + T_map_cam_mat[0][3] * center_3d_sel[3];
            center_3d_new[1] = T_map_cam_mat[1][0] * center_3d_sel[0] + T_map_cam_mat[1][1] * center_3d_sel[1] + T_map_cam_mat[1][2] * center_3d_sel[2] + T_map_cam_mat[1][3] * center_3d_sel[3];
            center_3d_new[2] = T_map_cam_mat[2][0] * center_3d_sel[0] + T_map_cam_mat[2][1] * center_3d_sel[1] + T_map_cam_mat[2][2] * center_3d_sel[2] + T_map_cam_mat[2][3] * center_3d_sel[3];

            // console.log(center_3d_new);

            let distance_comp = Math.sqrt(center_3d_new[0] * center_3d_new[0] + center_3d_new[1] * center_3d_new[1] + center_3d_new[2] * center_3d_new[2]);

            console.log(distance_comp);

            if (flag_audio_on_off) { // Do sound only if global flag for aduio on/off is on
                if (sonifiedObjects[unique_id] instanceof synthLoopSonification)
                {
                    if (distance_comp < 4) { // just some very large value here but this can be a failsafe thing about the radius of the human workspace.. 
                        sonifiedObjects[unique_id].loop.start(0);
                        sonifiedObjects[unique_id].synth.volume.rampTo(0, 0.1);
                        sonifiedObjects[unique_id].setPlaybackRate(distance_comp, [0.5, 4])
                        console.log(sonifiedObjects[unique_id].loop.playbackRate);
                    }
                    else {
                        sonifiedObjects[unique_id].synth.volume.rampTo(-Infinity, 0.1);
                        sonifiedObjects[unique_id].loop.stop(0);
                        console.log('SHOULD NEVER BE HERE!')
                    }
                    sonifiedObjects[unique_id].panner.setPosition(center_3d_new[0], center_3d_new[1], center_3d_new[2]);
                }
                else if (sonifiedObjects[unique_id] instanceof droneSonification)
                {
                    if (distance_comp < 1.5) { // just some very large value here but this can be a failsafe thing about the radius of the human workspace.. 
                        sonifiedObjects[unique_id].oscillators.forEach((o, index) => { // this can be added in the class.. 
                            o.start();
                            o.volume.rampTo(sonifiedObjects[unique_id].volumesArray[index], 0.5);
                        });
                        sonifiedObjects[unique_id].setHarmonicity(distance_comp, [0.5, 1.5]);
                    }
                    else {
                        sonifiedObjects[unique_id].oscillators.forEach((o, index) => { // this can be added in the class.. 
                            o.stop();
                            o.volume.rampTo(-Infinity, 1);
                        });
                    }
                    sonifiedObjects[unique_id].panner.setPosition(center_3d_new[0], center_3d_new[1], center_3d_new[2]);
                }
            }

        }

        //get timing info
        const ts = parseFloat(JsonString[JsonString_keys[0]].ros_timestamp);
        var ts_msec = parseInt(ts * 1000); //time stamp is given in seconds


        const date = new Date(ts_msec);
        const datevalues = [
            date.getFullYear(),
            date.getMonth() + 1,
            date.getDate(),
            date.getHours(),
            date.getMinutes(),
            date.getSeconds(),
            date.getMilliseconds()
        ];

        if (timest_msec_offset == -1) {
            timest_msec_offset = ts_msec;
        }

        var elapsed_msec = ts_msec - timest_msec_offset;

        console.log(elapsed_msec); // TOTAL AMOUNT OF TIME THAT PASSED
    });

    var json_walls_equations_sub= new ROSLIB.Topic({ros:ros, name:'/out/json_walls_equations', messageType:'std_msgs/String'});
    json_walls_equations_sub.subscribe(function(message) {
        console.log(message.data)
        var JsonString = JSON.parse(message.data);
        let JsonString_keys = Object.keys(JsonString);        
        
        span_walls_html = "<h2><i>Wall detection info:</i></h2>"; // init html string
        for (var iKeys = 0; iKeys < JsonString_keys.length; iKeys++) {
            span_walls_html+="<b>wall_type: </b>"+JsonString[JsonString_keys[iKeys]]['wall_type']
                            +"</br> <b>equation: </b>"+JsonString[JsonString_keys[iKeys]]['a']+"x + "+JsonString[JsonString_keys[iKeys]]['b']+"y + "+JsonString[JsonString_keys[iKeys]]['c']+"z + "+JsonString[JsonString_keys[iKeys]]['d']+" = 0"
                            +"</br> <b>shortest_distance: </b>"+JsonString[JsonString_keys[iKeys]]['shortest_distance']
                            +"</br> <b>num_points: </b>"+JsonString[JsonString_keys[iKeys]]['num_points']
                            +"</br> <b>plane_center_x: </b>"+JsonString[JsonString_keys[iKeys]]['plane_center_x']
                            +"</br> <b>plane_center_y: </b>"+JsonString[JsonString_keys[iKeys]]['plane_center_y']
                            +"</br> <b>plane_center_z: </b>"+JsonString[JsonString_keys[iKeys]]['plane_center_z']+"</br></br>";
        }
        document.getElementById("span_walls").innerHTML = span_walls_html; // print on html
    });
   
    // Reference: https://roboticsknowledgebase.com/wiki/tools/roslibjs/
    // rosrun image_transport republish raw in:=camera/rgb/image_rect_color out:=camera/rgb
    var img_rgb_sub = new ROSLIB.Topic({ros:ros, name:'/camera/rgb/compressed', messageType: 'sensor_msgs/CompressedImage'});
    img_rgb_sub.subscribe(function(message) {
       document.getElementById('img_rgb').src = "data:image/jpg;base64," + message.data;
    });

    // rosrun image_transport republish raw in:=out/map2d_img1 out:=out/map2d
    var img_map2d_sub = new ROSLIB.Topic({ros:ros, name:'/out/map2d/compressed', messageType: 'sensor_msgs/CompressedImage'});
    img_map2d_sub.subscribe(function(message) {
       document.getElementById('img_map2d').src = "data:image/jpg;base64," + message.data;
    });

    // rosrun image_transport republish raw in:=out/walls_img out:=out/walls
    var img_map2d_sub = new ROSLIB.Topic({ros:ros, name:'/out/walls/compressed', messageType: 'sensor_msgs/CompressedImage'});
    img_map2d_sub.subscribe(function(message) {
       document.getElementById('img_walls').src = "data:image/jpg;base64," + message.data;
    });



            
}
