/**
 * 游戏对象集合 - 玩家、防守队员、篮球等所有游戏实体
 */

import { GameConfig, AppearancePresets, DefenderConfig, PhysicsConfig } from '../data/GameData.js';
import { MathUtils, CollisionUtils, CanvasUtils } from '../utils/GameUtils.js';

// 游戏对象基类
export class GameObject {
    constructor(x = 0, y = 0, width = 0, height = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.active = true;
        this.visible = true;
    }

    update(deltaTime) {
        // 子类重写
    }

    render(ctx) {
        // 子类重写
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    getCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }

    intersects(other) {
        const bounds1 = this.getBounds();
        const bounds2 = other.getBounds();
        return CollisionUtils.rectIntersects(
            bounds1.x, bounds1.y, bounds1.width, bounds1.height,
            bounds2.x, bounds2.y, bounds2.width, bounds2.height
        );
    }

    distanceTo(other) {
        const center1 = this.getCenter();
        const center2 = other.getCenter();
        return MathUtils.distance(center1.x, center1.y, center2.x, center2.y);
    }

    destroy() {
        this.active = false;
    }
}

// 玩家类
export class Player extends GameObject {
    constructor(eventBus) {
        super(
            GameConfig.player.startX,
            GameConfig.player.startY,
            GameConfig.player.size.width,
            GameConfig.player.size.height
        );
        
        this.eventBus = eventBus;
        this.speed = GameConfig.player.speed;
        
        // 动画相关
        this.animFrame = 0;
        this.animSpeed = GameConfig.player.animSpeed;
        this.dribbling = true;
        
        // 外观属性
        this.appearance = {
            headIndex: 0,
            jerseyIndex: 0,
            numberIndex: 0
        };
        
        // 向后兼容属性
        this.jerseyNumber = '1';
        this.bodyColor1 = '#00529B';
        this.bodyColor2 = '#FFD700';
        
        // 移动状态
        this.velocity = { x: 0, y: 0 };
        this.isMoving = false;
        
        this.loadAppearanceFromStorage();
    }

    loadAppearanceFromStorage() {
        try {
            const saved = localStorage.getItem('playerAppearance');
            if (saved) {
                const appearance = JSON.parse(saved);
                if (this.validateAppearance(appearance)) {
                    this.appearance = appearance;
                    this.updateLegacyColors();
                }
            }
        } catch (error) {
            console.warn('Failed to load player appearance:', error);
        }
    }

    validateAppearance(appearance) {
        return appearance &&
               typeof appearance.headIndex === 'number' &&
               typeof appearance.jerseyIndex === 'number' &&
               typeof appearance.numberIndex === 'number' &&
               appearance.headIndex >= 0 && appearance.headIndex < AppearancePresets.heads.length &&
               appearance.jerseyIndex >= 0 && appearance.jerseyIndex < AppearancePresets.jerseys.length &&
               appearance.numberIndex >= 0 && appearance.numberIndex < AppearancePresets.numbers.length;
    }

    updateLegacyColors() {
        if (this.appearance.jerseyIndex < AppearancePresets.jerseys.length) {
            const jersey = AppearancePresets.jerseys[this.appearance.jerseyIndex];
            this.bodyColor1 = jersey.color1;
            this.bodyColor2 = jersey.color2;
        }
        
        if (this.appearance.numberIndex < AppearancePresets.numbers.length) {
            this.jerseyNumber = AppearancePresets.numbers[this.appearance.numberIndex];
        }
    }

    update(deltaTime, input) {
        this.handleInput(input);
        this.updatePosition(deltaTime);
        this.updateAnimation(deltaTime);
        this.constrainToScreen();
    }

