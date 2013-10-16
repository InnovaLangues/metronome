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

    $("#bpb").change(function() {
        bpb = parseFloat($("#bpb").val());
        if (bpb < '1') {
            $("#bpb").val(1);
            bpb = 1;
        }
        if (bpb > '500') {
            $("#bpm").val(500);
            bpb = 500;
        }
    });

    $("#bpbPlus").click(function() {
        var currentValue = parseFloat($("#bpb").val());
        $("#bpb").val(currentValue + 1);
        bpb = parseFloat($("#bpb").val());
        if (bpb > '500') {
            $("#bpb").val(500);
            bpb = 500;
        }
    });

    $("#bpbMinus").click(function() {
        var currentValue = parseFloat($("#bpb").val());
        $("#bpb").val(currentValue - 1);
        bpb = parseFloat($("#bpb").val());
        if (bpb < '1') {
            $("#bpb").val(1);
            bpb = 1;
        }
    });

    $("#start").click(function() {
        if (turnedOn) {
            return false;
        }
        beatCount = 1;
        beat();
        turnedOn = true;
    });

    $("#stop").click(function() {
        clearTimeout(timeoutId);
        beatCount = 1
        beatReset();
        turnedOn = false;
    });
});

function beat() {
    timeoutId = setTimeout("beat()", (oneMin / bpm));

    $("#beatIndicator").show();
    $("#beatIndicator").html(""); // Clear HTML
    $("#beatIndicator").html(beatCount);

    if (beatCount == 1) {
        barBeep();
    }
    else {
        beep();
    }

    beatCount++;
    if (beatCount > bpb) {
        beatCount = 1;
    }
}

function beep() {
    $("#beatIndicator").removeClass('barBeep');
    $("#beatIndicator").addClass('beep');
	document.getElementById('beepOne').play();
    blink();
}

function barBeep() {
    $("#beatIndicator").removeClass('beep');
    $("#beatIndicator").addClass('barBeep');
	document.getElementById('beepTwo').play();
    blink();
}

/*Ajouté par dono*/
function blink() {
    $("#beatIndicator").addClass('blink');
    setTimeout(function(){
        $("#beatIndicator").removeClass('blink');
    },60)

}

/*Ajouté par dono*/
function barBlink() {
    $("#beatIndicator").addClass('blink');
    $("#beatIndicator").removeClass('blink');
}

function beatReset()
{
    $("#beatBar").removeClass('beatRight');
    $("#beatBar").removeClass('beatLeft');
    $("#beatBar").addClass('beatReset');
}