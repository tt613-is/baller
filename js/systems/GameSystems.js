/**
 * 游戏系统集合 - 物理、碰撞、渲染、动画系统等
 */

import { GameConfig, ThemeColors, PhysicsConfig } from '../data/GameData.js';
import { MathUtils, CollisionUtils, CanvasUtils, ColorUtils } from '../utils/GameUtils.js';
import { Particle, ScorePopup } from '../components/GameObjects.js';

// 渲染系统
export class RenderSystem {
    constructor(canvas, ctx, eventBus) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.eventBus = eventBus;
        
        // 缓存
        this.cachedGradients = {};
        this.cachedGridPattern = null;
        this.needsGridRedraw = true;
        
        this.theme = 'day';
    }

    // 清屏
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // 绘制背景
    drawBackground(theme = this.theme) {
        this.theme = theme;
        const colors = ThemeColors[theme];
        
        if (theme === 'day') {
            this.drawDayBackground(colors);
        } else {
            this.drawNightBackground(colors);
        }
    }

    drawDayBackground(colors) {
        // 天空渐变
        const skyGradient = this.getCachedGradient('daySky', () => {
            const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height * 0.6);
            grad.addColorStop(0, colors.background.sky[0]);
            grad.addColorStop(1, colors.background.sky[1]);
            return grad;
        });
        
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height * 0.6);

        // 地面/球场
        const courtGradient = this.getCachedGradient('dayCourt', () => {
            const grad = this.ctx.createLinearGradient(0, this.canvas.height * 0.6, 0, this.canvas.height);
            grad.addColorStop(0, colors.background.court[0]);
            grad.addColorStop(1, colors.background.court[1]);
            return grad;
        });
        
        this.ctx.fillStyle = courtGradient;
        this.ctx.fillRect(0, this.canvas.height * 0.6, this.canvas.width, this.canvas.height * 0.4);

        // 木地板纹理线条（批量优化）
        this.ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        for (let i = 0; i < this.canvas.width; i += 60) {
            this.ctx.moveTo(i, this.canvas.height * 0.6);
            this.ctx.lineTo(i, this.canvas.height);
        }
        this.ctx.stroke();
    }

    drawNightBackground(colors) {
        // 夜空渐变
        const skyGradient = this.getCachedGradient('nightSky', () => {
            const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            grad.addColorStop(0, colors.background.sky[0]);
            grad.addColorStop(1, colors.background.sky[1]);
            return grad;
        });
        
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 地面
        const courtGradient = this.getCachedGradient('nightCourt', () => {
            const grad = this.ctx.createLinearGradient(0, this.canvas.height * 0.6, 0, this.canvas.height);
            grad.addColorStop(0, colors.background.court[0]);
            grad.addColorStop(1, colors.background.court[1]);
            return grad;
        });
        
        this.ctx.fillStyle = courtGradient;
        this.ctx.fillRect(0, this.canvas.height * 0.6, this.canvas.width, this.canvas.height * 0.4);
    }

    // 绘制球场线条
    drawCourtLines() {
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 4;
        
        // 批量绘制实线
        this.ctx.beginPath();
        GameConfig.lanes.forEach(lane => {
            this.ctx.moveTo(0, lane.y + 25);
            this.ctx.lineTo(this.canvas.width, lane.y + 25);
        });
        this.ctx.stroke();
        
        // 批量绘制虚线
        this.ctx.setLineDash([10, 10]);
        this.ctx.beginPath();
        GameConfig.lanes.forEach(lane => {
            this.ctx.moveTo(0, lane.y - 25);
            this.ctx.lineTo(this.canvas.width, lane.y - 25);
        });
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    // 绘制篮筐
    drawHoop() {
        const hoop = GameConfig.hoop;
        
        CanvasUtils.withState(this.ctx, () => {
            // 篮板
            this.ctx.fillStyle = hoop.backboard.color;
            this.ctx.fillRect(
                hoop.x - hoop.backboard.width / 2,
                hoop.y - hoop.backboard.height / 2,
                hoop.backboard.width,
                hoop.backboard.height
            );
            
            // 篮板边框
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(
                hoop.x - hoop.backboard.width / 2,
                hoop.y - hoop.backboard.height / 2,
                hoop.backboard.width,
                hoop.backboard.height
            );

            // 篮圈（椭圆形）
            this.ctx.strokeStyle = hoop.rim.color;
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.ellipse(hoop.x, hoop.y, hoop.rim.radiusX, hoop.rim.radiusY, 0, 0, Math.PI * 2);
            this.ctx.stroke();

            // 篮网
            this.drawNet(hoop.x, hoop.y, hoop.rim.radiusX);
        });
    }

    drawNet(centerX, centerY, radius) {
        this.ctx.strokeStyle = GameConfig.hoop.net.color;
        this.ctx.lineWidth = 1;
        
        // 绘制网格线
        const segments = 8;
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const startX = centerX + Math.cos(angle) * radius * 0.8;
            const startY = centerY + Math.sin(angle) * GameConfig.hoop.rim.radiusY * 0.8;
            const endX = centerX + Math.cos(angle) * radius * 0.6;
            const endY = centerY + Math.sin(angle) * GameConfig.hoop.rim.radiusY * 0.6 + 15;
            
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
        }
    }

    // 绘制隐形墙（调试用）
    drawInvisibleWall(isFlashing = false) {
        if (!window.DEBUG) return;
        
        const wall = GameConfig.invisibleWall;
        this.ctx.strokeStyle = isFlashing ? '#FF0000' : 'rgba(255, 0, 0, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
    }

    // 缓存渐变
    getCachedGradient(key, createFunction) {
        if (!this.cachedGradients[key]) {
            this.cachedGradients[key] = createFunction();
        }
        return this.cachedGradients[key];
    }

    // 清理缓存
    clearCache() {
        this.cachedGradients = {};
        this.cachedGridPattern = null;
        this.needsGridRedraw = true;
    }
}

