/**
 * 游戏逻辑核心类
 * 
 * 设计意图：
 * - 作为游戏的"心脏"，包含所有核心游戏机制
 * - 管理玩家、防守者、投篮、得分等游戏逻辑
 * - 与渲染分离，专注于逻辑处理
 * - 提供清晰的状态管理接口
 */

// 导入依赖模块
import { 
    GAME_CONSTANTS, 
    GAME_CONFIG, 
    GAME_LANES,
    DEFENDER_CONFIG,
    APPEARANCE_PRESETS,
    VISUAL_CONFIG,
    DEFAULT_VALUES,
    STORAGE_KEYS
} from '../Constants.js';

import { GameUtils } from '../utils/GameUtils.js';

/**
 * 游戏逻辑核心类
 * 
 * 职责：
 * - 玩家系统管理
 * - 防守者AI管理  
 * - 投篮系统管理
 * - 得分系统管理
 * - 碰撞检测管理
 * - 特效系统管理
 */
export class GameLogic {
    /**
     * 构造函数
     * 设计意图：初始化游戏逻辑，设置初始状态
     * 
     * @param {HTMLCanvasElement} canvas - 游戏画布
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.engine = null; // 将由GameEngine设置
        
        // === 游戏状态 ===
        this.score = 0;                     // 当前分数
        this.gameRunning = false;           // 游戏是否运行中
        this.gameWon = false;               // 是否已获胜
        this.isCelebrating = false;         // 是否在庆祝中
        this.animationFrame = 0;            // 动画帧计数
        
        // === 初始化各个系统 ===
        this.initializePlayer();
        this.initializeDefenders();
        this.initializeShootingSystem();
        this.initializeEffectSystem();
        this.initializeAudience();
        this.initializeStarField();
        
        console.log('游戏逻辑初始化完成');
    }
    
    /**
     * 设置游戏引擎引用
     * 设计意图：获取引擎实例以访问输入状态等
     * 
     * @param {GameEngine} engine - 游戏引擎实例
     */
    setEngine(engine) {
        this.engine = engine;
    }
    
    // === 系统初始化方法 ===
    
    /**
     * 初始化玩家系统
     * 设计意图：设置玩家初始状态和属性
     */
    initializePlayer() {
        // 从本地存储加载外观设置
        const savedAppearance = GameUtils.loadFromStorage(
            STORAGE_KEYS.APPEARANCE, 
            DEFAULT_VALUES.playerAppearance
        );
        
        this.player = {
            x: DEFAULT_VALUES.playerPosition.x,
            y: DEFAULT_VALUES.playerPosition.y,
            width: GAME_CONSTANTS.PLAYER_WIDTH,
            height: GAME_CONSTANTS.PLAYER_HEIGHT,
            speed: GAME_CONSTANTS.PLAYER_SPEED,
            animFrame: 0,
            animSpeed: 8,
            dribbling: true,
            
            // 外观配置
            appearance: { ...savedAppearance },
            
            // 保持向后兼容的旧属性
            jerseyNumber: APPEARANCE_PRESETS.numbers[savedAppearance.numberIndex] || '1',
            bodyColor1: APPEARANCE_PRESETS.jerseys[savedAppearance.jerseyIndex]?.color1 || '#00529B',
            bodyColor2: APPEARANCE_PRESETS.jerseys[savedAppearance.jerseyIndex]?.color2 || '#FFD700'
        };
    }
    
