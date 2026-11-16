'use strict';

const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');
const size = 16;
const cell = canvas.width / size;
const directions = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' };
const keys = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
};
const scoreDisplay = document.getElementById('score');
const recordDisplay = document.getElementById('record');
const overlay = document.getElementById('overlay');
const title = document.getElementById('screen-title');
const description = document.getElementById('screen-description');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const fullscreenButton = document.getElementById('fullscreenButton');
const consolePanel = document.getElementById('gameContainer');
const controlsHint = document.getElementById('controls-hint');
const touchScreen = window.matchMedia('(pointer: coarse)').matches;
const strawberry = new Image();
strawberry.onload = render;
strawberry.src = 'berry.png';

const menus = {
    paused: ['Пауза', 'Продолжите с того же места.', 'Продолжить'],
    lost: ['Игра окончена', 'Счёт: ', 'Попробовать снова'],
    won: ['Поле заполнено', 'Счёт: ', 'Сыграть снова'],
};

let snake = [[size / 2, size / 2]];
let food;
let score = 0;
let record = loadRecord();
let state = 'ready';
let direction;
let pendingTurn;
let timer;
let pointer;

function loadRecord() {
    try {
        const value = Number(localStorage.getItem('snake-record'));
        return Number.isSafeInteger(value) && value >= 0 ? value : 0;
    } catch {
        return 0;
    }
}

function showState(nextState) {
    state = nextState;
    overlay.hidden = nextState === 'running';
    pauseButton.hidden = nextState !== 'running';
    if (nextState === 'running') return;

    const [heading, message, buttonText] = menus[nextState];
    title.textContent = heading;
    description.textContent = nextState === 'lost' || nextState === 'won' ? message + score : message;
    startButton.textContent = buttonText;
}

function stop(nextState) {
    window.clearInterval(timer);
    timer = undefined;
    showState(nextState);
    startButton.focus();
}

function start() {
    if (state !== 'paused') {
        snake = [[size / 2, size / 2]];
        score = 0;
        direction = undefined;
        pendingTurn = undefined;
        food = placeFood();
        updateScore();
        render();
    }

    window.clearInterval(timer);
    showState('running');
    timer = window.setInterval(step, 125);
    canvas.focus({ preventScroll: true });
}

function sameCell(a, b) {
    return Boolean(b) && a[0] === b[0] && a[1] === b[1];
}

function placeFood() {
    const occupied = new Set(snake.map(([x, y]) => y * size + x));
    const free = [];
    for (let index = 0; index < size * size; index++) {
        if (!occupied.has(index)) free.push(index);
    }
    if (!free.length) return undefined;

    const index = free[Math.floor(Math.random() * free.length)];
    return [index % size, Math.floor(index / size)];
}

function turn(next) {
    if (state !== 'running' || pendingTurn || next === direction || next === opposite[direction]) return;
    pendingTurn = next;
}

function step() {
    direction = pendingTurn ?? direction;
    pendingTurn = undefined;
    if (!direction) return;

    const [dx, dy] = directions[direction];
    const [x, y] = snake[0];
    const head = [x + dx, y + dy];
    const eats = sameCell(head, food);
    const body = eats ? snake : snake.slice(0, -1);
    if (head.some(coordinate => coordinate < 0 || coordinate >= size) || body.some(part => sameCell(head, part))) {
        stop('lost');
        return;
    }

    if (!eats) snake.pop();
    snake.unshift(head);

    if (eats) {
        score++;
        updateScore();
        food = placeFood();
        if (!food) stop('won');
    }
    render();
}

function updateScore() {
    scoreDisplay.textContent = score;
    if (score > record) {
        record = score;
        try { localStorage.setItem('snake-record', String(record)); } catch {}
    }
    recordDisplay.textContent = record;
}

function render() {
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            context.fillStyle = (x + y) % 2 ? '#1d382a' : '#203d2e';
            context.fillRect(x * cell, y * cell, cell, cell);
        }
    }
    snake.forEach(([x, y], index) => {
        context.fillStyle = index === 0 ? '#e4f39e' : '#a8d460';
        context.fillRect(x * cell + 2, y * cell + 2, cell - 4, cell - 4);
    });
    if (!food) return;
    const [x, y] = food;
    if (strawberry.complete && strawberry.naturalWidth) {
        context.drawImage(strawberry, x * cell + 2, y * cell + 2, cell - 4, cell - 4);
        return;
    }
    context.fillStyle = '#f79483';
    context.beginPath();
    context.arc((x + .5) * cell, (y + .5) * cell, cell * .32, 0, Math.PI * 2);
    context.fill();
}

startButton.addEventListener('click', start);
pauseButton.addEventListener('click', () => stop('paused'));
document.addEventListener('keydown', event => {
    if (state !== 'running' || event.altKey || event.metaKey || event.ctrlKey) return;
    if (keys[event.code]) {
        event.preventDefault();
        turn(keys[event.code]);
    } else if (event.code === 'KeyP' || (event.code === 'Space' && event.target === canvas)) {
        event.preventDefault();
        if (!event.repeat) stop('paused');
    }
});

document.querySelectorAll('[data-direction]').forEach(button => {
    button.addEventListener('click', () => turn(button.dataset.direction));
});

canvas.addEventListener('pointerdown', event => {
    if (pointer || !event.isPrimary || event.pointerType === 'mouse') return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener('pointerup', event => {
    if (event.pointerId !== pointer?.id) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    pointer = undefined;
    const horizontal = Math.abs(dx) > Math.abs(dy);
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    if (horizontal) turn(dx > 0 ? 'right' : 'left');
    else turn(dy > 0 ? 'down' : 'up');
});

canvas.addEventListener('lostpointercapture', event => {
    if (event.pointerId === pointer?.id) pointer = undefined;
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'running') stop('paused');
});

function syncExpandedControl() {
    const expanded = document.fullscreenElement === consolePanel || consolePanel.classList.contains('console--expanded');
    const label = expanded ? 'Свернуть поле' : 'Развернуть поле';
    fullscreenButton.setAttribute('aria-label', label);
    fullscreenButton.setAttribute('aria-pressed', String(expanded));
    fullscreenButton.title = label;
}

async function toggleExpanded() {
    if (document.fullscreenElement === consolePanel) {
        await document.exitFullscreen();
        return;
    }
    if (consolePanel.classList.contains('console--expanded')) {
        consolePanel.classList.remove('console--expanded');
        syncExpandedControl();
        return;
    }
    if (document.fullscreenEnabled && consolePanel.requestFullscreen) {
        try {
            await consolePanel.requestFullscreen();
            return;
        } catch {
            // Embedded browsers may disallow native fullscreen.
        }
    }
    consolePanel.classList.add('console--expanded');
    syncExpandedControl();
}

fullscreenButton.hidden = false;
fullscreenButton.addEventListener('click', toggleExpanded);
document.addEventListener('fullscreenchange', syncExpandedControl);
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && consolePanel.classList.contains('console--expanded')) {
        consolePanel.classList.remove('console--expanded');
        syncExpandedControl();
    }
});

if (touchScreen) controlsHint.textContent = 'Свайп по полю или кнопки со стрелками';
updateScore();
render();
