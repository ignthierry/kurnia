import Phaser from 'phaser';
import { LEVELS } from './PreloadScene';

interface LevelConfig {
  playerSpawn: { x: number; y: number };
  portal: { x: number; y: number };
  orbs: { x: number; y: number }[];
  bats: { x: number; y: number }[];
  thornPlants: { x: number; y: number }[];
}

const GRAVITY = 900;
const JUMP_VEL = -430;
const DOUBLE_JUMP_VEL = -360;
const MOVE_SPEED = 210;
const DASH_SPEED = 480;

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private orbs!: Phaser.Physics.Arcade.StaticGroup;
  private bats!: Phaser.Physics.Arcade.Group;
  private thornPlants!: Phaser.Physics.Arcade.StaticGroup;
  private portal!: Phaser.Physics.Arcade.Sprite;
  private orbCount = 0;
  private orbTotal = 0;
  private orbText!: Phaser.GameObjects.Text;
  private lives = 3;
  private livesText!: Phaser.GameObjects.Text;
  private winText!: Phaser.GameObjects.Text;
  private sparkles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private isDead = false;
  private dashKey!: Phaser.Input.Keyboard.Key;
  private lastDashTime = 0;
  private wasOnGround = true;

  constructor() {
    super('GameScene');
  }

  create(): void {
    const cfg = (this.registry.get('levelConfigs') as LevelConfig[])[0];
    this.physics.world.setBounds(0, 0, 640, 600);
    this.physics.world.gravity.y = GRAVITY;
    this.isDead = false;
    this.orbCount = 0;
    this.lives = 3;

    // ---------- background (pixel art forest) ----------
    this.cameras.main.setBackgroundColor('#0d1b2a');
    const bg = this.add.image(320, 300, 'forestBg');
    bg.setDepth(-10);
    bg.setAlpha(0.6);
    bg.setScale(0.95);

    // ---------- platform (dari LEVELS) ----------
    this.platforms = this.physics.add.staticGroup();
    const tiles = LEVELS[0];
    const cols = 30;
    const tileW = 32;
    const tileH = 32;
    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i];
      if (t === 1) {
        const x = (i % cols) * tileW + tileW / 2;
        const y = Math.floor(i / cols) * tileH + tileH / 2;
        const plat = this.platforms.create(x, y, 'leafPlat');
        plat.setScale(0.5);
        plat.refreshBody();
      } else if (t === 2) {
        const x = (i % cols) * tileW + tileW / 2;
        const y = Math.floor(i / cols) * tileH + tileH / 2;
        const plat = this.platforms.create(x, y, 'woodPlat');
        plat.setScale(0.5);
        plat.refreshBody();
      }
    }

    // ---------- player ----------
    this.player = this.physics.add.sprite(cfg.playerSpawn.x, cfg.playerSpawn.y, 'fairy');
    this.player.setCollideWorldBounds(true);
    this.player.setScale(0.55);
    this.player.body?.setSize(50, 60, true);
    this.player.setDepth(10);

    // ---------- orb ----------
    this.orbTotal = cfg.orbs.length;
    this.orbs = this.physics.add.staticGroup();
    for (const o of cfg.orbs) {
      const orb = this.orbs.create(o.x, o.y, 'coins');
      orb.setScale(0.35);
      this.tweens.add({
        targets: orb,
        y: orb.y - 8,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // ---------- musuh: kelelawar ----------
    this.bats = this.physics.add.group();
    for (const b of cfg.bats) {
      const bat = this.bats.create(b.x, b.y, 'bat') as Phaser.Physics.Arcade.Sprite;
      bat.setVelocityX(60);
      bat.setScale(1.4);
      bat.body?.setSize(20, 12, true);
    }

    // ---------- tanaman berduri (statis, menyakiti) ----------
    this.thornPlants = this.physics.add.staticGroup();
    for (const p of cfg.thornPlants) {
      const plant = this.thornPlants.create(p.x, p.y, 'thornPlant');
      plant.setScale(1.2);
      plant.refreshBody();
    }

    // ---------- portal ----------
    this.portal = this.physics.add.sprite(cfg.portal.x, cfg.portal.y, 'portal');
    this.portal.setScale(1);
    this.portal.body?.setSize(30, 60, true);
    this.portal.setDepth(5);
    this.tweens.add({
      targets: this.portal,
      alpha: 0.55,
      duration: 900,
      yoyo: true,
      repeat: -1,
    });

    // ---------- colliders ----------
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.bats, this.platforms);
    this.physics.add.overlap(
      this.player,
      this.orbs,
      this.collectOrb as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.bats,
      this.hitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.thornPlants,
      this.hitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.portal,
      this.winLevel as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // ---------- sparkle trail ----------
    this.sparkles = this.add.particles(0, 0, 'sparkle', {
      x: 0,
      y: 0,
      lifespan: 400,
      speedX: { min: -30, max: 30 },
      speedY: { min: -40, max: 10 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      quantity: 1,
      frequency: 60,
      follow: this.player,
      blendMode: 'ADD',
    });
    this.sparkles.start();

    // ---------- UI ----------
    this.cameras.main.setBounds(0, 0, 640, 600);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(120, 100);

    this.orbText = this.add
      .text(16, 12, `Stardust: 0/${this.orbTotal}`, {
        fontSize: '16px',
        color: '#ffe082',
        fontFamily: 'monospace',
      })
      .setScrollFactor(0)
      .setDepth(100);
    this.livesText = this.add
      .text(560, 12, `Lives: ${this.lives}`, {
        fontSize: '16px',
        color: '#ff8a80',
        fontFamily: 'monospace',
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.winText = this.add
      .text(320, 280, '', {
        fontSize: '26px',
        color: '#b388ff',
        fontFamily: 'serif',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(200);

    // ---------- input ----------
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.dashKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
  }

  update(_t: number, _delta: number): void {
    if (this.isDead) return;
    const p = this.player;

    // horizontal
    if (this.cursors.left.isDown) {
      p.setVelocityX(-MOVE_SPEED);
      p.setFlipX(true);
      p.anims.play('fairy-walk', true);
    } else if (this.cursors.right.isDown) {
      p.setVelocityX(MOVE_SPEED);
      p.setFlipX(false);
      p.anims.play('fairy-walk', true);
    } else {
      p.setVelocityX(0);
      p.anims.stop();
      p.setTexture('fairy');
    }

    // animasi flutter (sayap) - scale kecil di atas skala dasar 0.55
    p.setScale(
      0.55 * (1 + Math.sin(this.time.now * 0.02) * 0.03),
      0.55 * (1 - Math.sin(this.time.now * 0.02) * 0.03)
    );
    if (
      Phaser.Input.Keyboard.JustDown(this.dashKey) &&
      this.time.now - this.lastDashTime > 600
    ) {
      const dir = p.flipX ? -1 : 1;
      p.setVelocityX(DASH_SPEED * dir);
      this.lastDashTime = this.time.now;
      this.sparkles.explode(8, p.x, p.y);
    }

    // jump / double jump
    const onGround = p.body?.blocked.down ?? false;
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      if (onGround) {
        p.setVelocityY(JUMP_VEL);
        this.wasOnGround = true;
      } else if (this.wasOnGround) {
        p.setVelocityY(DOUBLE_JUMP_VEL);
        this.wasOnGround = false;
        this.sparkles.explode(10, p.x, p.y + 10);
      }
    }
    if (onGround) this.wasOnGround = true;
    if (!onGround && this.wasOnGround && p.body!.velocity.y > 0) {
      // sudah airborne setelah initial jump, izinkan double jump sekali
    }

    // kematian jatuh ke bawah
    if (p.y > 640) {
      this.die();
    }
  }

  private collectOrb(
    _player: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    orb: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ): void {
    const o = orb as Phaser.Physics.Arcade.Sprite;
    o.disableBody(true, true);
    this.orbCount++;
    this.orbText.setText(`Stardust: ${this.orbCount}/${this.orbTotal}`);
    this.sparkles.explode(12, o.x, o.y);
  }

  private hitEnemy(
    _player: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    _enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ): void {
    if (this.isDead) return;
    // kalau player di atas musuh, musuh mati (stomp) - sederhana: selalu kena
    this.die();
  }

  private die(): void {
    if (this.isDead) return;
    this.isDead = true;
    this.lives--;
    this.livesText.setText(`Lives: ${this.lives}`);
    this.cameras.main.shake(200, 0.008);
    this.sparkles.explode(20, this.player.x, this.player.y);

    if (this.lives <= 0) {
      this.winText.setText('Game Over\nTekan R utk mulai ulang');
      this.input.keyboard!.once('keydown-R', () => this.scene.restart());
      return;
    }
    this.winText.setText('Hilang 1 nyawa, melanjutkan...');
    this.time.delayedCall(900, () => {
      this.winText.setText('');
      this.player.setPosition(60, 540);
      this.player.setVelocity(0, 0);
      this.isDead = false;
    });
  }

  private winLevel(
    _player: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    _portal: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ): void {
    if (this.isDead) return;
    this.isDead = true;
    this.winText.setText('✨ Semua Stardust terkumpul!\nHutan Ajaib terselamatkan ✨\nTekan R utk main lagi');
    this.input.keyboard!.once('keydown-R', () => this.scene.restart());
  }
}