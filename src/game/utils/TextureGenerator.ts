import * as Phaser from 'phaser';

/**
 * TextureGenerator creates procedural fallback textures and enhances loaded assets
 * with magical glow effects, particle textures, and smooth animations.
 */
export class TextureGenerator {
  public static generateAll(scene: Phaser.Scene) {
    this.createSparkleParticle(scene);
    this.createMagicBullet(scene);
    this.createStardust(scene);
    this.createPlatforms(scene);
    this.createEnemies(scene);
    this.createPortal(scene);
    this.createFairyFallback(scene);
  }

  private static createSparkleParticle(scene: Phaser.Scene) {
    if (scene.textures.exists('sparkle_particle')) return;
    const canvas = scene.textures.createCanvas('sparkle_particle', 16, 16);
    if (!canvas) return;
    const ctx = canvas.getContext();

    const rad = ctx.createRadialGradient(8, 8, 1, 8, 8, 8);
    rad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    rad.addColorStop(0.4, 'rgba(255, 220, 120, 0.8)');
    rad.addColorStop(1, 'rgba(255, 180, 50, 0)');

    ctx.fillStyle = rad;
    ctx.beginPath();
    ctx.arc(8, 8, 8, 0, Math.PI * 2);
    ctx.fill();

    // 4-point star shine
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(7, 2, 2, 12);
    ctx.fillRect(2, 7, 12, 2);

    canvas.refresh();
  }

  private static createMagicBullet(scene: Phaser.Scene) {
    if (scene.textures.exists('magic_bullet')) return;
    const canvas = scene.textures.createCanvas('magic_bullet', 24, 24);
    if (!canvas) return;
    const ctx = canvas.getContext();

    const rad = ctx.createRadialGradient(12, 12, 2, 12, 12, 12);
    rad.addColorStop(0, '#ffffff');
    rad.addColorStop(0.3, '#70d6ff');
    rad.addColorStop(0.7, '#ff70a6');
    rad.addColorStop(1, 'rgba(255, 112, 166, 0)');

    ctx.fillStyle = rad;
    ctx.beginPath();
    ctx.arc(12, 12, 12, 0, Math.PI * 2);
    ctx.fill();

    canvas.refresh();
  }

