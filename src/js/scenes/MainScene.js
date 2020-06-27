export default class MainScene extends Phaser.Scene {
  constructor(key) {
    super(key);
  }

  init () {}

  preload () {
    this.load.spritesheet('player', './src/assets/player.png', {
      frameWidth: 16,
      frameHeight: 16,
    });

    this.load.spritesheet('enemy', './src/assets/enemy.png', {
      frameWidth: 16,
      frameHeight: 16,
    });

    this.load.image('bullet', './src/assets/bullet.png');
    this.load.image('block', './src/assets/block.png');
    this.load.image('brick', './src/assets/brick.png');
    this.load.image('bush', './src/assets/bush.png');
    this.load.image('pointer', './src/assets/pointer.png');

    this.load.json('map', './src/assets/levels/level-1.json');
  }

  create () {
    this.createCursorPointer();
    this.createMap();
  }

  update () {}

  createCursorPointer () {
    // tamanho do nosso TILE 16x16
    const TILE_SIZE = 16;
    // Pegamos o valor setado em config.js
    const { debug } = this.physics.config;
    this.cursorPointer = this.add.image(TILE_SIZE, TILE_SIZE, 'pointer');
    // por padrão o cursor vai ser invisivel
    this.cursorPointer.setAlpha(0);
    // setamos a origin para 0,0 assim ele fica corretamente posicionado no grid
    this.cursorPointer.setOrigin(0);

    // se o debug estiver ativos, ele ira ficar visivel de acordo com a posição do mouse
    if (debug) {
      this.cursorPointer.setAlpha(1);

      // evento para capturar o movimento do mouse na tela
      this.input.on('pointermove', (pointer) => {
        // numero da linha
        const row = Math.floor(pointer.y / TILE_SIZE);
        // numero da coluna
        const column = Math.floor(pointer.x / TILE_SIZE);
        console.log(row, column);
        // seta a posicao do pointer de acordo com a linha e coluna do grid
        this.cursorPointer.setPosition((column * TILE_SIZE), (row * TILE_SIZE));
      });

      this.input.on('pointerdown', (pointer) => {
        const row = Math.floor(pointer.x / TILE_SIZE);
        const column = Math.floor(pointer.y / TILE_SIZE);

        // convertendo o valor do GRID em pixels
        console.log(`X: ${row * TILE_SIZE} | Y: ${column * TILE_SIZE}`);
      });
    }
  }

  createMap () {
    this.map = this.cache.json.get('map');
    this.createTiles(this.map);
  }

  createTiles ({ bricks, blocks, bushes }) {
    // cria um fisico grupo estático
    this.bricksGroup = this.physics.add.staticGroup();
    this.blocksGroup = this.physics.add.staticGroup();
    // depth: 1, irá fazer com que o arbusto fique "acima",
    // dos outros elementos, como inimigos e jogador
    // imagine ele como o z-index do css
    this.bushesGroup = this.add.group({ depth: 1 });

    // para cada tijolo no .json, add ele ao grupo e a tela do jogo
    bricks.forEach((brick) => {
      const newBrick = this.add.image(brick.x, brick.y, brick.texture).setOrigin(0);
      this.bricksGroup.add(newBrick);
    });

    blocks.forEach((block) => {
      const newBlock = this.add.image(block.x, block.y, block.texture).setOrigin(0);
      this.blocksGroup.add(newBlock);
    });

    bushes.forEach((bush) => {
      const newBush = this.add.image(bush.x, bush.y, bush.texture).setOrigin(0);
      this.bushesGroup.add(newBush);
    });
  }
}
