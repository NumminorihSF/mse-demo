const BASE_URL = 'https://numminorihsf.github.io/mse-demo/streams/';

const media = '$RepresentationID$/fragment-$Number$-$RepresentationID$.m4s';
const init = '$RepresentationID$/init-$RepresentationID$.mp4';

let disabled = false;
const enableWaiters = [];

function onMediaSourceOpen() {
    console.log('Source was opened');

    this.duration = 596.4;

    initSourceBufferManager({
        mediaSource: this,
        mediaType: 'video/mp4; codecs="avc1.64001f"',
        init: BASE_URL + init.replaceAll('$RepresentationID$', 'vid4'),
        getMedia: (number) => BASE_URL + media.replaceAll('$RepresentationID$', 'vid4').replaceAll('$Number$', number),
        amountOfChunks: 150,
    });

    initSourceBufferManager({
        mediaSource: this,
        mediaType: 'audio/mp4; codecs="mp4a.40.2"',
        init: BASE_URL + init.replaceAll('$RepresentationID$', 'aid4'),
        getMedia: (number) => BASE_URL + media.replaceAll('$RepresentationID$', 'aid4').replaceAll('$Number$', number),
        amountOfChunks: 150,
    });
}

function initSourceBufferManager({
                                     mediaSource,
                                     mediaType,
                                     init,
                                     getMedia,
                                     amountOfChunks
                                 }) {
    // Добавление SourceBuffer для определенного формата видео
    const sourceBuffer = mediaSource.addSourceBuffer(mediaType);
    // Подписка на событие окончания добавления или очистки буфера
    sourceBuffer.addEventListener('updateend', fetchAndAppendNextSegment);

    fetchSegment(init).then((e) => {
        sourceBuffer.appendBuffer(new Uint8Array(e));
        video.play();
    });

    let index = 1;

    function fetchAndAppendNextSegment() {
        if (disabled) {
            enableWaiters.push(fetchAndAppendNextSegment);
            return;
        }

        const url = getMedia(index);

        fetchSegment(url).then((e) => {
            sourceBuffer.appendBuffer(new Uint8Array(e));
            index++;
            if (index > amountOfChunks) {
                sourceBuffer.removeEventListener('updateend', fetchAndAppendNextSegment);
            }
        });
    }

    function fetchSegment(url) {
        return fetch(url, {
            responseType: 'arraybuffer'
        }).then((res) => {
            if (!res.ok) {
                console.warn('Unexpected status code ' + res.status + ' for ' + url);
                return;
            }

            return res.arrayBuffer();
        });
    }
}

function disablePlayer() {
    disabled = true;
}

function enablePlayer() {
    disabled = false;
    enableWaiters.forEach((waiter) => waiter());
    enableWaiters.length = 0;
}