  private static createStardust(scene: Phaser.Scene) {
    if (scene.textures.exists('stardust_orb')) return;
    const canvas = scene.textures.createCanvas('stardust_orb', 32, 32);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Outer glow
    const rad = ctx.createRadialGradient(16, 16, 4, 16, 16, 16);
    rad.addColorStop(0, '#ffffff');
    rad.addColorStop(0.3, '#ffe066');
    rad.addColorStop(0.6, '#ffd166');
    rad.addColorStop(1, 'rgba(255, 209, 102, 0)');

    ctx.fillStyle = rad;
    ctx.beginPath();
    ctx.arc(16, 16, 16, 0, Math.PI * 2);
    ctx.fill();

    // Star icon inside
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    const spikes = 5;
    const outerRadius = 8;
    const innerRadius = 4;
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;

    ctx.moveTo(16, 16 - outerRadius);
    for (let i = 0; i < spikes; i++) {
      let x = 16 + Math.cos(rot) * outerRadius;
      let y = 16 + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = 16 + Math.cos(rot) * innerRadius;
      y = 16 + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(16, 16 - outerRadius);
    ctx.closePath();
    ctx.fill();

    canvas.refresh();
  }

  private static createPlatforms(scene: Phaser.Scene) {
    // 1. Mossy Forest Ground
    if (!scene.textures.exists('ground_tile')) {
      const canvas = scene.textures.createCanvas('ground_tile', 128, 64);
      if (canvas) {
        const ctx = canvas.getContext();
        // Base dark earth
        ctx.fillStyle = '#1b262c';
        ctx.fillRect(0, 0, 128, 64);

        // Gradient top soil
        const grad = ctx.createLinearGradient(0, 0, 0, 64);
        grad.addColorStop(0, '#2d4059');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 128, 64);

        // Glowing Moss top layer
        ctx.fillStyle = '#06d6a0';
        ctx.fillRect(0, 0, 128, 8);
        ctx.fillStyle = '#70e000';
        for (let i = 0; i < 128; i += 16) {
          ctx.beginPath();
          ctx.arc(i + 8, 8, 6, 0, Math.PI);
          ctx.fill();
        }

        // Bioluminescent specs
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(20, 24, 4, 4);
        ctx.fillRect(70, 36, 4, 4);
        ctx.fillRect(100, 18, 3, 3);

        canvas.refresh();
      }
    }

    // 2. Bouncy Leaf Platform (Trampoline)
    if (!scene.textures.exists('bouncy_leaf')) {
      const canvas = scene.textures.createCanvas('bouncy_leaf', 96, 32);
      if (canvas) {
        const ctx = canvas.getContext();
        ctx.fillStyle = '#38b000';
        ctx.beginPath();
        ctx.ellipse(48, 16, 46, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#9ef01a';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Leaf vein
        ctx.strokeStyle = '#ccff33';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(8, 16);
        ctx.lineTo(88, 16);
        ctx.stroke();

        canvas.refresh();
      }
    }

    // 3. Glowing Mushroom Platform
    if (!scene.textures.exists('mushroom_platform')) {
      const canvas = scene.textures.createCanvas('mushroom_platform', 110, 36);
      if (canvas) {
        const ctx = canvas.getContext();
        // Mushroom Cap
        const grad = ctx.createLinearGradient(0, 0, 0, 36);
        grad.addColorStop(0, '#f72585');
        grad.addColorStop(1, '#7209b7');
        ctx.fillStyle = grad;

        ctx.beginPath();
        ctx.ellipse(55, 20, 52, 16, 0, Math.PI, 0);
        ctx.fill();

        // Glowing dots
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(35, 14, 5, 0, Math.PI * 2);
        ctx.arc(55, 10, 6, 0, Math.PI * 2);
        ctx.arc(75, 14, 5, 0, Math.PI * 2);
        ctx.fill();

        canvas.refresh();
      }
    }
  }

  private static createEnemies(scene: Phaser.Scene) {
    // 1. Forest Bat
    if (!scene.textures.exists('enemy_bat')) {
      const canvas = scene.textures.createCanvas('enemy_bat', 48, 36);
      if (canvas) {
        const ctx = canvas.getContext();
        // Body
        ctx.fillStyle = '#4a0e4e';
        ctx.beginPath();
        ctx.ellipse(24, 18, 10, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wings
        ctx.fillStyle = '#81007f';
        ctx.beginPath();
        ctx.moveTo(14, 16);
        ctx.lineTo(0, 6);
        ctx.lineTo(6, 24);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(34, 16);
        ctx.lineTo(48, 6);
        ctx.lineTo(42, 24);
        ctx.closePath();
        ctx.fill();

        // Glowing red eyes
        ctx.fillStyle = '#ff0055';
        ctx.fillRect(20, 14, 3, 3);
        ctx.fillRect(26, 14, 3, 3);

        canvas.refresh();
      }
    }

    // 2. Poison Thorn Plant
    if (!scene.textures.exists('enemy_thorn')) {
      const canvas = scene.textures.createCanvas('enemy_thorn', 40, 40);
      if (canvas) {
        const ctx = canvas.getContext();
        ctx.fillStyle = '#590d22';
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(40, 40);
        ctx.lineTo(0, 40);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ff4d6d';
        ctx.beginPath();
        ctx.moveTo(20, 8);
        ctx.lineTo(34, 38);
        ctx.lineTo(6, 38);
        ctx.closePath();
        ctx.fill();

        canvas.refresh();
      }
    }
  }

  private static createPortal(scene: Phaser.Scene) {
    if (scene.textures.exists('magic_portal')) return;
    const canvas = scene.textures.createCanvas('magic_portal', 80, 110);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Portal arch
    const grad = ctx.createRadialGradient(40, 55, 10, 40, 55, 45);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, '#4cc9f0');
    grad.addColorStop(0.8, '#4361ee');
    grad.addColorStop(1, 'rgba(67, 97, 238, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(40, 55, 36, 50, 0, 0, Math.PI * 2);
    ctx.fill();

    // Magic swirl lines
    ctx.strokeStyle = '#f72585';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(40, 55, 26, 38, 0.3, 0, Math.PI * 2);
    ctx.stroke();

    canvas.refresh();
  }

  private static createFairyFallback(scene: Phaser.Scene) {
    if (scene.textures.exists('fairy_sprite')) return;
    const canvas = scene.textures.createCanvas('fairy_sprite', 48, 48);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Wings
    ctx.fillStyle = 'rgba(180, 240, 255, 0.85)';
    ctx.beginPath();
    ctx.ellipse(14, 18, 12, 8, -0.4, 0, Math.PI * 2);
    ctx.ellipse(34, 18, 12, 8, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = '#ffeedb';
    ctx.beginPath();
    ctx.arc(24, 18, 8, 0, Math.PI * 2); // Head
    ctx.fill();

    // Fairy Dress (Leaf green / gold)
    ctx.fillStyle = '#a7c957';
    ctx.beginPath();
    ctx.moveTo(18, 24);
    ctx.lineTo(30, 24);
    ctx.lineTo(34, 38);
    ctx.lineTo(14, 38);
    ctx.closePath();
    ctx.fill();

    // Golden Hair
    ctx.fillStyle = '#f9c74f';
    ctx.beginPath();
    ctx.arc(24, 14, 9, Math.PI, 0);
    ctx.fill();

    // Sparkle halo
    ctx.strokeStyle = '#fff3b0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(24, 8, 6, 0, Math.PI * 2);
    ctx.stroke();

    canvas.refresh();
  }
}
