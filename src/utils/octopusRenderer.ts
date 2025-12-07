import type { OctopusCustomization } from '../types/customization';
import type { Position } from '../components/gameEntities';

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  position: Position;
  size: number;
  rotation?: number;
  alpha?: number;
}

export class OctopusRenderer {
  static drawCustomizedOctopus(
    context: RenderContext,
    customization: OctopusCustomization,
    animationFrame: number = 0
  ) {
    const { ctx, position, size, rotation = 0, alpha = 1 } = context;
    
    ctx.save();
    ctx.translate(position.x, position.y);
    ctx.rotate(rotation);
    ctx.globalAlpha = alpha;

    const sizeMultiplier = this.getSizeMultiplier(customization.size);
    const effectiveSize = size * sizeMultiplier;

    // Draw glow effect if enabled
    if (customization.glowEffect) {
      this.drawGlowEffect(ctx, effectiveSize, customization.bodyColor);
    }

    // Draw tentacles
    this.drawTentacles(ctx, effectiveSize, customization, animationFrame);

    // Draw body with pattern
    this.drawBody(ctx, effectiveSize, customization);

    // Draw eyes
    this.drawEyes(ctx, effectiveSize, customization.eyeColor);

    // Draw accessory
    this.drawAccessory(ctx, effectiveSize, customization);

    ctx.restore();
  }

  private static getSizeMultiplier(size: 'small' | 'medium' | 'large'): number {
    switch (size) {
      case 'small': return 0.8;
      case 'medium': return 1.0;
      case 'large': return 1.2;
      default: return 1.0;
    }
  }

  private static drawGlowEffect(ctx: CanvasRenderingContext2D, size: number, color: string) {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.5);
    gradient.addColorStop(0, `${color}40`);
    gradient.addColorStop(0.5, `${color}20`);
    gradient.addColorStop(1, `${color}00`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(-size * 1.5, -size * 1.5, size * 3, size * 3);
  }