// 物理系统
export class PhysicsSystem {
    static updateMovement(object, deltaTime) {
        if (!object.velocity) return;
        
        const normalizedDelta = deltaTime / 16.67; // 60fps基准
        
        object.x += object.velocity.x * normalizedDelta;
        object.y += object.velocity.y * normalizedDelta;
    }

    static applyGravity(object, deltaTime, gravity = PhysicsConfig.gravity) {
        if (!object.vy) return;
        
        const normalizedDelta = deltaTime / 16.67;
        object.vy += gravity * normalizedDelta;
    }

    static constrainToScreen(object, screenWidth, screenHeight) {
        object.x = MathUtils.clamp(object.x, 0, screenWidth - object.width);
        object.y = MathUtils.clamp(object.y, 0, screenHeight - object.height);
    }

    static bounce(object, surface) {
        // 简单的反弹物理
        if (surface.type === 'horizontal') {
            object.vy *= -0.8; // 能量损失
        } else if (surface.type === 'vertical') {
            object.vx *= -0.8;
        }
    }

    // 抛物线运动计算
    static calculateTrajectory(startX, startY, angle, power, gravity = PhysicsConfig.gravity) {
        const vx = Math.cos(angle) * power;
        const vy = Math.sin(angle) * power;
        
        const points = [];
        const timeStep = 0.1;
        const maxTime = 5; // 最大计算时间
        
        for (let t = 0; t < maxTime; t += timeStep) {
            const x = startX + vx * t;
            const y = startY + vy * t + 0.5 * gravity * t * t;
            
            points.push({ x, y, time: t });
            
            // 如果飞出屏幕就停止计算
            if (x < 0 || x > GameConfig.canvas.width || y > GameConfig.canvas.height) {
                break;
            }
        }
        
        return points;
    }
}

// 碰撞系统
export class CollisionSystem {
    constructor(eventBus) {
        this.eventBus = eventBus;
    }

    // 检查玩家与防守队员碰撞
    checkPlayerDefenderCollisions(player, defenders) {
        defenders.forEach(defender => {
            if (this.checkCollision(player, defender)) {
                this.handlePlayerDefenderCollision(player, defender);
            }
        });
    }

