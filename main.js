import { Game } from "./game.js";

window.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('canvas-container');
    const screens = {
        start: document.getElementById('start-screen'),
        gameOver: document.getElementById('game-over-screen'),
        win: document.getElementById('win-screen')
    };
    const statusVal = document.getElementById('status-value');
    const levelVal = document.getElementById('level-indicator');

    //buttons
    const btnStart = document.getElementById('start-btn');
    const btnReset = document.getElementById('retry-btn');
    const btnRetry = document.getElementById('retry-btn');
    const btnNext = document.getElementById('next-level-btn');

    //initialze
    const game = new Game(container, (event, data) => {
        handleGameEvents(event, data);
    });
    function handleGameEvents(event, data){
        if(event === 'STATUS_CHANGE'){
            if(data === 'DANGER'){
                statusVal.innerText = 'CRITICAL EXPOSURE';
                statusVal.className = 'value danger';
            } else {
                statusVal.innerText = 'SECURE';
                statusVal.className = 'value safe';
            }
        }
        else if(event === 'GAME_OVER'){
            screens.gameOver.classList.remove('hidden');
        }
        else if (event === 'LEVEL_COMPLETE'){
            screens.win.classList.remove('hidden');
        }
        else if(event === 'LEVEL_LOADED'){
            levelVal.innerText = (data + 1).toString().padStart(2, '0');
        }
    }
    //start game
    btnStart.addEventListener('click', () => {
        screens.start.classList.add('hidden');
        game.startLevel();
    });
    btnRetry.addEventListener('click', () => {
        screens.gameOver.classList.add('hidden');
        game.resetLevel();
    });
    //reset
    btnReset.addEventListener('click', () => {
        game.resetLevel();
    });
    btnNext.addEventListener('click', () => {
        screens.win.classList.add('hidden');
        const hasNext = game.nextLevel();
        if(!hasNext){
            alert("ALL SECTORS SECURED. ARCHITECT STATUS: LEGEND.");
            game.loadlevel(0);
        }
    });
    window.addEventListener('resize', () => {
        game.onwindowResize();
    });
});