/**
 * 游戏引擎核心类
 * 
 * 设计意图：
 * - 作为游戏的"大脑"，负责整体控制和协调
 * - 管理游戏生命周期（初始化、启动、暂停、恢复、销毁）
 * - 统一处理游戏状态管理
 * - 协调各个模块之间的通信
 * - 提供稳定的游戏主循环
 */

// 导入依赖模块
import { 
    GAME_CONSTANTS, 
    GAME_CONFIG, 
    DEFAULT_VALUES,
    getResponsiveSpacing,
    getThemeColors 
} from '../Constants.js';

import { GameLogic } from '../logic/GameLogic.js';
import { Renderer } from '../rendering/Renderer.js';
import { UIManager } from '../ui/UIManager.js';
import { GameUtils } from '../utils/GameUtils.js';

/**
 * 游戏引擎核心类
 * 
 * 职责：
 * - 生命周期管理
 * - 状态管理
 * - 事件协调
 * - 循环控制
 * - 模块协调
 */
export class GameEngine {
    /**
     * 构造函数
     * 设计意图：初始化游戏引擎，创建各个子模块
     */
    constructor() {
        // === 基础设置 ===
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 验证Canvas和上下文
        if (!this.canvas || !this.ctx) {
            throw new Error('无法获取Canvas元素或2D上下文');
        }
        
        // === 生命周期管理 ===
        this.isDestroyed = false;           // 是否已销毁
        this.animationFrameId = null;       // 动画帧ID
        this.contextLost = false;           // 上下文是否丢失
        this.isRunning = false;             // 是否正在运行
        
        // === 状态管理 ===
        this.gameState = GAME_CONFIG.GAME_STATES.MENU;  // 当前游戏状态
        this.previousGameState = null;                   // 暂停前的状态
        this.difficulty = GAME_CONFIG.DIFFICULTY_LEVELS.NORMAL;  // 难度级别
        this.theme = DEFAULT_VALUES.gameSettings.theme;         // 主题
        
        // === 时间管理 ===
        this.lastTime = 0;                  // 上次更新时间
        this.deltaTime = 0;                 // 时间差
        this.frameCount = 0;                // 帧计数
        this.fps = 0;                       // FPS
        this.fpsTimer = 0;                  // FPS计时器
        
        // === 事件处理 ===
        this.keys = {};                     // 键盘状态
        this.mouse = {                      // 鼠标状态
            x: 0,
            y: 0,
            isDown: false,
            lastClick: { x: 0, y: 0 }
        };
        
        // === 绑定的事件处理器（用于清理） ===
        this.boundHandlers = {
            keydown: this.handleKeyDown.bind(this),
            keyup: this.handleKeyUp.bind(this),
            mousemove: this.handleMouseMove.bind(this),
            mousedown: this.handleMouseDown.bind(this),
            contextmenu: this.handleContextMenu.bind(this),
            contextlost: this.handleContextLost.bind(this),
            contextrestored: this.handleContextRestored.bind(this)
        };
        
        // === 淡入淡出效果 ===
        this.fadeState = null;              // 淡入淡出状态
        this.fadeAlpha = 0;                 // 淡入淡出透明度
        this.fadeCallback = null;           // 淡入淡出回调
        
        // === 响应式设计 ===
        this.spacing = getResponsiveSpacing(this.canvas.width, this.canvas.height);
        this.themeColors = getThemeColors(this.theme);
        
        // === 初始化子模块 ===
        this.initializeModules();
        
        // === 设置事件监听器 ===
        this.setupEventListeners();
        
        console.log('游戏引擎初始化完成');
    }
    
    /**
     * 初始化子模块
     * 设计意图：创建并配置各个子模块
     */
    initializeModules() {
        try {
            // 创建游戏逻辑模块
            this.gameLogic = new GameLogic(this.canvas, this.ctx);
            
            // 创建渲染器模块
            this.renderer = new Renderer(this.canvas, this.ctx);
            
            // 创建UI管理器模块
            this.uiManager = new UIManager(this.canvas, this.ctx);
            
            // 传递引擎实例给各个模块，以便它们可以访问引擎状态
            this.gameLogic.setEngine(this);
            this.renderer.setEngine(this);
            this.uiManager.setEngine(this);
            
            console.log('所有子模块初始化完成');
            
        } catch (error) {
            console.error('子模块初始化失败:', error);
            throw error;
        }
    }
    
