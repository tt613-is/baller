/**
 * 渲染系统核心类
 * 
 * 设计意图：
 * - 作为游戏的"眼睛"，负责所有视觉呈现
 * - 与游戏逻辑分离，专注于渲染
 * - 根据游戏状态进行渲染，无状态设计
 * - 支持主题切换和性能优化
 */

// 导入依赖模块
import { 
    GAME_CONSTANTS, 
    GAME_CONFIG, 
    APPEARANCE_PRESETS,
    VISUAL_CONFIG,
    AUDIENCE_CONFIG
} from '../Constants.js';

import { GameUtils } from '../utils/GameUtils.js';

/**
 * 渲染器核心类
 * 
 * 职责：
 * - 场景渲染（背景、星空、篮球场）
 * - 实体渲染（玩家、防守者、篮球、篮筐）
 * - UI渲染（得分显示、游戏状态UI）
 * - 特效渲染（粒子效果、闪烁效果、过渡动画）
 * - 主题支持（日夜主题切换）
 */
export class Renderer {
    /**
     * 构造函数
     * 设计意图：初始化渲染器，设置画布和缓存
     * 
     * @param {HTMLCanvasElement} canvas - 游戏画布
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.engine = null; // 将由GameEngine设置
        
        // === 性能优化缓存 ===
        this.cachedGradients = new Map();   // 缓存渐变
        this.cachedPatterns = new Map();    // 缓存图案
        this.needsGridRedraw = true;        // 是否需要重绘网格
        
        console.log('渲染器初始化完成');
    }
    
    /**
     * 设置游戏引擎引用
     * 设计意图：获取引擎实例以访问状态等
     * 
     * @param {GameEngine} engine - 游戏引擎实例
     */
    setEngine(engine) {
        this.engine = engine;
    }
    
    /**
     * 主渲染方法
     * 设计意图：根据游戏状态渲染完整的游戏场景
     * 
     * @param {object} gameState - 完整的游戏状态
     */
    render(gameState) {
        if (!gameState) return;
        
        // 保存渲染上下文
        this.ctx.save();
        
        try {
            // 绘制背景
            this.drawBackground(gameState);
            
            // 绘制星空（夜晚主题）
            if (gameState.theme === GAME_CONFIG.THEMES.NIGHT) {
                this.drawStarField(gameState.starField);
            }
            
            // 绘制观众席
            this.drawAudience(gameState.audience, gameState.theme);
            
            // 绘制篮筐
            this.drawBasket(gameState.theme);
            
            // 绘制防守者
            this.drawDefenders(gameState.defenders, gameState.theme);
            
            // 绘制玩家
            this.drawPlayer(gameState.player, gameState.theme);
            
            // 绘制篮球
            if (gameState.basketball) {
                this.drawBasketball(gameState.basketball, gameState.theme);
            }
            
            // 绘制空间按钮
            this.drawSpaceButton(gameState.spaceButton, gameState.theme);
            
            // 绘制投篮瞄准系统
            if (gameState.shootingPhase !== GAME_CONFIG.SHOOTING_PHASES.IDLE) {
                this.drawShootingSystem(gameState);
            }
            
            // 绘制特效
            this.drawParticles(gameState.particles);
            this.drawScorePopups(gameState.scorePopups);
            
            // 绘制墙壁闪烁效果
            if (gameState.wallFlashTime > 0) {
                this.drawWallFlash(gameState.wallFlashTime, gameState.theme);
            }
            
            // 绘制投篮失败重置效果
            if (gameState.missedState !== GAME_CONFIG.MISSED_STATES.IDLE) {
                this.drawMissedEffect(gameState);
            }
            
            // 绘制游戏UI
            this.drawGameUI(gameState);
            
        } catch (error) {
            console.error('渲染出错:', error);
        } finally {
            // 恢复渲染上下文
            this.ctx.restore();
        }
    }
    