    handleInput(input) {
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.isMoving = false;

        if (input.isKeyPressed('ArrowUp') || input.isKeyPressed('w') || input.isKeyPressed('W')) {
            this.velocity.y = -this.speed;
            this.isMoving = true;
        }
        if (input.isKeyPressed('ArrowDown') || input.isKeyPressed('s') || input.isKeyPressed('S')) {
            this.velocity.y = this.speed;
            this.isMoving = true;
        }
        if (input.isKeyPressed('ArrowLeft') || input.isKeyPressed('a') || input.isKeyPressed('A')) {
            this.velocity.x = -this.speed;
            this.isMoving = true;
        }
        if (input.isKeyPressed('ArrowRight') || input.isKeyPressed('d') || input.isKeyPressed('D')) {
            this.velocity.x = this.speed;
            this.isMoving = true;
        }
    }

    updatePosition(deltaTime) {
        // 标准化时间步长（60fps基准）
        const normalizedDelta = deltaTime / 16.67;
        
        this.x += this.velocity.x * normalizedDelta;
        this.y += this.velocity.y * normalizedDelta;
    }

    updateAnimation(deltaTime) {
        // 只有在移动时才播放动画
        if (this.isMoving) {
            const normalizedDelta = deltaTime / 16.67;
            if (Math.floor(Date.now() / (1000 / 60)) % this.animSpeed === 0) {
                this.animFrame = (this.animFrame + 1) % 4;
            }
        }
    }

    constrainToScreen() {
        const canvas = { width: GameConfig.canvas.width, height: GameConfig.canvas.height };
        
        this.x = MathUtils.clamp(this.x, 0, canvas.width - this.width);
        this.y = MathUtils.clamp(this.y, 0, canvas.height - this.height);
    }

    render(ctx) {
        this.drawPlayer(ctx);
    }

    drawPlayer(ctx) {
        CanvasUtils.withState(ctx, () => {
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            
            // 获取外观数据
            const headData = AppearancePresets.heads[this.appearance.headIndex] || AppearancePresets.heads[0];
            const jerseyData = AppearancePresets.jerseys[this.appearance.jerseyIndex] || AppearancePresets.jerseys[0];
            const number = AppearancePresets.numbers[this.appearance.numberIndex] || AppearancePresets.numbers[0];

            // 绘制身体（球衣）
            this.drawBody(ctx, centerX, centerY, jerseyData);
            
            // 绘制头部
            this.drawHead(ctx, centerX, centerY - 15, headData);
            
            // 绘制球衣号码
            this.drawJerseyNumber(ctx, centerX, centerY, number);
            
            // 绘制运球动画
            if (this.dribbling) {
                this.drawBasketball(ctx, centerX, centerY);
            }
        });
    }

    drawBody(ctx, centerX, centerY, jerseyData) {
        // 身体渐变
        const bodyGradient = ctx.createLinearGradient(0, centerY - 15, 0, centerY + 20);
        bodyGradient.addColorStop(0, jerseyData.color1);
        bodyGradient.addColorStop(1, jerseyData.color2);
        
        ctx.fillStyle = bodyGradient;
        ctx.fillRect(centerX - 15, centerY - 15, 30, 35);
        
        // 身体边框
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(centerX - 15, centerY - 15, 30, 35);
        
        // 手臂
        ctx.fillStyle = headData.skinColor;
        ctx.fillRect(centerX - 20, centerY - 10, 8, 20); // 左臂
        ctx.fillRect(centerX + 12, centerY - 10, 8, 20); // 右臂
        
        // 腿部
        ctx.fillRect(centerX - 12, centerY + 20, 8, 15); // 左腿
        ctx.fillRect(centerX + 4, centerY + 20, 8, 15);  // 右腿
    }