    /**
     * 设置事件监听器
     * 设计意图：统一管理所有事件监听器
     */
    setupEventListeners() {
        // 键盘事件
        document.addEventListener('keydown', this.boundHandlers.keydown);
        document.addEventListener('keyup', this.boundHandlers.keyup);
        
        // 鼠标事件
        this.canvas.addEventListener('mousemove', this.boundHandlers.mousemove);
        this.canvas.addEventListener('mousedown', this.boundHandlers.mousedown);
        this.canvas.addEventListener('contextmenu', this.boundHandlers.contextmenu);
        
        // Canvas上下文事件
        this.canvas.addEventListener('webglcontextlost', this.boundHandlers.contextlost);
        this.canvas.addEventListener('webglcontextrestored', this.boundHandlers.contextrestored);
        
        console.log('事件监听器设置完成');
    }
    
    /**
     * 移除事件监听器
     * 设计意图：清理所有事件监听器，防止内存泄漏
     */
    removeEventListeners() {
        document.removeEventListener('keydown', this.boundHandlers.keydown);
        document.removeEventListener('keyup', this.boundHandlers.keyup);
        
        this.canvas.removeEventListener('mousemove', this.boundHandlers.mousemove);
        this.canvas.removeEventListener('mousedown', this.boundHandlers.mousedown);
        this.canvas.removeEventListener('contextmenu', this.boundHandlers.contextmenu);
        
        this.canvas.removeEventListener('webglcontextlost', this.boundHandlers.contextlost);
        this.canvas.removeEventListener('webglcontextrestored', this.boundHandlers.contextrestored);
        
        console.log('事件监听器已清理');
    }
    
    // === 生命周期管理方法 ===
    
    /**
     * 启动游戏
     * 设计意图：启动游戏循环，开始运行
     */
    start() {
        if (this.isDestroyed) {
            throw new Error('无法启动已销毁的游戏引擎');
        }
        
        if (this.isRunning) {
            console.warn('游戏已经在运行中');
            return;
        }
        
        this.isRunning = true;
        this.lastTime = performance.now();
        
        // 设置主题
        this.setTheme(this.theme);
        
        // 启动游戏循环
        this.gameLoop();
        
        console.log('游戏启动成功');
    }
    
    /**
     * 暂停游戏
     * 设计意图：暂停游戏循环，保存当前状态
     */
    pause() {
        if (!this.isRunning) return;
        
        // 只在游戏中时才暂停
        if (this.gameState === GAME_CONFIG.GAME_STATES.PLAYING) {
            this.previousGameState = this.gameState;
            this.setState(GAME_CONFIG.GAME_STATES.PAUSED);
            console.log('游戏已暂停');
        }
    }
    
    /**
     * 恢复游戏
     * 设计意图：恢复游戏循环，恢复之前的状态
     */
    resume() {
        if (!this.isRunning) return;
        
        // 只在暂停状态时才恢复
        if (this.gameState === GAME_CONFIG.GAME_STATES.PAUSED && this.previousGameState) {
            this.setState(this.previousGameState);
            this.previousGameState = null;
            console.log('游戏已恢复');
        }
    }
    
    /**
     * 重启游戏
     * 设计意图：重置游戏状态，重新开始
     */
    restart() {
        console.log('正在重启游戏...');
        
        // 重置游戏逻辑
        this.gameLogic.reset();
        
        // 重置状态
        this.setState(GAME_CONFIG.GAME_STATES.MENU);
        this.previousGameState = null;
        
        // 重新应用主题
        this.setTheme(this.theme);
        
        console.log('游戏重启完成');
    }
    
    /**
     * 销毁游戏引擎
     * 设计意图：清理所有资源，防止内存泄漏
     */
    destroy() {
        console.log('正在销毁游戏引擎...');
        
        // 标记为已销毁
        this.isDestroyed = true;
        this.isRunning = false;
        
        // 取消动画帧
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // 清理事件监听器
        this.removeEventListeners();
        
        // 销毁子模块
        if (this.gameLogic) {
            this.gameLogic.destroy();
            this.gameLogic = null;
        }
        
        if (this.renderer) {
            this.renderer.destroy();
            this.renderer = null;
        }
        
        if (this.uiManager) {
            this.uiManager.destroy();
            this.uiManager = null;
        }
        
        console.log('游戏引擎销毁完成');
    }
    
    // === 状态管理方法 ===
    
    /**
     * 设置游戏状态
     * 设计意图：统一管理游戏状态变化
     * 
     * @param {string} newState - 新的游戏状态
     */
    setState(newState) {
        if (this.gameState === newState) return;
        
        const oldState = this.gameState;
        this.gameState = newState;
        
        // 通知子模块状态变化
        this.gameLogic.onStateChange(oldState, newState);
        this.uiManager.onStateChange(oldState, newState);
        
        console.log(`游戏状态变化: ${oldState} -> ${newState}`);
    }
    
