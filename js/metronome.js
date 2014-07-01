'use strict';

var timeoutId = 0;
var timeoutClearId = 0;
var oneMin = 60000; // How many milliseconds
var bpm = 70;
var bpb = 4;
var beatCount = 1;
var left = 1;
var turnedOn = false;
var audio = null; // buffer source
var context;
var bufferLoader;
var source;

$(document).ready(function() {

    $("#bpm").val(bpm);

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
        source.stop();
        clearTimeout(timeoutId);
        turnedOn = false;
    });

    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();

    bufferLoader = new BufferLoader(
            context,
            ['sounds/woodblock.wav'],
            finishedLoading
        );
    bufferLoader.load();

    // drop down menu item change
    $('.dropdown-menu a').click(function(e) {
        var rId = $(this).data('id');
        if (rId && 'undefined' !== rId) {
            var url = 'sounds/' + rId + '.wav';
            bufferLoader = new BufferLoader(
                context,
                [url],
                finishedLoading
            ); 
            bufferLoader.load();        
        }
        $('h5.selected-title').text('Current sound : '+ $(this).text());
    });
});

function finishedLoading(bufferList){
    audio = context.createBufferSource();
    audio.buffer = bufferList[0];
    audio.connect(context.destination);
}

function beat() {

    timeoutId = setTimeout("beat()", (oneMin / bpm) );
    var option = $('input[name=options]:checked').val();

    switch(option)
    {
        case 'beep-blink':
            beep();
            blink();
            break;
        case 'beep':
            beep();
            break;
        case 'blink':
            blink();
            break;
    }
}

function beep() {
    source = context.createBufferSource();
    source.buffer = audio.buffer;
    source.connect(context.destination);
    source.start(0);
}

function blink() {
    $("#beatIndicator").addClass('blink');
    setTimeout(function(){
        $("#beatIndicator").removeClass('blink');
    },60);
}


function BufferLoader(context, urlList, callback) {
    this.context = context;
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
        loader.context.decodeAudioData(
                request.response,
                function(buffer) {
                    if (!buffer) {
                        alert('error decoding file data: ' + url);
                        return;
                    }
                    loader.bufferList[index] = buffer;
                    if (++loader.loadCount == loader.urlList.length)
                        loader.onload(loader.bufferList);
                },
                function(error) {
                    console.error('decodeAudioData error', error);
                }
        );
    }

    request.onerror = function() {
        alert('BufferLoader: XHR error');
    }

    request.send();
}

BufferLoader.prototype.load = function() {
    for (var i = 0; i < this.urlList.length; ++i)
        this.loadBuffer(this.urlList[i], i);
}