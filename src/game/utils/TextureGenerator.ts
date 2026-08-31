import * as Phaser from 'phaser';

/**
 * TextureGenerator creates rich procedural platforms, magical hazards,
 * interactive props, particles, and environmental decorations.
 */
export class TextureGenerator {
  public static generateAll(scene: Phaser.Scene) {
    this.createSparkleParticle(scene);
    this.createSporeParticle(scene);
    this.createMagicBullet(scene);
    this.createStardust(scene);
    this.createPlatforms(scene);
    this.createPropsAndHazards(scene);
    this.createPortal(scene);
  }

  private static createSparkleParticle(scene: Phaser.Scene) {
    if (scene.textures.exists('sparkle_particle')) return;
    const canvas = scene.textures.createCanvas('sparkle_particle', 16, 16);
    if (!canvas) return;
    const ctx = canvas.getContext();

    const rad = ctx.createRadialGradient(8, 8, 1, 8, 8, 8);
    rad.addColorStop(0, '#ffffff');
    rad.addColorStop(0.4, 'rgba(0, 245, 212, 0.9)'); // Cyan Sihir #00F5D4
    rad.addColorStop(0.8, 'rgba(181, 23, 158, 0.5)'); // Ungu Magenta #B5179E
    rad.addColorStop(1, 'rgba(0, 0, 0, 0)');

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

  private static createSporeParticle(scene: Phaser.Scene) {
    if (scene.textures.exists('spore_particle')) return;
    const canvas = scene.textures.createCanvas('spore_particle', 16, 16);
    if (!canvas) return;
    const ctx = canvas.getContext();

    const rad = ctx.createRadialGradient(8, 8, 1, 8, 8, 8);
    rad.addColorStop(0, '#ffffff');
    rad.addColorStop(0.4, 'rgba(163, 230, 53, 0.85)'); // Toxic lime green
    rad.addColorStop(0.8, 'rgba(181, 23, 158, 0.4)'); // Purple spore smoke
    rad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = rad;
    ctx.beginPath();
    ctx.arc(8, 8, 8, 0, Math.PI * 2);
    ctx.fill();

    canvas.refresh();
  }

  private static createMagicBullet(scene: Phaser.Scene) {
    if (scene.textures.exists('magic_bullet')) return;
    const canvas = scene.textures.createCanvas('magic_bullet', 24, 24);
    if (!canvas) return;
    const ctx = canvas.getContext();

    const rad = ctx.createRadialGradient(12, 12, 2, 12, 12, 12);
    rad.addColorStop(0, '#ffffff');
    rad.addColorStop(0.3, '#00F5D4'); // Cyan Sihir
    rad.addColorStop(0.7, '#B5179E'); // Magenta
    rad.addColorStop(1, 'rgba(181, 23, 158, 0)');

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
    rad.addColorStop(0.3, '#FEE440'); // Kuning Amber
    rad.addColorStop(0.6, '#ffd166');
    rad.addColorStop(1, 'rgba(254, 228, 64, 0)');

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
    // 1. Mossy Ancient Stone (Solid Ground & Platforms)
    if (!scene.textures.exists('ground_tile')) {
      const canvas = scene.textures.createCanvas('ground_tile', 128, 64);
      if (canvas) {
        const ctx = canvas.getContext();
        // Base dark wet earth #2D1E18 & slate rock #3A405A
        const grad = ctx.createLinearGradient(0, 0, 0, 64);
        grad.addColorStop(0, '#3A405A'); // Slate stone
        grad.addColorStop(0.3, '#2A2D34');
        grad.addColorStop(1, '#2D1E18'); // Cokelat Tanah Basah
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 128, 64);

        // Stone brick cracks / granite texture
        ctx.strokeStyle = '#1d1f27';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 32);
        ctx.lineTo(128, 32);
        ctx.moveTo(42, 0);
        ctx.lineTo(42, 32);
        ctx.moveTo(86, 32);
        ctx.lineTo(86, 64);
        ctx.stroke();

        // Thick emerald moss top layer #1B4332 & #06d6a0
        ctx.fillStyle = '#1B4332';
        ctx.fillRect(0, 0, 128, 10);
        ctx.fillStyle = '#06d6a0';
        for (let i = 0; i < 128; i += 16) {
          ctx.beginPath();
          ctx.arc(i + 8, 10, 6, 0, Math.PI);
          ctx.fill();
        }

        // Golden Glowing Magical Rune Engravings (#FEE440)
        ctx.strokeStyle = '#FEE440';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#FEE440';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        // Rune 1
        ctx.moveTo(18, 18);
        ctx.lineTo(26, 26);
        ctx.lineTo(34, 18);
        ctx.moveTo(26, 18);
        ctx.lineTo(26, 28);
        // Rune 2
        ctx.moveTo(60, 48);
        ctx.lineTo(70, 40);
        ctx.lineTo(80, 48);
        ctx.moveTo(70, 40);
        ctx.lineTo(70, 56);
        // Rune 3
        ctx.moveTo(102, 18);
        ctx.arc(108, 22, 6, 0, Math.PI * 1.5);
        ctx.stroke();

        // Reset shadow
        ctx.shadowBlur = 0;

        canvas.refresh();
      }
    }