    /**
     * 设置主题
     * 设计意图：切换日夜主题
     * 
     * @param {string} theme - 主题名称
     */
    setTheme(theme) {
        this.theme = theme;
        this.themeColors = getThemeColors(theme);
        
        // 更新HTML主题类
        if (theme === GAME_CONFIG.THEMES.DAY) {
            document.body.classList.add('day-theme');
        } else {
            document.body.classList.remove('day-theme');
        }
        
        console.log(`主题切换为: ${theme}`);
    }
    
    /**
     * 设置难度
     * 设计意图：调整游戏难度
     * 
     * @param {string} difficulty - 难度级别
     */
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        this.gameLogic.setDifficulty(difficulty);
        
        console.log(`难度设置为: ${difficulty}`);
    }
    
    // === 核心游戏循环 ===
    
    /**
     * 游戏主循环
     * 设计意图：提供稳定的游戏循环，协调更新和渲染
     * 
     * @param {number} currentTime - 当前时间戳
     */
    gameLoop(currentTime = performance.now()) {
        // 如果已销毁，停止循环
        if (this.isDestroyed) return;
        
        // 计算时间差
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // 更新FPS计算
        this.updateFPS();
        
        try {
            // 更新游戏状态
            this.update();
            
            // 渲染游戏
            this.render();
            
        } catch (error) {
            console.error('游戏循环出错:', error);
            // 可以在这里添加错误恢复逻辑
        }
        
        // 请求下一帧
        if (this.isRunning) {
            this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
        }
    }
    
    /**
     * 更新游戏状态
     * 设计意图：协调各个模块的更新
     */
    update() {
        // 更新淡入淡出效果
        this.updateFadeTransition();
        
        // 只在非暂停状态下更新游戏逻辑
        if (this.gameState !== GAME_CONFIG.GAME_STATES.PAUSED) {
            this.gameLogic.update();
        }
        
        // UI管理器总是需要更新（处理菜单交互）
        this.uiManager.update();
    }
    
    /**
     * 渲染游戏
     * 设计意图：协调各个模块的渲染
     */
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 根据游戏状态渲染不同内容
        switch (this.gameState) {
            case GAME_CONFIG.GAME_STATES.MENU:
                this.uiManager.drawMainMenu();
                break;
                
            case GAME_CONFIG.GAME_STATES.PLAYING:
                this.renderer.render(this.getGameState());
                break;
                
            case GAME_CONFIG.GAME_STATES.PAUSED:
                // 先渲染游戏场景（静止状态）
                this.renderer.render(this.getGameState());
                // 再渲染暂停菜单
                this.uiManager.drawPauseMenu();
                break;
                
            case GAME_CONFIG.GAME_STATES.CUSTOMIZATION:
                this.uiManager.drawCustomizationMenu();
                break;
                
            case GAME_CONFIG.GAME_STATES.GAME_OVER:
                this.renderer.render(this.getGameState());
                this.uiManager.drawGameOverScreen();
                break;
                
            case GAME_CONFIG.GAME_STATES.WIN:
                this.renderer.render(this.getGameState());
                this.uiManager.drawWinScreen();
                break;
        }
        
        // 渲染淡入淡出效果
        this.renderFadeTransition();
    }
    
    // === 工具方法 ===
    
    /**
     * 获取完整的游戏状态
     * 设计意图：为渲染器提供完整的游戏状态数据
     * 
     * @returns {object} 游戏状态对象
     */
    getGameState() {
        return {
            // 引擎状态
            gameState: this.gameState,
            theme: this.theme,
            difficulty: this.difficulty,
            spacing: this.spacing,
            themeColors: this.themeColors,
            
            // 游戏逻辑状态
            ...this.gameLogic.getState(),
            
            // 时间信息
            deltaTime: this.deltaTime,
            fps: this.fps,
            frameCount: this.frameCount
        };
    }
    
    /**
     * 更新FPS计算
     * 设计意图：计算并更新FPS信息
     */
    updateFPS() {
        this.frameCount++;
        this.fpsTimer += this.deltaTime;
        
        if (this.fpsTimer >= 1000) { // 每秒更新一次FPS
            this.fps = Math.round(this.frameCount * 1000 / this.fpsTimer);
            this.frameCount = 0;
            this.fpsTimer = 0;
        }
    }
    
    /**
     * 开始淡入淡出过渡
     * 设计意图：提供平滑的场景切换效果
     * 
     * @param {function} callback - 过渡完成后的回调函数
     */
    startFadeTransition(callback) {
        this.fadeState = 'fadeOut';
        this.fadeAlpha = 0;
        this.fadeCallback = callback;
    }
    
    /**
     * 更新淡入淡出效果
     * 设计意图：更新淡入淡出动画
     */
    updateFadeTransition() {
        if (!this.fadeState) return;
        
        const fadeSpeed = 0.05; // 淡入淡出速度
        
        if (this.fadeState === 'fadeOut') {
            this.fadeAlpha += fadeSpeed;
            if (this.fadeAlpha >= 1) {
                this.fadeAlpha = 1;
                this.fadeState = 'fadeIn';
                // 执行回调
                if (this.fadeCallback) {
                    this.fadeCallback();
                    this.fadeCallback = null;
                }
            }
        } else if (this.fadeState === 'fadeIn') {
            this.fadeAlpha -= fadeSpeed;
            if (this.fadeAlpha <= 0) {
                this.fadeAlpha = 0;
                this.fadeState = null;
            }
        }
    }
    
    /**
     * 渲染淡入淡出效果
     * 设计意图：渲染过渡效果
     */
    renderFadeTransition() {
        if (!this.fadeState || this.fadeAlpha === 0) return;
        
        this.ctx.save();
        this.ctx.fillStyle = `rgba(0, 0, 0, ${this.fadeAlpha})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }
    
    // === 事件处理方法 ===
    
    /**
     * 处理键盘按下事件
     * 设计意图：统一处理键盘输入
     * 
     * @param {KeyboardEvent} event - 键盘事件
     */
    handleKeyDown(event) {
        this.keys[event.code] = true;
        
        // 传递给UI管理器处理
        this.uiManager.handleKeyDown(event);
        
        // 传递给游戏逻辑处理
        this.gameLogic.handleKeyDown(event);
    }
    
    /**
     * 处理键盘释放事件
     * 设计意图：统一处理键盘释放
     * 
     * @param {KeyboardEvent} event - 键盘事件
     */
    handleKeyUp(event) {
        this.keys[event.code] = false;
        
        // 传递给UI管理器处理
        this.uiManager.handleKeyUp(event);
        
        // 传递给游戏逻辑处理
        this.gameLogic.handleKeyUp(event);
    }
    
    /**
     * 处理鼠标移动事件
     * 设计意图：统一处理鼠标移动
     * 
     * @param {MouseEvent} event - 鼠标事件
     */
    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = event.clientX - rect.left;
        this.mouse.y = event.clientY - rect.top;
        
        // 传递给UI管理器处理
        this.uiManager.handleMouseMove(event, this.mouse);
    }
    
    /**
     * 处理鼠标按下事件
     * 设计意图：统一处理鼠标点击
     * 
     * @param {MouseEvent} event - 鼠标事件
     */
    handleMouseDown(event) {
        this.mouse.isDown = true;
        this.mouse.lastClick = { x: this.mouse.x, y: this.mouse.y };
        
        // 传递给UI管理器处理
        this.uiManager.handleMouseDown(event, this.mouse);
        
        // 传递给游戏逻辑处理
        this.gameLogic.handleMouseDown(event, this.mouse);
    }
    
    /**
     * 处理右键菜单事件
     * 设计意图：禁用右键菜单
     * 
     * @param {Event} event - 右键事件
     */
    handleContextMenu(event) {
        event.preventDefault();
    }
    
    /**
     * 处理Canvas上下文丢失事件
     * 设计意图：处理上下文丢失，暂停游戏
     * 
     * @param {Event} event - 上下文丢失事件
     */
    handleContextLost(event) {
        event.preventDefault();
        this.contextLost = true;
        console.warn('Canvas上下文丢失');
    }
    
    /**
     * 处理Canvas上下文恢复事件
     * 设计意图：处理上下文恢复，恢复游戏
     * 
     * @param {Event} event - 上下文恢复事件
     */
    handleContextRestored(event) {
        this.contextLost = false;
        console.log('Canvas上下文已恢复');
    }
    
    // === 公共接口方法 ===
    
    /**
     * 检查按键是否被按下
     * 设计意图：为子模块提供按键状态查询
     * 
     * @param {string} key - 按键代码
     * @returns {boolean} 是否被按下
     */
    isKeyPressed(key) {
        return !!this.keys[key];
    }
    
    /**
     * 获取鼠标状态
     * 设计意图：为子模块提供鼠标状态查询
     * 
     * @returns {object} 鼠标状态对象
     */
    getMouseState() {
        return { ...this.mouse };
    }
    
    /**
     * 获取引擎信息
     * 设计意图：为调试和监控提供引擎信息
     * 
     * @returns {object} 引擎信息对象
     */
    getEngineInfo() {
        return {
            isRunning: this.isRunning,
            gameState: this.gameState,
            difficulty: this.difficulty,
            theme: this.theme,
            fps: this.fps,
            frameCount: this.frameCount,
            isDestroyed: this.isDestroyed
        };
    }
}