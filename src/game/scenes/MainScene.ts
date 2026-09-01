import * as Phaser from 'phaser';
import { soundFx } from '../audio/SoundFx';
import { TextureGenerator } from '../utils/TextureGenerator';
import { DialogSystem } from './DialogSystem';
import type { DialogLine } from './DialogSystem';

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

export type PlatformDef = {
  x: number;
  y: number;
  type: 'giant_mushroom' | 'twisted_branch' | 'fading_crystal' | 'dewdrop_leaf' | 'enchanted_flower';
};

export type EnemyDef = {
  x: number;
  y: number;
  type: 'thorn' | 'bat' | 'arachnid';
  /** jarak patroli dari titik spawn (ala goomba Mario) */
  patrolDistance?: number;
  /** arah awal: 1 = kanan, -1 = kiri (default -1) */
  dir?: 1 | -1;
};

// -------- NARASI: "Nia and the Gilded Cure" --------
export const STORY_INTRO: DialogLine[] = [
  {
    speaker: 'Nia',
    portrait: 'portrait_nia',
    text: 'Berry... bertahanlah. Warnamu... memudar dengan cepat.',
  },
  {
    speaker: 'Berry',
    portrait: 'portrait_berry',
    tint: 0x9a8bc0,
    text: 'Ugh... kegelapan ini... terlalu kuat, Nia. Hanya Jamur Gilded Glimmer... di jantung hutan malam... yang bisa menyelamatkanku.',
  },
  {
    speaker: 'Nia',
    portrait: 'portrait_nia',
    text: 'Aku akan menemukannya, Berry. Aku berjanji! Aku akan membawa Jamur Gilded Glimmer kembali.',
  },
];

export const STORY_BOSS: DialogLine[] = [
  {
    speaker: 'Nia',
    portrait: 'portrait_nia',
    text: 'Luna? Penjaga hutan? Apa yang terjadi padamu?',
  },
  {
    speaker: 'Luna',
    portrait: 'portrait_luna',
    text: 'MEOW-GRRR! Jamur... Milikku! Semuanya milikku! Pergi, Peri Kecil!',
  },
  {
    speaker: 'Nia',
    portrait: 'portrait_nia',
    text: 'Kau sudah memakan terlalu banyak Jamur Gilded Glimmer! Itu meracunimu! Aku harus menghentikanmu untuk menyelamatkanmu... dan Berry!',
  },
];