    /**
     * 初始化防守者系统
     * 设计意图：根据配置创建防守者数组
     */
    initializeDefenders() {
        this.defenders = [];
        
        GAME_LANES.forEach((lane, laneIndex) => {
            if (laneIndex === 0) {
                // 第一排：3组，每组3个
                const config = DEFENDER_CONFIG.LANE_0;
                for (let group = 0; group < config.groupCount; group++) {
                    for (let i = 0; i < config.playersPerGroup; i++) {
                        this.defenders.push({
                            x: (group * config.groupSpacing) + (i * config.playerSpacing) + config.baseX,
                            y: lane.y,
                            width: config.width,
                            height: config.height,
                            speed: lane.speed,
                            direction: lane.direction,
                            laneIndex: laneIndex,
                            groupIndex: group,
                            playerInGroup: i,
                            color: `hsl(${120 + laneIndex * 60}, 70%, 50%)`,
                            jerseyNumber: GameUtils.randomInt(1, 99),
                            animOffset: Math.random() * 10
                        });
                    }
                }
            } else if (laneIndex === 2) {
                // 第三排：4组，每组2个
                const config = DEFENDER_CONFIG.LANE_2;
                for (let group = 0; group < config.groupCount; group++) {
                    for (let i = 0; i < config.playersPerGroup; i++) {
                        this.defenders.push({
                            x: (group * config.groupSpacing) + (i * config.playerSpacing) + config.baseX,
                            y: lane.y,
                            width: config.width,
                            height: config.height,
                            speed: lane.speed,
                            direction: lane.direction,
                            laneIndex: laneIndex,
                            groupIndex: group,
                            playerInGroup: i,
                            color: `hsl(${120 + laneIndex * 60}, 70%, 50%)`,
                            jerseyNumber: GameUtils.randomInt(1, 99),
                            animOffset: Math.random() * 10
                        });
                    }
                }
            } else {
                // 第二排：标准配置
                const defenderCount = 3 + laneIndex;
                for (let i = 0; i < defenderCount; i++) {
                    this.defenders.push({
                        x: (i * 200) + Math.random() * 100,
                        y: lane.y,
                        width: DEFENDER_CONFIG.LANE_1.width,
                        height: DEFENDER_CONFIG.LANE_1.height,
                        speed: lane.speed,
                        direction: lane.direction,
                        laneIndex: laneIndex,
                        color: `hsl(${120 + laneIndex * 60}, 70%, 50%)`,
                        jerseyNumber: GameUtils.randomInt(1, 99),
                        animOffset: Math.random() * 10
                    });
                }
            }
        });
    }
    
    /**
     * 初始化投篮系统
     * 设计意图：设置投篮相关的状态和配置
     */
    initializeShootingSystem() {
        // 投篮阶段管理
        this.shootingPhase = GAME_CONFIG.SHOOTING_PHASES.IDLE;
        this.aimAngle = 0;
        this.aimSpeed = VISUAL_CONFIG.shooting.aimSpeed;
        this.basketball = null;
        this.shootingRange = VISUAL_CONFIG.shooting.range;
        
        // 力度系统
        this.powerIndicator = 0;
        this.powerSpeed = VISUAL_CONFIG.shooting.powerSpeed;
        this.powerDirection = 1;
        this.lockedAngle = 0;
        this.maxPowerDistance = VISUAL_CONFIG.shooting.maxPowerDistance;
        
        // 空间按钮系统
        const dashedY = GAME_LANES[GAME_LANES.length - 1].y - 25;
        this.spaceButton = {
            width: VISUAL_CONFIG.spaceButton.width,
            height: VISUAL_CONFIG.spaceButton.height,
            x: 0,
            y: dashedY - VISUAL_CONFIG.spaceButton.offsetY
        };
        this.spaceButtonSide = Math.random() < 0.5 ? 'left' : 'right';
        this.spaceButtonTimer = 0;
        this.positionSpaceButton();
        
        // 篮筐和墙壁系统
        this.basket = {
            x: this.canvas.width / 2 - GAME_CONSTANTS.BASKET_WIDTH / 2,
            y: 120,
            width: GAME_CONSTANTS.BASKET_WIDTH,
            height: GAME_CONSTANTS.BASKET_HEIGHT
        };
        
        this.invisibleWall = {
            x: this.canvas.width / 2 - VISUAL_CONFIG.invisibleWall.width / 2,
            y: 100,
            width: VISUAL_CONFIG.invisibleWall.width,
            height: VISUAL_CONFIG.invisibleWall.height
        };
        
        // 特效状态
        this.wallFlashTime = 0;
        this.wallFlashDuration = GAME_CONSTANTS.WALL_FLASH_DURATION;
        
        // 投篮失败重置系统
        this.missedState = GAME_CONFIG.MISSED_STATES.IDLE;
        this.missedCountdown = 0;
        this.missedCountdownValue = 3;
        this.teleportEffect = {
            sourceCircle: { x: 0, y: 0, radius: 0, maxRadius: 50 },
            targetCircle: { x: 0, y: 0, radius: 100, maxRadius: 50 },
            duration: VISUAL_CONFIG.teleportEffect.duration,
            timer: 0
        };
    }
    
