
var audioContext = null;
var isPlaying = false;      // Are we currently playing?
var startTime;              // The start time of the entire sequence.
var current16thNote;        // What note is currently last scheduled?
var tempo = 70.0; // tempo (in beats per minute)   
var lookahead = 25.0;       // How frequently to call scheduling function 
//(in milliseconds)
var scheduleAheadTime = 0.1;    // How far ahead to schedule audio (sec)
// This is calculated from lookahead, and overlaps 
// with next interval (in case the timer is late)
var nextNoteTime = 0.0;     // when the next note is due.
var noteResolution = 2;     // 0 == 16th, 1 == 8th, 2 == quarter note
var noteLength = 0.05;      // length of "beep" (in seconds)

var notesInQueue = [];      // the notes that have been put into the web audio,
// and may or may not have played yet. {note, time}
var timerWorker = null;     // The Web Worker used to fire timer messages


var last = 0;
var audio = null; // buffer source
var source = null; // another buffer source
var bufferLoader;

var option;


// First, let's shim the requestAnimationFrame API, with a setTimeout fallback
window.requestAnimFrame = (function () {
    return  window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (callback) {
                console.log('tooo bad');
                window.setTimeout(callback, 1000 / 60);
            };
})();

function nextNote() {
    // Advance current note and time by a 16th note...
    var secondsPerBeat = 60.0 / tempo;    // Notice this picks up the CURRENT 
    // tempo value to calculate beat length.
    nextNoteTime += 0.25 * secondsPerBeat;    // Add beat length to last beat time

    current16thNote++;    // Advance the beat number, wrap to zero
    if (current16thNote === 16) {
        current16thNote = 0;
    }
}

function scheduleNote(beatNumber, time) {
    // push the note on the queue, even if we're not playing.
    notesInQueue.push({note: beatNumber, time: time});

    if (beatNumber % 4)
        return; // we're not playing non-quarter 8th notes

    option = $('input[name=options]:checked').val();
    switch (option) {
        case 'beep-blink':
            bleep(time);
            blink();
            break;
        case 'beep':
            bleep(time);
            break;
        case 'blink':
            blink();
            break;
    }
    // control scheduling accuracy    
    // @70 BPM max gap = 75ms
    // @120 BPM max gap = 50ms
    var now = Date.now();
    interval = now - start;
    start = now;
    console.log(interval);
}

function scheduler() {
    // while there are notes that will need to play before the next interval, 
    // schedule them and advance the pointer.
    while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
        scheduleNote(current16thNote, nextNoteTime);
        nextNote();
    }
}
// control accuracy
var start = 0;
var interval = 0;

function bleep(time) {
    source = audioContext.createBufferSource();
    source.buffer = audio.buffer;
    source.connect(audioContext.destination);
    source.start(time, 0, time + noteLength);
}

function blink() {
    $("#beatIndicator").addClass('blink');
    setTimeout(function () {
        $("#beatIndicator").removeClass('blink');
    }, 60);
}

function flashIt() {
    document.getElementById('flash').classList.add('on');
    window.setTimeout(function () {
        document.getElementById('flash').classList.remove('on');
    }, 100);
}

$(document).ready(function () {
    // set bpm text input value
    $("#bpm").val(tempo);
    $(".set-bpm").click(function () {
        var currentValue = parseFloat($(this).val());
        $("#bpm").val(currentValue);
        tempo = parseFloat($("#bpm").val());
    });
    $("#bpmPlus").click(function () {
        var currentValue = parseFloat($("#bpm").val());
        $("#bpm").val(currentValue + 5);
        tempo = parseFloat($("#bpm").val());
        if (tempo > '500') {
            $("#bpm").val(500);
            tempo = 500;
        }
    });
    $("#bpmMinus").click(function () {
        var currentValue = parseFloat($("#bpm").val());
        $("#bpm").val(currentValue - 5);
        tempo = parseFloat($("#bpm").val());
        if (tempo < '1') {
            $("#bpm").val(1);
            tempo = 1;
        }
    });
    $("#bpm").change(function () {
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
    $("#play").click(function () {
        if (isPlaying) {
            source.stop();
            isPlaying = false;
            timerWorker.postMessage("stop");
            return "play";
        }
        else {
            isPlaying = true;
            current16thNote = 0;
            nextNoteTime = audioContext.currentTime;
            timerWorker.postMessage("start");
            return "stop";
        }
    });

    // if we wanted to load audio files, etc., this is where we should do it.
    timerWorker = new Worker("js/metronomeworker.js");
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();
    bufferLoader = new BufferLoader(audioContext, ['sounds/woodblock.wav'], finishedLoading);
    bufferLoader.load();
    // drop down menu item change
    $('.dropdown-menu a').click(function (e) {
        var rId = $(this).data('id');
        if (rId && 'undefined' !== rId) {
            var url = 'sounds/' + rId + '.wav';
            console.log(url);
            bufferLoader = new BufferLoader(audioContext, [url], finishedLoading);
            bufferLoader.load();
        }
        $('span.selected-title').text($(this).text());
    });

    timerWorker.onmessage = function (e) {
        if (e.data === "tick") {
            scheduler();
        } else {
            console.log("message: " + e.data);
        }
    };
    timerWorker.postMessage({"interval": lookahead});



});

function finishedLoading(bufferList) {
    audio = audioContext.createBufferSource();
    audio.buffer = bufferList[0];
    audio.connect(audioContext.destination);
}

function BufferLoader(context, urlList, callback) {
    this.audioContext = context;
    this.urlList = urlList;
    this.onload = callback;
    this.bufferList = new Array();
    this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function (url, index) {
    // Load buffer asynchronously
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";
    var loader = this;
    request.onload = function () {
        // Asynchronously decode the audio file data in request.response
        loader.audioContext.decodeAudioData(request.response, function (buffer) {
            if (!buffer) {
                console.log('error decoding file data: ' + url);
                return;
            }
            loader.bufferList[index] = buffer;
            if (++loader.loadCount == loader.urlList.length)
                loader.onload(loader.bufferList);
        }, function (e) {
            console.log('decodeAudioData error');
            console.log(e);
        });

    };
    request.onerror = function () {
        alert('BufferLoader: XHR error');
    };
    request.send();
};
BufferLoader.prototype.load = function () {
    for (var i = 0; i < this.urlList.length; ++i)
        this.loadBuffer(this.urlList[i], i);
};
