import './lib/phaser.min.js';

const config = {
  type: Phaser.AUTO,
  pixelArt: true,
  roundPixels: true,
  banner: false,
  scale: { // deixa o nosso jogo responsivo
    width: 192,
    height: 240,
    mode: Phaser.Scale.FIT, // se "encaixa" no espaço disponivel da tela
    autoCenter: Phaser.Scale.CENTER_BOTH, // centraliza a tela do jogo
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: true,
    }
  }
}

export {
  config,
}