    /**
     * 初始化特效系统
     * 设计意图：设置粒子系统和特效管理
     */
    initializeEffectSystem() {
        this.particles = [];
        this.scorePopups = [];
    }
    
    /**
     * 初始化观众系统
     * 设计意图：创建观众席
     */
    initializeAudience() {
        this.audience = [];
        this.audienceCheerTime = 0;
        
        // 创建观众
        for (let row = 0; row < 2; row++) {
            for (let i = 0; i < 25; i++) {
                this.audience.push({
                    x: 50 + (i * 28),
                    y: 5 + (row * 18),
                    width: 24,
                    height: 32,
                    cheerFrame: 0,
                    baseY: 5 + (row * 18),
                    scale: 1.2 + (row * 0.1),
                    color: GameUtils.randomColor(),
                    shirtColor: GameUtils.randomColor()
                });
            }
        }
    }
    
    /**
     * 初始化星空系统
     * 设计意图：创建夜晚主题的星空效果
     */
    initializeStarField() {
        this.starField = [];
        
        // 创建星星
        for (let i = 0; i < 100; i++) {
            this.starField.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height * 0.6,
                size: Math.random() * 2 + 1,
                twinkle: Math.random() * Math.PI * 2,
                speed: Math.random() * 0.02 + 0.01
            });
        }
    }
    
    // === 核心更新方法 ===
    
    /**
     * 主更新方法
     * 设计意图：统一更新所有游戏逻辑
     */
    update() {
        // 更新动画帧
        this.animationFrame++;
        
        // 更新空间按钮（即使游戏暂停也要更新）
        this.updateSpaceButton();
        
        // 如果游戏没有运行且不在庆祝中，只更新基础动画
        if (!this.gameRunning && !this.isCelebrating) {
            return;
        }
        
        // 更新视觉效果
        this.updateParticles();
        this.updateAudience();
        
        // 核心游戏逻辑仅在游戏运行时更新
        if (this.gameRunning) {
            this.updatePlayer();
            this.updateDefenders();
            this.checkCollisions();
            this.checkScoring();
        }
        
        // 更新投篮相关逻辑
        this.updateShooting();
        
        // 更新墙壁闪烁效果
        if (this.wallFlashTime > 0) {
            this.wallFlashTime--;
        }
        
        // 更新投篮失败重置效果
        this.updateMissedEffect();
    }
    
    /**
     * 更新玩家状态
     * 设计意图：处理玩家移动和动画
     */
    updatePlayer() {
        // 在投篮失败重置期间，玩家不能移动
        if (this.missedState !== GAME_CONFIG.MISSED_STATES.IDLE) {
            return;
        }
        
        if (!this.engine) return;
        
        // 获取输入状态
        const leftPressed = this.engine.isKeyPressed('ArrowLeft') || 
                           this.engine.isKeyPressed('KeyA');
        const rightPressed = this.engine.isKeyPressed('ArrowRight') || 
                            this.engine.isKeyPressed('KeyD');
        const upPressed = this.engine.isKeyPressed('ArrowUp') || 
                         this.engine.isKeyPressed('KeyW');
        const downPressed = this.engine.isKeyPressed('ArrowDown') || 
                           this.engine.isKeyPressed('KeyS');
        
        // 左右移动
        if (leftPressed && this.player.x > 0) {
            this.player.x -= this.player.speed;
        }
        if (rightPressed && this.player.x < this.canvas.width - this.player.width) {
            this.player.x += this.player.speed;
        }
        
        // 上下移动
        if (upPressed && this.player.y > 80) {
            this.player.y -= this.player.speed;
        }
        if (downPressed && this.player.y < this.canvas.height - this.player.height - 20) {
            this.player.y += this.player.speed;
        }
        
        // 更新动画帧
        if (this.animationFrame % this.player.animSpeed === 0) {
            this.player.animFrame = (this.player.animFrame + 1) % 4;
        }
    }
    
    /**
     * 更新防守者AI
     * 设计意图：处理防守者移动逻辑
     */
    updateDefenders() {
        this.defenders.forEach(defender => {
            // 水平移动
            defender.x += defender.speed * defender.direction;
            
            // 边界反弹
            if (defender.x <= 0 || defender.x >= this.canvas.width - defender.width) {
                defender.direction *= -1;
            }
        });
    }
    
    /**
     * 检查碰撞
     * 设计意图：处理所有碰撞检测逻辑
     */
    checkCollisions() {
        // 检查与防守队员的碰撞
        this.defenders.forEach(defender => {
            if (GameUtils.isColliding(this.player, defender)) {
                this.gameOver();
            }
        });
        
        // 检查与隐形墙的碰撞
        if (GameUtils.isColliding(this.player, this.invisibleWall)) {
            this.handleWallCollision();
        }
    }
    
    /**
     * 处理墙壁碰撞
     * 设计意图：处理玩家撞墙的逻辑
     */
    handleWallCollision() {
        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;
        const wallCenterX = this.invisibleWall.x + this.invisibleWall.width / 2;
        const wallCenterY = this.invisibleWall.y + this.invisibleWall.height / 2;
        
        // 计算推回方向
        const dx = playerCenterX - wallCenterX;
        const dy = playerCenterY - wallCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0.01) {
            // 将玩家推离墙壁
            this.player.x += (dx / distance) * 5;
            this.player.y += (dy / distance) * 5;
        } else {
            // 默认推回方向
            this.player.y += 5;
        }
        
        // 触发闪烁效果
        if (this.wallFlashTime <= 0) {
            this.wallFlashTime = this.wallFlashDuration;
        }
    }
    
    /**
     * 检查得分
     * 设计意图：处理得分逻辑和胜利条件
     */
    checkScoring() {
        // 检查玩家是否到达篮筐
        if (GameUtils.isColliding(this.player, this.basket)) {
            // 庆祝期间防止重复计分
            if (this.isCelebrating) return;
            
            this.score += GAME_CONSTANTS.SCORE_PER_BASKET;
            
            // 创建得分特效
            this.createScoreEffect(
                this.basket.x + this.basket.width / 2, 
                this.basket.y
            );
            
            this.triggerAudienceCheer();
            this.createFireworks();
            this.increaseDifficulty();
            
            // 检查胜利条件
            if (this.score >= GAME_CONSTANTS.WINNING_SCORE) {
                this.handleGameWin();
            } else {
                // 重置玩家位置
                this.resetPlayerPosition();
            }
        }
    }
    
    /**
     * 处理游戏胜利
     * 设计意图：处理胜利状态和庆祝效果
     */
    handleGameWin() {
        this.isCelebrating = true;
        this.gameRunning = false;
        
        // 盛大的烟花庆祝
        for (let i = 0; i < 5; i++) {
            setTimeout(() => this.createFireworks(), i * GAME_CONSTANTS.FIREWORK_INTERVAL);
        }
        
        // 延迟触发胜利
        setTimeout(() => {
            this.gameWon = true;
        }, GAME_CONSTANTS.CELEBRATION_DELAY);
    }
    
    /**
     * 重置玩家位置
     * 设计意图：得分后重置玩家位置
     */
    resetPlayerPosition() {
        this.player.x = this.canvas.width / 2;
        this.player.y = 520;
    }
    
    /**
     * 增加游戏难度
     * 设计意图：随着得分增加难度
     */
    increaseDifficulty() {
        this.defenders.forEach(defender => {
            defender.speed += GAME_CONSTANTS.DEFENDER_SPEED_INCREASE;
        });
    }
    
    /**
     * 创建得分特效
     * 设计意图：在得分时创建视觉效果
     * 
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    createScoreEffect(x, y) {
        // 创建得分粒子效果
        for (let i = 0; i < 10; i++) {
            const particle = GameUtils.createParticle(x, y, {
                vx: GameUtils.random(-4, 4),
                vy: GameUtils.random(-8, -2),
                color: GameUtils.randomColor(),
                size: GameUtils.random(3, 6),
                life: 60
            });
            this.particles.push(particle);
        }
        
        // 添加得分文字
        this.scorePopups.push({
            x: x,
            y: y,
            text: `+${GAME_CONSTANTS.SCORE_PER_BASKET}`,
            life: 60,
            vy: -2
        });
    }
    
    /**
     * 触发观众欢呼
     * 设计意图：得分时触发观众反应
     */
    triggerAudienceCheer() {
        this.audienceCheerTime = 120; // 2秒的欢呼
    }
    
    /**
     * 创建烟花效果
     * 设计意图：创建庆祝烟花
     */
    createFireworks() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 3;
        
        // 创建烟花爆炸效果
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const speed = GameUtils.random(3, 8);
            
            const particle = GameUtils.createParticle(centerX, centerY, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: GameUtils.randomColor(),
                size: GameUtils.random(2, 4),
                life: 90,
                decay: 0.95
            });
            
            this.particles.push(particle);
        }
    }
    
    /**
     * 更新粒子系统
     * 设计意图：更新所有粒子状态
     */
    updateParticles() {
        // 更新粒子
        this.particles = this.particles.filter(particle => {
            return GameUtils.updateParticle(particle);
        });
        
        // 更新得分文字
        this.scorePopups = this.scorePopups.filter(popup => {
            popup.y += popup.vy;
            popup.life--;
            return popup.life > 0;
        });
    }
    
    /**
     * 更新观众状态
     * 设计意图：更新观众动画
     */
    updateAudience() {
        if (this.audienceCheerTime > 0) {
            this.audienceCheerTime--;
            
            // 更新观众动画
            this.audience.forEach((member, index) => {
                member.cheerFrame = Math.sin((this.animationFrame + index) * 0.2) * 5;
            });
        }
    }
    
    /**
     * 更新星空效果
     * 设计意图：更新夜晚主题的星空动画
     */
    updateStarField() {
        this.starField.forEach(star => {
            star.twinkle += star.speed;
        });
    }
    
    /**
     * 定位空间按钮
     * 设计意图：随机定位空间按钮位置
     */
    positionSpaceButton() {
        if (this.spaceButtonSide === 'left') {
            this.spaceButton.x = 50;
        } else {
            this.spaceButton.x = this.canvas.width - this.spaceButton.width - 50;
        }
    }
    
    /**
     * 更新空间按钮
     * 设计意图：管理空间按钮的计时和重新定位
     */
    updateSpaceButton() {
        this.spaceButtonTimer++;
        
        if (this.spaceButtonTimer >= GAME_CONSTANTS.SPACE_BUTTON_INTERVAL) {
            this.spaceButtonTimer = 0;
            this.spaceButtonSide = this.spaceButtonSide === 'left' ? 'right' : 'left';
            this.positionSpaceButton();
        }
    }
    
    /**
     * 检查玩家是否在空间按钮区域
     * 设计意图：检查空格键触发条件
     * 
     * @returns {boolean} 是否在区域内
     */
    isPlayerInSpaceButtonArea() {
        return GameUtils.isColliding(this.player, this.spaceButton);
    }
    
    /**
     * 更新投篮系统
     * 设计意图：处理投篮相关逻辑
     */
    updateShooting() {
        // 更新瞄准角度
        if (this.shootingPhase === GAME_CONFIG.SHOOTING_PHASES.ANGLE) {
            this.aimAngle += this.aimSpeed;
            if (this.aimAngle > this.shootingRange / 2) {
                this.aimAngle = this.shootingRange / 2;
                this.aimSpeed = -this.aimSpeed;
            } else if (this.aimAngle < -this.shootingRange / 2) {
                this.aimAngle = -this.shootingRange / 2;
                this.aimSpeed = -this.aimSpeed;
            }
        }
        
        // 更新力度指示器
        if (this.shootingPhase === GAME_CONFIG.SHOOTING_PHASES.POWER) {
            this.powerIndicator += this.powerSpeed * this.powerDirection;
            if (this.powerIndicator >= 1) {
                this.powerIndicator = 1;
                this.powerDirection = -1;
            } else if (this.powerIndicator <= 0) {
                this.powerIndicator = 0;
                this.powerDirection = 1;
            }
        }
        
        // 更新篮球物理
        if (this.basketball) {
            this.updateBasketballPhysics();
        }
    }
    
    /**
     * 更新篮球物理
     * 设计意图：处理篮球的移动和碰撞
     */
    updateBasketballPhysics() {
        this.basketball.x += this.basketball.vx;
        this.basketball.y += this.basketball.vy;
        this.basketball.vy += 0.5; // 重力
        
        // 检查是否进入篮筐
        if (this.isBasketballInHoop()) {
            this.handleSuccessfulShot();
        }
        
        // 检查是否出界或超时
        if (this.basketball.y > this.canvas.height || 
            this.basketball.x < 0 || 
            this.basketball.x > this.canvas.width) {
            this.handleMissedShot();
        }
    }
    
    /**
     * 检查篮球是否在篮筐内
     * 设计意图：判断投篮是否成功
     * 
     * @returns {boolean} 是否在篮筐内
     */
    isBasketballInHoop() {
        if (!this.basketball) return false;
        
        const hoopArea = {
            x: this.canvas.width / 2 - 30,
            y: 115,
            width: 60,
            height: 20
        };
        
        return GameUtils.pointInRect(this.basketball, hoopArea) && 
               this.basketball.vy > 0; // 向下运动才算进
    }
    
    /**
     * 处理投篮成功
     * 设计意图：处理投篮得分
     */
    handleSuccessfulShot() {
        this.score += GAME_CONSTANTS.SCORE_PER_SHOT;
        this.createScoreEffect(this.basketball.x, this.basketball.y);
        this.resetShooting();
    }
    
    /**
     * 处理投篮失败
     * 设计意图：处理投篮失败的重置
     */
    handleMissedShot() {
        this.startMissedEffect();
    }
    
    /**
     * 开始投篮失败效果
     * 设计意图：启动失败重置动画
     */
    startMissedEffect() {
        this.missedState = GAME_CONFIG.MISSED_STATES.COUNTDOWN;
        this.missedCountdown = GAME_CONSTANTS.MISSED_COUNTDOWN_FRAMES;
        this.missedCountdownValue = 3;
        this.basketball = null;
    }
    
    /**
     * 更新失败重置效果
     * 设计意图：处理失败重置动画
     */
    updateMissedEffect() {
        if (this.missedState === GAME_CONFIG.MISSED_STATES.COUNTDOWN) {
            this.missedCountdown--;
            
            // 每秒更新倒计时数字
            if (this.missedCountdown % 60 === 0) {
                this.missedCountdownValue--;
            }
            
            if (this.missedCountdown <= 0) {
                this.startTeleportEffect();
            }
        } else if (this.missedState === GAME_CONFIG.MISSED_STATES.TELEPORT) {
            this.updateTeleportEffect();
        }
    }
    
    /**
     * 开始传送效果
     * 设计意图：启动传送动画
     */
    startTeleportEffect() {
        this.missedState = GAME_CONFIG.MISSED_STATES.TELEPORT;
        
        // 设置传送效果
        this.teleportEffect.sourceCircle.x = this.player.x + this.player.width / 2;
        this.teleportEffect.sourceCircle.y = this.player.y + this.player.height / 2;
        this.teleportEffect.targetCircle.x = this.canvas.width / 2;
        this.teleportEffect.targetCircle.y = 520;
        this.teleportEffect.timer = 0;
    }
    
    /**
     * 更新传送效果
     * 设计意图：处理传送动画和玩家传送
     */
    updateTeleportEffect() {
        this.teleportEffect.timer++;
        
        const progress = this.teleportEffect.timer / this.teleportEffect.duration;
        
        // 更新圆圈大小
        this.teleportEffect.sourceCircle.radius = 
            (1 - progress) * this.teleportEffect.sourceCircle.maxRadius;
        this.teleportEffect.targetCircle.radius = 
            progress * this.teleportEffect.targetCircle.maxRadius;
        
        if (this.teleportEffect.timer >= this.teleportEffect.duration) {
            // 传送玩家
            this.player.x = this.teleportEffect.targetCircle.x - this.player.width / 2;
            this.player.y = this.teleportEffect.targetCircle.y - this.player.height / 2;
            
            // 重置状态
            this.missedState = GAME_CONFIG.MISSED_STATES.IDLE;
            this.resetShooting();
        }
    }
    
    /**
     * 重置投篮状态
     * 设计意图：重置投篮系统到初始状态
     */
    resetShooting() {
        this.shootingPhase = GAME_CONFIG.SHOOTING_PHASES.IDLE;
        this.basketball = null;
        this.aimAngle = 0;
        this.powerIndicator = 0;
        this.powerDirection = 1;
    }
    
    /**
     * 开始游戏
     * 设计意图：启动游戏逻辑
     */
    startGame() {
        this.gameRunning = true;
        this.gameWon = false;
        this.isCelebrating = false;
    }
    
    /**
     * 游戏结束
     * 设计意图：处理游戏失败
     */
    gameOver() {
        this.gameRunning = false;
        // 触发游戏结束状态由引擎处理
    }
    
    /**
     * 设置难度
     * 设计意图：调整游戏难度
     * 
     * @param {string} difficulty - 难度级别
     */
    setDifficulty(difficulty) {
        // 根据难度调整游戏参数
        if (difficulty === GAME_CONFIG.DIFFICULTY_LEVELS.HARDCORE) {
            // 困难模式：防守者更快，玩家更慢
            this.defenders.forEach(defender => {
                defender.speed *= 1.5;
            });
            this.player.speed = Math.max(1, this.player.speed * 0.8);
        }
    }
    
    /**
     * 处理状态变化
     * 设计意图：响应游戏状态变化
     * 
     * @param {string} oldState - 旧状态
     * @param {string} newState - 新状态
     */
    onStateChange(oldState, newState) {
        if (newState === GAME_CONFIG.GAME_STATES.PLAYING) {
            this.startGame();
        }
    }
    
    /**
     * 处理键盘按下事件
     * 设计意图：处理游戏相关的键盘输入
     * 
     * @param {KeyboardEvent} event - 键盘事件
     */
    handleKeyDown(event) {
        // 空格键处理投篮
        if (event.code === 'Space') {
            event.preventDefault();
            this.handleSpaceKey();
        }
    }
    
    /**
     * 处理键盘释放事件
     * 设计意图：处理键盘释放
     * 
     * @param {KeyboardEvent} event - 键盘事件
     */
    handleKeyUp(event) {
        // 目前没有特殊的键盘释放处理
    }
    
    /**
     * 处理鼠标按下事件
     * 设计意图：处理鼠标点击
     * 
     * @param {MouseEvent} event - 鼠标事件
     * @param {object} mouse - 鼠标状态
     */
    handleMouseDown(event, mouse) {
        // 目前没有特殊的鼠标处理
    }
    
    /**
     * 处理空格键
     * 设计意图：处理投篮逻辑的空格键输入
     */
    handleSpaceKey() {
        if (!this.gameRunning) return;
        
        // 检查是否在空间按钮区域
        if (!this.isPlayerInSpaceButtonArea()) return;
        
        switch (this.shootingPhase) {
            case GAME_CONFIG.SHOOTING_PHASES.IDLE:
                this.shootingPhase = GAME_CONFIG.SHOOTING_PHASES.ANGLE;
                break;
                
            case GAME_CONFIG.SHOOTING_PHASES.ANGLE:
                this.lockedAngle = this.aimAngle;
                this.shootingPhase = GAME_CONFIG.SHOOTING_PHASES.POWER;
                break;
                
            case GAME_CONFIG.SHOOTING_PHASES.POWER:
                this.shoot();
                break;
        }
    }
    
    /**
     * 执行投篮
     * 设计意图：创建篮球并设置初始速度
     */
    shoot() {
        const power = this.powerIndicator * 15; // 调整力度系数
        
        this.basketball = {
            x: this.player.x + this.player.width / 2,
            y: this.player.y,
            vx: Math.sin(this.lockedAngle) * power,
            vy: Math.cos(this.lockedAngle) * power - 8, // 向上的初始速度
            radius: 8
        };
        
        this.shootingPhase = GAME_CONFIG.SHOOTING_PHASES.IDLE;
    }
    
    /**
     * 获取游戏状态
     * 设计意图：为渲染器和其他模块提供状态数据
     * 
     * @returns {object} 完整的游戏状态
     */
    getState() {
        return {
            // 基础游戏状态
            score: this.score,
            gameRunning: this.gameRunning,
            gameWon: this.gameWon,
            isCelebrating: this.isCelebrating,
            animationFrame: this.animationFrame,
            
            // 游戏对象
            player: this.player,
            defenders: this.defenders,
            basket: this.basket,
            
            // 投篮系统
            shootingPhase: this.shootingPhase,
            aimAngle: this.aimAngle,
            basketball: this.basketball,
            spaceButton: this.spaceButton,
            powerIndicator: this.powerIndicator,
            lockedAngle: this.lockedAngle,
            
            // 特效系统
            particles: this.particles,
            scorePopups: this.scorePopups,
            wallFlashTime: this.wallFlashTime,
            audience: this.audience,
            starField: this.starField,
            
            // 失败重置系统
            missedState: this.missedState,
            missedCountdown: this.missedCountdown,
            missedCountdownValue: this.missedCountdownValue,
            teleportEffect: this.teleportEffect
        };
    }
    
    /**
     * 重置游戏状态
     * 设计意图：重新开始游戏时重置所有状态
     */
    reset() {
        this.score = 0;
        this.gameRunning = false;
        this.gameWon = false;
        this.isCelebrating = false;
        this.animationFrame = 0;
        
        // 重置玩家位置
        this.player.x = DEFAULT_VALUES.playerPosition.x;
        this.player.y = DEFAULT_VALUES.playerPosition.y;
        
        // 重新初始化防守者
        this.initializeDefenders();
        
        // 重置投篮系统
        this.shootingPhase = GAME_CONFIG.SHOOTING_PHASES.IDLE;
        this.basketball = null;
        this.missedState = GAME_CONFIG.MISSED_STATES.IDLE;
        
        // 清空特效
        this.particles = [];
        this.scorePopups = [];
        this.wallFlashTime = 0;
        
        console.log('游戏逻辑已重置');
    }
    
    /**
     * 销毁游戏逻辑
     * 设计意图：清理资源
     */
    destroy() {
        // 清空所有数组
        this.defenders = [];
        this.particles = [];
        this.scorePopups = [];
        this.audience = [];
        this.starField = [];
        
        console.log('游戏逻辑已销毁');
    }
}