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
  private border!: Phaser.GameObjects.Rectangle;
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
    const boxW = Math.min(W - 40, 720);
    const boxH = 130;
    const boxX = (W - boxW) / 2;
    // Geser ke bawah layar: hindari overlap HUD (NYAWA/STARDUST) di atas
    const boxY = H - boxH - (this.scene.scale.width < 768 ? 190 : 160);

    this.container = this.scene.add.container(0, 0).setDepth(50);

    // ornamen border emas
    this.border = this.scene.add
      .rectangle(boxX - 4, boxY - 4, boxW + 8, boxH + 8, 0xFEE440, 0.9)
      .setStrokeStyle(2, 0xB5179E, 1);

    this.box = this.scene.add
      .rectangle(boxX, boxY, boxW, boxH, 0x0d0a1a, 0.94)
      .setStrokeStyle(1, 0x00F5D4, 0.5);

    this.portrait = this.scene.add
          .image(boxX + 74, boxY + 68, '')
          .setScale(2.2);

        // frame potret
        const frame = this.scene.add
          .rectangle(boxX + 74, boxY + 68, 84, 84, 0x000000, 0.4)
          .setStrokeStyle(2, 0xFEE440, 0.8);

        this.nameLabel = this.scene.add
          .text(boxX + 130, boxY + 18, '', {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: '#FEE440',
            fontStyle: 'bold',
          })
          .setShadow(2, 2, '#FEE440', 6, false, true);

        this.textLabel = this.scene.add
          .text(boxX + 130, boxY + 50, '', {
            fontFamily: 'monospace',
            fontSize: '15px',
            color: '#EDE7D9',
            wordWrap: { width: boxW - 170 },
            lineSpacing: 4,
          });

        this.nextHint = this.scene.add
          .text(boxX + boxW - 30, boxY + boxH - 20, '▼', {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#00F5D4',
          })
          .setAlpha(0);

    this.container.add([this.border, this.box, frame, this.portrait, this.nameLabel, this.textLabel, this.nextHint]);
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
    this.nextHint.setAlpha(0);

    if (this.typeEvent) this.typeEvent.remove();
    const scene = this.scene;
    this.typeEvent = scene.time.addEvent({
      delay: 22,
      repeat: this.fullText.length - 1,
      callback: () => {
        this.typedLength++;
        this.textLabel.setText(this.fullText.slice(0, this.typedLength));
        if (this.typedLength >= this.fullText.length) {
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