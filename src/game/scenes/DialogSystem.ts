import * as Phaser from 'phaser';

export interface DialogLine {
  speaker: string;
  text: string;
  /** texture key potret */
  portrait: string;
  /** tint potret (misal Berry gelap) */
  tint?: number;
  /** suara blip karakter */
}

/**
 * DialogSystem — kotak dialog pixel art di atas layar.
 * Typewriter, next via klik/tap/space, potret speaker.
 */
export class DialogSystem {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private box!: Phaser.GameObjects.Rectangle;
  private nameLabel!: Phaser.GameObjects.Text;
  private textLabel!: Phaser.GameObjects.Text;
  private portrait!: Phaser.GameObjects.Image;
  private nextHint!: Phaser.GameObjects.Text;

  private active = false;
  private lines: DialogLine[] = [];
  private lineIndex = 0;
  private fullText = '';
  private typedLength = 0;
  private typeEvent?: Phaser.Time.TimerEvent;
  private onComplete?: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.build();
  }

  private build() {
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;
    // Compact: 88% lebar layar (max 620), tinggi 100 — tak menutupi karakter
    const boxW = Math.min(W * 0.88, 620);
    const boxH = 100;
    const boxX = (W - boxW) / 2;
    // Bottom-anchored: tepat di atas kontrol mobile (~150px) / HUD desktop (~80px)
    const isMobile = W < 768;
    const navH = isMobile ? 155 : 80;
    const boxY = H - boxH - navH;

    this.container = this.scene.add.container(0, 0).setDepth(50);

    // Background box — solid gelap, border emas rapi (1 lapis)
    this.box = this.scene.add
      .rectangle(boxX, boxY, boxW, boxH, 0x0d0a1a, 0.96)
      .setStrokeStyle(2, 0xFEE440, 1);

    // Potret: frame kotak hitam + border emas tipis
    const portraitX = boxX + 54;
    const portraitY = boxY + boxH / 2;
    const frame = this.scene.add
      .rectangle(portraitX, portraitY, 66, 66, 0x000000, 0.85)
      .setStrokeStyle(2, 0xFEE440, 0.9);
    this.portrait = this.scene.add.image(portraitX, portraitY, '').setScale(1.65);

    // Nama speaker (di atas teks, kiri)
    this.nameLabel = this.scene.add
      .text(boxX + 100, boxY + 14, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#FEE440',
        fontStyle: 'bold',
      });

    // Teks percakapan
    this.textLabel = this.scene.add
      .text(boxX + 100, boxY + 40, '', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#F0EBDC',
        wordWrap: { width: boxW - 130 },
        lineSpacing: 5,
      });

    // Hint lanjut — pojok kanan bawah, berkedip
    this.nextHint = this.scene.add
      .text(boxX + boxW - 66, boxY + boxH - 18, 'TAP ▼', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#00F5D4',
        fontStyle: 'bold',
      })
      .setAlpha(0);

    // blinker utk hint
    this.scene.tweens.add({
      targets: this.nextHint,
      alpha: { from: 0.3, to: 1 },
      yoyo: true,
      repeat: -1,
      duration: 500,
    });

    this.container.add([this.box, frame, this.portrait, this.nameLabel, this.textLabel, this.nextHint]);
    // Semua elemen dialog ikut layar (bukan world) — scrollFactor 0 di tiap child
    this.container.setScrollFactor(0);
    this.box.setScrollFactor(0);
    frame.setScrollFactor(0);
    this.portrait.setScrollFactor(0);
    this.nameLabel.setScrollFactor(0);
    this.textLabel.setScrollFactor(0);
    this.nextHint.setScrollFactor(0);
    this.container.setVisible(false);
  }

  get isActive(): boolean {
    return this.active;
  }

  show(lines: DialogLine[], onDone?: () => void) {
    this.lines = lines;
    this.lineIndex = 0;
    this.onComplete = onDone;
    this.active = true;
    this.container.setVisible(true);
    this.renderLine();

    const scene = this.scene;
    scene.input.on('pointerdown', this.advance, this);
    if (scene.input.keyboard) {
      scene.input.keyboard.on('keydown-SPACE', this.advance, this);
      scene.input.keyboard.on('keydown-ENTER', this.advance, this);
    }
  }

  private renderLine() {
    const line = this.lines[this.lineIndex];
    this.nameLabel.setText(line.speaker.toUpperCase());
    this.portrait.setTexture(line.portrait);
    this.portrait.clearTint();
    if (line.tint !== undefined) this.portrait.setTint(line.tint);
    if (line.tint === undefined) this.portrait.setAlpha(1);

    this.fullText = line.text;
    this.typedLength = 0;
    this.textLabel.setText('');
    this.nextHint.setVisible(false);

    if (this.typeEvent) this.typeEvent.remove();
    const scene = this.scene;
    this.typeEvent = scene.time.addEvent({
      delay: 22,
      repeat: this.fullText.length - 1,
      callback: () => {
        this.typedLength++;
        this.textLabel.setText(this.fullText.slice(0, this.typedLength));
        if (this.typedLength >= this.fullText.length) {
          this.nextHint.setVisible(true);
          this.nextHint.setAlpha(1);
        }
      },
    });
  }

  private advance() {
    if (!this.active) return;
    // masih ngetik → langsung tampilkan penuh
    if (this.typedLength < this.fullText.length) {
      if (this.typeEvent) this.typeEvent.remove();
      this.typedLength = this.fullText.length;
      this.textLabel.setText(this.fullText);
      this.nextHint.setVisible(true);
      this.nextHint.setAlpha(1);
      return;
    }

    this.lineIndex++;
    if (this.lineIndex < this.lines.length) {
      this.renderLine();
    } else {
      this.finish();
    }
  }

  private finish() {
    this.active = false;
    this.container.setVisible(false);
    this.nextHint.setVisible(false);
    this.scene.input.off('pointerdown', this.advance, this);
    if (this.scene.input.keyboard) {
      this.scene.input.keyboard.off('keydown-SPACE', this.advance, this);
      this.scene.input.keyboard.off('keydown-ENTER', this.advance, this);
    }
    const cb = this.onComplete;
    this.onComplete = undefined;
    if (cb) cb();
  }
}