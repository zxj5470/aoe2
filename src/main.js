import Game from './core/Game.js';

// 初始化游戏
const game = new Game();

// 将 game 对象暴露到全局，方便在项目中任何地方访问
window.game = game;

// 启动游戏
game.init();