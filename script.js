// WEBSOCKET PART

var last_ts = 0;
var timest_msec_offset = -1;


function WebSocketTest() {
    //start video
    var videoPlayer = document.getElementById('videoPlayer');
    videoPlayer.play();

    if ("WebSocket" in window) {
        //alert("WebSocket is supported by your Browser!");

        // Let us open a web socket
        var ws = new WebSocket("ws://localhost:9998/echo");

        ws.onopen = function () {
            ws.send("Message to send");
        };

        ws.onmessage = function (evt) {
            var received_msg = evt.data;
            // console.log(received_msg);


            var JsonString = JSON.parse(received_msg);
            
            // // alert("on message!")
            // console.log(JsonString);
            // console.log(JsonString['0']['distance']);

            console.log(JSON.parse(JsonString['0']['center_3d']));
            console.log(JSON.parse(JsonString['0']['T_map_cam']));


            let T_map_cam_mat = JSON.parse(JsonString['0']['T_map_cam']);
            let center_3d_sel = JSON.parse(JsonString['0']['center_3d']);
            center_3d_sel.push(1); // in the Python script, I forgot to add the 1 at the end .. 
            let center_3d_new = [0,0,0];

            center_3d_new[0] = T_map_cam_mat[0][0] * center_3d_sel[0] + T_map_cam_mat[0][1] * center_3d_sel[1] + T_map_cam_mat[0][2] * center_3d_sel[2]  + T_map_cam_mat[0][3] * center_3d_sel[3] ;
            center_3d_new[1] = T_map_cam_mat[1][0] * center_3d_sel[0] + T_map_cam_mat[1][1] * center_3d_sel[1] + T_map_cam_mat[1][2] * center_3d_sel[2]  + T_map_cam_mat[1][3] * center_3d_sel[3] ;
            center_3d_new[2] = T_map_cam_mat[2][0] * center_3d_sel[0] + T_map_cam_mat[2][1] * center_3d_sel[1] + T_map_cam_mat[2][2] * center_3d_sel[2]  + T_map_cam_mat[2][3] * center_3d_sel[3] ;

            console.log(center_3d_new);

            let distance_comp = Math.sqrt(center_3d_new[0]*center_3d_new[0] + center_3d_new[1]*center_3d_new[1] + center_3d_new[2]*center_3d_new[2]);

            console.log(distance_comp);

            // Sound control.. 
            // setHarmonicity(distance_comp,[1.73,3.2]);
            if (distance_comp < 2.5){
                synth.volume.rampTo(0,0.1); // start the synth.. 
            }
            else{
                synth.volume.rampTo(-Infinity, 0.1);
            }

            updatePannerPos(panner,center_3d_new[0],center_3d_new[1],center_3d_new[2]);

            // console.log(JsonString["0"].ros_timestamp)

            //get timing info
            const ts = parseFloat(JsonString["0"].ros_timestamp);
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

            if(timest_msec_offset==-1){
                timest_msec_offset = ts_msec;
            }

            var elapsed_msec = ts_msec-timest_msec_offset;
            
            console.log(elapsed_msec); // TOTAL AMOUNT OF TIME THAT PASSED


            // console.log(datevalues);
            
            // if (elapsed_msec<0){
            //     console.log('ELAPSED T TOO SMALL!')
            // } 

        };

        ws.onclose = function () {

            // websocket is closed.
            alert("Connection is closed...");
        };
    } else {

        // The browser doesn't support WebSocket
        alert("WebSocket NOT supported by your Browser!");
    }
}