    // 2. Giant Glowing Mushroom (Bouncing Platform - Squash & Stretch)
    if (!scene.textures.exists('giant_mushroom')) {
      const canvas = scene.textures.createCanvas('giant_mushroom', 130, 48);
      if (canvas) {
        const ctx = canvas.getContext();

        // Mushroom Cap: Gradient Neon Magenta (#B5179E) to Deep Purple (#4A0E4E)
        const grad = ctx.createLinearGradient(0, 0, 0, 48);
        grad.addColorStop(0, '#B5179E');
        grad.addColorStop(0.5, '#7209b7');
        grad.addColorStop(1, '#3a0ca3');
        ctx.fillStyle = grad;

        ctx.beginPath();
        ctx.ellipse(65, 24, 62, 22, 0, Math.PI, 0);
        ctx.fill();

        // Cyan Bioluminescent Rim Glow (#00F5D4)
        ctx.strokeStyle = '#00F5D4';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00F5D4';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.ellipse(65, 24, 61, 21, 0, Math.PI, 0);
        ctx.stroke();

        // Glowing Bioluminescent Spots
        ctx.fillStyle = '#00F5D4';
        const spots = [
          { x: 30, y: 16, r: 6 },
          { x: 50, y: 10, r: 7 },
          { x: 65, y: 8, r: 8 },
          { x: 80, y: 10, r: 7 },
          { x: 100, y: 16, r: 6 },
        ];
        spots.forEach((s) => {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#00F5D4';
        });

        ctx.shadowBlur = 0;
        canvas.refresh();
      }
    }

