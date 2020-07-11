import { direction, speed, time } from '../config.js';

export default class MainScene extends Phaser.Scene {
  constructor(key) {
    super(key);
  }

  init () {
    this.TILE_SIZE = 16;
    this.pauseGame = false;
    /*
      método auxiliar do Phaser que nos retorna um objeto
      com os direcionais e a barra de espaço e o shift
    */
    this.cursors = this.input.keyboard.createCursorKeys();

    this.bulletsGroup = this.physics.add.group();
  }

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
    this.createPlayer();
    this.checkCollisions();
    this.enemyInterval();
  }

  update (currentTime) {
    if (this.pauseGame) {
      this.enemiesGroup.getChildren()
        .forEach(enemy => enemy.setVelocity(0));
      this.bulletsGroup.getChildren()
        .forEach(bullet => bullet.setVelocity(0));
      return;
    }

    this.movePlayer();
    this.bulletOutOfBounds();

    // Jogador atirar
    if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
      if (currentTime > this.player.nextFire) {
        this.fire(this.player);
        this.player.nextFire = currentTime + time.PLAYER_INTERVAL;
      }
    }

    // jogador destruiu todos os inimigos
    if (!this.enemiesGroup.getChildren().length) {
      this.gameOver();
    }
  }

  createCursorPointer () {
    // tamanho do nosso TILE 16x16
    const { TILE_SIZE } = this;
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
        // console.log(row, column);
        // seta a posicao do pointer de acordo com a linha e coluna do grid
        this.cursorPointer.setPosition((column * TILE_SIZE), (row * TILE_SIZE));
      });

      this.input.on('pointerdown', (pointer) => {
        const row = Math.floor(pointer.x / TILE_SIZE);
        const column = Math.floor(pointer.y / TILE_SIZE);

        // convertendo o valor do GRID em pixels
        // console.log(`X: ${row * TILE_SIZE} | Y: ${column * TILE_SIZE}`);
      });
    }
  }

  createMap () {
    this.map = this.cache.json.get('map');
    this.createTiles(this.map);
    this.createEnemies(this.map);
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
      const newBush = this.add.image(bush.x, bush.y, bush.texture)
        .setOrigin(0)
        .setDepth(1);
      this.bushesGroup.add(newBush);
    });
  }

  createPlayer() {
    // cria player já com corpo fisico
    this.player = this.physics.add.sprite(96, 192, 'player', 0).setOrigin(0);

    // Adicionando propriedades extras ao nosso this.player
    this.player.direction = direction.UP;
    this.player.nextFire = 0;

    // utilizado para verificar colisões com balas
    this.playersGroup = this.physics.add.group();
    this.playersGroup.add(this.player);
  }

  movePlayer () {
    const { left, right, up, down } = this.cursors;

    // se o jogador não estiver pressionando nenhuma tecla, 
    // a velocidade dele ira sempre ser 0
    this.player.setVelocity(0);

    if (up.isDown) {
      this.player.direction = direction.UP;
      this.player.flipY = false;
      this.player.setFrame(0);
      this.player.setVelocityY(-speed.PLAYER);
    } else if (down.isDown) {
      this.player.direction = direction.DOWN;
      this.player.flipY = true;
      this.player.setFrame(0);
      this.player.setVelocityY(speed.PLAYER);
    } else if (left.isDown) {
      this.player.direction = direction.LEFT;
      this.player.flipX = true;
      this.player.setFrame(1);
      this.player.setVelocityX(-speed.PLAYER);
    } else if (right.isDown) {
      this.player.direction = direction.RIGHT;
      this.player.flipX = false;
      this.player.setFrame(1);
      this.player.setVelocityX(speed.PLAYER);
    }
  }

  checkCollisions() {
    // ativa colisões do jogador com as bordas do jogo
    this.player.setCollideWorldBounds(true); 

    // ativa colisões do jogador com os tijolos, blocos e inimigos
    this.physics.add.collider(this.player, [this.bricksGroup, this.blocksGroup, this.enemiesGroup]);

    // ativa colisões dos inimigos com tijolos e blocos
    this.physics.add.collider(this.enemiesGroup, [this.bricksGroup, this.blocksGroup]);

    // ativa colisões entre balas e tijolos
    this.physics.add.collider(this.bulletsGroup, [this.bricksGroup], this.bulletCollideBrick);

    // ativa colisões entre balas e blocos
    this.physics.add.collider(this.bulletsGroup, [this.blocksGroup], this.bulletCollideBlocks);

    // ativa colisões entre balas e jogador e inimigos
    this.physics.add.overlap(this.bulletsGroup, [this.enemiesGroup, this.playersGroup], this.bulletCollideEnemyOrPLayer.bind(this));
  }

  createEnemies ({ enemies }) {
    this.enemiesGroup = this.physics.add.group({
      collideWorldBounds: true,
    });

    enemies.forEach((enemy) => {
      const newEnemy = this.physics.add.sprite(
        enemy.x,
        enemy.y,
        enemy.texture,
        enemy.frame
      )
        .setOrigin(0)
        .setFlipY(true);
      newEnemy.direction = direction.DOWN;
      this.enemiesGroup.add(newEnemy);
    });
  }

  moveEnemy (enemy) {
    // baseado em uma das direções, usando o método auxiliar do phaser,
    // podemos selecionar uma delas de forma aleatoria.
    const randomPosition = Phaser.Math.RND.pick(Object.values(direction));
    // inimigo não se move antes de verificar a direção
    enemy.body.setVelocity(0);

    switch (randomPosition) {
      case direction.LEFT:
        enemy.body.setVelocityY(0); // evita mover na diagonal
        enemy.body.setVelocityX(-speed.ENEMY);
        enemy.flipX = true;
        enemy.setFrame(1);
        enemy.direction = direction.LEFT;
        break;
      case direction.RIGHT:
        enemy.body.setVelocityY(0);
        enemy.body.setVelocityX(speed.ENEMY);
        enemy.flipX = false;
        enemy.setFrame(1);
        enemy.direction = direction.RIGHT;
        break;
      case direction.UP:
        enemy.body.setVelocityX(0);
        enemy.body.setVelocityY(-speed.ENEMY);
        enemy.flipY = false;
        enemy.setFrame(0);
        enemy.direction = direction.UP;
        break;
      case direction.DOWN:
        enemy.body.setVelocityX(0);
        enemy.body.setVelocityY(speed.ENEMY);
        enemy.flipY = true;
        enemy.setFrame(0);
        enemy.direction = direction.DOWN;
        break;
      default:
        enemy.body.setVelocity(0); // inimigo não se move
        break;
    }
  }

  enemyInterval () {
    const enemyInterval = this.time.addEvent({
      delay: time.ENEMY_INTERVAL, 
      loop: true, // executa infinitamente
      callback: () => {
        // getChildren retorna todos os inimigos do grupo
        const enemies = this.enemiesGroup.getChildren();

        // para cada inimigo, executamos o metodo para movimenta-lo
        enemies.forEach((enemy) => {
          this.moveEnemy(enemy);

          // 50% de chance de atirar
          const chance = Math.random() <= 0.5;
          if (chance && !this.pauseGame) {
            this.fire(enemy);
          }
        });
      }
    });
  }

  fire (owner) {
    // cria a bala a ser disparada
    const bullet = this.physics.add.sprite(owner.x, owner.y, 'bullet')
      .setAlpha(0);

    // adiciona a propriedade owner para informar a quem essa bala pertence
    bullet.owner = owner.texture.key;

    // adiciona a bala ao grupo de balas
    this.bulletsGroup.add(bullet);

    // dependendo da direção do dono da bala, ela irá sair em uma determinada posição e ângulo
    switch (owner.direction) {
      case direction.LEFT:
        bullet.setPosition(bullet.x, bullet.y + (this.TILE_SIZE / 2))
        bullet.setAlpha(1);
        bullet.setVelocityX(-speed.BULLET);
        bullet.setAngle(-90);
        break;
      case direction.RIGHT:
        bullet.setPosition(bullet.x + this.TILE_SIZE, bullet.y + (this.TILE_SIZE / 2))
        bullet.setAlpha(1);
        bullet.setVelocityX(speed.BULLET);
        bullet.setAngle(90);
        break;
      case direction.UP:
        bullet.setPosition(bullet.x + (this.TILE_SIZE / 2), bullet.y)
        bullet.setAlpha(1);
        bullet.setVelocityY(-speed.BULLET);
        bullet.setFlipY(false);
        break;
      case direction.DOWN:
        bullet.setPosition(bullet.x + (this.TILE_SIZE / 2), bullet.y + this.TILE_SIZE)
        bullet.setAlpha(1);
        bullet.setVelocityY(speed.BULLET);
        bullet.setFlipY(true);
        break;
      default:
        bullet.destroy();
        break;
    }
  }

  bulletCollideBrick (bullet, brick) {
    bullet.destroy();
    brick.destroy();
  }

  bulletOutOfBounds () {
    const bullets = this.bulletsGroup.getChildren();

    bullets.forEach((bullet) => {
      // verificar se a bala ainda esta na tela (caso nao, destrui-la)
      if (!Phaser.Geom.Rectangle.Overlaps(this.physics.world.bounds, bullet.getBounds())) {
        bullet.destroy();
      }
    });
  }

  bulletCollideBlocks (bullet) {
    bullet.destroy();
  }

  bulletCollideEnemyOrPLayer (bullet, target) {
    const { owner } = bullet;
    const { key } = target.texture;

    // verificamos quem é o dono da bala, e quem é o alvo
    if (owner === 'player' && key === 'enemy') {
      bullet.destroy();
      target.destroy();
    } else if (owner === 'enemy' && key === 'player') {
      this.gameOver();
      bullet.destroy();
    }
  }

  gameOver () {
    this.pauseGame = true;
    this.cameras.main.shake(500);

    this.cameras.main.on('camerashakecomplete', (camera, effect) => {
      this.cameras.main.fade(500);
    }, this);

    this.cameras.main.on('camerafadeoutcomplete', (camera, effect) => {
      this.scene.restart();
    }, this);
  }
}
