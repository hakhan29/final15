const video = document.getElementById('video');
const expressionDiv = document.getElementById('expression');
const colorBox = document.getElementById('colorBox');
const startAudioButton = document.getElementById('startAudio');

let currentAudio = null;

// 모델 로드
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
    faceapi.nets.faceExpressionNet.loadFromUri('./models')
]).then(startVideo);

// 비디오 스트림 시작
function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => {
            video.srcObject = stream;
            startAudioButton.style.display = 'block'; // 오디오 버튼 표시
        })
        .catch(err => console.error(err));
}

// 오디오 재생 함수
function playEmotionMusic(emotion) {
    const emotionMusic = {
        happy: './audio/happy.mp3',
        sad: './audio/sad.mp3',
        anger: './audio/anger.mp3',
        neutral: './audio/neutral.mp3',
        surprised: './audio/surprised.mp3',
        fear: './audio/fear.mp3'
    };

    if (currentAudio) {
        currentAudio.pause();
        currentAudio.volume = 0;
    }

    currentAudio = new Audio(emotionMusic[emotion]);
    currentAudio.volume = 0.5; // 볼륨 설정
    currentAudio.play().catch(err => console.error('Audio play error:', err));
}

// 그라데이션 색상 업데이트 함수
function updateGradientColor(expressions) {
    const anger = expressions.anger || 0;
    const happy = expressions.happy || 0;
    const sad = expressions.sad || 0;
    const neutral = expressions.neutral || 0;
    const surprised = expressions.surprised || 0;
    const fear = expressions.fear || 0;

    const red = Math.round(
        anger * 255 +
        happy * 255 +
        surprised * 255 +
        fear * 128
    );
    const green = Math.round(
        happy * 255 +
        neutral * 255 +
        surprised * 165
    );
    const blue = Math.round(
        sad * 255 +
        neutral * 255 +
        fear * 255
    );

    const emotionColors = {
        anger: 'rgb(255, 0, 0)',
        happy: 'rgb(255, 255, 0)',
        sad: 'rgb(0, 0, 255)',
        neutral: 'rgb(128, 128, 128)',
        surprised: 'rgb(255, 165, 0)',
        fear: 'rgb(128, 0, 128)'
    };

    const highestEmotion = Object.keys(expressions).reduce((a, b) =>
        expressions[a] > expressions[b] ? a : b
    );

    const dominantColor = emotionColors[highestEmotion] || 'white';
    const textColor = `rgb(${red}, ${green}, ${blue})`;

    colorBox.style.background = `linear-gradient(to bottom, ${textColor}, ${dominantColor})`;
}

video.addEventListener('play', () => {
    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();

        if (detections.length > 0) {
            const expressions = detections[0].expressions;
            updateGradientColor(expressions);

            const highestEmotion = Object.keys(expressions).reduce((a, b) =>
                expressions[a] > expressions[b] ? a : b
            );

            if (expressionDiv.textContent !== `Detected Expression: ${highestEmotion}`) {
                expressionDiv.style.opacity = 0;
                setTimeout(() => {
                    expressionDiv.textContent = `Detected Expression: ${highestEmotion}`;
                    expressionDiv.style.opacity = 1;
                }, 500);
            }

            playEmotionMusic(highestEmotion);
        } else {
            if (expressionDiv.textContent !== 'No face detected') {
                expressionDiv.style.opacity = 0;
                setTimeout(() => {
                    expressionDiv.textContent = 'No face detected';
                    expressionDiv.style.opacity = 1;
                }, 500);
            }
            colorBox.style.background = 'white';
        }
    }, 100);
});

startAudioButton.addEventListener('click', () => {
    playEmotionMusic('neutral'); // 중립 감정 초기 재생
});
