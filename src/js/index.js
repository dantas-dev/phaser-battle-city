import { config } from './config.js';
import MainScene from './scenes/MainScene.js';

class Game extends Phaser.Game {
  constructor(config) {
    super(config); // passando as configurações do jogo

    this.scene.add('Main', new MainScene('Main')); // adiciona essa cena ao jogo
    this.scene.start('Main'); // inicia a cena selecionada
  }
}

// ao carregar os arquivos, iniciar o game
window.onload = () => {
  window.game = new Game(config);
};