    // 检查篮球与篮筐碰撞
    checkBasketballHoop(basketball, hoop) {
        if (!basketball || !basketball.active) return false;
        
        const distance = MathUtils.distance(
            basketball.centerX, basketball.centerY,
            hoop.x, hoop.y
        );
        
        return distance < 25 && basketball.vy > 0; // 篮球必须向下运动才能进筐
    }

    // 检查玩家与隐形墙碰撞
    checkPlayerWallCollision(player) {
        const wall = GameConfig.invisibleWall;
        return CollisionUtils.rectIntersects(
            player.x, player.y, player.width, player.height,
            wall.x, wall.y, wall.width, wall.height
        );
    }

    // 基础碰撞检测
    checkCollision(obj1, obj2) {
        return CollisionUtils.rectIntersects(
            obj1.x, obj1.y, obj1.width, obj1.height,
            obj2.x, obj2.y, obj2.width, obj2.height
        );
    }

    // 处理玩家与防守队员碰撞
    handlePlayerDefenderCollision(player, defender) {
        // 计算推开方向
        const playerCenter = player.getCenter();
        const defenderCenter = defender.getCenter();
        
        const dx = playerCenter.x - defenderCenter.x;
        const dy = playerCenter.y - defenderCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > PhysicsConfig.collisionEpsilon) {
            // 将玩家推离防守队员
            const pushX = (dx / distance) * PhysicsConfig.pushForce;
            const pushY = (dy / distance) * PhysicsConfig.pushForce;
            
            player.x += pushX;
            player.y += pushY;
            
            // 确保玩家在屏幕内
            PhysicsSystem.constrainToScreen(player, GameConfig.canvas.width, GameConfig.canvas.height);
        }
        
        this.eventBus.emit('playerDefenderCollision', { player, defender });
    }

    // 处理玩家与墙壁碰撞
    handlePlayerWallCollision(player) {
        const wall = GameConfig.invisibleWall;
        const playerCenter = player.getCenter();
        const wallCenter = {
            x: wall.x + wall.width / 2,
            y: wall.y + wall.height / 2
        };
        
        const dx = playerCenter.x - wallCenter.x;
        const dy = playerCenter.y - wallCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > PhysicsConfig.collisionEpsilon) {
            player.x += (dx / distance) * PhysicsConfig.pushForce;
            player.y += (dy / distance) * PhysicsConfig.pushForce;
        } else {
            player.y += PhysicsConfig.pushForce; // 默认向下推
        }
        
        PhysicsSystem.constrainToScreen(player, GameConfig.canvas.width, GameConfig.canvas.height);
        this.eventBus.emit('playerWallCollision', { player });
    }
}

// 动画系统
export class AnimationSystem {
    constructor() {
        this.tweens = [];
        this.runningAnimations = new Map();
    }

    // 创建动画补间
    createTween(target, properties, duration, easing = 'linear') {
        const tween = {
            target,
            startValues: {},
            endValues: properties,
            duration,
            elapsed: 0,
            easing,
            active: true,
            onComplete: null,
            onUpdate: null
        };

        // 记录起始值
        Object.keys(properties).forEach(prop => {
            tween.startValues[prop] = target[prop];
        });

        this.tweens.push(tween);
        return tween;
    }

    // 更新所有动画
    update(deltaTime) {
        this.tweens = this.tweens.filter(tween => {
            if (!tween.active) return false;

            tween.elapsed += deltaTime;
            const progress = Math.min(tween.elapsed / tween.duration, 1);
            
            // 应用缓动函数
            const easedProgress = this.applyEasing(progress, tween.easing);

            // 更新属性
            Object.keys(tween.endValues).forEach(prop => {
                const start = tween.startValues[prop];
                const end = tween.endValues[prop];
                tween.target[prop] = MathUtils.lerp(start, end, easedProgress);
            });

            // 调用更新回调
            if (tween.onUpdate) {
                tween.onUpdate(easedProgress);
            }

            // 检查完成
            if (progress >= 1) {
                if (tween.onComplete) {
                    tween.onComplete();
                }
                return false; // 移除已完成的动画
            }

            return true;
        });
    }

