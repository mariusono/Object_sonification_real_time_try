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


// Initialize sonifiedObjects
let sonifiedObjects = {};


// // Try to make a global loop to go through each sonified object at a time.. 
let loopGlobal = new Tone.Loop(loopStep, "1n");  // '1n' here sets the speed of our loop -- every 1th note

count = 0;
function loopStep(time){
    let sonifiedObjects_keys = Object.keys(sonifiedObjects);
    let objectsPlaying = [];

    console.log(sonifiedObjects);

    for (let i = 0; i<sonifiedObjects_keys.length;i++)
    {
        if (sonifiedObjects[sonifiedObjects_keys[i]].playingFlag)
        {
            // objectsPlaying[sonifiedObjects_keys[i]] = sonifiedObjects[sonifiedObjects_keys[i]];
            objectsPlaying.push(sonifiedObjects[sonifiedObjects_keys[i]]);
        }
    }

    console.log(objectsPlaying);

    if (objectsPlaying.length > 0)
    {
        if (count>=objectsPlaying.length) {count = 0;};

        if (objectsPlaying[count] instanceof droneSonification)
        {
            objectsPlaying[count].envelope.triggerAttackRelease('1n',time);
        }
        else if (objectsPlaying[count] instanceof synthLoopSonification)
        {
            objectsPlaying[count].loop.start(); // start the synthSonification loop
            objectsPlaying[count].loop.stop('+1n'); // close it at a future time.. 
        }
        count = count + 1;
    }
}






//attach a click listener to a play button
const button_1 = document.getElementById("button_1");
const button_2 = document.getElementById("button_2");

button_1.addEventListener("click", async () => {
    await Tone.start();
    console.log("audio is ready");

    Tone.Transport.bpm.value = 60;

    // start the transport (i.e. the "clock" that drives the loop)
    Tone.Transport.start();

    loopGlobal.start();

});

button_2.addEventListener("click", async () => {
    console.log("stopping all sounds!");

    Tone.Transport.stop(); // this just stops the master time.. 
 
});


// Clear console after load.. 
// console.clear();
//---------------------------------------------------------------------------------------------------------------