    // 3. Twisted Branch Platform (One-Way Pass-through)
    if (!scene.textures.exists('twisted_branch')) {
      const canvas = scene.textures.createCanvas('twisted_branch', 120, 32);
      if (canvas) {
        const ctx = canvas.getContext();

        // Ancient curved tree bough #2D1E18
        ctx.fillStyle = '#3d261d';
        ctx.beginPath();
        ctx.ellipse(60, 16, 58, 10, -0.05, 0, Math.PI * 2);
        ctx.fill();

        // Bark texture lines
        ctx.strokeStyle = '#1d120d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(10, 15);
        ctx.lineTo(110, 15);
        ctx.stroke();

        // Glowing Flower Vines (#00F5D4 & #B5179E)
        ctx.strokeStyle = '#06d6a0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(5, 12);
        ctx.bezierCurveTo(35, 6, 75, 24, 115, 12);
        ctx.stroke();

        // Tiny glowing magical blossoms
        const flowers = [
          { x: 22, y: 9, color: '#00F5D4' },
          { x: 55, y: 17, color: '#B5179E' },
          { x: 85, y: 13, color: '#FEE440' },
          { x: 105, y: 10, color: '#00F5D4' },
        ];
        flowers.forEach((f) => {
          ctx.fillStyle = f.color;
          ctx.shadowColor = f.color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(f.x, f.y, 4, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.shadowBlur = 0;
        canvas.refresh();
      }
    }

    // 4. Fading Crystal Shard (Timed / Collapsing Platform)
    if (!scene.textures.exists('fading_crystal')) {
      const canvas = scene.textures.createCanvas('fading_crystal', 100, 36);
      if (canvas) {
        const ctx = canvas.getContext();

        // Translucent Quartz Crystal Cluster (#00F5D4 to #70d6ff)
        const grad = ctx.createLinearGradient(0, 0, 100, 36);
        grad.addColorStop(0, 'rgba(0, 245, 212, 0.85)');
        grad.addColorStop(0.5, 'rgba(112, 214, 255, 0.95)');
        grad.addColorStop(1, 'rgba(181, 23, 158, 0.8)');
        ctx.fillStyle = grad;

        // Faceted crystal platform polygon
        ctx.beginPath();
        ctx.moveTo(10, 18);
        ctx.lineTo(25, 4);
        ctx.lineTo(75, 4);
        ctx.lineTo(90, 18);
        ctx.lineTo(75, 32);
        ctx.lineTo(25, 32);
        ctx.closePath();
        ctx.fill();

        // Glowing crystal facet lines
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00F5D4';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(25, 4);
        ctx.lineTo(50, 18);
        ctx.lineTo(75, 4);
        ctx.moveTo(50, 18);
        ctx.lineTo(50, 32);
        ctx.stroke();

        ctx.shadowBlur = 0;
        canvas.refresh();
      }
    }

    // 5. Enchanted Flower Pad (Moving Platform)
    if (!scene.textures.exists('enchanted_flower')) {
      const canvas = scene.textures.createCanvas('enchanted_flower', 110, 36);
      if (canvas) {
        const ctx = canvas.getContext();

        // Radiant Lotus Petal Pad
        const grad = ctx.createRadialGradient(55, 18, 5, 55, 18, 50);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, '#B5179E');
        grad.addColorStop(0.8, '#7209b7');
        grad.addColorStop(1, '#00F5D4');
        ctx.fillStyle = grad;

        ctx.beginPath();
        ctx.ellipse(55, 18, 52, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#00F5D4';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00F5D4';
        ctx.shadowBlur = 6;
        ctx.stroke();

        ctx.shadowBlur = 0;
        canvas.refresh();
      }
    }
  }

  private static createPropsAndHazards(scene: Phaser.Scene) {
    // 1. Spore Pod Cluster (Hazard / Trap)
    if (!scene.textures.exists('spore_pod')) {
      const canvas = scene.textures.createCanvas('spore_pod', 48, 48);
      if (canvas) {
        const ctx = canvas.getContext();

        // Pod cluster base
        ctx.fillStyle = '#4a0e4e';
        ctx.beginPath();
        ctx.arc(24, 34, 14, 0, Math.PI * 2);
        ctx.fill();

        // Spore nozzles (#B5179E with neon green pore #a3e635)
        const pods = [
          { x: 14, y: 22, r: 8 },
          { x: 24, y: 14, r: 10 },
          { x: 34, y: 22, r: 8 },
        ];
        pods.forEach((p) => {
          ctx.fillStyle = '#B5179E';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();

          // Poison nozzle opening
          ctx.fillStyle = '#a3e635';
          ctx.shadowColor = '#a3e635';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(p.x, p.y - 2, 3, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.shadowBlur = 0;
        canvas.refresh();
      }
    }

    // 2. Dewdrop Leaf (Interactive Speed Slide / Bouncy Prop)
    if (!scene.textures.exists('dewdrop_leaf')) {
      const canvas = scene.textures.createCanvas('dewdrop_leaf', 110, 36);
      if (canvas) {
        const ctx = canvas.getContext();

        // Broad tropical curved emerald leaf #1B4332 to #06d6a0
        const grad = ctx.createLinearGradient(0, 0, 110, 36);
        grad.addColorStop(0, '#1B4332');
        grad.addColorStop(0.5, '#2d6a4f');
        grad.addColorStop(1, '#52b788');
        ctx.fillStyle = grad;

        ctx.beginPath();
        ctx.ellipse(55, 18, 52, 13, -0.04, 0, Math.PI * 2);
        ctx.fill();

        // Leaf veins
        ctx.strokeStyle = '#95d5b2';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(8, 18);
        ctx.lineTo(102, 18);
        ctx.stroke();

        // Giant Glistening Crystal Dewdrop (center)
        const dropGrad = ctx.createRadialGradient(55, 14, 2, 55, 14, 10);
        dropGrad.addColorStop(0, '#ffffff');
        dropGrad.addColorStop(0.4, 'rgba(0, 245, 212, 0.9)');
        dropGrad.addColorStop(1, 'rgba(112, 214, 255, 0.2)');
        ctx.fillStyle = dropGrad;

        ctx.shadowColor = '#00F5D4';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(55, 14, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        canvas.refresh();
      }
    }

    // 3. Ancient Runestone Pillar (Background Prop for Parallax)
    if (!scene.textures.exists('runestone_pillar')) {
      const canvas = scene.textures.createCanvas('runestone_pillar', 64, 220);
      if (canvas) {
        const ctx = canvas.getContext();

        // Slate monolith column #3A405A
        const grad = ctx.createLinearGradient(0, 0, 64, 0);
        grad.addColorStop(0, '#2b2d42');
        grad.addColorStop(0.4, '#3A405A');
        grad.addColorStop(1, '#1e1f29');
        ctx.fillStyle = grad;
        ctx.fillRect(8, 0, 48, 220);

        // Weathered cracks
        ctx.strokeStyle = '#111218';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(14, 30);
        ctx.lineTo(28, 60);
        ctx.lineTo(20, 110);
        ctx.moveTo(48, 80);
        ctx.lineTo(36, 140);
        ctx.lineTo(44, 190);
        ctx.stroke();

        // Glowing Rune symbols carved down the column (#FEE440 & #00F5D4)
        ctx.strokeStyle = '#FEE440';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#FEE440';
        ctx.shadowBlur = 8;

        const runes = [
          // Rune 1
          () => {
            ctx.beginPath();
            ctx.moveTo(26, 40);
            ctx.lineTo(38, 40);
            ctx.moveTo(32, 34);
            ctx.lineTo(32, 54);
            ctx.lineTo(24, 60);
            ctx.stroke();
          },
          // Rune 2 (Cyan)
          () => {
            ctx.strokeStyle = '#00F5D4';
            ctx.shadowColor = '#00F5D4';
            ctx.beginPath();
            ctx.arc(32, 90, 8, 0, Math.PI * 1.6);
            ctx.moveTo(32, 82);
            ctx.lineTo(32, 106);
            ctx.stroke();
          },
          // Rune 3 (Gold)
          () => {
            ctx.strokeStyle = '#FEE440';
            ctx.shadowColor = '#FEE440';
            ctx.beginPath();
            ctx.moveTo(24, 130);
            ctx.lineTo(32, 140);
            ctx.lineTo(40, 130);
            ctx.moveTo(32, 140);
            ctx.lineTo(32, 158);
            ctx.stroke();
          },
          // Rune 4 (Magenta)
          () => {
            ctx.strokeStyle = '#B5179E';
            ctx.shadowColor = '#B5179E';
            ctx.beginPath();
            ctx.moveTo(24, 180);
            ctx.lineTo(40, 180);
            ctx.lineTo(32, 196);
            ctx.closePath();
            ctx.stroke();
          },
        ];

        runes.forEach((drawRune) => drawRune());

        ctx.shadowBlur = 0;
        canvas.refresh();
      }
    }

    // 4. Thorn hazard
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

    // 5. Bat
    if (!scene.textures.exists('enemy_bat')) {
      const canvas = scene.textures.createCanvas('enemy_bat', 48, 36);
      if (canvas) {
        const ctx = canvas.getContext();
        ctx.fillStyle = '#4a0e4e';
        ctx.beginPath();
        ctx.ellipse(24, 18, 10, 14, 0, 0, Math.PI * 2);
        ctx.fill();

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

        ctx.fillStyle = '#ff0055';
        ctx.fillRect(20, 14, 3, 3);
        ctx.fillRect(26, 14, 3, 3);

        canvas.refresh();
      }
    }
  }

  private static createPortal(scene: Phaser.Scene) {
    if (scene.textures.exists('magic_portal')) return;
    const canvas = scene.textures.createCanvas('magic_portal', 80, 110);
    if (!canvas) return;
    const ctx = canvas.getContext();

    const grad = ctx.createRadialGradient(40, 55, 10, 40, 55, 45);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, '#00F5D4'); // Cyan Sihir
    grad.addColorStop(0.8, '#B5179E'); // Ungu Magenta
    grad.addColorStop(1, 'rgba(181, 23, 158, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(40, 55, 36, 50, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#FEE440';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(40, 55, 26, 38, 0.3, 0, Math.PI * 2);
    ctx.stroke();

    canvas.refresh();
  }
}