    drawHead(ctx, centerX, centerY, headData) {
        // 头部
        ctx.fillStyle = headData.skinColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // 头部边框
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 头发
        ctx.fillStyle = headData.hairColor;
        this.drawHair(ctx, centerX, centerY, headData.hairStyle);
        
        // 眼睛
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(centerX - 4, centerY - 2, 1.5, 0, Math.PI * 2);
        ctx.arc(centerX + 4, centerY - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // 嘴巴
        ctx.beginPath();
        ctx.arc(centerX, centerY + 4, 3, 0, Math.PI);
        ctx.stroke();
    }

    drawHair(ctx, centerX, centerY, hairStyle) {
        switch (hairStyle) {
            case 'spiky':
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const startX = centerX + Math.cos(angle) * 10;
                    const startY = centerY + Math.sin(angle) * 10;
                    const endX = centerX + Math.cos(angle) * 16;
                    const endY = centerY + Math.sin(angle) * 16;
                    
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(endX, endY);
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }
                break;
            case 'curly':
                ctx.beginPath();
                for (let i = 0; i < 16; i++) {
                    const angle = (i / 16) * Math.PI * 2;
                    const radius = 12 + Math.sin(i * 1.5) * 2;
                    const x = centerX + Math.cos(angle) * radius;
                    const y = centerY + Math.sin(angle) * radius;
                    
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.closePath();
                ctx.fill();
                break;
            case 'long':
                ctx.fillRect(centerX - 14, centerY - 12, 28, 8);
                ctx.fillRect(centerX - 16, centerY - 4, 32, 20);
                break;
            default: // classic
                ctx.beginPath();
                ctx.arc(centerX, centerY - 3, 14, Math.PI, 0);
                ctx.fill();
                break;
        }
    }

    drawJerseyNumber(ctx, centerX, centerY, number) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(number, centerX, centerY + 5);
        
        // 号码边框
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeText(number, centerX, centerY + 5);
    }

    drawBasketball(ctx, centerX, centerY) {
        // 运球动画
        const bounce = Math.sin(Date.now() * 0.01) * 3;
        const ballY = centerY + 25 + bounce;
        
        // 篮球
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.arc(centerX + 5, ballY, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // 篮球线条
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX + 5, ballY, 6, 0, Math.PI * 2);
        ctx.moveTo(centerX - 1, ballY);
        ctx.lineTo(centerX + 11, ballY);
        ctx.moveTo(centerX + 5, ballY - 6);
        ctx.lineTo(centerX + 5, ballY + 6);
        ctx.stroke();
    }

    // 碰撞处理
    handleCollision(object) {
        if (object instanceof Defender) {
            this.eventBus.emit('playerDefenderCollision', { player: this, defender: object });
        }
    }

    // 重置位置
    reset() {
        this.x = GameConfig.player.startX;
        this.y = GameConfig.player.startY;
        this.velocity = { x: 0, y: 0 };
        this.isMoving = false;
        this.animFrame = 0;
    }

    // 设置外观
    setAppearance(headIndex, jerseyIndex, numberIndex) {
        this.appearance = { headIndex, jerseyIndex, numberIndex };
        this.updateLegacyColors();
    }
}

// 防守队员类
export class Defender extends GameObject {
    constructor(config, laneIndex) {
        super(config.x, config.y, config.size.width, config.size.height);
        
        this.laneIndex = laneIndex;
        this.speed = config.speed;
        this.direction = config.direction;
        this.groupIndex = config.groupIndex || 0;
        this.playerInGroup = config.playerInGroup || 0;
        
        this.color = config.color || `hsl(${120 + laneIndex * 60}, 70%, 50%)`;
        this.jerseyNumber = config.jerseyNumber || Math.floor(Math.random() * 100);
        this.animOffset = config.animOffset || Math.random() * 10;
        
        this.originalX = config.x;
        this.canvasWidth = GameConfig.canvas.width;
    }

    update(deltaTime) {
        this.updateMovement(deltaTime);
        this.checkBoundaries();
    }

    updateMovement(deltaTime) {
        const normalizedDelta = deltaTime / 16.67;
        this.x += this.speed * this.direction * normalizedDelta;
    }

    checkBoundaries() {
        if (this.x <= 0 || this.x >= this.canvasWidth - this.width) {
            this.direction *= -1;
        }
    }

    render(ctx) {
        this.drawDefender(ctx);
    }

