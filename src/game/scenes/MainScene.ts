import * as Phaser from 'phaser';
import { soundFx } from '../audio/SoundFx';
import { TextureGenerator } from '../utils/TextureGenerator';

export interface GameStateEvent {
  health: number;
  maxHealth: number;
  stardust: number;
  stardustRequired: number;
  score: number;
  level: number;
  isPortalOpen: boolean;
  status: 'playing' | 'paused' | 'gameover' | 'levelcomplete' | 'victory';
}

export class MainScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private keyShift!: Phaser.Input.Keyboard.Key;
  private keyZ!: Phaser.Input.Keyboard.Key;
  private keyX!: Phaser.Input.Keyboard.Key;
  private keyJ!: Phaser.Input.Keyboard.Key;
  private keyK!: Phaser.Input.Keyboard.Key;

  // Groups
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private bouncyLeaves!: Phaser.Physics.Arcade.StaticGroup;
  private movingClouds!: Phaser.Physics.Arcade.Group;
  private stardusts!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private bullets!: Phaser.Physics.Arcade.Group;
  private portal!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private particleEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

  // Gameplay State
  public currentLevel: number = 1;
  public maxLevels: number = 3;
  private health: number = 3;
  private maxHealth: number = 3;
  private score: number = 0;
  private stardustCollected: number = 0;
  private stardustRequired: number = 5;
  private isPortalOpen: boolean = false;
  private isInvulnerable: boolean = false;
  private isDashing: boolean = false;
  private dashCooldown: boolean = false;
  private canDoubleJump: boolean = false;
  private facingRight: boolean = true;
  private lastShotTime: number = 0;

  // External UI callback
  public onStateChange?: (state: GameStateEvent) => void;

  constructor() {
    super({ key: 'MainScene' });
  }

  init(data: { level?: number; score?: number }) {
    this.currentLevel = data.level || 1;
    this.score = data.score || 0;
    this.health = 3;
    this.stardustCollected = 0;
    this.stardustRequired = this.currentLevel === 1 ? 5 : this.currentLevel === 2 ? 7 : 8;
    this.isPortalOpen = false;
    this.isDashing = false;
    this.dashCooldown = false;
  }

  preload() {
    // Load image assets from public directory
    this.load.image('bg_forest', '/assets/game/bg.jpeg');
    this.load.image('fairy_art', '/assets/game/caracter.jpeg');
    this.load.image('btn_play', '/assets/game/PNG/btn/play.png');
    this.load.image('cloud_1', '/assets/game/PNG/clouds/1.png');
    this.load.image('cloud_2', '/assets/game/PNG/clouds/2.png');

    // Load character spritesheet & JSON atlas
    this.load.atlas(
      'fairy_atlas',
      '/assets/game/character/fairy_spritesheet.png',
      '/assets/game/character/fairy_spritesheet.json'
    );
  }

  create() {
    TextureGenerator.generateAll(this);

    // Create character animations from extracted PNG frames
    this.createFairyAnimations();

    // Set level world bounds (wide scrolling platformer level: 3600px width x 800px height)
    const levelWidth = 3600;
    const levelHeight = 700;
    this.physics.world.setBounds(0, 0, levelWidth, levelHeight);

    // 1. Parallax Background
    this.createBackground(levelWidth, levelHeight);

    // 2. Sparkle Particle Emitter for Fairy Trail
    this.particleEmitter = this.add.particles(0, 0, 'sparkle_particle', {
      speed: { min: 20, max: 60 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 500,
      blendMode: 'ADD',
      emitting: false,
    });
    this.particleEmitter.setDepth(15);

    // 3. Physics Groups
    this.platforms = this.physics.add.staticGroup();
    this.bouncyLeaves = this.physics.add.staticGroup();
    this.movingClouds = this.physics.add.group({ allowGravity: false, immovable: true });
    this.stardusts = this.physics.add.group({ allowGravity: false });
    this.enemies = this.physics.add.group();
    this.bullets = this.physics.add.group({ allowGravity: false });

    // 4. Build Level Geography
    this.buildLevel(levelWidth, levelHeight);

    // 5. Create Player (Fairy)
    this.createPlayer();

    // 6. Camera Follow
    this.cameras.main.setBounds(0, 0, levelWidth, levelHeight);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(100, 50);

    // 7. Setup Collisions & Overlaps
    this.setupCollisions();

    // 8. Keyboard Controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.keyShift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
      this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
      this.keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
      this.keyJ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
      this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    }

    // Mouse / Pointer click to shoot
    this.input.on('pointerdown', () => {
      this.shootMagic();
    });

    // Start background music
    soundFx.startMagicalBGM();

    // Initial state notify
    this.notifyState('playing');
  }

  private createBackground(width: number, height: number) {
    // Backdrop tiled image
    const bg = this.add.tileSprite(0, 0, width, height, 'bg_forest');
    bg.setOrigin(0, 0);
    bg.setScrollFactor(0.2);
    bg.setDisplaySize(width, height);
    bg.setAlpha(0.65);

    // Dark magical vignette overlay
    const overlay = this.add.rectangle(0, 0, width, height, 0x070b19, 0.4);
    overlay.setOrigin(0, 0);
    overlay.setScrollFactor(0.2);

    // Ambient floating clouds in sky
    for (let x = 100; x < width; x += 600) {
      const cloudKey = Math.random() > 0.5 ? 'cloud_1' : 'cloud_2';
      if (this.textures.exists(cloudKey)) {
        const cloud = this.add.image(x, 80 + Math.random() * 120, cloudKey);
        cloud.setScrollFactor(0.35);
        cloud.setAlpha(0.45);
        cloud.setScale(0.8 + Math.random() * 0.4);
      }
    }
  }

  private createFairyAnimations() {
    if (!this.anims.exists('fairy_idle')) {
      this.anims.create({
        key: 'fairy_idle',
        frames: [
          { key: 'fairy_atlas', frame: 'idle_1' },
          { key: 'fairy_atlas', frame: 'idle_2' },
          { key: 'fairy_atlas', frame: 'idle_3' },
          { key: 'fairy_atlas', frame: 'idle_4' },
          { key: 'fairy_atlas', frame: 'idle_5' },
          { key: 'fairy_atlas', frame: 'idle_6' },
        ],
        frameRate: 8,
        repeat: -1,
      });
    }

    if (!this.anims.exists('fairy_walk')) {
      this.anims.create({
        key: 'fairy_walk',
        frames: [
          { key: 'fairy_atlas', frame: 'walk_1' },
          { key: 'fairy_atlas', frame: 'walk_2' },
          { key: 'fairy_atlas', frame: 'walk_3' },
          { key: 'fairy_atlas', frame: 'walk_4' },
        ],
        frameRate: 10,
        repeat: -1,
      });
    }

    if (!this.anims.exists('fairy_jump')) {
      this.anims.create({
        key: 'fairy_jump',
        frames: [
          { key: 'fairy_atlas', frame: 'jump_1' },
          { key: 'fairy_atlas', frame: 'jump_2' },
          { key: 'fairy_atlas', frame: 'jump_3' },
          { key: 'fairy_atlas', frame: 'jump_4' },
          { key: 'fairy_atlas', frame: 'jump_5' },
        ],
        frameRate: 10,
        repeat: 0,
      });
    }

    if (!this.anims.exists('fairy_flutter')) {
      this.anims.create({
        key: 'fairy_flutter',
        frames: [
          { key: 'fairy_atlas', frame: 'jump_2' },
          { key: 'fairy_atlas', frame: 'jump_3' },
          { key: 'fairy_atlas', frame: 'jump_4' },
        ],
        frameRate: 12,
        repeat: -1,
      });
    }

    if (!this.anims.exists('fairy_dash')) {
      this.anims.create({
        key: 'fairy_dash',
        frames: [
          { key: 'fairy_atlas', frame: 'dash_1' },
          { key: 'fairy_atlas', frame: 'dash_2' },
          { key: 'fairy_atlas', frame: 'dash_3' },
        ],
        frameRate: 14,
        repeat: -1,
      });
    }

    if (!this.anims.exists('fairy_attack')) {
      this.anims.create({
        key: 'fairy_attack',
        frames: [
          { key: 'fairy_atlas', frame: 'attack_1' },
          { key: 'fairy_atlas', frame: 'attack_2' },
          { key: 'fairy_atlas', frame: 'attack_3' },
          { key: 'fairy_atlas', frame: 'attack_4' },
          { key: 'fairy_atlas', frame: 'attack_5' },
        ],
        frameRate: 14,
        repeat: 0,
      });
    }
  }

  private createPlayer() {
    // Instantiate player sprite from fairy atlas with actual character cuts
    this.player = this.physics.add.sprite(120, 480, 'fairy_atlas', 'idle_1');
    this.player.setScale(0.55);
    this.player.setSize(55, 95);
    this.player.setOffset(52, 60);
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0.05);
    this.player.setGravityY(750);
    this.player.setDepth(20);
    this.player.play('fairy_idle');

    // Add a soft glowing magical fairy aura
    const aura = this.add.ellipse(0, 0, 50, 50, 0x70d6ff, 0.25);
    aura.setDepth(18);
    this.tweens.add({
      targets: aura,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0.1,
      yoyo: true,
      repeat: -1,
      duration: 800,
    });

    // Keep aura attached to player
    this.events.on('postupdate', () => {
      if (this.player && aura) {
        aura.setPosition(this.player.x, this.player.y);
      }
    });
  }

  private buildLevel(width: number, height: number) {
    const groundY = height - 40;

    // 1. Continuous Ground Segments with occasional gaps/pits
    for (let x = 0; x < width; x += 128) {
      // Create pit gaps for excitement in Level 2 & 3
      if (this.currentLevel > 1 && ((x >= 800 && x <= 950) || (x >= 1900 && x <= 2100))) {
        continue;
      }
      const ground = this.platforms.create(x + 64, groundY, 'ground_tile');
      ground.refreshBody();
    }

    // 2. Platforms & Structures based on Level
    if (this.currentLevel === 1) {
      this.buildLevel1Layout(groundY);
    } else if (this.currentLevel === 2) {
      this.buildLevel2Layout(groundY);
    } else {
      this.buildLevel3Layout(groundY);
    }

    // 3. Final Magic Portal at level end
    this.portal = this.physics.add.sprite(width - 180, groundY - 60, 'magic_portal');
    this.portal.body.setAllowGravity(false);
    this.portal.setImmovable(true);
    this.portal.setDepth(10);
    this.portal.setAlpha(0.6); // Dim until opened

    // Floating pulsing tween for portal
    this.tweens.add({
      targets: this.portal,
      scaleX: 1.08,
      scaleY: 1.08,
      y: this.portal.y - 8,
      yoyo: true,
      repeat: -1,
      duration: 1200,
      ease: 'Sine.easeInOut',
    });
  }

  private buildLevel1Layout(groundY: number) {
    // Introductory level: gentle platforms, bouncy leaves, stardust
    const platformCoords = [
      { x: 350, y: groundY - 120, type: 'mushroom_platform' },
      { x: 550, y: groundY - 200, type: 'mushroom_platform' },
      { x: 750, y: groundY - 130, type: 'bouncy_leaf' },
      { x: 1050, y: groundY - 160, type: 'mushroom_platform' },
      { x: 1250, y: groundY - 260, type: 'mushroom_platform' },
      { x: 1550, y: groundY - 140, type: 'bouncy_leaf' },
      { x: 1850, y: groundY - 200, type: 'mushroom_platform' },
      { x: 2150, y: groundY - 150, type: 'mushroom_platform' },
      { x: 2450, y: groundY - 240, type: 'bouncy_leaf' },
      { x: 2800, y: groundY - 180, type: 'mushroom_platform' },
      { x: 3100, y: groundY - 140, type: 'mushroom_platform' },
    ];

    platformCoords.forEach(p => {
      if (p.type === 'bouncy_leaf') {
        const leaf = this.bouncyLeaves.create(p.x, p.y, 'bouncy_leaf');
        leaf.refreshBody();
      } else {
        const plat = this.platforms.create(p.x, p.y, 'mushroom_platform');
        plat.refreshBody();
      }
    });

    // Stardust positions (5 total)
    const stardustCoords = [
      { x: 350, y: groundY - 170 },
      { x: 750, y: groundY - 320 },
      { x: 1250, y: groundY - 310 },
      { x: 2150, y: groundY - 210 },
      { x: 2800, y: groundY - 240 },
    ];
    this.spawnStardusts(stardustCoords);

    // Enemies (Bats & Thorns)
    this.spawnEnemies([
      { x: 600, y: groundY - 20, type: 'thorn' },
      { x: 1100, y: groundY - 280, type: 'bat' },
      { x: 1700, y: groundY - 20, type: 'thorn' },
      { x: 2300, y: groundY - 260, type: 'bat' },
      { x: 2950, y: groundY - 20, type: 'thorn' },
    ]);
  }

  private buildLevel2Layout(groundY: number) {
    // Level 2: Twilight Canopy - Moving clouds and more bats
    const platformCoords = [
      { x: 300, y: groundY - 130, type: 'bouncy_leaf' },
      { x: 550, y: groundY - 240, type: 'mushroom_platform' },
      { x: 880, y: groundY - 180, type: 'moving_cloud' }, // over pit
      { x: 1200, y: groundY - 280, type: 'mushroom_platform' },
      { x: 1450, y: groundY - 160, type: 'bouncy_leaf' },
      { x: 1700, y: groundY - 320, type: 'mushroom_platform' },
      { x: 2000, y: groundY - 200, type: 'moving_cloud' }, // over pit
      { x: 2300, y: groundY - 150, type: 'mushroom_platform' },
      { x: 2600, y: groundY - 280, type: 'bouncy_leaf' },
      { x: 2900, y: groundY - 200, type: 'mushroom_platform' },
      { x: 3200, y: groundY - 160, type: 'mushroom_platform' },
    ];

    platformCoords.forEach(p => {
      if (p.type === 'bouncy_leaf') {
        const leaf = this.bouncyLeaves.create(p.x, p.y, 'bouncy_leaf');
        leaf.refreshBody();
      } else if (p.type === 'moving_cloud') {
        const cloud = this.movingClouds.create(p.x, p.y, 'bouncy_leaf');
        cloud.setVelocityX(60);
        cloud.startX = p.x;
        cloud.distance = 180;
      } else {
        const plat = this.platforms.create(p.x, p.y, 'mushroom_platform');
        plat.refreshBody();
      }
    });

    const stardustCoords = [
      { x: 550, y: groundY - 290 },
      { x: 880, y: groundY - 280 },
      { x: 1450, y: groundY - 350 },
      { x: 1700, y: groundY - 370 },
      { x: 2300, y: groundY - 210 },
      { x: 2600, y: groundY - 450 },
      { x: 3200, y: groundY - 220 },
    ];
    this.spawnStardusts(stardustCoords);

    this.spawnEnemies([
      { x: 450, y: groundY - 20, type: 'thorn' },
      { x: 750, y: groundY - 320, type: 'bat' },
      { x: 1300, y: groundY - 20, type: 'thorn' },
      { x: 1600, y: groundY - 300, type: 'bat' },
      { x: 2200, y: groundY - 20, type: 'thorn' },
      { x: 2500, y: groundY - 320, type: 'bat' },
      { x: 2850, y: groundY - 20, type: 'thorn' },
      { x: 3100, y: groundY - 300, type: 'bat' },
    ]);
  }

  private buildLevel3Layout(groundY: number) {
    // Level 3: Crystal Grove - High agility & enemy density
    const platformCoords = [
      { x: 280, y: groundY - 140, type: 'bouncy_leaf' },
      { x: 500, y: groundY - 280, type: 'mushroom_platform' },
      { x: 720, y: groundY - 380, type: 'bouncy_leaf' },
      { x: 1000, y: groundY - 220, type: 'moving_cloud' },
      { x: 1300, y: groundY - 320, type: 'mushroom_platform' },
      { x: 1550, y: groundY - 180, type: 'bouncy_leaf' },
      { x: 1800, y: groundY - 380, type: 'mushroom_platform' },
      { x: 2100, y: groundY - 220, type: 'moving_cloud' },
      { x: 2400, y: groundY - 340, type: 'bouncy_leaf' },
      { x: 2700, y: groundY - 240, type: 'mushroom_platform' },
      { x: 3000, y: groundY - 360, type: 'bouncy_leaf' },
      { x: 3250, y: groundY - 200, type: 'mushroom_platform' },
    ];

    platformCoords.forEach(p => {
      if (p.type === 'bouncy_leaf') {
        const leaf = this.bouncyLeaves.create(p.x, p.y, 'bouncy_leaf');
        leaf.refreshBody();
      } else if (p.type === 'moving_cloud') {
        const cloud = this.movingClouds.create(p.x, p.y, 'bouncy_leaf');
        cloud.setVelocityX(80);
        cloud.startX = p.x;
        cloud.distance = 220;
      } else {
        const plat = this.platforms.create(p.x, p.y, 'mushroom_platform');
        plat.refreshBody();
      }
    });

    const stardustCoords = [
      { x: 280, y: groundY - 350 },
      { x: 720, y: groundY - 480 },
      { x: 1000, y: groundY - 280 },
      { x: 1300, y: groundY - 380 },
      { x: 1800, y: groundY - 440 },
      { x: 2400, y: groundY - 500 },
      { x: 2700, y: groundY - 300 },
      { x: 3000, y: groundY - 520 },
    ];
    this.spawnStardusts(stardustCoords);

    this.spawnEnemies([
      { x: 400, y: groundY - 20, type: 'thorn' },
      { x: 650, y: groundY - 320, type: 'bat' },
      { x: 950, y: groundY - 20, type: 'thorn' },
      { x: 1200, y: groundY - 340, type: 'bat' },
      { x: 1500, y: groundY - 20, type: 'thorn' },
      { x: 1750, y: groundY - 360, type: 'bat' },
      { x: 2300, y: groundY - 320, type: 'bat' },
      { x: 2600, y: groundY - 20, type: 'thorn' },
      { x: 2900, y: groundY - 350, type: 'bat' },
    ]);
  }

  private spawnStardusts(coords: { x: number; y: number }[]) {
    coords.forEach(c => {
      const star = this.stardusts.create(c.x, c.y, 'stardust_orb');
      star.setDepth(12);
      this.tweens.add({
        targets: star,
        y: c.y - 10,
        scaleX: 1.15,
        scaleY: 1.15,
        yoyo: true,
        repeat: -1,
        duration: 900 + Math.random() * 300,
        ease: 'Sine.easeInOut',
      });
    });
  }

  private spawnEnemies(list: { x: number; y: number; type: 'thorn' | 'bat' }[]) {
    list.forEach(e => {
      if (e.type === 'thorn') {
        const thorn = this.enemies.create(e.x, e.y, 'enemy_thorn');
        thorn.body.setAllowGravity(false);
        thorn.setImmovable(true);
        thorn.enemyType = 'thorn';
      } else {
        const bat = this.enemies.create(e.x, e.y, 'enemy_bat');
        bat.body.setAllowGravity(false);
        bat.setVelocityX(-70);
        bat.baseY = e.y;
        bat.startX = e.x;
        bat.enemyType = 'bat';
      }
    });
  }

  private setupCollisions() {
    // Player on static & moving platforms
    this.physics.add.collider(this.player, this.platforms, () => {
      this.canDoubleJump = true;
    });

    this.physics.add.collider(this.player, this.movingClouds, () => {
      this.canDoubleJump = true;
    });

    // Trampoline bouncy leaves
    this.physics.add.collider(this.player, this.bouncyLeaves, (_player, leaf) => {
      if (this.player.body.touching.down) {
        this.player.setVelocityY(-680);
        this.canDoubleJump = true;
        soundFx.playBounce();

        // Squash & stretch leaf effect
        this.tweens.add({
          targets: leaf,
          scaleY: 0.6,
          scaleX: 1.3,
          yoyo: true,
          duration: 150,
        });
      }
    });

    // Stardust collection
    this.physics.add.overlap(this.player, this.stardusts, (_p, star) => {
      const s = star as Phaser.Physics.Arcade.Sprite;
      s.disableBody(true, true);
      this.stardustCollected++;
      this.score += 100;
      soundFx.playCollect();

      // Emit sparkle burst
      this.particleEmitter.explode(15, s.x, s.y);

      if (this.stardustCollected >= this.stardustRequired && !this.isPortalOpen) {
        this.openPortal();
      }

      this.notifyState('playing');
    });

    // Player vs Enemies
    this.physics.add.overlap(this.player, this.enemies, () => {
      if (!this.isInvulnerable && !this.isDashing) {
        this.takeDamage();
      }
    });

    // Bullets vs Enemies
    this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => {
      const b = bullet as Phaser.Physics.Arcade.Sprite;
      const e = enemy as Phaser.Physics.Arcade.Sprite & { enemyType: string };

      b.destroy();
      soundFx.playEnemyDefeat();
      this.particleEmitter.explode(20, e.x, e.y);
      this.score += 150;

      e.destroy();
      this.notifyState('playing');
    });

    // Bullets vs Platforms (bullets vanish upon wall impact)
    this.physics.add.collider(this.bullets, this.platforms, (bullet) => {
      (bullet as Phaser.Physics.Arcade.Sprite).destroy();
    });

    // Player touches open Portal
    this.physics.add.overlap(this.player, this.portal, () => {
      if (this.isPortalOpen) {
        this.completeLevel();
      }
    });
  }

  private openPortal() {
    this.isPortalOpen = true;
    soundFx.playWin();
    this.portal.setAlpha(1);

    this.tweens.add({
      targets: this.portal,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 300,
      yoyo: true,
    });

    this.particleEmitter.explode(30, this.portal.x, this.portal.y);
    this.notifyState('playing');
  }

  private completeLevel() {
    this.physics.pause();
    soundFx.playWin();

    if (this.currentLevel < this.maxLevels) {
      this.notifyState('levelcomplete');
    } else {
      this.notifyState('victory');
    }
  }

  public nextLevel() {
    this.scene.restart({ level: this.currentLevel + 1, score: this.score + 500 });
  }

  public restartCurrentLevel() {
    this.scene.restart({ level: this.currentLevel, score: this.score });
  }

  private takeDamage() {
    this.health--;
    soundFx.playHit();
    this.cameras.main.shake(200, 0.015);

    if (this.health <= 0) {
      this.health = 0;
      this.notifyState('gameover');
      this.physics.pause();
      return;
    }

    // Invulnerability frames & flashing
    this.isInvulnerable = true;
    this.player.setVelocityY(-250);
    this.player.setVelocityX(this.facingRight ? -180 : 180);

    this.tweens.add({
      targets: this.player,
      alpha: 0.3,
      yoyo: true,
      repeat: 6,
      duration: 100,
      onComplete: () => {
        this.player.setAlpha(1);
        this.isInvulnerable = false;
      },
    });

    this.notifyState('playing');
  }

  // --- Controls & Update Loop ---
  public shootMagic() {
    const now = this.time.now;
    if (now - this.lastShotTime < 240) return; // Fire rate limit
    this.lastShotTime = now;

    if (!this.isDashing) {
      this.player.play('fairy_attack', true);
    }

    const bullet = this.bullets.create(
      this.player.x + (this.facingRight ? 24 : -24),
      this.player.y,
      'magic_bullet'
    );
    if (!bullet) return;

    bullet.setVelocityX(this.facingRight ? 550 : -550);
    bullet.setDepth(16);
    soundFx.playShoot();

    // Auto-destroy bullet after 1.2s
    this.time.delayedCall(1200, () => {
      if (bullet.active) bullet.destroy();
    });
  }

  public dash() {
    if (this.isDashing || this.dashCooldown) return;
    this.isDashing = true;
    this.dashCooldown = true;
    soundFx.playDash();

    this.player.play('fairy_dash', true);

    const dashSpeed = this.facingRight ? 480 : -480;
    this.player.setVelocityX(dashSpeed);
    this.player.setVelocityY(0);

    // Emit glitter trail burst
    this.particleEmitter.explode(12, this.player.x, this.player.y);

    this.time.delayedCall(200, () => {
      this.isDashing = false;
    });

    this.time.delayedCall(600, () => {
      this.dashCooldown = false;
    });
  }

  public jumpOrFlutter() {
    const onGround = this.player.body.blocked.down || this.player.body.touching.down;

    if (onGround) {
      this.player.setVelocityY(-460);
      this.canDoubleJump = true;
      soundFx.playJump();
      this.player.play('fairy_jump', true);
    } else if (this.canDoubleJump && this.player.body.velocity.y > -100) {
      // Double Jump
      this.player.setVelocityY(-400);
      this.canDoubleJump = false;
      soundFx.playJump();
      this.player.play('fairy_jump', true);
      this.particleEmitter.explode(8, this.player.x, this.player.y);
    } else if (this.player.body.velocity.y > 0) {
      // Flutter / Glide mode (slow descent)
      this.player.setVelocityY(Math.min(this.player.body.velocity.y, 65));
      this.player.play('fairy_flutter', true);
      if (Math.random() < 0.25) {
        soundFx.playFlutter();
        this.particleEmitter.emitParticleAt(this.player.x, this.player.y + 10, 1);
      }
    }
  }

  override update() {
    if (!this.player || !this.player.body || this.health <= 0) return;

    // Moving Clouds logic
    (this.movingClouds.getChildren() as (Phaser.Physics.Arcade.Sprite & { startX: number; distance: number })[]).forEach((cloud) => {
      if (!cloud.body) return;
      if (cloud.x >= cloud.startX + cloud.distance) {
        cloud.setVelocityX(-Math.abs(cloud.body.velocity.x));
      } else if (cloud.x <= cloud.startX - cloud.distance) {
        cloud.setVelocityX(Math.abs(cloud.body.velocity.x));
      }
    });

    // Bat sinusoidal flight pattern
    (this.enemies.getChildren() as (Phaser.Physics.Arcade.Sprite & { enemyType: string; baseY: number; startX: number })[]).forEach((enemy) => {
      if (enemy.body && enemy.enemyType === 'bat') {
        enemy.y = enemy.baseY + Math.sin(this.time.now * 0.005 + enemy.startX) * 35;
        // Turn around at boundaries
        if (enemy.x < enemy.startX - 180) enemy.setVelocityX(70);
        if (enemy.x > enemy.startX + 180) enemy.setVelocityX(-70);
      }
    });

    // Pit fall check (death)
    if (this.player.y > this.physics.world.bounds.height - 20) {
      this.takeDamage();
      if (this.health > 0) {
        this.player.setPosition(120, 300);
        this.player.setVelocity(0, 0);
      }
    }

    if (this.isDashing) return;

    // Horizontal Movement
    const isLeft = this.cursors?.left.isDown || this.keyA?.isDown;
    const isRight = this.cursors?.right.isDown || this.keyD?.isDown;
    const isJump = this.cursors?.up.isDown || this.keyW?.isDown || this.keySpace?.isDown;
    const isDash = this.keyShift?.isDown || this.keyZ?.isDown || this.keyK?.isDown;
    const isShoot = this.keyX?.isDown || this.keyJ?.isDown;

    if (isDash) {
      this.dash();
      return;
    }

    if (isShoot) {
      this.shootMagic();
    }

    const moveSpeed = 220;

    if (isLeft) {
      this.player.setVelocityX(-moveSpeed);
      this.player.setFlipX(true);
      this.facingRight = false;
      this.particleEmitter.emitParticleAt(this.player.x + 10, this.player.y + 12, 1);
    } else if (isRight) {
      this.player.setVelocityX(moveSpeed);
      this.player.setFlipX(false);
      this.facingRight = true;
      this.particleEmitter.emitParticleAt(this.player.x - 10, this.player.y + 12, 1);
    } else {
      this.player.setVelocityX(0);
    }

    if (isJump) {
      this.jumpOrFlutter();
    }

    // Animation state update
    const onGround = this.player.body.blocked.down || this.player.body.touching.down;
    const isAttacking = this.player.anims.currentAnim?.key === 'fairy_attack' && this.player.anims.isPlaying;

    if (!isAttacking) {
      if (onGround) {
        if (Math.abs(this.player.body.velocity.x) > 10) {
          this.player.play('fairy_walk', true);
        } else {
          this.player.play('fairy_idle', true);
        }
      } else {
        if (this.player.body.velocity.y < -30) {
          this.player.play('fairy_jump', true);
        } else {
          this.player.play('fairy_flutter', true);
        }
      }
    }
  }

  public notifyState(status: GameStateEvent['status']) {
    if (this.onStateChange) {
      this.onStateChange({
        health: this.health,
        maxHealth: this.maxHealth,
        stardust: this.stardustCollected,
        stardustRequired: this.stardustRequired,
        score: this.score,
        level: this.currentLevel,
        isPortalOpen: this.isPortalOpen,
        status,
      });
    }
  }
}
