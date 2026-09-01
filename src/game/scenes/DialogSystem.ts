import * as Phaser from 'phaser';

export interface DialogLine {
  speaker: string;
  text: string;
  /** texture key potret */
  portrait: string;
  /** tint potret (misal Berry gelap) */
  tint?: number;
}

/**
 * DialogSystem — kotak dialog responsif, bottom-anchored.
 * - Box selalu di dalam viewport (layout ulang saat canvas resize)
 * - Tinggi box otomatis mengikuti panjang teks (teks tak pernah keluar)
 * - Typewriter + lanjut via tap/klik/Space/Enter
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
    this.container = this.scene.add.container(0, 0).setDepth(50);

    this.box = this.scene.add.rectangle(0, 0, 10, 10, 0x0d0a1a, 0.96);
    this.portrait = this.scene.add.image(0, 0, '').setScale(1.6);
    const frame = this.scene.add
      .rectangle(0, 0, 64, 64, 0x000000, 0.85)
      .setStrokeStyle(2, 0xFEE440, 0.9);
    this.nameLabel = this.scene.add.text(0, 0, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#FEE440',
      fontStyle: 'bold',
    });
    this.textLabel = this.scene.add.text(0, 0, '', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#F0EBDC',
      wordWrap: { width: 300 },
      lineSpacing: 5,
    });
    this.nextHint = this.scene.add
      .text(0, 0, 'TAP ▼', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#00F5D4',
        fontStyle: 'bold',
      })
      .setAlpha(0);

    // blinker hint
    this.scene.tweens.add({
      targets: this.nextHint,
      alpha: { from: 0.3, to: 1 },
      yoyo: true,
      repeat: -1,
      duration: 500,
    });

    this.container.add([this.box, frame, this.portrait, this.nameLabel, this.textLabel, this.nextHint]);
    this.container.setVisible(false);

    // Layout ulang saat canvas resize (Scale.RESIZE mode)
    this.scene.scale.on('resize', () => this.layout(), this);
    this.layout();
  }

  /** Posisi & ukuran semua elemen — dipanggil saat create & resize */
  private layout() {
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;
    const isMobile = W < 768;

    const boxW = Math.min(W - 20, 620);
    const navH = isMobile ? 150 : 70;
    const portrait = 64;
    const padX = portrait + 26; // margin kiri utk teks
    const textW = boxW - padX - 24;

    // Tinggi box dinamis: muat teks penuh + nama
    this.textLabel.setWordWrapWidth(Math.max(textW, 120), true);
    const textH = this.textLabel.height || 40;
    const boxH = Math.max(96, textH + 58);

    const boxX = (W - boxW) / 2;
    const boxY = H - navH - boxH - 8; // 8px dari atas kontrol

    // Box
    this.box.setPosition(boxX + boxW / 2, boxY + boxH / 2);
    this.box.setSize(boxW, boxH);
    this.box.setStrokeStyle(2, 0xFEE440, 1);

    // Potret kiri (vertikal center)
    this.portrait.setPosition(boxX + portrait / 2 + 12, boxY + boxH / 2);
    (this.container.list[1] as Phaser.GameObjects.Rectangle).setPosition(
      boxX + portrait / 2 + 12,
      boxY + boxH / 2
    );
    (this.container.list[1] as Phaser.GameObjects.Rectangle).setSize(portrait, portrait);

    // Nama + teks
    this.nameLabel.setPosition(boxX + padX, boxY + 12);
    this.textLabel.setPosition(boxX + padX, boxY + 36);

    // Hint kanan bawah
    this.nextHint.setPosition(boxX + boxW - 62, boxY + boxH - 18);
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

    // text pertama tanpa teks (biar height dihitung dari isi baris)
    this.fullText = line.text;
    this.typedLength = 0;
    this.textLabel.setText('');
    this.nextHint.setVisible(false);

    // layout ulang utk teks penuh baris ini (posisi box pas dgn tinggi teks)
    this.textLabel.setText(this.fullText);
    this.layout();
    this.textLabel.setText('');

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