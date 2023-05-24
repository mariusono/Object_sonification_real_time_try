//---------------------------------------------------------------------------------------------------------------

// const { dbToGain } = require("tone"); // dafuq is this ? 

// TONE.JS PART
let flag_audio_on_off = false; // initialize global audio on/off flag

// Synth pattern:
// Loop for synth 

// const baseNotePossibilities = [43.65,49,55,61.74,77.78,98,110,155.56,185,196,220,311.13,392,440]
// const baseNotePossibilities = [110,155.56,185,196,220,311.13,392,440]
const baseNotePossibilities = [392,440]
// const baseNotePossibilities_drone = [55,110,155.56,196,220]
const baseNotePossibilities_drone = [110,155.56,196]

// create reverb node
const freeverb = new Tone.Freeverb(0.3,5000);

// create a gain node
const gainNode = new Tone.Gain(0.0);


//connect freeverb to gain
freeverb.connect(gainNode); // synth goes to gain !

// send gain to audio destination (audio out)
gainNode.toDestination();

gainNode.gain.rampTo(db2mag(-6), 0.1);


function setGain(v) {
    let gainVal = linearMapping(-30.0, 10.0, 0, 10000, v); // db linear Scale
    let gainVal_amp = 10 ** (gainVal / 20);
    if (gainVal_amp < 0.0316 + 0.0001) { // equivalent of -30 dB + 0.0001
        gainVal_amp = 0;
    }
    document.getElementById('Gain').innerText = parseFloat(gainVal).toFixed(4);
    // gainNode.gain.value = gainVal;
    gainNode.gain.rampTo(gainVal_amp, 0.1);
}

function setRoomSize(v) {
    let roomSizeVal = linearMapping(0.0, 1.0, 0, 10000, v); // db linear Scale
    freeverb.roomSize.value = roomSizeVal;
    document.getElementById('RoomSize').innerText = parseFloat(roomSizeVal).toFixed(4);
    // console.log(freeverb.roomSize.value );
}

function setDampening(v) {
    let dampSize = linearMapping(0.0, 10000.0, 0, 10000, v); 
    freeverb.dampening = dampSize;  // weird that it doesn't have .value ... 
    document.getElementById('Dampening').innerText = parseFloat(dampSize).toFixed(4);
    // console.log(freeverb.dampening);
}


// Initialize sonifiedObjects
let sonifiedObjects = {};


//attach a click listener to a play button
const button_1 = document.getElementById("button_1");
const button_2 = document.getElementById("button_2");

button_1.addEventListener("click", async () => {
    await Tone.start();
    console.log("audio is ready");

    // start the transport (i.e. the "clock" that drives the loop)
    Tone.Transport.start();

    // SET THE GLOBAL BPM VAL !  
    // Tone.Transport.bpm.value = 240; // working with '4n', i.e. quarter notes afterwards.. so equivalent to '8n' eigth notes at 120 bpm
    // play with rampTo and change bpm ? 

    // loop.start(0);

    // synthLoop_instance.synth.volume.rampTo(-Infinity,0.1);
    // drone_instance.oscillators.forEach(o => {
    //     o.volume.rampTo(-Infinity,0.1);
    // });

    flag_audio_on_off = true;
});

button_2.addEventListener("click", async () => {
    console.log("stopping all sounds!");

    Tone.Transport.stop(); // this just stops the master time.. 
    // Tone.stop(); // this just stops the master time.. 

    // Stop sonified objects that are playing
    for (var index = 0; index < Object.keys(sonifiedObjects).length; index++)
    {                    
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
    }

    flag_audio_on_off = false;
});


// Clear console after load.. 
// console.clear();
//---------------------------------------------------------------------------------------------------------------