    /**
     * 绘制背景
     * 设计意图：根据主题绘制不同的背景
     * 
     * @param {object} gameState - 游戏状态
     */
    drawBackground(gameState) {
        const theme = gameState.theme;
        
        if (theme === GAME_CONFIG.THEMES.NIGHT) {
            this.drawNightBackground();
        } else {
            this.drawDayBackground();
        }
        
        // 绘制球场线条
        this.drawCourtLines(theme);
    }
    
    /**
     * 绘制夜晚背景
     * 设计意图：绘制夜晚主题的渐变背景
     */
    drawNightBackground() {
        // 使用缓存的夜空背景渐变
        const skyGradient = this.getCachedGradient('nightSky', () => {
            const grad = this.ctx.createRadialGradient(
                this.canvas.width / 2, this.canvas.height / 4, 0,
                this.canvas.width / 2, this.canvas.height / 4, this.canvas.width
            );
            grad.addColorStop(0, '#1a1a2e');  // 深紫色中心
            grad.addColorStop(0.5, '#16213e'); // 深蓝色
            grad.addColorStop(1, '#0f0f23');   // 深夜色
            return grad;
        });
        
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制球场地面
        const courtGradient = this.getCachedGradient('nightCourt', () => {
            const grad = this.ctx.createLinearGradient(
                0, this.canvas.height * 0.6, 
                0, this.canvas.height
            );
            grad.addColorStop(0, '#2d5016');  // 深绿色
            grad.addColorStop(1, '#1a3009');  // 更深的绿色
            return grad;
        });
        
        this.ctx.fillStyle = courtGradient;
        this.ctx.fillRect(0, this.canvas.height * 0.6, this.canvas.width, this.canvas.height * 0.4);
    }
    
    /**
     * 绘制白天背景
     * 设计意图：绘制白天主题的室内篮球场背景
     */
    drawDayBackground() {
        // 室内背景墙
        const wallGradient = this.getCachedGradient('dayWall', () => {
            const grad = this.ctx.createLinearGradient(
                0, 0, 
                0, this.canvas.height * 0.6
            );
            grad.addColorStop(0, '#DEB887');  // 浅木色
            grad.addColorStop(1, '#D2B48C');  // 棕褐色
            return grad;
        });
        
        this.ctx.fillStyle = wallGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height * 0.6);
        
        // 篮球场木地板
        const courtGradient = this.getCachedGradient('dayCourt', () => {
            const grad = this.ctx.createLinearGradient(
                0, this.canvas.height * 0.6, 
                0, this.canvas.height
            );
            grad.addColorStop(0, '#CD853F');  // 秘鲁色
            grad.addColorStop(1, '#A0522D');  // 黄褐色
            return grad;
        });
        
        this.ctx.fillStyle = courtGradient;
        this.ctx.fillRect(0, this.canvas.height * 0.6, this.canvas.width, this.canvas.height * 0.4);
        
