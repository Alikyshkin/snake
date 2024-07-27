const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlay");
const startScreen = document.getElementById("startScreen");
const startButton = document.getElementById("startButton");
const gameContainer = document.getElementById("gameContainer");
const scoreDisplay = document.getElementById("score");
const gameOverScreen = document.getElementById("gameOverScreen");
const tryAgainButton = document.getElementById("tryAgainButton");
const fullscreenButton = document.getElementById("fullscreenButton");

const box = 40;
let snake = [];
let food;
let score;
let d;
let game;

const foodImg = new Image();
foodImg.src = "berry.png";

startButton.addEventListener("click", startGame);
tryAgainButton.addEventListener("click", startGame);
fullscreenButton.addEventListener("click", toggleFullScreen);
document.addEventListener("keydown", direction);

function startGame() {
    startScreen.classList.remove("active");
    gameOverScreen.classList.remove("active");
    overlay.style.display = "none";
    snake = [{ x: 12 * box, y: 12 * box }];
    score = 0;
    d = null;
    scoreDisplay.innerText = "Счет: " + score;
    placeFood();
    if (game) clearInterval(game);
    game = setInterval(draw, 100);
}

function placeFood() {
    food = {
        x: Math.floor(Math.random() * 25) * box,
        y: Math.floor(Math.random() * 25) * box,
    };
}

function direction(event) {
    const key = event.keyCode;
    if ((key == 37 || key == 65) && d != "RIGHT") {
        d = "LEFT";
    } else if ((key == 38 || key == 87) && d != "DOWN") {
        d = "UP";
    } else if ((key == 39 || key == 68) && d != "LEFT") {
        d = "RIGHT";
    } else if ((key == 40 || key == 83) && d != "UP") {
        d = "DOWN";
    }
}

function draw() {
    // Шахматный фон
    for (let x = 0; x < canvas.width; x += box) {
        for (let y = 0; y < canvas.height; y += box) {
            ctx.fillStyle = (x / box % 2 === y / box % 2) ? "#1a651a" : "#146314";
            ctx.fillRect(x, y, box, box);
        }
    }

    // Отрисовка змейки
    ctx.fillStyle = "blue";
    for (let i = 0; i < snake.length; i++) {
        ctx.fillRect(snake[i].x, snake[i].y, box, box);

        // Отрисовка глаз на голове змейки
        if (i === 0) {
            ctx.fillStyle = "white";
            let eyeRadius = box / 8;
            let eyeOffsetX = box / 4;
            let eyeOffsetY = box / 4;

            // Левый глаз
            ctx.beginPath();
            ctx.arc(snake[i].x + eyeOffsetX, snake[i].y + eyeOffsetY, eyeRadius, 0, 2 * Math.PI);
            ctx.fill();

            // Правый глаз
            ctx.beginPath();
            ctx.arc(snake[i].x + box - eyeOffsetX, snake[i].y + eyeOffsetY, eyeRadius, 0, 2 * Math.PI);
            ctx.fill();

            // Зрачки
            ctx.fillStyle = "black";
            let pupilRadius = box / 16;
            ctx.beginPath();
            ctx.arc(snake[i].x + eyeOffsetX, snake[i].y + eyeOffsetY, pupilRadius, 0, 2 * Math.PI);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(snake[i].x + box - eyeOffsetX, snake[i].y + eyeOffsetY, pupilRadius, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    // Отрисовка еды
    ctx.drawImage(foodImg, food.x, food.y, box, box);

    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    if (d === "LEFT") snakeX -= box;
    if (d === "UP") snakeY -= box;
    if (d === "RIGHT") snakeX += box;
    if (d === "DOWN") snakeY += box;

    if (snakeX === food.x && snakeY === food.y) {
        score++;
        scoreDisplay.innerText = "Счет: " + score;
        placeFood();
    } else {
        snake.pop();
    }

    let newHead = { x: snakeX, y: snakeY };

    if (snakeX < 0 || snakeY < 0 || snakeX >= canvas.width || snakeY >= canvas.height || collision(newHead, snake)) {
        clearInterval(game);
        overlay.style.display = "flex";
        gameOverScreen.classList.add("active");
    }

    snake.unshift(newHead);
}


function collision(head, array) {
    for (let i = 0; i < array.length; i++) {
        if (head.x === array[i].x && head.y === array[i].y) {
            return true;
        }
    }
    return false;
}

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        canvas.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

startScreen.classList.add("active");
overlay.style.display = "flex";