    drawDefender(ctx) {
        CanvasUtils.withState(ctx, () => {
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            
            // 身体动画偏移
            const animOffset = Math.sin(Date.now() * 0.005 + this.animOffset) * 2;
            
            // 身体
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y + animOffset, this.width, this.height - 10);
            
            // 身体边框
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x, this.y + animOffset, this.width, this.height - 10);
            
            // 头部
            ctx.fillStyle = '#FFDBAC';
            ctx.beginPath();
            ctx.arc(centerX, this.y + 8 + animOffset, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // 眼睛
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(centerX - 2, this.y + 6 + animOffset, 1, 0, Math.PI * 2);
            ctx.arc(centerX + 2, this.y + 6 + animOffset, 1, 0, Math.PI * 2);
            ctx.fill();
            
            // 球衣号码
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '8px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.jerseyNumber.toString(), centerX, centerY + animOffset);
            
            // 手臂摆动
            this.drawArms(ctx, centerX, centerY + animOffset);
        });
    }

    drawArms(ctx, centerX, centerY) {
        const armSwing = Math.sin(Date.now() * 0.008 + this.animOffset) * 0.3;
        
        ctx.strokeStyle = '#FFDBAC';
        ctx.lineWidth = 3;
        
        // 左臂
        ctx.beginPath();
        ctx.moveTo(centerX - 8, centerY - 5);
        ctx.lineTo(centerX - 12 + armSwing * 5, centerY + 5);
        ctx.stroke();
        
        // 右臂
        ctx.beginPath();
        ctx.moveTo(centerX + 8, centerY - 5);
        ctx.lineTo(centerX + 12 - armSwing * 5, centerY + 5);
        ctx.stroke();
    }

    // 静态工厂方法 - 创建防守队员
    static createDefendersForLane(laneConfig, laneIndex) {
        const defenders = [];
        const config = DefenderConfig[`lane${laneIndex}`];
        
        if (!config) {
            // 默认配置
            const defenderCount = 3 + laneIndex;
            for (let i = 0; i < defenderCount; i++) {
                defenders.push(new Defender({
                    x: (i * 200) + Math.random() * 100,
                    y: laneConfig.y,
                    size: { width: 35, height: 45 },
                    speed: laneConfig.speed,
                    direction: laneConfig.direction,
                    jerseyNumber: Math.floor(Math.random() * 100),
                    animOffset: Math.random() * 10
                }, laneIndex));
            }
            return defenders;
        }

        if (config.groupCount) {
            // 分组模式
            for (let group = 0; group < config.groupCount; group++) {
                for (let i = 0; i < config.playersPerGroup; i++) {
                    defenders.push(new Defender({
                        x: (group * config.groupSpacing) + (i * config.playerSpacing) + config.startX,
                        y: laneConfig.y,
                        size: config.size,
                        speed: laneConfig.speed,
                        direction: laneConfig.direction,
                        groupIndex: group,
                        playerInGroup: i,
                        jerseyNumber: Math.floor(Math.random() * 100),
                        animOffset: Math.random() * 10
                    }, laneIndex));
                }
            }
        } else {
            // 单个模式
            for (let i = 0; i < config.count; i++) {
                defenders.push(new Defender({
                    x: (i * config.spacing) + (config.randomOffset ? Math.random() * config.randomOffset : 0),
                    y: laneConfig.y,
                    size: config.size,
                    speed: laneConfig.speed,
                    direction: laneConfig.direction,
                    jerseyNumber: Math.floor(Math.random() * 100),
                    animOffset: Math.random() * 10
                }, laneIndex));
            }
        }
        
        return defenders;
    }
}

// 篮球类
export class Basketball extends GameObject {
    constructor(startX, startY, angle, power) {
        super(startX, startY, PhysicsConfig.basketballSize * 2, PhysicsConfig.basketballSize * 2);
        
        this.size = PhysicsConfig.basketballSize;
        this.centerX = startX + this.size;
        this.centerY = startY + this.size;
        
        // 物理属性
        this.vx = Math.cos(angle) * power;
        this.vy = Math.sin(angle) * power;
        this.gravity = PhysicsConfig.gravity;
        
        // 轨迹记录
        this.trail = [];
        this.maxTrailLength = 10;
        
        this.active = true;
    }

