import { Game } from './Game.js';

window.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('canvas-container');
    const startScreen = document.getElementById('start-screen');
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const statusVal = document.getElementById('status-value');

    //init game
    const game = new Game(container, (status) => {
        if (status === 'DANGER') {
            statusVal.innerText = 'CRITICAL EXPOSURE';
            statusVal.className = 'value danger';
        } else {
            statusVal.innerText = 'SECURE';
            statusVal.className = 'value safe';
        }
    });
    startBtn.addEventListener('click', () => {
        startScreen.classList.add('hidden');
        game.start();
    });

    //
    resetBtn.addEventListener('click', () => {
        game.reset();
    });

    //it will handle the resizing of web.
    window.addEventListener('resize', () => {
        game.onwindowResize()
    });
});