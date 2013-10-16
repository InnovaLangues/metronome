'use strict';

var timeoutId = 0;
var timeoutClearId = 0;
var oneMin = 50000; // How many milliseconds
var bpm = 100;
var bpb = 4;
var beatCount = 1;
var left = 1;
var turnedOn = false;

$(document).ready(function() {
    $(".set-bpm").click(function() {
        var currentValue = parseFloat($(this).val());
        $("#bpm").val(currentValue);
        bpm = parseFloat($("#bpm").val());
    });

    $("#bpmPlus").click(function() {
        var currentValue = parseFloat($("#bpm").val());
        $("#bpm").val(currentValue + 1);
        bpm = parseFloat($("#bpm").val());
        if (bpm > '500') {
            $("#bpm").val(500);
            bpm = 500;
        }
    });

    $("#bpmMinus").click(function() {
        var currentValue = parseFloat($("#bpm").val());
        $("#bpm").val(currentValue - 1);
        bpm = parseFloat($("#bpm").val());
        if (bpm < '1') {
            $("#bpm").val(1);
            bpm = 1;
        }
    });

    $("#bpm").change(function() {
        bpm = parseFloat($("#bpm").val());
        if (bpm < '1') {
            $("#bpm").val(1);
            bpm = 1;
        }
        if (bpm > '500') {
            $("#bpm").val(500);
            bpm = 500;
        }
    });

    $("#start").click(function() {
        if (turnedOn) {
            return false;
        }
        beat();
        turnedOn = true;
    });

    $("#stop").click(function() {
        clearTimeout(timeoutId);
        turnedOn = false;
    });
});

function beat() {
    timeoutId = setTimeout("beat()", (oneMin / bpm));
    beep();
    blink();
}

function beep() {
    document.getElementById('beepOne').play();
}

function blink() {
    $("#beatIndicator").addClass('blink');
    setTimeout(function(){
        $("#beatIndicator").removeClass('blink');
    },60)
}