    update(deltaTime) {
        if (!this.active) return;
        
        const normalizedDelta = deltaTime / 16.67;
        
        // 更新位置
        this.centerX += this.vx * normalizedDelta;
        this.centerY += this.vy * normalizedDelta;
        
        // 应用重力
        this.vy += this.gravity * normalizedDelta;
        
        // 更新边界框
        this.x = this.centerX - this.size;
        this.y = this.centerY - this.size;
        
        // 记录轨迹
        this.trail.push({ x: this.centerX, y: this.centerY });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // 检查边界
        this.checkBoundaries();
    }

    checkBoundaries() {
        const canvas = GameConfig.canvas;
        
        if (this.centerX < 0 || this.centerX > canvas.width || this.centerY > canvas.height) {
            this.active = false;
        }
    }

    render(ctx) {
        if (!this.active) return;
        
        this.drawTrail(ctx);
        this.drawBasketball(ctx);
    }

    drawTrail(ctx) {
        if (this.trail.length < 2) return;
        
        CanvasUtils.withState(ctx, () => {
            ctx.strokeStyle = 'rgba(255, 140, 0, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            this.trail.forEach((point, index) => {
                if (index === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            });
            
            ctx.stroke();
        });
    }

    drawBasketball(ctx) {
        CanvasUtils.withState(ctx, () => {
            // 篮球主体
            ctx.fillStyle = '#FF8C00';
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, this.size, 0, Math.PI * 2);
            ctx.fill();

            // 篮球纹理线条
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, this.size, 0, Math.PI * 2);
            ctx.moveTo(this.centerX - this.size, this.centerY);
            ctx.lineTo(this.centerX + this.size, this.centerY);
            ctx.moveTo(this.centerX, this.centerY - this.size);
            ctx.lineTo(this.centerX, this.centerY + this.size);
            ctx.stroke();
        });
    }

    // 检查与篮筐的碰撞
    checkHoopCollision(hoopX, hoopY, tolerance = 25) {
        const distance = MathUtils.distance(this.centerX, this.centerY, hoopX, hoopY);
        return distance < tolerance && this.vy > 0; // 篮球必须向下运动才能进筐
    }

    // 获取中心点
    getCenter() {
        return { x: this.centerX, y: this.centerY };
    }
}

// 粒子类
export class Particle extends GameObject {
    constructor(x, y, config = {}) {
        super(x, y, 0, 0);
        
        this.vx = config.vx || (Math.random() - 0.5) * 12;
        this.vy = config.vy || Math.random() * -12 - 3;
        this.life = config.life || 80;
        this.maxLife = this.life;
        this.color = config.color || `hsl(${Math.random() * 360}, 100%, 60%)`;
        this.size = config.size || Math.random() * 4 + 2;
        this.gravity = config.gravity || PhysicsConfig.gravity;
    }

    update(deltaTime) {
        const normalizedDelta = deltaTime / 16.67;
        
        this.x += this.vx * normalizedDelta;
        this.y += this.vy * normalizedDelta;
        this.vy += this.gravity * normalizedDelta;
        
        this.life -= normalizedDelta;
        this.active = this.life > 0;
    }