export const STORY_ENDING: DialogLine[] = [
  {
    speaker: 'Nia',
    portrait: 'portrait_nia',
    text: 'Luna... kau kembali! Jamur beracunnya sudah hilang.',
  },
  {
    speaker: 'Luna',
    portrait: 'portrait_luna',
    text: 'Meow... terima kasih, Peri kecil. Aku... kembali menjadi diriku sendiri.',
  },
  {
    speaker: 'Nia',
    portrait: 'portrait_nia',
    text: 'Berry, ini dia — Jamur Gilded Glimmer. Hutan Ajaib terselamatkan. ✨',
  },
];

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

  // Platform & Prop Groups
  private platforms!: Phaser.Physics.Arcade.StaticGroup; // Mossy Ancient Stone
  private giantMushrooms!: Phaser.Physics.Arcade.StaticGroup; // Bouncing Squash & Stretch Mushrooms
  private oneWayBranches!: Phaser.Physics.Arcade.StaticGroup; // Twisted Branch Pass-Through
  private fadingCrystals!: Phaser.Physics.Arcade.StaticGroup; // Collapsing Quartz Crystals
  private dewdropLeaves!: Phaser.Physics.Arcade.StaticGroup; // Interactive Speed Slide Leaves
  private movingFlowers!: Phaser.Physics.Arcade.Group; // Moving Enchanted Lotus Pads
  private movingClouds!: Phaser.Physics.Arcade.Group; // Moving Clouds
  private sporePods!: Phaser.Physics.Arcade.StaticGroup; // Hazard Spore Pod Clusters

  private stardusts!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private bullets!: Phaser.Physics.Arcade.Group;
  private portal!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

  // Particle Emitters
  private particleEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private sporeEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private fireflyEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

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
  private jumpCount: number = 0;
  private facingRight: boolean = true;
  private lastShotTime: number = 0;

  // External UI callback
  public onStateChange?: (state: GameStateEvent) => void;
  private dialog!: DialogSystem;
  private introDone = false;
  private bossActive = false;
  private bossHealth = 3;
  private bossLuna!: Phaser.Physics.Arcade.Sprite;
  private bossMinions!: Phaser.Physics.Arcade.Group;

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
    this.introDone = false;
    this.bossActive = false;
    this.bossHealth = 3;
  }

  preload() {
    this.load.image('bg_forest', '/assets/game/bg.jpeg');
    this.load.image('fairy_art', '/assets/game/caracter.jpeg');
    this.load.image('btn_play', '/assets/game/PNG/btn/play.png');

    // Load fairy character spritesheet
    this.load.atlas(
      'fairy_atlas',
      '/assets/game/character/fairy_spritesheet.png',
      '/assets/game/character/fairy_spritesheet.json'
    );

    // Load Cave Arachnid monster spritesheet
    this.load.atlas(
      'monster_atlas',
      '/assets/game/monster/monster_spritesheet.png',
      '/assets/game/monster/monster_spritesheet.json'
    );

    // Berry (peri gelap) — Scene 1 cutscene
    this.load.image('berry_fall', '/assets/game/berry/berry_fall.png');
    this.load.image('berry_die', '/assets/game/berry/berry_die.png');

    // Luna (bos kucing jahat) — atlas animasi
    this.load.spritesheet('luna_idle', '/assets/game/luna/luna_idle.png', { frameWidth: 128, frameHeight: 118 });
    this.load.spritesheet('luna_walk', '/assets/game/luna/luna_walk.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('luna_jump', '/assets/game/luna/luna_jump.png', { frameWidth: 128, frameHeight: 121 });
    this.load.spritesheet('luna_die', '/assets/game/luna/luna_die.png', { frameWidth: 128, frameHeight: 121 });
    this.load.spritesheet('luna_attack', '/assets/game/luna/luna_attack.png', { frameWidth: 128, frameHeight: 121 });
  }

  create() {
    TextureGenerator.generateAll(this);

    this.createFairyAnimations();
    this.createMonsterAnimations();

    const screenW = this.scale.width;
    const screenH = this.scale.height;
    const isMobile = screenW < 768;

    const levelWidth = 3600;
    // Set level height dynamically to match or exceed screen height
    const levelHeight = Math.max(700, screenH);
    this.physics.world.setBounds(0, 0, levelWidth, levelHeight);

    // 1. Parallax Background & Ancient Runestone Pillars
    this.createBackground(levelWidth, levelHeight);

    // 2. Particle Emitters
    this.particleEmitter = this.add.particles(0, 0, 'sparkle_particle', {
      speed: { min: 20, max: 60 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 500,
      blendMode: 'ADD',
      emitting: false,
    });
    this.particleEmitter.setDepth(15);

    this.sporeEmitter = this.add.particles(0, 0, 'spore_particle', {
      speed: { min: 30, max: 90 },
      scale: { start: 1.0, end: 0.1 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 800,
      blendMode: 'SCREEN',
      emitting: false,
    });
    this.sporeEmitter.setDepth(14);

    // Ambient floating fireflies
    this.fireflyEmitter = this.add.particles(0, 0, 'sparkle_particle', {
      x: { min: 0, max: levelWidth },
      y: { min: 50, max: levelHeight - 50 },
      speed: { min: 5, max: 15 },
      scale: { start: 0.4, end: 0.1 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 2500,
      frequency: 200,
      blendMode: 'ADD',
    });
    this.fireflyEmitter.setDepth(8);

    // 3. Physics Groups
    this.platforms = this.physics.add.staticGroup();
    this.giantMushrooms = this.physics.add.staticGroup();
    this.oneWayBranches = this.physics.add.staticGroup();
    this.fadingCrystals = this.physics.add.staticGroup();
    this.dewdropLeaves = this.physics.add.staticGroup();
    this.movingFlowers = this.physics.add.group({ allowGravity: false, immovable: true });
    this.movingClouds = this.physics.add.group({ allowGravity: false, immovable: true });
    this.sporePods = this.physics.add.staticGroup();

    this.stardusts = this.physics.add.group({ allowGravity: false });
    this.enemies = this.physics.add.group();
    this.bullets = this.physics.add.group({ allowGravity: false });

    // 4. Build Level Geography
    this.buildLevel(levelWidth, levelHeight);

    // 5. Create Player (Fairy)
    this.createPlayer();

    // 6. Camera Follow with platform raised cleanly above touch navigation buttons
    this.cameras.main.setBounds(0, 0, levelWidth, levelHeight);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(80, 40);

    // Offset camera: mobile ground sudah naik 110px, offset kecil cukup
    const yOffset = isMobile ? -10 : -60;
    this.cameras.main.setFollowOffset(0, yOffset);

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

    this.input.on('pointerdown', () => {
      this.shootMagic();
    });

    // Handle screen resize smoothly
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      const newMobile = gameSize.width < 768;
      const newYOffset = newMobile ? -10 : -60;
      this.cameras.main.setFollowOffset(0, newYOffset);
    });

    soundFx.startMagicalBGM();

    // Sistem dialog narasi
    this.dialog = new DialogSystem(this);
    if (this.currentLevel === 1 && !this.introDone) {
      // Scene 1: The Plea — Berry lemah di depan Nia, game pause saat dialog
      this.physics.pause();

      // Spawn Berry (sprite FALL) di samping Nia — tergeletak lemah
      const groundY = this.physics.world.bounds.height - (this.scale.width < 768 ? 110 : 40);
      const berry = this.add.image(this.player.x + 90, groundY - 45, 'berry_fall');
      berry.setScale(0.28);
      berry.setDepth(9);
      // efek nafas lemah (naik-turun halus)
      this.tweens.add({
        targets: berry,
        y: berry.y - 4,
        yoyo: true,
        repeat: -1,
        duration: 1200,
        ease: 'Sine.easeInOut',
      });

      // aura gelap tipis di sekitar Berry
      const darkAura = this.add.ellipse(berry.x, berry.y - 10, 170, 60, 0x4a0e4e, 0.25);
      darkAura.setDepth(8);
      this.tweens.add({
        targets: darkAura,
        alpha: 0.08,
        yoyo: true,
        repeat: -1,
        duration: 900,
      });

      this.dialog.show(STORY_INTRO, () => {
        this.physics.resume();
        this.introDone = true;
        // Berry menghilang (melanjutkan perjalanan)
        this.tweens.add({
          targets: [berry, darkAura],
          alpha: 0,
          duration: 400,
          onComplete: () => {
            berry.destroy();
            darkAura.destroy();
          },
        });
      });
    }

    this.notifyState('playing');
  }

  private createBackground(width: number, height: number) {
    const bgH = Math.max(height, 1000);
    const bg = this.add.tileSprite(0, 0, width, bgH, 'bg_forest');
    bg.setOrigin(0, 0);
    bg.setScrollFactor(0.2);
    bg.setDisplaySize(width, bgH);
    bg.setAlpha(0.65);

    const overlay = this.add.rectangle(0, 0, width, bgH, 0x070b19, 0.4);
    overlay.setOrigin(0, 0);
    overlay.setScrollFactor(0.2);

    // Ancient Runestone Pillars in the background parallax
    for (let x = 200; x < width; x += 450) {
      const pillar = this.add.image(x, height - 150, 'runestone_pillar');
      pillar.setScrollFactor(0.35);
      pillar.setAlpha(0.7);
      pillar.setScale(0.9);

      // Subtle rune pulsing glow
      this.tweens.add({
        targets: pillar,
        alpha: 0.85,
        yoyo: true,
        repeat: -1,
        duration: 1600 + Math.random() * 800,
        ease: 'Sine.easeInOut',
      });
    }

    // Ambient firefly glow flares (kunang-kunang) — menggantikan cloud
    for (let x = 80; x < width; x += 140 + Math.random() * 120) {
      const flare = this.add.image(x, 90 + Math.random() * 220, 'sparkle_particle');
      flare.setScrollFactor(0.45);
      flare.setAlpha(0.25 + Math.random() * 0.3);
      flare.setScale(1.6 + Math.random() * 1.4);
      this.tweens.add({
        targets: flare,
        alpha: 0.05,
        scale: flare.scale * 1.6,
        y: flare.y - 14 + Math.random() * 10,
        yoyo: true,
        repeat: -1,
        duration: 1400 + Math.random() * 1200,
        ease: 'Sine.easeInOut',
        delay: Math.random() * 500,
      });
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

  private createMonsterAnimations() {
    if (!this.anims.exists('monster_idle')) {
      this.anims.create({
        key: 'monster_idle',
        frames: [{ key: 'monster_atlas', frame: 'monster_idle_1' }],
        frameRate: 1,
        repeat: -1,
      });
    }

    if (!this.anims.exists('monster_walk')) {
      this.anims.create({
        key: 'monster_walk',
        frames: [
          { key: 'monster_atlas', frame: 'monster_walk_1' },
          { key: 'monster_atlas', frame: 'monster_walk_2' },
        ],
        frameRate: 6,
        repeat: -1,
      });
    }

    if (!this.anims.exists('monster_attack')) {
      this.anims.create({
        key: 'monster_attack',
        frames: [
          { key: 'monster_atlas', frame: 'monster_attack_1' },
          { key: 'monster_atlas', frame: 'monster_attack_2' },
        ],
        frameRate: 6,
        repeat: -1,
      });
    }

    if (!this.anims.exists('monster_fall')) {
      this.anims.create({
        key: 'monster_fall',
        frames: [
          { key: 'monster_atlas', frame: 'monster_fall_1' },
          { key: 'monster_atlas', frame: 'monster_fall_2' },
        ],
        frameRate: 8,
        repeat: -1,
      });
    }

    if (!this.anims.exists('monster_die')) {
      this.anims.create({
        key: 'monster_die',
        frames: [
          { key: 'monster_atlas', frame: 'monster_die_1' },
          { key: 'monster_atlas', frame: 'monster_die_2' },
        ],
        frameRate: 5,
        repeat: 0,
      });
    }

    // --- Luna (Bos Kucing Jahat) animations ---
    if (!this.anims.exists('luna_idle_anim')) {
      this.anims.create({
        key: 'luna_idle_anim',
        frames: this.anims.generateFrameNumbers('luna_idle', { start: 0, end: 2 }),
        frameRate: 4,
        repeat: -1,
      });
    }
    if (!this.anims.exists('luna_walk_anim')) {
      this.anims.create({
        key: 'luna_walk_anim',
        frames: this.anims.generateFrameNumbers('luna_walk', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1,
      });
    }
    if (!this.anims.exists('luna_jump_anim')) {
      this.anims.create({
        key: 'luna_jump_anim',
        frames: this.anims.generateFrameNumbers('luna_jump', { start: 0, end: 1 }),
        frameRate: 8,
        repeat: 0,
      });
    }
    if (!this.anims.exists('luna_die_anim')) {
      this.anims.create({
        key: 'luna_die_anim',
        frames: this.anims.generateFrameNumbers('luna_die', { start: 0, end: 0 }),
        frameRate: 4,
        repeat: 0,
      });
    }
    if (!this.anims.exists('luna_attack_anim')) {
      this.anims.create({
        key: 'luna_attack_anim',
        frames: this.anims.generateFrameNumbers('luna_attack', { start: 0, end: 2 }),
        frameRate: 10,
        repeat: 0,
      });
    }
  }

  private createPlayer() {
    const isMobile = this.scale.width < 768;
    const groundY = this.physics.world.bounds.height - (isMobile ? 110 : 40);
    this.player = this.physics.add.sprite(120, groundY - 95, 'fairy_atlas', 'idle_1');
    this.player.setScale(0.55);
    this.player.setSize(55, 95);
    this.player.setOffset(52, 60);
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0.05);
    this.player.setGravityY(750);
    this.player.setDepth(20);
    this.player.play('fairy_idle');

    // Glowing fairy aura
    const aura = this.add.ellipse(0, 0, 50, 50, 0x00F5D4, 0.25);
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

    this.events.on('postupdate', () => {
      if (this.player && aura) {
        aura.setPosition(this.player.x, this.player.y);
      }
    });
  }

  private buildLevel(width: number, height: number) {
    // Mobile: ground naik ~70px agar platform tidak tertutup navigation button
    const isMobile = this.scale.width < 768;
    const groundY = height - (isMobile ? 110 : 40);

    // 1. Mossy Ancient Stone Solid Ground (#3A405A with Gold Runes)
    for (let x = 0; x < width; x += 128) {
      if (this.currentLevel > 1 && ((x >= 800 && x <= 950) || (x >= 1900 && x <= 2100))) {
        continue;
      }
      const ground = this.platforms.create(x + 64, groundY, 'ground_tile');
      ground.refreshBody();
    }

    // 2. Build Level Layout
    if (this.currentLevel === 1) {
      this.buildLevel1Layout(groundY);
    } else if (this.currentLevel === 2) {
      this.buildLevel2Layout(groundY);
    } else {
      this.buildLevel3Layout(groundY);
    }

    // 3. Magic Portal at level end — duduk di atas ground
    this.portal = this.physics.add.sprite(width - 200, groundY - 70, 'magic_portal');
    this.portal.body.setAllowGravity(false);
    this.portal.setImmovable(true);
    this.portal.setDepth(10);
    this.portal.setAlpha(0.9);

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
    // Level 1: Introduction to Glowing Mushrooms, Twisted Branches, Dewdrop Leaves, and Spore Pods
    const platforms: PlatformDef[] = [
      { x: 350, y: groundY - 120, type: 'giant_mushroom' },
      { x: 580, y: groundY - 200, type: 'twisted_branch' },
      { x: 800, y: groundY - 140, type: 'dewdrop_leaf' },
      { x: 1050, y: groundY - 180, type: 'fading_crystal' },
      { x: 1300, y: groundY - 260, type: 'giant_mushroom' },
      { x: 1550, y: groundY - 160, type: 'twisted_branch' },
      { x: 1850, y: groundY - 210, type: 'enchanted_flower' },
      { x: 2150, y: groundY - 150, type: 'dewdrop_leaf' },
      { x: 2450, y: groundY - 240, type: 'giant_mushroom' },
      { x: 2750, y: groundY - 180, type: 'fading_crystal' },
      { x: 3050, y: groundY - 140, type: 'twisted_branch' },
    ];

    this.spawnPlatforms(platforms);

    // Spore Pod Hazards
    this.spawnSporePods([
      { x: 680, y: groundY - 24 },
      { x: 1950, y: groundY - 24 },
    ]);

    // Stardust
    this.spawnStardusts([
      { x: 350, y: groundY - 210 },
      { x: 800, y: groundY - 280 },
      { x: 1300, y: groundY - 360 },
      { x: 2150, y: groundY - 260 },
      { x: 2750, y: groundY - 260 },
    ]);

    // Enemies (Bats, Thorns & Cave Arachnids) — ala Mario: duduk di pijakan
    // Arachnid spawn di atas platform (y = platformTop), patroli kiri-kanan
    this.spawnEnemies([
      { x: 600, y: groundY - 20, type: 'thorn' },
      { x: 850, y: groundY - 140, type: 'arachnid', patrolDistance: 120, dir: 1 },
      { x: 1150, y: groundY - 280, type: 'bat' },
      { x: 1650, y: groundY - 20, type: 'thorn' },
      { x: 1970, y: groundY - 160, type: 'arachnid', patrolDistance: 140, dir: -1 },
      { x: 2350, y: groundY - 260, type: 'bat' },
      { x: 2950, y: groundY - 20, type: 'thorn' },
    ]);
  }

  private buildLevel2Layout(groundY: number) {
    // Level 2: Twilight Canopy - Moving Flower Pads, Collapsing Crystals, and High Agility
    const platforms: PlatformDef[] = [
      { x: 300, y: groundY - 130, type: 'dewdrop_leaf' },
      { x: 550, y: groundY - 240, type: 'giant_mushroom' },
      { x: 880, y: groundY - 180, type: 'enchanted_flower' }, // moving over pit
      { x: 1200, y: groundY - 280, type: 'fading_crystal' },
      { x: 1450, y: groundY - 170, type: 'twisted_branch' },
      { x: 1700, y: groundY - 320, type: 'giant_mushroom' },
      { x: 2000, y: groundY - 200, type: 'enchanted_flower' }, // moving over pit
      { x: 2300, y: groundY - 160, type: 'dewdrop_leaf' },
      { x: 2550, y: groundY - 280, type: 'fading_crystal' },
      { x: 2850, y: groundY - 210, type: 'twisted_branch' },
      { x: 3150, y: groundY - 160, type: 'giant_mushroom' },
    ];

    this.spawnPlatforms(platforms);

    this.spawnSporePods([
      { x: 480, y: groundY - 24 },
      { x: 1350, y: groundY - 24 },
      { x: 2450, y: groundY - 24 },
    ]);

    this.spawnStardusts([
      { x: 550, y: groundY - 330 },
      { x: 880, y: groundY - 280 },
      { x: 1450, y: groundY - 280 },
      { x: 1700, y: groundY - 420 },
      { x: 2300, y: groundY - 270 },
      { x: 2550, y: groundY - 380 },
      { x: 3150, y: groundY - 260 },
    ]);

    this.spawnEnemies([
      { x: 450, y: groundY - 20, type: 'thorn' },
      { x: 700, y: groundY - 240, type: 'bat' },
      // arachnid di atas platform (mushroom 550/240, crystal 1200/280)
      { x: 620, y: groundY - 250, type: 'arachnid', patrolDistance: 100, dir: 1 },
      { x: 1280, y: groundY - 290, type: 'arachnid', patrolDistance: 100, dir: -1 },
      { x: 1550, y: groundY - 180, type: 'bat' },
      { x: 1780, y: groundY - 330, type: 'arachnid', patrolDistance: 120, dir: 1 },
      { x: 2200, y: groundY - 20, type: 'thorn' },
      { x: 2580, y: groundY - 290, type: 'bat' },
      { x: 2930, y: groundY - 220, type: 'arachnid', patrolDistance: 130, dir: -1 },
      { x: 3180, y: groundY - 170, type: 'bat' },
    ]);
  }

  private buildLevel3Layout(groundY: number) {
    // Level 3: Crystal Grove - Full Challenge with All Dynamic Platforms & Hazards
    const platforms: PlatformDef[] = [
      { x: 280, y: groundY - 140, type: 'giant_mushroom' },
      { x: 500, y: groundY - 280, type: 'fading_crystal' },
      { x: 720, y: groundY - 380, type: 'dewdrop_leaf' },
      { x: 1000, y: groundY - 220, type: 'enchanted_flower' },
      { x: 1300, y: groundY - 320, type: 'twisted_branch' },
      { x: 1550, y: groundY - 180, type: 'giant_mushroom' },
      { x: 1800, y: groundY - 380, type: 'fading_crystal' },
      { x: 2100, y: groundY - 220, type: 'enchanted_flower' },
      { x: 2400, y: groundY - 340, type: 'dewdrop_leaf' },
      { x: 2700, y: groundY - 240, type: 'twisted_branch' },
      { x: 3000, y: groundY - 360, type: 'giant_mushroom' },
      { x: 3250, y: groundY - 200, type: 'fading_crystal' },
    ];

    this.spawnPlatforms(platforms);

    this.spawnSporePods([
      { x: 380, y: groundY - 24 },
      { x: 920, y: groundY - 24 },
      { x: 1650, y: groundY - 24 },
      { x: 2500, y: groundY - 24 },
    ]);

    this.spawnStardusts([
      { x: 280, y: groundY - 350 },
      { x: 720, y: groundY - 480 },
      { x: 1000, y: groundY - 300 },
      { x: 1300, y: groundY - 410 },
      { x: 1800, y: groundY - 470 },
      { x: 2400, y: groundY - 460 },
      { x: 2700, y: groundY - 340 },
      { x: 3000, y: groundY - 480 },
    ]);

    this.spawnEnemies([
      { x: 400, y: groundY - 20, type: 'thorn' },
      { x: 650, y: groundY - 320, type: 'bat' },
      { x: 760, y: groundY - 390, type: 'arachnid', patrolDistance: 100, dir: 1 },
      { x: 950, y: groundY - 20, type: 'thorn' },
      { x: 1200, y: groundY - 340, type: 'bat' },
      { x: 1280, y: groundY - 330, type: 'arachnid', patrolDistance: 110, dir: -1 },
      { x: 1500, y: groundY - 20, type: 'thorn' },
      { x: 1580, y: groundY - 190, type: 'bat' },
      { x: 1830, y: groundY - 390, type: 'arachnid', patrolDistance: 120, dir: 1 },
      { x: 2300, y: groundY - 320, type: 'bat' },
      { x: 2600, y: groundY - 20, type: 'thorn' },
      { x: 2730, y: groundY - 250, type: 'arachnid', patrolDistance: 130, dir: -1 },
      { x: 2900, y: groundY - 350, type: 'bat' },
    ]);
  }

  private spawnPlatforms(
    list: { x: number; y: number; type: 'giant_mushroom' | 'twisted_branch' | 'fading_crystal' | 'dewdrop_leaf' | 'enchanted_flower' }[]
  ) {
    list.forEach((p) => {
      if (p.type === 'giant_mushroom') {
        const shroom = this.giantMushrooms.create(p.x, p.y, 'giant_mushroom');
        shroom.setSize(120, 20);
        shroom.setOffset(5, 28);
        shroom.refreshBody();
      } else if (p.type === 'twisted_branch') {
        const branch = this.oneWayBranches.create(p.x, p.y, 'twisted_branch');
        branch.setSize(110, 16);
        branch.setOffset(5, 16);
        branch.refreshBody();
        // One-Way Pass-Through platform physics
        branch.body.checkCollision.down = false;
        branch.body.checkCollision.left = false;
        branch.body.checkCollision.right = false;
      } else if (p.type === 'fading_crystal') {
        const crystal = this.fadingCrystals.create(p.x, p.y, 'fading_crystal');
        crystal.setSize(90, 16);
        crystal.setOffset(5, 20);
        crystal.refreshBody();
        crystal.isTriggered = false;
      } else if (p.type === 'dewdrop_leaf') {
        const leaf = this.dewdropLeaves.create(p.x, p.y, 'dewdrop_leaf');
        leaf.setSize(100, 16);
        leaf.setOffset(5, 20);
        leaf.refreshBody();
      } else if (p.type === 'enchanted_flower') {
        const flower = this.movingFlowers.create(p.x, p.y, 'enchanted_flower');
        flower.setSize(100, 16);
        flower.setOffset(5, 20);
        flower.setVelocityX(70);
        flower.startX = p.x;
        flower.distance = 200;
      }
    });
  }

  private spawnSporePods(coords: { x: number; y: number }[]) {
    coords.forEach((c) => {
      const pod = this.sporePods.create(c.x, c.y, 'spore_pod');
      pod.refreshBody();
      pod.lastSprayTime = 0;
    });
  }

  private spawnStardusts(coords: { x: number; y: number }[]) {
    coords.forEach((c) => {
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

  private spawnEnemies(list: EnemyDef[]) {
    list.forEach((e) => {
      if (e.type === 'thorn') {
        const thorn = this.enemies.create(e.x, e.y, 'enemy_thorn');
        thorn.body.setAllowGravity(false);
        thorn.setImmovable(true);
        thorn.enemyType = 'thorn';
      } else if (e.type === 'bat') {
        const bat = this.enemies.create(e.x, e.y, 'enemy_bat');
        bat.body.setAllowGravity(false);
        bat.setVelocityX(-60);
        bat.baseY = e.y;
        bat.startX = e.x;
        bat.patrolDistance = e.patrolDistance || 160;
        bat.enemyType = 'bat';
      } else if (e.type === 'arachnid') {
        const spider = this.enemies.create(e.x, e.y, 'monster_atlas', 'monster_walk_1');
        spider.setScale(0.65);
        spider.setSize(75, 75);
        spider.setOffset(26, 47);
        spider.setGravityY(750);
        spider.setCollideWorldBounds(true);
        spider.setBounce(0);
        const startDir = e.dir === 1 ? 1 : -1;
        spider.setVelocityX(startDir * 60);
        spider.setFlipX(startDir === 1);
        spider.startX = e.x;
        spider.patrolDistance = e.patrolDistance || 160;
        spider.dir = startDir;
        spider.enemyType = 'arachnid';
        spider.isDying = false;
        spider.play('monster_walk');
      }
    });
  }

  private setupCollisions() {
    // 1. Solid Ground Platforms (#3A405A with Gold Runes)
    this.physics.add.collider(this.player, this.platforms, () => {
      this.jumpCount = 0;
    });

    this.physics.add.collider(this.enemies, this.platforms);

    // 2. Giant Glowing Mushroom (Squash & Stretch Bouncing Platform)
    this.physics.add.collider(this.player, this.giantMushrooms, (_player, shroomObj) => {
      if (this.player.body.touching.down) {
        this.player.setVelocityY(-740);
        this.jumpCount = 0;
        soundFx.playBounce();

        const shroom = shroomObj as Phaser.GameObjects.Sprite;
        this.particleEmitter.explode(15, shroom.x, shroom.y - 10);
        this.tweens.add({
          targets: shroom,
          scaleY: 0.55,
          scaleX: 1.35,
          yoyo: true,
          duration: 140,
        });
      }
    });
    this.physics.add.collider(this.enemies, this.giantMushrooms);

    // 3. Twisted Branch Platform (One-Way Pass-Through)
    this.physics.add.collider(this.player, this.oneWayBranches, () => {
      this.jumpCount = 0;
    });

    // 4. Fading Crystal Shard (Timed Collapsing Platform)
    this.physics.add.collider(this.player, this.fadingCrystals, (_player, crystalObj) => {
      const crystal = crystalObj as Phaser.Physics.Arcade.Sprite & { isTriggered?: boolean };
      this.jumpCount = 0;

      if (!crystal.isTriggered && this.player.body.touching.down) {
        crystal.isTriggered = true;

        // Vibrate and fade out over 1.5s
        this.tweens.add({
          targets: crystal,
          alpha: 0.3,
          x: crystal.x + 3,
          yoyo: true,
          repeat: 8,
          duration: 80,
          onComplete: () => {
            this.particleEmitter.explode(12, crystal.x, crystal.y);
            crystal.disableBody(true, true);

            // Respawn crystal after 2.5s
            this.time.delayedCall(2500, () => {
              crystal.enableBody(true, crystal.x, crystal.y, true, true);
              crystal.setAlpha(0);
              crystal.isTriggered = false;
              this.tweens.add({ targets: crystal, alpha: 1, duration: 400 });
            });
          },
        });
      }
    });

    // 5. Dewdrop Leaf (Interactive Speed Slide / Boost)
    this.physics.add.collider(this.player, this.dewdropLeaves, (_player, leafObj) => {
      if (this.player.body.touching.down) {
        const speed = this.facingRight ? 460 : -460;
        this.player.setVelocityX(speed);
        this.player.setVelocityY(-380);
        this.jumpCount = 0;
        soundFx.playBounce();

        const leaf = leafObj as Phaser.GameObjects.Sprite;
        this.particleEmitter.explode(18, leaf.x, leaf.y - 8);
        this.tweens.add({
          targets: leaf,
          scaleY: 0.7,
          scaleX: 1.25,
          yoyo: true,
          duration: 120,
        });
      }
    });

    // 6. Moving Lotus Pads
    this.physics.add.collider(this.player, this.movingFlowers, () => {
      this.jumpCount = 0;
    });

    // 7. Spore Pod Hazards
    this.physics.add.overlap(this.player, this.sporePods, () => {
      if (!this.isInvulnerable && !this.isDashing) {
        this.takeDamage();
      }
    });

    // 8. Moving Clouds
    this.physics.add.collider(this.player, this.movingClouds, () => {
      this.jumpCount = 0;
    });

    // 9. Stardust Collection
    this.physics.add.overlap(this.player, this.stardusts, (_p, star) => {
      const s = star as Phaser.Physics.Arcade.Sprite;
      s.disableBody(true, true);
      this.stardustCollected++;
      this.score += 100;
      soundFx.playCollect();

      this.particleEmitter.explode(15, s.x, s.y);

      if (this.stardustCollected >= this.stardustRequired && !this.isPortalOpen) {
        if (this.currentLevel === 3 && !this.bossActive) {
          // Jantung Hutan: Luna menghadang portal — kalahkan dulu
          this.spawnBossLuna();
        } else {
          this.openPortal();
        }
      }

      this.notifyState('playing');
    });

    // 10. Player vs Enemies
    this.physics.add.overlap(this.player, this.enemies, (_player, enemy) => {
      const e = enemy as Phaser.Physics.Arcade.Sprite & { isDying?: boolean };
      if (!this.isInvulnerable && !this.isDashing && !e.isDying) {
        this.takeDamage();
      }
    });

    // 11. Bullets vs Enemies
    this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => {
      const b = bullet as Phaser.Physics.Arcade.Sprite;
      const e = enemy as Phaser.Physics.Arcade.Sprite & { enemyType: string; isDying?: boolean };

      if (e.isDying) return;
      b.destroy();

      if (e.enemyType === 'arachnid') {
        e.isDying = true;
        e.setVelocity(0, 0);
        e.play('monster_die');
        soundFx.playEnemyDefeat();
        this.particleEmitter.explode(25, e.x, e.y);
        this.score += 250;
        this.time.delayedCall(400, () => {
          if (e.active) e.destroy();
        });
      } else {
        soundFx.playEnemyDefeat();
        this.particleEmitter.explode(20, e.x, e.y);
        this.score += 150;
        e.destroy();
      }

      this.notifyState('playing');
    });

    // Bullets vs Platforms
    this.physics.add.collider(this.bullets, this.platforms, (bullet) => {
      (bullet as Phaser.Physics.Arcade.Sprite).destroy();
    });

    // Portal Touch
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

  /**
   * Boss Luna (Level 3): kucing raksasa korup di depan portal.
   * 3 hit magic bullet ke jamur di punggungnya → sembuh → dialog akhir → portal.
   */
  private spawnBossLuna() {
    if (this.bossActive || this.currentLevel !== 3) return;
    this.bossActive = true;
    this.bossHealth = 3;

    const groundY = this.physics.world.bounds.height - (this.scale.width < 768 ? 110 : 40);
    const x = this.portal.x - 320;

    this.bossLuna = this.physics.add.sprite(x, groundY - 90, 'luna_idle', 0);
    this.bossLuna.setScale(1.15);
    this.bossLuna.setGravityY(750);
    this.bossLuna.setCollideWorldBounds(true);
    this.bossLuna.setDepth(11);
    this.bossLuna.setVelocityX(-70);
    this.bossLuna.body!.setSize(90, 100);
    this.bossLuna.body!.setOffset(20, 18);
    this.bossLuna.play('luna_idle_anim');

    // minion group
    this.bossMinions = this.physics.add.group({ allowGravity: false });
    this.physics.add.collider(this.bossLuna, this.platforms);
    this.physics.add.collider(this.player, this.bossLuna, () => {
      if (!this.isInvulnerable && !this.isDashing) this.takeDamage();
    });
    this.physics.add.collider(this.player, this.bossMinions, () => {
      if (!this.isInvulnerable && !this.isDashing) this.takeDamage();
    });

    // bullet vs boss: hit ke jamur (3x)
    this.physics.add.overlap(this.bullets, this.bossLuna, (_bullet, _boss) => {
      const b = _bullet as Phaser.Physics.Arcade.Image;
      b.disableBody(true, true);
      this.bossHit();
    });

    // spawn minion berkala
    this.time.addEvent({
      delay: 4000,
      loop: true,
      callback: () => {
        if (!this.bossActive || this.bossLuna.active === false) return;
        const m = this.bossMinions.create(x - 60 + Math.random() * 120, groundY - 30, 'luna_minion');
        if (!m) return;
        m.setDepth(12);
        m.setVelocityX(this.player.x < m.x ? -120 : 120);
      },
    });

    // dialog bos sebelum fight
    this.physics.pause();
    this.dialog.show(STORY_BOSS, () => {
      this.physics.resume();
      // Luna mulai menyerang
      this.bossLuna.setVelocityX(-80);
    });
  }

  private bossHit() {
    if (!this.bossActive) return;
    this.bossHealth--;
    soundFx.playHit();
    this.particleEmitter.explode(18, this.bossLuna.x + 30, this.bossLuna.y - 20);
    this.cameras.main.shake(160, 0.012);

    if (this.bossHealth <= 0) {
      // Sembuh: jamur beracun hilang, Luna kembali normal
      this.bossActive = false;
      this.bossLuna.setVelocityX(0);
      this.bossLuna.play('luna_die_anim', true);
      soundFx.playWin();
      this.particleEmitter.explode(40, this.bossLuna.x, this.bossLuna.y);
      this.tweens.add({
        targets: this.bossLuna,
        alpha: 0.25,
        yoyo: true,
        repeat: 4,
        duration: 120,
        onComplete: () => {
          this.bossLuna.destroy();
          this.bossMinions.clear(true, true);
          // cutscene akhir
          this.physics.pause();
          this.dialog.show(STORY_ENDING, () => {
            this.physics.resume();
            this.openPortal();
          });
        },
      });
    } else {
      // Luna marah: dash ke player
      const dir = this.player.x < this.bossLuna.x ? -1 : 1;
      this.bossLuna.setVelocityX(dir * 160);
      this.bossLuna.play('luna_attack_anim', true);
      // summon 1 minion tambahan
      const groundY = this.physics.world.bounds.height - (this.scale.width < 768 ? 110 : 40);
      const m = this.bossMinions.create(this.bossLuna.x + (dir > 0 ? -50 : 50), groundY - 30, 'luna_minion');
      if (m) m.setVelocityX(-dir * 120);
    }
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
    if (now - this.lastShotTime < 240) return;
    this.lastShotTime = now;

    if (!this.isDashing) {
      this.player.play('fairy_attack', true);
    }

    const bullet = this.bullets.create(
      this.player.x + (this.facingRight ? 28 : -28),
      this.player.y + 6,
      'magic_bullet'
    );
    if (!bullet) return;

    bullet.setVelocityX(this.facingRight ? 550 : -550);
    bullet.setDepth(16);
    soundFx.playShoot();

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
      // reset jump count saat menyentuh tanah → bisa triple jump lagi
      this.jumpCount = 0;
      this.player.setVelocityY(-460);
      this.jumpCount++;
      soundFx.playJump();
      this.player.play('fairy_jump', true);
    } else if (this.jumpCount < 3 && this.player.body.velocity.y > -100) {
      // jump ke-2 & ke-3 (triple jump)
      this.player.setVelocityY(-400);
      this.jumpCount++;
      soundFx.playJump();
      this.player.play('fairy_jump', true);
      this.particleEmitter.explode(8, this.player.x, this.player.y);
    } else if (this.player.body.velocity.y > 0) {
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

    // Moving Lotus Pads & Moving Clouds
    (this.movingFlowers.getChildren() as (Phaser.Physics.Arcade.Sprite & { startX: number; distance: number })[]).forEach((flower) => {
      if (!flower.body) return;
      if (flower.x >= flower.startX + flower.distance) {
        flower.setVelocityX(-Math.abs(flower.body.velocity.x));
      } else if (flower.x <= flower.startX - flower.distance) {
        flower.setVelocityX(Math.abs(flower.body.velocity.x));
      }
    });

    (this.movingClouds.getChildren() as (Phaser.Physics.Arcade.Sprite & { startX: number; distance: number })[]).forEach((cloud) => {
      if (!cloud.body) return;
      if (cloud.x >= cloud.startX + cloud.distance) {
        cloud.setVelocityX(-Math.abs(cloud.body.velocity.x));
      } else if (cloud.x <= cloud.startX - cloud.distance) {
        cloud.setVelocityX(Math.abs(cloud.body.velocity.x));
      }
    });

    // Boss Luna AI (Level 3): patroli dekat portal, dash ke player saat dekat
    if (this.bossActive && this.bossLuna && this.bossLuna.active) {
      const centerX = this.portal.x - 320;
      const dist = Phaser.Math.Distance.Between(this.bossLuna.x, this.bossLuna.y, this.player.x, this.player.y);
      if (dist < 280 && Math.abs(this.bossLuna.y - this.player.y) < 180) {
        // serang: dash ke player
        const dir = this.player.x < this.bossLuna.x ? -1 : 1;
        this.bossLuna.setVelocityX(dir * 150);
        this.bossLuna.setFlipX(dir > 0);
        if (this.bossLuna.anims.currentAnim?.key !== 'luna_attack_anim') {
          this.bossLuna.play('luna_attack_anim', true);
        }
      } else {
        // patroli halang portal
        if (this.bossLuna.x <= centerX - 260) {
          this.bossLuna.setVelocityX(90);
          this.bossLuna.setFlipX(true);
        } else if (this.bossLuna.x >= centerX + 260) {
          this.bossLuna.setVelocityX(-90);
          this.bossLuna.setFlipX(false);
        }
        if (this.bossLuna.body!.velocity.x !== 0) {
          if (this.bossLuna.anims.currentAnim?.key !== 'luna_walk_anim') {
            this.bossLuna.play('luna_walk_anim', true);
          }
        } else if (this.bossLuna.anims.currentAnim?.key !== 'luna_idle_anim') {
          this.bossLuna.play('luna_idle_anim', true);
        }
      }
    }

    // Spore Pod Proximity Trap Trigger
    (this.sporePods.getChildren() as (Phaser.Physics.Arcade.Sprite & { lastSprayTime?: number })[]).forEach((pod) => {
      const dist = Phaser.Math.Distance.Between(pod.x, pod.y, this.player.x, this.player.y);
      const now = this.time.now;
      if (dist < 150 && (!pod.lastSprayTime || now - pod.lastSprayTime > 2000)) {
        pod.lastSprayTime = now;
        this.sporeEmitter.explode(20, pod.x, pod.y - 12);
        this.tweens.add({
          targets: pod,
          scaleY: 1.25,
          scaleX: 0.85,
          yoyo: true,
          duration: 160,
        });
      }
    });

    // Bat & Cave Arachnid AI
    (this.enemies.getChildren() as (Phaser.Physics.Arcade.Sprite & { enemyType: string; baseY?: number; startX: number; patrolDistance?: number; isDying?: boolean; dir?: number })[]).forEach((enemy) => {
      if (!enemy.body || enemy.isDying) return;

      if (enemy.enemyType === 'bat') {
        enemy.y = (enemy.baseY || enemy.y) + Math.sin(this.time.now * 0.005 + enemy.startX) * 35;
        if (enemy.x < enemy.startX - 180) enemy.setVelocityX(70);
        if (enemy.x > enemy.startX + 180) enemy.setVelocityX(-70);
      } else if (enemy.enemyType === 'arachnid') {
        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

        if (dist < 260 && Math.abs(enemy.y - this.player.y) < 120) {
          const dir = this.player.x < enemy.x ? -1 : 1;
          enemy.setVelocityX(dir * 110);
          enemy.setFlipX(dir > 0);
          if (enemy.anims.currentAnim?.key !== 'monster_attack') {
            enemy.play('monster_attack', true);
          }
        } else {
          const patrol = enemy.patrolDistance || 150;
          if (enemy.x <= enemy.startX - patrol) {
            enemy.setVelocityX(60);
            enemy.setFlipX(true);
          } else if (enemy.x >= enemy.startX + patrol) {
            enemy.setVelocityX(-60);
            enemy.setFlipX(false);
          }
          if (enemy.anims.currentAnim?.key !== 'monster_walk') {
            enemy.play('monster_walk', true);
          }
        }
      }
    });

    // Pit fall check
    if (this.player.y > this.physics.world.bounds.height - 20) {
      this.takeDamage();
      if (this.health > 0) {
        this.player.setPosition(120, 300);
        this.player.setVelocity(0, 0);
      }
    }

    if (this.isDashing) return;

    // Movement Controls
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