        // 绘制木地板纹理线条
        this.ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        for (let i = 0; i < this.canvas.width; i += 60) {
            this.ctx.moveTo(i, this.canvas.height * 0.6);
            this.ctx.lineTo(i, this.canvas.height);
        }
        this.ctx.stroke();
    }
    
    /**
     * 绘制球场线条
     * 设计意图：绘制篮球场的标准线条
     * 
     * @param {string} theme - 当前主题
     */
    drawCourtLines(theme) {
        const isNight = theme === GAME_CONFIG.THEMES.NIGHT;
        
        if (isNight) {
            // 夜晚主题：发光线条
            this.ctx.shadowColor = '#00FFFF';
            this.ctx.shadowBlur = 10;
            this.ctx.strokeStyle = '#00FFFF';
            this.ctx.lineWidth = 3;
        } else {
            // 白天主题：经典白色线条
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 4;
        }
        
        // 绘制实线
        this.ctx.beginPath();
        [450, 350, 250].forEach(y => {
            this.ctx.moveTo(0, y + 25);
            this.ctx.lineTo(this.canvas.width, y + 25);
        });
        this.ctx.stroke();
        
        // 绘制虚线
        this.ctx.setLineDash(isNight ? [15, 15] : [10, 10]);
        this.ctx.beginPath();
        [450, 350, 250].forEach(y => {
            this.ctx.moveTo(0, y - 25);
            this.ctx.lineTo(this.canvas.width, y - 25);
        });
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // 重置阴影
        if (isNight) {
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
        }
    }
    
    /**
     * 绘制星空
     * 设计意图：绘制夜晚主题的星空效果
     * 
     * @param {Array} starField - 星星数组
     */
    drawStarField(starField) {
        if (!starField) return;
        
        starField.forEach(star => {
            const alpha = 0.5 + 0.5 * Math.sin(star.twinkle);
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }
    
    /**
     * 绘制观众席
     * 设计意图：绘制观众席和观众动画
     * 
     * @param {Array} audience - 观众数组
     * @param {string} theme - 当前主题
     */
    drawAudience(audience, theme) {
        if (!audience) return;
        
        audience.forEach(member => {
            this.ctx.save();
            
            // 应用缩放和位置偏移（欢呼动画）
            const yOffset = member.cheerFrame || 0;
            this.ctx.scale(member.scale || 1, member.scale || 1);
            
            // 绘制观众身体
            this.ctx.fillStyle = member.shirtColor || '#FF6B6B';
            GameUtils.drawRoundedRect(
                this.ctx,
                member.x / (member.scale || 1),
                (member.y + yOffset) / (member.scale || 1),
                member.width,
                member.height * 0.7,
                5
            );
            this.ctx.fill();
            
            // 绘制观众头部
            this.ctx.fillStyle = member.color || '#FFDBAC';
            this.ctx.beginPath();
            this.ctx.arc(
                member.x / (member.scale || 1) + member.width / 2,
                (member.y + yOffset) / (member.scale || 1) + member.height * 0.3,
                member.width * 0.3,
                0, Math.PI * 2
            );
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }
    
    /**
     * 绘制篮筐
     * 设计意图：绘制篮筐、篮板和篮网
     * 
     * @param {string} theme - 当前主题
     */
    drawBasket(theme) {
        const hoopX = this.canvas.width / 2;
        const hoopY = 120;
        const isDay = theme === GAME_CONFIG.THEMES.DAY;
        
        // 绘制篮板
        const backboardColor = isDay ? 'rgba(255, 255, 255, 0.9)' : VISUAL_CONFIG.hoop.backboard.color;
        this.ctx.fillStyle = backboardColor;
        
        if (isDay) {
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            this.ctx.shadowBlur = 10;
        } else {
            this.ctx.shadowColor = '#FFFFFF';
            this.ctx.shadowBlur = 10;
        }
        
        this.ctx.fillRect(
            hoopX - VISUAL_CONFIG.hoop.backboard.width / 2,
            hoopY - VISUAL_CONFIG.hoop.backboard.height + 30,
            VISUAL_CONFIG.hoop.backboard.width,
            VISUAL_CONFIG.hoop.backboard.height
        );
        
        // 绘制篮板边框
        const frameColor = isDay ? 'rgba(255, 0, 0, 0.8)' : 'rgba(255, 0, 0, 0.5)';
        this.ctx.strokeStyle = frameColor;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(hoopX - 30, hoopY - 25, 60, 40);
        this.ctx.shadowBlur = 0;
        
        // 绘制篮筐支架
        this.ctx.fillStyle = '#666666';
        this.ctx.beginPath();
        this.ctx.moveTo(hoopX, hoopY + 10);
        this.ctx.lineTo(hoopX - 10, hoopY + 20);
        this.ctx.lineTo(hoopX + 10, hoopY + 20);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 绘制篮圈
        const rimColor = isDay ? '#FF4500' : VISUAL_CONFIG.hoop.rim.color;
        this.ctx.fillStyle = rimColor;
        this.ctx.shadowColor = rimColor;
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.ellipse(
            hoopX, hoopY,
            VISUAL_CONFIG.hoop.rim.radiusX,
            VISUAL_CONFIG.hoop.rim.radiusY,
            0, 0, Math.PI * 2
        );
        this.ctx.fill();
        
        const strokeColor = isDay ? '#B22222' : '#FFD700';
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // 绘制篮网
        this.drawBasketNet(hoopX, hoopY);
        
        // 重置阴影
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
    }
    
    /**
     * 绘制篮网
     * 设计意图：绘制逼真的篮网效果
     * 
     * @param {number} hoopX - 篮筐X坐标
     * @param {number} hoopY - 篮筐Y坐标
     */
    drawBasketNet(hoopX, hoopY) {
        this.ctx.strokeStyle = VISUAL_CONFIG.hoop.net.color;
        this.ctx.lineWidth = 1.5;
        this.ctx.shadowColor = VISUAL_CONFIG.hoop.net.color;
        this.ctx.shadowBlur = 8;
        
        const netBottomY = hoopY + 40;
        const rimRadius = VISUAL_CONFIG.hoop.rim.radiusX;
        
        // 绘制纵向网线
        for (let i = 0; i <= 8; i++) {
            const angle = (i / 8) * Math.PI;
            const startX = hoopX + Math.cos(angle) * rimRadius;
            const endX = hoopX + Math.cos(angle) * (rimRadius * 0.5);
            
            if (i > 0 && i < 8) {
                this.ctx.beginPath();
                this.ctx.moveTo(startX, hoopY);
                this.ctx.quadraticCurveTo(startX, hoopY + 20, endX, netBottomY);
                this.ctx.stroke();
            }
        }
        
        // 绘制横向网线
        this.ctx.beginPath();
        this.ctx.moveTo(hoopX - rimRadius, hoopY);
        this.ctx.quadraticCurveTo(hoopX, hoopY + 15, hoopX + rimRadius, hoopY);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(hoopX - rimRadius * 0.7, hoopY + 20);
        this.ctx.quadraticCurveTo(hoopX, hoopY + 35, hoopX + rimRadius * 0.7, hoopY + 20);
        this.ctx.stroke();
    }
    
    /**
     * 绘制玩家
     * 设计意图：根据外观配置绘制玩家角色
     * 
     * @param {object} player - 玩家对象
     * @param {string} theme - 当前主题
     */
    drawPlayer(player, theme) {
        if (!player) return;
        
        this.drawPlayerWithAppearance(player.x, player.y, player.appearance, 1.0, theme);
    }
    
    /**
     * 根据外观配置绘制玩家
     * 设计意图：绘制带有自定义外观的玩家
     * 
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {object} appearance - 外观配置
     * @param {number} scale - 缩放比例
     * @param {string} theme - 主题
     */
    drawPlayerWithAppearance(x, y, appearance, scale = 1.0, theme = 'day') {
        const bodyY = y + 12 * scale;
        
        // 获取外观配置
        const headConfig = APPEARANCE_PRESETS.heads[appearance.headIndex] || APPEARANCE_PRESETS.heads[0];
        const jerseyConfig = APPEARANCE_PRESETS.jerseys[appearance.jerseyIndex] || APPEARANCE_PRESETS.jerseys[0];
        const numberConfig = APPEARANCE_PRESETS.numbers[appearance.numberIndex] || APPEARANCE_PRESETS.numbers[0];
        
        this.ctx.save();
        
        // 绘制身体（球衣）
        const gradient = this.ctx.createLinearGradient(x, bodyY, x, bodyY + 35 * scale);
        gradient.addColorStop(0, jerseyConfig.color1);
        gradient.addColorStop(1, jerseyConfig.color2);
        
        this.ctx.fillStyle = gradient;
        GameUtils.drawRoundedRect(this.ctx, x, bodyY, 40 * scale, 35 * scale, 8 * scale);
        this.ctx.fill();
        
        // 绘制球衣号码
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = `bold ${16 * scale}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(numberConfig, x + 20 * scale, bodyY + 25 * scale);
        
        // 绘制头部
        this.ctx.fillStyle = headConfig.skinColor;
        this.ctx.beginPath();
        this.ctx.arc(x + 20 * scale, y + 12 * scale, 12 * scale, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制头发
        this.drawHairStyle(x + 20 * scale, y + 12 * scale, headConfig.hairStyle, headConfig.hairColor, scale);
        
        // 绘制眼睛
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(x + 16 * scale, y + 10 * scale, 1.5 * scale, 0, Math.PI * 2);
        this.ctx.arc(x + 24 * scale, y + 10 * scale, 1.5 * scale, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制腿部
        this.ctx.fillStyle = jerseyConfig.color1;
        GameUtils.drawRoundedRect(this.ctx, x + 8 * scale, bodyY + 30 * scale, 12 * scale, 15 * scale, 4 * scale);
        GameUtils.drawRoundedRect(this.ctx, x + 20 * scale, bodyY + 30 * scale, 12 * scale, 15 * scale, 4 * scale);
        this.ctx.fill();
        
        // 绘制鞋子
        this.ctx.fillStyle = '#333333';
        GameUtils.drawRoundedRect(this.ctx, x + 6 * scale, bodyY + 42 * scale, 16 * scale, 6 * scale, 3 * scale);
        GameUtils.drawRoundedRect(this.ctx, x + 18 * scale, bodyY + 42 * scale, 16 * scale, 6 * scale, 3 * scale);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    /**
     * 绘制发型
     * 设计意图：根据发型类型绘制不同的头发样式
     * 
     * @param {number} x - 头部中心X坐标
     * @param {number} y - 头部中心Y坐标
     * @param {string} style - 发型样式
     * @param {string} color - 头发颜色
     * @param {number} scale - 缩放比例
     */
    drawHairStyle(x, y, style, color, scale = 1.0) {
        this.ctx.fillStyle = color;
        
        switch (style) {
            case 'classic':
                // 经典短发
                this.ctx.beginPath();
                this.ctx.arc(x, y - 2 * scale, 14 * scale, Math.PI, 0, true);
                this.ctx.fill();
                break;
                
            case 'spiky':
                // 刺头
                for (let i = 0; i < 5; i++) {
                    const angle = (i / 4) * Math.PI - Math.PI / 2;
                    const spikeX = x + Math.cos(angle) * 10 * scale;
                    const spikeY = y + Math.sin(angle) * 10 * scale;
                    const tipX = x + Math.cos(angle) * 18 * scale;
                    const tipY = y + Math.sin(angle) * 18 * scale;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(spikeX, spikeY);
                    this.ctx.lineTo(tipX, tipY);
                    this.ctx.lineTo(spikeX + 4 * scale, spikeY);
                    this.ctx.fill();
                }
                break;
                
            case 'curly':
                // 卷发
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    const curlX = x + Math.cos(angle) * 8 * scale;
                    const curlY = y + Math.sin(angle) * 8 * scale;
                    this.ctx.beginPath();
                    this.ctx.arc(curlX, curlY, 3 * scale, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                break;
                
            case 'long':
                // 长发
                this.ctx.beginPath();
                this.ctx.arc(x, y - 2 * scale, 14 * scale, Math.PI, 0, true);
                this.ctx.fill();
                GameUtils.drawRoundedRect(this.ctx, x - 12 * scale, y + 8 * scale, 24 * scale, 15 * scale, 8 * scale);
                this.ctx.fill();
                break;
                
            default:
                // 默认发型
                this.ctx.beginPath();
                this.ctx.arc(x, y - 2 * scale, 12 * scale, Math.PI, 0, true);
                this.ctx.fill();
        }
    }
    
    /**
     * 绘制防守者
     * 设计意图：绘制所有防守者角色
     * 
     * @param {Array} defenders - 防守者数组
     * @param {string} theme - 当前主题
     */
    drawDefenders(defenders, theme) {
        if (!defenders) return;
        
        defenders.forEach(defender => {
            this.ctx.save();
            
            // 绘制身体
            this.ctx.fillStyle = defender.color;
            GameUtils.drawRoundedRect(
                this.ctx,
                defender.x, defender.y,
                defender.width, defender.height,
                8
            );
            this.ctx.fill();
            
            // 绘制球衣号码
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                defender.jerseyNumber || '00',
                defender.x + defender.width / 2,
                defender.y + defender.height / 2 + 4
            );
            
            // 绘制头部
            this.ctx.fillStyle = '#FFDBAC';
            this.ctx.beginPath();
            this.ctx.arc(
                defender.x + defender.width / 2,
                defender.y - 8,
                8, 0, Math.PI * 2
            );
            this.ctx.fill();
            
            // 绘制眼睛
            this.ctx.fillStyle = '#000000';
            this.ctx.beginPath();
            this.ctx.arc(defender.x + defender.width / 2 - 3, defender.y - 10, 1, 0, Math.PI * 2);
            this.ctx.arc(defender.x + defender.width / 2 + 3, defender.y - 10, 1, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }
    
    /**
     * 绘制篮球
     * 设计意图：绘制投篮时的篮球
     * 
     * @param {object} basketball - 篮球对象
     * @param {string} theme - 当前主题
     */
    drawBasketball(basketball, theme) {
        if (!basketball) return;
        
        this.ctx.save();
        
        // 绘制篮球阴影
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(basketball.x, basketball.y + 20, basketball.radius, basketball.radius * 0.5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制篮球主体
        const gradient = this.ctx.createRadialGradient(
            basketball.x - 3, basketball.y - 3, 0,
            basketball.x, basketball.y, basketball.radius
        );
        gradient.addColorStop(0, '#FF8C00');
        gradient.addColorStop(1, '#FF4500');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(basketball.x, basketball.y, basketball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制篮球纹理线条
        this.ctx.strokeStyle = '#8B0000';
        this.ctx.lineWidth = 1.5;
        
        // 竖直线
        this.ctx.beginPath();
        this.ctx.moveTo(basketball.x, basketball.y - basketball.radius);
        this.ctx.lineTo(basketball.x, basketball.y + basketball.radius);
        this.ctx.stroke();
        
        // 水平线
        this.ctx.beginPath();
        this.ctx.moveTo(basketball.x - basketball.radius, basketball.y);
        this.ctx.lineTo(basketball.x + basketball.radius, basketball.y);
        this.ctx.stroke();
        
        // 弧线
        this.ctx.beginPath();
        this.ctx.arc(basketball.x, basketball.y, basketball.radius * 0.6, 0, Math.PI);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.arc(basketball.x, basketball.y, basketball.radius * 0.6, Math.PI, 0);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    /**
     * 绘制空间按钮
     * 设计意图：绘制投篮触发按钮
     * 
     * @param {object} spaceButton - 空间按钮对象
     * @param {string} theme - 当前主题
     */
    drawSpaceButton(spaceButton, theme) {
        if (!spaceButton) return;
        
        this.ctx.save();
        
        // 绘制按钮背景
        const gradient = this.ctx.createLinearGradient(
            spaceButton.x, spaceButton.y,
            spaceButton.x, spaceButton.y + spaceButton.height
        );
        gradient.addColorStop(0, '#FF6B6B');
        gradient.addColorStop(1, '#FF4444');
        
        this.ctx.fillStyle = gradient;
        GameUtils.drawRoundedRect(
            this.ctx,
            spaceButton.x, spaceButton.y,
            spaceButton.width, spaceButton.height,
            8
        );
        this.ctx.fill();
        
        // 绘制按钮边框
        this.ctx.strokeStyle = '#CC0000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // 绘制按钮文字
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
            'SPACE',
            spaceButton.x + spaceButton.width / 2,
            spaceButton.y + spaceButton.height / 2
        );
        
        this.ctx.restore();
    }
    
    /**
     * 绘制投篮瞄准系统
     * 设计意图：绘制投篮瞄准界面
     * 
     * @param {object} gameState - 游戏状态
     */
    drawShootingSystem(gameState) {
        const player = gameState.player;
        if (!player) return;
        
        this.ctx.save();
        
        const centerX = player.x + player.width / 2;
        const centerY = player.y;
        
        if (gameState.shootingPhase === GAME_CONFIG.SHOOTING_PHASES.ANGLE) {
            // 绘制瞄准扇形
            this.ctx.strokeStyle = '#00FF00';
            this.ctx.lineWidth = 3;
            this.ctx.globalAlpha = 0.7;
            
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(
                centerX, centerY, 100,
                -Math.PI / 2 - gameState.shootingRange / 2,
                -Math.PI / 2 + gameState.shootingRange / 2
            );
            this.ctx.closePath();
            this.ctx.stroke();
            
            // 绘制当前瞄准线
            this.ctx.strokeStyle = '#FFFF00';
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.lineTo(
                centerX + Math.sin(gameState.aimAngle) * 100,
                centerY - Math.cos(gameState.aimAngle) * 100
            );
            this.ctx.stroke();
            
        } else if (gameState.shootingPhase === GAME_CONFIG.SHOOTING_PHASES.POWER) {
            // 绘制锁定的角度线
            this.ctx.strokeStyle = '#FF0000';
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.lineTo(
                centerX + Math.sin(gameState.lockedAngle) * 100,
                centerY - Math.cos(gameState.lockedAngle) * 100
            );
            this.ctx.stroke();
            
            // 绘制力度指示器
            const powerDistance = gameState.powerIndicator * gameState.maxPowerDistance || 50;
            const powerX = centerX + Math.sin(gameState.lockedAngle) * powerDistance;
            const powerY = centerY - Math.cos(gameState.lockedAngle) * powerDistance;
            
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.beginPath();
            this.ctx.arc(powerX, powerY, 8, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 绘制力度条
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            this.ctx.fillRect(centerX - 50, centerY + 50, 100, 10);
            
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.fillRect(
                centerX - 50, centerY + 50,
                100 * gameState.powerIndicator, 10
            );
        }
        
        this.ctx.restore();
    }
    
    /**
     * 绘制粒子效果
     * 设计意图：绘制所有粒子特效
     * 
     * @param {Array} particles - 粒子数组
     */
    drawParticles(particles) {
        if (!particles) return;
        
        particles.forEach(particle => {
            GameUtils.drawParticle(this.ctx, particle);
        });
    }
    
    /**
     * 绘制得分文字提示
     * 设计意图：绘制得分时的文字效果
     * 
     * @param {Array} scorePopups - 得分文字数组
     */
    drawScorePopups(scorePopups) {
        if (!scorePopups) return;
        
        scorePopups.forEach(popup => {
            this.ctx.save();
            this.ctx.globalAlpha = popup.life / 60;
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            
            this.ctx.strokeText(popup.text, popup.x, popup.y);
            this.ctx.fillText(popup.text, popup.x, popup.y);
            
            this.ctx.restore();
        });
    }
    
    /**
     * 绘制墙壁闪烁效果
     * 设计意图：绘制碰撞时的闪烁效果
     * 
     * @param {number} flashTime - 闪烁时间
     * @param {string} theme - 当前主题
     */
    drawWallFlash(flashTime, theme) {
        if (flashTime <= 0) return;
        
        this.ctx.save();
        
        const alpha = flashTime / GAME_CONSTANTS.WALL_FLASH_DURATION * 0.5;
        const flashColor = theme === GAME_CONFIG.THEMES.DAY ? '#FF0000' : '#FFFFFF';
        
        this.ctx.fillStyle = `rgba(${flashColor === '#FF0000' ? '255,0,0' : '255,255,255'}, ${alpha})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.restore();
    }
    
    /**
     * 绘制投篮失败重置效果
     * 设计意图：绘制投篮失败时的传送效果
     * 
     * @param {object} gameState - 游戏状态
     */
    drawMissedEffect(gameState) {
        const missedState = gameState.missedState;
        
        if (missedState === GAME_CONFIG.MISSED_STATES.COUNTDOWN) {
            // 绘制倒计时
            this.ctx.save();
            this.ctx.fillStyle = '#FF0000';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 3;
            
            const text = gameState.missedCountdownValue.toString();
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            
            this.ctx.strokeText(text, centerX, centerY);
            this.ctx.fillText(text, centerX, centerY);
            
            this.ctx.restore();
            
        } else if (missedState === GAME_CONFIG.MISSED_STATES.TELEPORT) {
            // 绘制传送圆圈
            this.ctx.save();
            
            const teleport = gameState.teleportEffect;
            
            // 绘制源圆圈
            if (teleport.sourceCircle.radius > 0) {
                this.ctx.strokeStyle = '#00FFFF';
                this.ctx.lineWidth = 3;
                this.ctx.globalAlpha = 0.8;
                this.ctx.beginPath();
                this.ctx.arc(
                    teleport.sourceCircle.x,
                    teleport.sourceCircle.y,
                    teleport.sourceCircle.radius,
                    0, Math.PI * 2
                );
                this.ctx.stroke();
            }
            
            // 绘制目标圆圈
            if (teleport.targetCircle.radius > 0) {
                this.ctx.strokeStyle = '#FF00FF';
                this.ctx.lineWidth = 3;
                this.ctx.globalAlpha = 0.8;
                this.ctx.beginPath();
                this.ctx.arc(
                    teleport.targetCircle.x,
                    teleport.targetCircle.y,
                    teleport.targetCircle.radius,
                    0, Math.PI * 2
                );
                this.ctx.stroke();
            }
            
            this.ctx.restore();
        }
    }
    
    /**
     * 绘制游戏UI
     * 设计意图：绘制游戏中的UI元素
     * 
     * @param {object} gameState - 游戏状态
     */
    drawGameUI(gameState) {
        this.ctx.save();
        
        // 绘制分数
        this.ctx.fillStyle = gameState.theme === GAME_CONFIG.THEMES.DAY ? '#000000' : '#FFFFFF';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${gameState.score}`, 20, 40);
        
        // 绘制目标分数
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Goal: ${GAME_CONSTANTS.WINNING_SCORE}`, 20, 65);
        
        // 绘制FPS（调试信息）
        if (gameState.fps) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.font = '12px monospace';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`FPS: ${gameState.fps}`, this.canvas.width - 20, 25);
        }
        
        // 绘制投篮提示
        if (gameState.shootingPhase !== GAME_CONFIG.SHOOTING_PHASES.IDLE) {
            let instruction = '';
            switch (gameState.shootingPhase) {
                case GAME_CONFIG.SHOOTING_PHASES.ANGLE:
                    instruction = 'Press SPACE to lock angle';
                    break;
                case GAME_CONFIG.SHOOTING_PHASES.POWER:
                    instruction = 'Press SPACE to shoot!';
                    break;
            }
            
            if (instruction) {
                this.ctx.fillStyle = gameState.theme === GAME_CONFIG.THEMES.DAY ? '#000000' : '#FFFFFF';
                this.ctx.font = 'bold 18px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(instruction, this.canvas.width / 2, this.canvas.height - 30);
            }
        }
        
        this.ctx.restore();
    }
    
    /**
     * 获取缓存的渐变
     * 设计意图：缓存渐变以提高性能
     * 
     * @param {string} key - 缓存键
     * @param {function} createFunction - 创建渐变的函数
     * @returns {CanvasGradient} 渐变对象
     */
    getCachedGradient(key, createFunction) {
        if (!this.cachedGradients.has(key)) {
            this.cachedGradients.set(key, createFunction());
        }
        return this.cachedGradients.get(key);
    }
    
    /**
     * 销毁渲染器
     * 设计意图：清理缓存和资源
     */
    destroy() {
        this.cachedGradients.clear();
        this.cachedPatterns.clear();
        console.log('渲染器已销毁');
    }
}