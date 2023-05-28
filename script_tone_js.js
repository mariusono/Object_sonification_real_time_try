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
// let loopGlobal = new Tone.Loop(loopStep, "1n");  // '1n' here sets the speed of our loop -- every 1th note

count = 0;

let flagAllSounds = false;

const checkbox_sounds = document.getElementById("checkbox_sounds");

checkbox_sounds.addEventListener("change", () => {
    flagAllSounds = !flagAllSounds;
    console.log(flagAllSounds);
});

let loopGlobal;
if (flagAllSounds)
{
    loopGlobal = new Tone.Loop(loopStep, '16n');  // '1n' here sets the speed of our loop -- every 1th note
}
else
{
    loopGlobal = new Tone.Loop(loopStep, "1n");  // '1n' here sets the speed of our loop -- every 1th note
}

let intervalVal = loopGlobal.interval;

function loopStep(time){
    let sonifiedObjects_keys = Object.keys(sonifiedObjects);
    let objectsPlaying = [];
    let objectsNotPlaying = [];

    // console.log(sonifiedObjects);

    for (let i = 0; i<sonifiedObjects_keys.length;i++)
    {
        if (sonifiedObjects[sonifiedObjects_keys[i]].playingFlag)
        {
            // objectsPlaying[sonifiedObjects_keys[i]] = sonifiedObjects[sonifiedObjects_keys[i]];
            objectsPlaying.push(sonifiedObjects[sonifiedObjects_keys[i]]);
        }
        else
        {
            objectsNotPlaying.push(sonifiedObjects[sonifiedObjects_keys[i]]);
        }
    }

    console.log(flagAllSounds);
    console.log(objectsPlaying);

    // console.log(objectsPlaying);
    if (flagAllSounds)
    {
        for (let i = 0;i<objectsPlaying.length;i++)
        {
            if (objectsPlaying[i] instanceof droneSonification)
            {
                objectsPlaying[i].envelope.triggerAttack();
            }
            else if (objectsPlaying[i] instanceof synthLoopSonification)
            {
                objectsPlaying[i].loop.start(); // start the synthSonification loop
            }
        }
        for (let i = 0;i<objectsNotPlaying.length;i++)
        {
            if (objectsNotPlaying[i] instanceof droneSonification)
            {
                objectsNotPlaying[i].envelope.triggerRelease();
            }
            else if (objectsNotPlaying[i] instanceof synthLoopSonification)
            {
                objectsNotPlaying[i].loop.stop(); // start the synthSonification loop
            }
        }        
    }
    else
    {
        // console.log('here');
        if (objectsPlaying.length > 0)
        {
            if (count>=objectsPlaying.length) {count = 0;};
    
            if (objectsPlaying[count] instanceof droneSonification)
            {
                // objectsPlaying[count].envelope.triggerAttackRelease('1n',time);
                objectsPlaying[count].envelope.triggerAttackRelease(String(intervalVal),time);
            }
            else if (objectsPlaying[count] instanceof synthLoopSonification)
            {
                objectsPlaying[count].loop.start(); // start the synthSonification loop
                // objectsPlaying[count].loop.stop('+1n'); // close it at a future time.. 
                objectsPlaying[count].loop.stop('+'+String(intervalVal)); // close it at a future time.. 
            }
            count = count + 1;
        }
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


// ADD SLIDER FUNCTIONS

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

function setLoopTime(v) {
    intervalVal = linearMapping(0.1, 5.0, 0, 10000, v); // db linear Scale

    document.getElementById('Interval').innerText = parseFloat(intervalVal).toFixed(4);
    // gainNode.gain.value = gainVal;
    loopGlobal.interval = intervalVal;
}



// Clear console after load.. 
// console.clear();
//---------------------------------------------------------------------------------------------------------------