    // 缓动函数
    applyEasing(t, easing) {
        switch (easing) {
            case 'easeIn': return t * t;
            case 'easeOut': return t * (2 - t);
            case 'easeInOut': return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            case 'bounce': 
                if (t < 1/2.75) return 7.5625 * t * t;
                if (t < 2/2.75) return 7.5625 * (t -= 1.5/2.75) * t + 0.75;
                if (t < 2.5/2.75) return 7.5625 * (t -= 2.25/2.75) * t + 0.9375;
                return 7.5625 * (t -= 2.625/2.75) * t + 0.984375;
            default: return t; // linear
        }
    }

    // 停止特定目标的所有动画
    stopTweens(target) {
        this.tweens.forEach(tween => {
            if (tween.target === target) {
                tween.active = false;
            }
        });
    }

    // 清除所有动画
    clear() {
        this.tweens = [];
        this.runningAnimations.clear();
    }
}

// 粒子系统
export class ParticleSystem {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.particles = [];
        this.scorePopups = [];
        this.maxParticles = 200;
    }

    // 创建得分特效
    createScoreEffect(x, y, points = 10) {
        const config = GameConfig.particles.scoreEffect;
        
        // 创建粒子
        for (let i = 0; i < config.count; i++) {
            const particle = new Particle(x, y, {
                vx: (Math.random() - 0.5) * config.spreadX,
                vy: Math.random() * -config.spreadY - 3,
                life: config.life,
                color: `hsl(${Math.random() * 360}, 100%, 60%)`,
                size: MathUtils.random(config.size.min, config.size.max),
                gravity: config.gravity
            });
            
            this.addParticle(particle);
        }

        // 创建得分弹出文本
        const popup = new ScorePopup(x, y, points);
        this.scorePopups.push(popup);
    }

    // 创建烟花效果
    createFireworkEffect(x, y) {
        for (let i = 0; i < 30; i++) {
            const angle = (i / 30) * Math.PI * 2;
            const speed = MathUtils.random(3, 8);
            
            const particle = new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 100,
                color: `hsl(${Math.random() * 360}, 100%, 60%)`,
                size: MathUtils.random(2, 5),
                gravity: 0.1
            });
            
            this.addParticle(particle);
        }
    }

    // 添加粒子
    addParticle(particle) {
        this.particles.push(particle);
        
        // 限制粒子数量
        if (this.particles.length > this.maxParticles) {
            this.particles.shift();
        }
    }

    // 更新粒子系统
    update(deltaTime) {
        // 更新粒子
        this.particles = this.particles.filter(particle => {
            particle.update(deltaTime);
            return particle.active;
        });

        // 更新得分弹出
        this.scorePopups = this.scorePopups.filter(popup => {
            popup.update(deltaTime);
            return popup.active;
        });
    }

    // 渲染粒子系统
    render(ctx) {
        // 渲染粒子
        this.particles.forEach(particle => {
            particle.render(ctx);
        });

        // 渲染得分弹出
        this.scorePopups.forEach(popup => {
            popup.render(ctx);
        });
    }

    // 清理所有粒子
    clear() {
        this.particles = [];
        this.scorePopups = [];
    }

    // 获取粒子统计信息
    getStats() {
        return {
            particles: this.particles.length,
            scorePopups: this.scorePopups.length,
            total: this.particles.length + this.scorePopups.length
        };
    }
}

// 星空系统
export class StarFieldSystem {
    constructor() {
        this.stars = [];
        this.initStarField();
    }

    initStarField() {
        const config = GameConfig.starField;
        
        for (let i = 0; i < config.count; i++) {
            this.stars.push({
                x: Math.random() * GameConfig.canvas.width,
                y: Math.random() * GameConfig.canvas.height,
                size: Math.random() * config.maxSize,
                opacity: Math.random(),
                twinkleSpeed: MathUtils.random(0.01, 0.03),
                twinklePhase: Math.random() * Math.PI * 2
            });
        }
    }

    update(deltaTime) {
        const normalizedDelta = deltaTime / 16.67;
        
        this.stars.forEach(star => {
            star.twinklePhase += star.twinkleSpeed * normalizedDelta;
            star.opacity = (Math.sin(star.twinklePhase) + 1) / 2; // 0-1之间
        });
    }

