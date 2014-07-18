/**
Very interesting article about audio synchornisation in HTML5 
http://www.html5rocks.com/en/tutorials/audio/scheduling/
**/
'use strict';
var audioContext = null; // audiocontext
var isPlaying = false; // Are we currently playing?
var intervalID = 0;
var tempo = 70.0; // tempo (in beats per minute)

var audio = null; // buffer source
var source = null; // another buffer source
var bufferLoader;

var startTime; // The start time of the entire sequence.
var current16thNote; // What note is currently last scheduled?        
var lookahead = 25.0; // How frequently to call scheduling function (in milliseconds)
// How far ahead to schedule audio (sec) This is calculated from lookahead, and overlaps with next interval (in case the timer is late)
var scheduleAheadTime = 0.1; 
var nextNoteTime = 0.0; // when the next note is due.

function nextNote() {
    // Advance current note and time by a 16th note...
    var secondsPerBeat = 60.0 / tempo; // Notice this picks up the CURRENT tempo value to calculate beat length.
    nextNoteTime += 0.25 * secondsPerBeat; // Add beat length to last beat time
    current16thNote++; // Advance the beat number, wrap to zero
    if (current16thNote == 16) {
        current16thNote = 0;
    }
}

function scheduleNote(beatNumber) {

    if (beatNumber % 4) return; // we're not playing non-quarter 8th notes
    

    var option = $('input[name=options]:checked').val();
    switch(option){
        case 'beep-blink': 
            bleep();
            blink();
        break;
        case 'beep': 
            bleep();
        break;
        case 'blink': 
            blink();
        break;
    }
}

function scheduler() {
    // while there are notes that will need to play before the next interval, 
    // schedule them and advance the pointer.
    while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
        scheduleNote(current16thNote);
        nextNote();
    }
    intervalID = window.setTimeout(scheduler, lookahead);
}

function play() {
    isPlaying = !isPlaying;
    if (isPlaying) { // start playing
        current16thNote = 0;
        nextNoteTime = audioContext.currentTime;
        scheduler(); // kick off scheduling
    }
}

function bleep(){
    source = audioContext.createBufferSource();
    source.buffer = audio.buffer;
    source.connect(audioContext.destination);
    source.start(0);
}

function blink() {
    $("#beatIndicator").addClass('blink');
    setTimeout(function() {
        $("#beatIndicator").removeClass('blink');
    }, 60);
}

$(document).ready(function() {
    // set bpm text input value
    $("#bpm").val(tempo);
    $(".set-bpm").click(function() {
        var currentValue = parseFloat($(this).val());
        $("#bpm").val(currentValue);
        tempo = parseFloat($("#bpm").val());
    });
    $("#bpmPlus").click(function() {
        var currentValue = parseFloat($("#bpm").val());
        $("#bpm").val(currentValue + 5);
        tempo = parseFloat($("#bpm").val());
        if (tempo > '500') {
            $("#bpm").val(500);
            tempo = 500;
        }
    });
    $("#bpmMinus").click(function() {
        var currentValue = parseFloat($("#bpm").val());
        $("#bpm").val(currentValue - 5);
        tempo = parseFloat($("#bpm").val());
        if (tempo < '1') {
            $("#bpm").val(1);
            tempo = 1;
        }
    });
    $("#bpm").change(function() {
        tempo = parseFloat($("#bpm").val());
        if (tempo < '1') {
            $("#bpm").val(1);
            tempo = 1;
        }
        if (tempo > '500') {
            $("#bpm").val(500);
            tempo = 500;
        }
    });
    $("#start").click(function() {
        if (isPlaying) {
            return false;
        }
        play();
        isPlaying = true;
    });
    $("#stop").click(function() {
        source.stop();
        clearTimeout(intervalID);
        isPlaying = false;
    });
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();
    bufferLoader = new BufferLoader(audioContext, ['sounds/woodblock.wav'], finishedLoading);
    bufferLoader.load();
    // drop down menu item change
    $('.dropdown-menu a').click(function(e) {
        var rId = $(this).data('id');
        if (rId && 'undefined' !== rId) {
            var url = 'sounds/' + rId + '.wav';
            bufferLoader = new BufferLoader(audioContext, [url], finishedLoading);
            bufferLoader.load();
        }
        $('h5.selected-title').text('Current sound : ' + $(this).text());
    });
});

function finishedLoading(bufferList) {
    audio = audioContext.createBufferSource();
    audio.buffer = bufferList[0];
    audio.connect(audioContext.destination);
}

function BufferLoader(context, urlList, callback) {
    this.audioContext = audioContext;
    this.urlList = urlList;
    this.onload = callback;
    this.bufferList = new Array();
    this.loadCount = 0;
}
BufferLoader.prototype.loadBuffer = function(url, index) {
    // Load buffer asynchronously
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";
    var loader = this;
    request.onload = function() {
        // Asynchronously decode the audio file data in request.response
        loader.audioContext.decodeAudioData(request.response, function(buffer) {
            if (!buffer) {
                alert('error decoding file data: ' + url);
                return;
            }
            loader.bufferList[index] = buffer;
            if (++loader.loadCount == loader.urlList.length) loader.onload(loader.bufferList);
        }, function(error) {
            console.error('decodeAudioData error', error);
        });
    }
    request.onerror = function() {
        alert('BufferLoader: XHR error');
    }
    request.send();
}
BufferLoader.prototype.load = function() {
    for (var i = 0; i < this.urlList.length; ++i) this.loadBuffer(this.urlList[i], i);
}