  private static drawTentacles(
    ctx: CanvasRenderingContext2D,
    size: number,
    customization: OctopusCustomization,
    animationFrame: number
  ) {
    const tentacleCount = 8;
    const tentacleLength = size * 1.0;
    const baseWidth = size * 0.12;
    
    for (let i = 0; i < tentacleCount; i++) {
      const angle = (i / tentacleCount) * Math.PI * 2;
      const waveOffset = Math.sin(animationFrame * 0.08 + i * 0.7) * 0.4;
      const secondaryWave = Math.cos(animationFrame * 0.12 + i * 1.2) * 0.2;
      
      ctx.save();
      ctx.rotate(angle + waveOffset);
      
      // Draw tentacle in segments for more realistic curve
      const segments = 6;
      for (let seg = 0; seg < segments; seg++) {
        const segmentProgress = seg / segments;
        const nextProgress = (seg + 1) / segments;
        
        const currentWidth = baseWidth * (1 - segmentProgress * 0.6);
        const nextWidth = baseWidth * (1 - nextProgress * 0.6);
        
        const currentY = tentacleLength * segmentProgress;
        const nextY = tentacleLength * nextProgress;
        
        // Add curve to tentacle
        const curve = Math.sin(segmentProgress * Math.PI) * secondaryWave * segmentProgress;
        
        // Create segment gradient
        const gradient = ctx.createLinearGradient(0, currentY, 0, nextY);
        const colorMix = segmentProgress * 0.7;
        const currentColor = this.blendColors(customization.bodyColor, customization.tentacleColor, colorMix);
        const nextColor = this.blendColors(customization.bodyColor, customization.tentacleColor, colorMix + 0.1);
        gradient.addColorStop(0, currentColor);
        gradient.addColorStop(1, nextColor);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(curve, (currentY + nextY) / 2, (currentWidth + nextWidth) / 2, (nextY - currentY) / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Add suckers on underside
        if (seg > 1 && seg < segments - 1) {
          this.drawTentacleSuckers(ctx, curve, currentY, currentWidth);
        }
      }
      
      ctx.restore();
    }
  }

  private static drawBody(
    ctx: CanvasRenderingContext2D,
    size: number,
    customization: OctopusCustomization
  ) {
    // Draw main body (mantle) - more octopus-like bulbous shape
    const bodyGradient = ctx.createRadialGradient(0, -size * 0.1, 0, 0, 0, size * 0.7);
    bodyGradient.addColorStop(0, this.adjustColor(customization.bodyColor, 20));
    bodyGradient.addColorStop(1, customization.bodyColor);
    
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    // Draw bulbous mantle shape instead of perfect circle
    ctx.ellipse(0, -size * 0.1, size * 0.55, size * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw head (distinct from mantle)
    const headGradient = ctx.createRadialGradient(0, size * 0.2, 0, 0, size * 0.2, size * 0.4);
    headGradient.addColorStop(0, this.adjustColor(customization.bodyColor, 15));
    headGradient.addColorStop(1, this.adjustColor(customization.bodyColor, -10));
    
    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.ellipse(0, size * 0.2, size * 0.45, size * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Apply pattern to both body and head
    if (customization.pattern !== 'solid' && customization.patternColor) {
      this.drawPattern(ctx, size * 0.7, customization.pattern, customization.patternColor);
    }

    // Add realistic body texture/bumps
    this.drawBodyTexture(ctx, size, customization.bodyColor);
    
    // Add subtle body highlight
    const highlightGradient = ctx.createRadialGradient(
      -size * 0.15, -size * 0.3, 0,
      -size * 0.15, -size * 0.3, size * 0.5
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.1, size * 0.55, size * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private static drawBodyTexture(
    ctx: CanvasRenderingContext2D,
    size: number,
    bodyColor: string
  ) {
    // Add subtle skin texture bumps
    const textureColor = this.adjustColor(bodyColor, -15);
    ctx.fillStyle = textureColor;
    
    // Small bumps for realistic octopus skin texture
    const bumps = [
      { x: -size * 0.2, y: -size * 0.3, size: size * 0.05 },
      { x: size * 0.1, y: -size * 0.4, size: size * 0.04 },
      { x: -size * 0.3, y: -size * 0.1, size: size * 0.03 },
      { x: size * 0.25, y: -size * 0.2, size: size * 0.04 },
      { x: 0, y: -size * 0.5, size: size * 0.03 },
      { x: size * 0.15, y: size * 0.1, size: size * 0.035 },
      { x: -size * 0.25, y: size * 0.15, size: size * 0.04 },
    ];
    
    bumps.forEach(bump => {
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(bump.x, bump.y, bump.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  private static drawPattern(
    ctx: CanvasRenderingContext2D,
    radius: number,
    pattern: string,
    color: string
  ) {
    ctx.fillStyle = color;
    
    switch (pattern) {
      case 'stripes':
        this.drawStripes(ctx, radius);
        break;
      case 'spots':
        this.drawSpots(ctx, radius);
        break;
      case 'gradient':
        this.drawGradientPattern(ctx, radius, color);
        break;
      case 'galaxy':
        this.drawGalaxyPattern(ctx, radius);
        break;
    }
  }

  private static drawStripes(ctx: CanvasRenderingContext2D, radius: number) {
    const stripeCount = 6;
    const stripeWidth = (radius * 2) / stripeCount;
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.clip();
    
    for (let i = 0; i < stripeCount; i++) {
      if (i % 2 === 0) {
        ctx.fillRect(-radius + i * stripeWidth, -radius, stripeWidth, radius * 2);
      }
    }
    
    ctx.restore();
  }

  private static drawSpots(ctx: CanvasRenderingContext2D, radius: number) {
    const spots = [
      { x: -radius * 0.3, y: -radius * 0.2, size: radius * 0.15 },
      { x: radius * 0.2, y: -radius * 0.4, size: radius * 0.1 },
      { x: -radius * 0.1, y: radius * 0.3, size: radius * 0.12 },
      { x: radius * 0.4, y: radius * 0.1, size: radius * 0.08 },
      { x: -radius * 0.4, y: radius * 0.2, size: radius * 0.1 },
    ];
    
    spots.forEach(spot => {
      ctx.beginPath();
      ctx.arc(spot.x, spot.y, spot.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private static drawGradientPattern(ctx: CanvasRenderingContext2D, radius: number, color: string) {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.6, `${color}80`);
    gradient.addColorStop(1, color);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  private static drawGalaxyPattern(ctx: CanvasRenderingContext2D, radius: number) {
    const starCount = 12;
    
    for (let i = 0; i < starCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius * 0.8;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const size = Math.random() * 3 + 1;
      
      ctx.fillStyle = `hsl(${Math.random() * 60 + 180}, 70%, 80%)`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private static drawEyes(ctx: CanvasRenderingContext2D, size: number, eyeColor: string) {
    const eyeSize = size * 0.12;
    const eyeOffset = size * 0.25;
    
    // Left eye
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(-eyeOffset, -size * 0.1, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Right eye
    ctx.beginPath();
    ctx.arc(eyeOffset, -size * 0.1, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupils
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-eyeOffset, -size * 0.1, eyeSize * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeOffset, -size * 0.1, eyeSize * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye shine
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-eyeOffset - eyeSize * 0.2, -size * 0.1 - eyeSize * 0.2, eyeSize * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeOffset - eyeSize * 0.2, -size * 0.1 - eyeSize * 0.2, eyeSize * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  private static drawAccessory(
    ctx: CanvasRenderingContext2D,
    size: number,
    customization: OctopusCustomization
  ) {
    if (customization.accessory === 'none') return;
    
    const accessoryColor = customization.accessoryColor || '#ffffff';
    
    switch (customization.accessory) {
      case 'hat':
        this.drawHat(ctx, size, accessoryColor);
        break;
      case 'crown':
        this.drawCrown(ctx, size, accessoryColor);
        break;
      case 'sunglasses':
        this.drawSunglasses(ctx, size);
        break;
      case 'bowtie':
        this.drawBowtie(ctx, size, accessoryColor);
        break;
      case 'cape':
        this.drawCape(ctx, size, accessoryColor);
        break;
    }
  }

  private static drawHat(ctx: CanvasRenderingContext2D, size: number, color: string) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.7, size * 0.5, size * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.rect(-size * 0.3, -size * 0.9, size * 0.6, size * 0.3);
    ctx.fill();
  }

  private static drawCrown(ctx: CanvasRenderingContext2D, size: number, color: string) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-size * 0.4, -size * 0.6);
    ctx.lineTo(-size * 0.2, -size * 0.8);
    ctx.lineTo(0, -size * 0.7);
    ctx.lineTo(size * 0.2, -size * 0.8);
    ctx.lineTo(size * 0.4, -size * 0.6);
    ctx.lineTo(size * 0.4, -size * 0.5);
    ctx.lineTo(-size * 0.4, -size * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  private static drawSunglasses(ctx: CanvasRenderingContext2D, size: number) {
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-size * 0.25, -size * 0.1, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size * 0.25, -size * 0.1, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = size * 0.03;
    ctx.beginPath();
    ctx.moveTo(-size * 0.1, -size * 0.1);
    ctx.lineTo(size * 0.1, -size * 0.1);
    ctx.stroke();
  }

  private static drawBowtie(ctx: CanvasRenderingContext2D, size: number, color: string) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-size * 0.15, size * 0.3);
    ctx.lineTo(-size * 0.05, size * 0.25);
    ctx.lineTo(size * 0.05, size * 0.25);
    ctx.lineTo(size * 0.15, size * 0.3);
    ctx.lineTo(size * 0.05, size * 0.35);
    ctx.lineTo(-size * 0.05, size * 0.35);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = this.adjustColor(color, -30);
    ctx.fillRect(-size * 0.02, size * 0.25, size * 0.04, size * 0.1);
  }

  private static drawCape(ctx: CanvasRenderingContext2D, size: number, color: string) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, size * 0.3, size * 0.8, -Math.PI, 0);
    ctx.closePath();
    ctx.fill();
  }

  private static drawTentacleSuckers(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    tentacleWidth: number
  ) {
    const suckerSize = tentacleWidth * 0.15;
    const suckerSpacing = tentacleWidth * 0.4;
    
    // Draw suckers on both sides of tentacle
    ctx.fillStyle = 'rgba(200, 150, 150, 0.8)';
    for (let side of [-1, 1]) {
      const suckerX = x + side * suckerSpacing;
      ctx.beginPath();
      ctx.arc(suckerX, y, suckerSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Add sucker rim
      ctx.strokeStyle = 'rgba(180, 130, 130, 0.9)';
      ctx.lineWidth = suckerSize * 0.2;
      ctx.stroke();
    }
  }

  private static blendColors(color1: string, color2: string, ratio: number): string {
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substring(0, 2), 16);
    const g1 = parseInt(hex1.substring(2, 4), 16);
    const b1 = parseInt(hex1.substring(4, 6), 16);
    
    const r2 = parseInt(hex2.substring(0, 2), 16);
    const g2 = parseInt(hex2.substring(2, 4), 16);
    const b2 = parseInt(hex2.substring(4, 6), 16);
    
    const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
    const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
    const b = Math.round(b1 * (1 - ratio) + b2 * ratio);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private static adjustColor(color: string, amount: number): string {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * amount);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  static drawTrailEffect(
    ctx: CanvasRenderingContext2D,
    position: Position,
    trailEffect: string,
    particles: any[]
  ) {
    if (trailEffect === 'none') return;

    switch (trailEffect) {
      case 'bubbles':
        this.drawBubbleTrail(ctx, particles);
        break;
      case 'sparkles':
        this.drawSparkleTrail(ctx, particles);
        break;
      case 'rainbow':
        this.drawRainbowTrail(ctx, particles);
        break;
      case 'ink':
        this.drawInkTrail(ctx, particles);
        break;
    }
  }

  private static drawBubbleTrail(ctx: CanvasRenderingContext2D, particles: any[]) {
    particles.forEach(particle => {
      if (particle.type === 'bubble') {
        ctx.save();
        ctx.globalAlpha = particle.life / particle.maxLife;
        ctx.fillStyle = 'rgba(173, 216, 230, 0.6)';
        ctx.beginPath();
        ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });
  }

  private static drawSparkleTrail(ctx: CanvasRenderingContext2D, particles: any[]) {
    particles.forEach(particle => {
      if (particle.type === 'sparkle') {
        ctx.save();
        ctx.globalAlpha = particle.life / particle.maxLife;
        ctx.fillStyle = particle.color;
        ctx.translate(particle.position.x, particle.position.y);
        
        // Draw star shape
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2;
          const x = Math.cos(angle) * particle.size;
          const y = Math.sin(angle) * particle.size;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    });
  }

  private static drawRainbowTrail(ctx: CanvasRenderingContext2D, particles: any[]) {
    particles.forEach((particle, index) => {
      if (particle.type === 'rainbow') {
        ctx.save();
        ctx.globalAlpha = particle.life / particle.maxLife;
        const hue = (index * 30) % 360;
        ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
        ctx.beginPath();
        ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });
  }

  private static drawInkTrail(ctx: CanvasRenderingContext2D, particles: any[]) {
    particles.forEach(particle => {
      if (particle.type === 'ink') {
        ctx.save();
        ctx.globalAlpha = particle.life / particle.maxLife * 0.7;
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });
  }
}