    render(ctx) {
        CanvasUtils.withState(ctx, () => {
            this.stars.forEach(star => {
                ctx.globalAlpha = star.opacity;
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();
            });
        });
    }

    // 重新初始化（用于屏幕尺寸改变）
    reinitialize() {
        this.stars = [];
        this.initStarField();
    }
}

// 投篮系统
export class ShootingSystem {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.phase = null; // null, 'angle', 'power'
        this.aimAngle = 0;
        this.aimSpeed = GameConfig.shooting.aimSpeed;
        this.powerIndicator = 0;
        this.powerSpeed = GameConfig.shooting.powerSpeed;
        this.powerDirection = 1;
        this.lockedAngle = 0;
        this.shootingRange = GameConfig.shooting.range;
        this.maxPowerDistance = GameConfig.shooting.maxPowerDistance;
        
        this.spaceButton = {
            ...GameConfig.spaceButton,
            x: 0,
            y: GameConfig.lanes[GameConfig.lanes.length - 1].y - 40
        };
        this.spaceButtonSide = Math.random() < 0.5 ? 'left' : 'right';
        this.spaceButtonTimer = 0;
        
        this.positionSpaceButton();
    }

    // 开始瞄准
    startAiming() {
        if (this.phase !== null) return false;
        
        this.phase = 'angle';
        this.aimAngle = -this.shootingRange / 2; // 从左边开始
        this.eventBus.emit('shootingStarted', { phase: 'angle' });
        return true;
    }

    // 锁定角度，开始力度选择
    lockAngle() {
        if (this.phase !== 'angle') return false;
        
        this.lockedAngle = this.aimAngle;
        this.phase = 'power';
        this.powerIndicator = 0;
        this.powerDirection = 1;
        this.eventBus.emit('shootingPhaseChanged', { phase: 'power', angle: this.lockedAngle });
        return true;
    }

    // 执行投篮
    shoot() {
        if (this.phase !== 'power') return null;
        
        const power = this.powerIndicator * 15 + 5; // 5-20的力度范围
        const basketball = {
            angle: this.lockedAngle,
            power: power,
            startX: GameConfig.player.startX + GameConfig.player.size.width / 2,
            startY: GameConfig.player.startY
        };
        
        this.reset();
        this.eventBus.emit('basketballShot', basketball);
        
        return basketball;
    }

    // 重置投篮状态
    reset() {
        this.phase = null;
        this.aimAngle = 0;
        this.lockedAngle = 0;
        this.powerIndicator = 0;
        this.powerDirection = 1;
        this.repositionSpaceButton();
    }

    // 更新投篮系统
    update(deltaTime) {
        this.updateSpaceButton(deltaTime);
        
        if (this.phase === 'angle') {
            this.updateAiming(deltaTime);
        } else if (this.phase === 'power') {
            this.updatePower(deltaTime);
        }
    }

    updateAiming(deltaTime) {
        const normalizedDelta = deltaTime / 16.67;
        this.aimAngle += this.aimSpeed * normalizedDelta;
        
        // 角度在范围内摆动
        if (this.aimAngle > this.shootingRange / 2) {
            this.aimAngle = this.shootingRange / 2;
            this.aimSpeed *= -1;
        } else if (this.aimAngle < -this.shootingRange / 2) {
            this.aimAngle = -this.shootingRange / 2;
            this.aimSpeed *= -1;
        }
    }

    updatePower(deltaTime) {
        const normalizedDelta = deltaTime / 16.67;
        this.powerIndicator += this.powerSpeed * this.powerDirection * normalizedDelta;
        
        // 力度在0-1之间摆动
        if (this.powerIndicator >= 1) {
            this.powerIndicator = 1;
            this.powerDirection = -1;
        } else if (this.powerIndicator <= 0) {
            this.powerIndicator = 0;
            this.powerDirection = 1;
        }
    }

    updateSpaceButton(deltaTime) {
        this.spaceButtonTimer += deltaTime / 16.67;
        
        // 按钮移动逻辑（如果需要的话）
        if (this.spaceButtonTimer > 300) { // 5秒后重新定位
            this.repositionSpaceButton();
        }
    }

    positionSpaceButton() {
        const margin = 40;
        const halfWidth = GameConfig.canvas.width / 2;
        
        if (this.spaceButtonSide === 'left') {
            this.spaceButton.x = margin;
        } else {
            this.spaceButton.x = GameConfig.canvas.width - this.spaceButton.width - margin;
        }
    }

    repositionSpaceButton() {
        this.spaceButtonSide = Math.random() < 0.5 ? 'left' : 'right';
        this.spaceButtonTimer = 0;
        this.positionSpaceButton();
    }

    // 检查玩家是否在Space按钮区域
    isPlayerInSpaceButtonArea(player) {
        return CollisionUtils.rectIntersects(
            player.x, player.y, player.width, player.height,
            this.spaceButton.x, this.spaceButton.y, this.spaceButton.width, this.spaceButton.height
        );
    }

    // 渲染投篮系统
    renderShootingUI(ctx, player) {
        this.renderSpaceButton(ctx, player);
        
        if (this.phase === 'angle') {
            this.renderAimingArc(ctx, player);
        } else if (this.phase === 'power') {
            this.renderPowerIndicator(ctx, player);
        }
    }

    renderSpaceButton(ctx, player) {
        const isPlayerNear = this.isPlayerInSpaceButtonArea(player);
        
        CanvasUtils.withState(ctx, () => {
            // 按钮背景
            ctx.fillStyle = isPlayerNear ? '#FF4444' : '#FF6666';
            CanvasUtils.roundRect(ctx, this.spaceButton.x, this.spaceButton.y, 
                                this.spaceButton.width, this.spaceButton.height, 8);
            ctx.fill();
            
            // 按钮边框
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // 按钮文字
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('SPACE', 
                this.spaceButton.x + this.spaceButton.width / 2,
                this.spaceButton.y + this.spaceButton.height / 2);
        });
    }

    renderAimingArc(ctx, player) {
        const playerCenter = player.getCenter();
        
        CanvasUtils.withState(ctx, () => {
            ctx.strokeStyle = '#FFFF00';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(playerCenter.x, playerCenter.y, 50, 
                   this.aimAngle - 0.1, this.aimAngle + 0.1);
            ctx.stroke();
            
            // 瞄准线
            const lineEndX = playerCenter.x + Math.cos(this.aimAngle) * 80;
            const lineEndY = playerCenter.y + Math.sin(this.aimAngle) * 80;
            
            ctx.beginPath();
            ctx.moveTo(playerCenter.x, playerCenter.y);
            ctx.lineTo(lineEndX, lineEndY);
            ctx.stroke();
        });
    }

    renderPowerIndicator(ctx, player) {
        const playerCenter = player.getCenter();
        const powerDistance = this.powerIndicator * this.maxPowerDistance;
        
        const powerX = playerCenter.x + Math.cos(this.lockedAngle) * powerDistance;
        const powerY = playerCenter.y + Math.sin(this.lockedAngle) * powerDistance;
        
        CanvasUtils.withState(ctx, () => {
            // 力度线
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(playerCenter.x, playerCenter.y);
            ctx.lineTo(powerX, powerY);
            ctx.stroke();
            
            // 力度指示器颜色
            let powerColor;
            if (this.powerIndicator < 0.5) {
                const ratio = this.powerIndicator * 2;
                powerColor = `rgb(${Math.floor(255 * ratio)}, 255, 0)`;
            } else {
                const ratio = (this.powerIndicator - 0.5) * 2;
                powerColor = `rgb(255, ${Math.floor(255 * (1 - ratio))}, 0)`;
            }
            
            ctx.fillStyle = powerColor;
            ctx.shadowColor = powerColor;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(powerX, powerY, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        });
    }

    // 获取当前状态
    getState() {
        return {
            phase: this.phase,
            aimAngle: this.aimAngle,
            lockedAngle: this.lockedAngle,
            powerIndicator: this.powerIndicator,
            spaceButtonPosition: { ...this.spaceButton }
        };
    }
}