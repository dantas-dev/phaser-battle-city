import { config } from './config.js';

class Game extends Phaser.Game {
  constructor(config) {
    super(config); // passando as configurações do jogo
  }
}

// ao carregar os arquivos, iniciar o game
window.onload = () => {
  window.game = new Game(config);
};