    render(ctx) {
        if (!this.active) return;
        
        CanvasUtils.withState(ctx, () => {
            const alpha = this.life / this.maxLife;
            ctx.globalAlpha = alpha;
            
            if (this.size > 0) {
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 10;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
}

// 得分弹出文本类
export class ScorePopup extends GameObject {
    constructor(x, y, points, color = '#FFD700') {
        super(x, y, 0, 0);
        
        this.points = points;
        this.color = color;
        this.life = 60; // 1秒（60帧）
        this.maxLife = this.life;
        this.vy = -2; // 向上飘动
        this.fontSize = 24;
    }

    update(deltaTime) {
        const normalizedDelta = deltaTime / 16.67;
        
        this.y += this.vy * normalizedDelta;
        this.life -= normalizedDelta;
        this.active = this.life > 0;
    }

    render(ctx) {
        if (!this.active) return;
        
        CanvasUtils.withState(ctx, () => {
            const alpha = this.life / this.maxLife;
            ctx.globalAlpha = alpha;
            
            CanvasUtils.drawTextWithShadow(
                ctx,
                `+${this.points}`,
                this.x,
                this.y,
                this.color,
                '#000000',
                5,
                { x: 2, y: 2 }
            );
            
            ctx.font = `bold ${this.fontSize}px Arial`;
            ctx.textAlign = 'center';
        });
    }
}

// 观众类
export class Spectator extends GameObject {
    constructor(x, y, scale = 1) {
        super(x, y, 24 * scale, 32 * scale);
        
        this.baseY = y;
        this.scale = scale;
        this.cheerFrame = 0;
        this.color = `hsl(${Math.random() * 360}, 70%, ${50 + Math.random() * 30}%)`;
        this.shirtColor = `hsl(${Math.random() * 360}, 80%, ${40 + Math.random() * 20}%)`;
        this.isCheeringOffset = 0;
    }

    update(deltaTime, isCheeringTime = false) {
        if (isCheeringTime) {
            this.isCheeringOffset = Math.sin(Date.now() * 0.003 + this.x * 0.1) * 6;
            
            // 更新欢呼动画帧
            if (Math.floor(Date.now() / (1000 / 4)) % 15 === 0) {
                this.cheerFrame = (this.cheerFrame + 1) % 3;
            }
        } else {
            this.isCheeringOffset = 0;
        }
    }

    render(ctx) {
        CanvasUtils.withState(ctx, () => {
            const baseWidth = 20 * this.scale;
            const baseHeight = 28 * this.scale;
            const drawY = this.y + this.isCheeringOffset;
            
            // 身体
            ctx.fillStyle = this.shirtColor;
            ctx.fillRect(
                this.x + 4 * this.scale,
                drawY + 12 * this.scale,
                baseWidth - 8 * this.scale,
                baseHeight - 12 * this.scale
            );
            
            // 头部
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(
                this.x + baseWidth / 2,
                drawY + 8 * this.scale,
                7 * this.scale,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            // 眼睛
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(this.x + baseWidth/2 - 2*this.scale, drawY + 7*this.scale, 1*this.scale, 0, Math.PI * 2);
            ctx.arc(this.x + baseWidth/2 + 2*this.scale, drawY + 7*this.scale, 1*this.scale, 0, Math.PI * 2);
            ctx.fill();
            
            // 如果在欢呼，画举起的手臂
            if (this.isCheeringOffset !== 0) {
                this.drawCheeringArms(ctx, drawY);
            }
        });
    }

    drawCheeringArms(ctx, drawY) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3 * this.scale;
        ctx.beginPath();
        
        // 左臂
        ctx.moveTo(this.x + 6*this.scale, drawY + 16*this.scale);
        ctx.lineTo(this.x + 2*this.scale, drawY + 4*this.scale);
        
        // 右臂
        ctx.moveTo(this.x + 18*this.scale, drawY + 16*this.scale);
        ctx.lineTo(this.x + 22*this.scale, drawY + 4*this.scale);
        
        ctx.stroke();
    }

    // 静态工厂方法
    static createAudience() {
        const audience = [];
        const config = GameConfig.audience;
        
        for (let row = 0; row < config.rows; row++) {
            for (let i = 0; i < config.perRow; i++) {
                audience.push(new Spectator(
                    50 + (i * config.spacing),
                    config.startY + (row * config.rowSpacing),
                    1.2 + (row * 0.1)
                ));
            }
        }
        
        return audience;
    }
}