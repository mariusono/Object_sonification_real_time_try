//---------------------------------------------------------------------------------------------------------------
function exponentialMapping(rangeOut_bottom, rangeOut_top, rangeIn_bottom, rangeIn_top, fac, val) {
    // map value between 0 1
    valueMapped = 0.0 + ((1.0 - 0.0) * (val - rangeIn_bottom) / (rangeIn_top - rangeIn_bottom));

    // map to an exponential curve between 0 and 1 with a factor fac
    mapToExp = (Math.exp(valueMapped * fac) - 1) / (Math.exp(fac) - 1);

    // map back to desired output range
    newValue = rangeOut_bottom + ((rangeOut_top - rangeOut_bottom) * (mapToExp - 0) / (1 - 0));

    return newValue;
}

function linearMapping(rangeOut_bottom, rangeOut_top, rangeIn_bottom, rangeIn_top, value) {
    newValue = rangeOut_bottom + ((rangeOut_top - rangeOut_bottom) * (value - rangeIn_bottom) / (rangeIn_top - rangeIn_bottom));
    return newValue;
}

function average(array) {
    var total = 0;
    for (var i = 0; i < array.length; i++) {
        total += array[i];
    }
    var avg = total / array.length;
    return avg;
}

function clip(value, min, max) {
    if (value > max) value = max;
    if (value < min) value = min;
    return value
}

function mag2db(value) {
    return 20 * Math.log10(value);
}

function db2mag(value) {
    return 10 ** (value / 20);
}

function rad2deg(value) {
    return value * 180 / Math.PI;
}

function deg2rad(value) {
    return value * Math.PI / 180;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
//---------------------------------------------------------------------------------------------------------------