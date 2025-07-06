/**
 * UI管理系统核心类
 * 
 * 设计意图：
 * - 作为游戏的"面板"，处理所有用户界面交互
 * - 管理菜单系统、自定义界面等UI组件
 * - 处理按钮交互和状态管理
 * - 提供流畅的过渡效果和响应式布局
 */

// 导入依赖模块
import { 
    GAME_CONSTANTS, 
    GAME_CONFIG, 
    BUTTON_CONFIG,
    APPEARANCE_PRESETS,
    STORAGE_KEYS,
    DEFAULT_VALUES,
    getResponsiveSpacing
} from '../Constants.js';

import { GameUtils } from '../utils/GameUtils.js';

/**
 * UI管理器核心类
 * 
 * 职责：
 * - 菜单管理（主菜单、暂停菜单、游戏结束菜单）
 * - 自定义界面管理
 * - 按钮处理（点击、悬停效果、状态管理）
 * - 过渡效果（淡入淡出、场景切换动画）
 * - 响应式布局（适配不同屏幕尺寸）
 */
export class UIManager {
    /**
     * 构造函数
     * 设计意图：初始化UI管理器，设置按钮和界面状态
     * 
     * @param {HTMLCanvasElement} canvas - 游戏画布
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.engine = null; // 将由GameEngine设置
        
        // === 响应式布局 ===
        this.spacing = getResponsiveSpacing(canvas.width, canvas.height);
        
        // === 按钮状态管理 ===
        this.initializeButtons();
        
        // === 自定义界面状态 ===
        this.initializeCustomization();
        
        console.log('UI管理器初始化完成');
    }
    
    /**
     * 设置游戏引擎引用
     * 设计意图：获取引擎实例以访问状态和方法
     * 
     * @param {GameEngine} engine - 游戏引擎实例
     */
    setEngine(engine) {
        this.engine = engine;
    }
    
    /**
     * 初始化按钮系统
     * 设计意图：创建并配置所有按钮
     */
    initializeButtons() {
        // 主菜单按钮
        this.menuButtons = {
            normal: {
                x: this.canvas.width / 2 - BUTTON_CONFIG.mainMenu.normal.width / 2,
                y: BUTTON_CONFIG.mainMenu.normal.y,
                width: BUTTON_CONFIG.mainMenu.normal.width,
                height: BUTTON_CONFIG.mainMenu.normal.height,
                text: BUTTON_CONFIG.mainMenu.normal.text,
                hover: false
            },
            hardcore: {
                x: this.canvas.width / 2 - BUTTON_CONFIG.mainMenu.hardcore.width / 2,
                y: BUTTON_CONFIG.mainMenu.hardcore.y,
                width: BUTTON_CONFIG.mainMenu.hardcore.width,
                height: BUTTON_CONFIG.mainMenu.hardcore.height,
                text: BUTTON_CONFIG.mainMenu.hardcore.text,
                hover: false
            }
        };
        
        // 辅助按钮
        this.secondaryButtons = {
            customize: {
                x: BUTTON_CONFIG.secondary.customize.x,
                y: this.canvas.height - BUTTON_CONFIG.secondary.customize.height - 30,
                width: BUTTON_CONFIG.secondary.customize.width,
                height: BUTTON_CONFIG.secondary.customize.height,
                text: BUTTON_CONFIG.secondary.customize.text,
                hover: false
            },
            themeToggle: {
                x: this.canvas.width - BUTTON_CONFIG.secondary.themeToggle.width - 30,
                y: this.canvas.height - BUTTON_CONFIG.secondary.themeToggle.height - 30,
                width: BUTTON_CONFIG.secondary.themeToggle.width,
                height: BUTTON_CONFIG.secondary.themeToggle.height,
                text: BUTTON_CONFIG.secondary.themeToggle.dayText,
                hover: false
            }
        };
        
        // 暂停菜单按钮
        this.pauseMenuButtons = {
            restart: {
                x: this.canvas.width / 2 - BUTTON_CONFIG.pauseMenu.restart.width / 2,
                y: BUTTON_CONFIG.pauseMenu.restart.y,
                width: BUTTON_CONFIG.pauseMenu.restart.width,
                height: BUTTON_CONFIG.pauseMenu.restart.height,
                text: BUTTON_CONFIG.pauseMenu.restart.text,
                hover: false
            },
            backToMenu: {
                x: this.canvas.width / 2 - BUTTON_CONFIG.pauseMenu.backToMenu.width / 2,
                y: BUTTON_CONFIG.pauseMenu.backToMenu.y,
                width: BUTTON_CONFIG.pauseMenu.backToMenu.width,
                height: BUTTON_CONFIG.pauseMenu.backToMenu.height,
                text: BUTTON_CONFIG.pauseMenu.backToMenu.text,
                hover: false
            }
        };
    }
    
    /**
     * 初始化自定义界面
     * 设计意图：设置角色自定义相关的状态
     */
    initializeCustomization() {
        // 自定义界面状态
        this.customization = {
            selectedCategory: 'head',
            selectedIndices: {
                head: 0,
                jersey: 0,
                number: 0
            },
            previewPlayer: null
        };
        
        // 自定义界面按钮
        this.customizationButtons = {
            // 分类按钮
            head: {
                x: BUTTON_CONFIG.customization.categories.head.x,
                y: BUTTON_CONFIG.customization.categories.head.y,
                width: BUTTON_CONFIG.customization.categories.head.width,
                height: BUTTON_CONFIG.customization.categories.head.height,
                text: BUTTON_CONFIG.customization.categories.head.text,
                hover: false,
                active: true
            },
            jersey: {
                x: BUTTON_CONFIG.customization.categories.jersey.x,
                y: BUTTON_CONFIG.customization.categories.jersey.y,
                width: BUTTON_CONFIG.customization.categories.jersey.width,
                height: BUTTON_CONFIG.customization.categories.jersey.height,
                text: BUTTON_CONFIG.customization.categories.jersey.text,
                hover: false,
                active: false
            },
            number: {
                x: BUTTON_CONFIG.customization.categories.number.x,
                y: BUTTON_CONFIG.customization.categories.number.y,
                width: BUTTON_CONFIG.customization.categories.number.width,
                height: BUTTON_CONFIG.customization.categories.number.height,
                text: BUTTON_CONFIG.customization.categories.number.text,
                hover: false,
                active: false
            },
            
            // 导航按钮
            prev: {
                x: BUTTON_CONFIG.customization.navigation.prev.x,
                y: BUTTON_CONFIG.customization.navigation.prev.y,
                width: BUTTON_CONFIG.customization.navigation.prev.width,
                height: BUTTON_CONFIG.customization.navigation.prev.height,
                text: BUTTON_CONFIG.customization.navigation.prev.text,
                hover: false
            },
            next: {
                x: BUTTON_CONFIG.customization.navigation.next.x,
                y: BUTTON_CONFIG.customization.navigation.next.y,
                width: BUTTON_CONFIG.customization.navigation.next.width,
                height: BUTTON_CONFIG.customization.navigation.next.height,
                text: BUTTON_CONFIG.customization.navigation.next.text,
                hover: false
            },
            
            // 操作按钮
            apply: {
                x: BUTTON_CONFIG.customization.actions.apply.x,
                y: BUTTON_CONFIG.customization.actions.apply.y,
                width: BUTTON_CONFIG.customization.actions.apply.width,
                height: BUTTON_CONFIG.customization.actions.apply.height,
                text: BUTTON_CONFIG.customization.actions.apply.text,
                hover: false
            },
            cancel: {
                x: BUTTON_CONFIG.customization.actions.cancel.x,
                y: BUTTON_CONFIG.customization.actions.cancel.y,
                width: BUTTON_CONFIG.customization.actions.cancel.width,
                height: BUTTON_CONFIG.customization.actions.cancel.height,
                text: BUTTON_CONFIG.customization.actions.cancel.text,
                hover: false
            }
        };
        
        // 从本地存储加载外观设置
        this.loadCustomizationFromStorage();
    }
    
    /**
     * 从本地存储加载自定义设置
     * 设计意图：恢复用户的自定义选择
     */
    loadCustomizationFromStorage() {
        const saved = GameUtils.loadFromStorage(
            STORAGE_KEYS.APPEARANCE,
            DEFAULT_VALUES.playerAppearance
        );
        
        this.customization.selectedIndices = { ...saved };
    }
    
    /**
     * 保存自定义设置到本地存储
     * 设计意图：持久化用户的自定义选择
     */
    saveCustomizationToStorage() {
        GameUtils.saveToStorage(
            STORAGE_KEYS.APPEARANCE,
            this.customization.selectedIndices
        );
    }
    
    // === 更新方法 ===
    
    /**
     * 主更新方法
     * 设计意图：更新UI状态和动画
     */
    update() {
        // 更新按钮悬停状态
        this.updateButtonHoverStates();
    }
    
    /**
     * 更新按钮悬停状态
     * 设计意图：根据鼠标位置更新按钮悬停效果
     */
    updateButtonHoverStates() {
        if (!this.engine) return;
        
        const mouse = this.engine.getMouseState();
        
        // 更新所有按钮的悬停状态
        const allButtons = [
            ...Object.values(this.menuButtons),
            ...Object.values(this.secondaryButtons),
            ...Object.values(this.pauseMenuButtons),
            ...Object.values(this.customizationButtons)
        ];
        
        allButtons.forEach(button => {
            button.hover = GameUtils.pointInRect(mouse, button);
        });
    }
    
    // === 绘制方法 ===
    
    /**
     * 绘制主菜单
     * 设计意图：绘制游戏主菜单界面
     */
    drawMainMenu() {
        this.ctx.save();
        
        // 绘制标题
        this.drawTitle();
        
        // 绘制主要按钮
        this.drawMenuButtons();
        
        // 绘制辅助按钮
        this.drawSecondaryButtons();
        
        // 绘制版本信息
        this.drawVersionInfo();
        
        this.ctx.restore();
    }
    
    /**
     * 绘制游戏标题
     * 设计意图：绘制游戏的主标题
     */
    drawTitle() {
        const centerX = this.canvas.width / 2;
        const titleY = 150;
        
        // 绘制主标题阴影
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Frog Basketball', centerX + 3, titleY + 3);
        
        // 绘制主标题
        const gradient = this.ctx.createLinearGradient(0, titleY - 30, 0, titleY + 30);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(1, '#FFA500');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillText('Frog Basketball', centerX, titleY);
        
        // 绘制副标题
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '18px Arial';
        this.ctx.fillText('Choose your difficulty', centerX, titleY + 60);
    }
    
    /**
     * 绘制菜单按钮
     * 设计意图：绘制主菜单的游戏模式按钮
     */
    drawMenuButtons() {
        Object.entries(this.menuButtons).forEach(([key, button]) => {
            this.drawButton(button, button.hover ? '#4A90E2' : '#357ABD');
        });
    }
    
    /**
     * 绘制辅助按钮
     * 设计意图：绘制主菜单的辅助功能按钮
     */
    drawSecondaryButtons() {
        // 更新主题按钮文字
        if (this.engine) {
            const currentTheme = this.engine.theme;
            this.secondaryButtons.themeToggle.text = currentTheme === GAME_CONFIG.THEMES.DAY ? 
                BUTTON_CONFIG.secondary.themeToggle.dayText : 
                BUTTON_CONFIG.secondary.themeToggle.nightText;
        }
        
        Object.entries(this.secondaryButtons).forEach(([key, button]) => {
            this.drawButton(button, button.hover ? '#5CB85C' : '#4CAF50');
        });
    }
    
    /**
     * 绘制版本信息
     * 设计意图：在主菜单显示版本或其他信息
     */
    drawVersionInfo() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText('v2.0', this.canvas.width - 20, this.canvas.height - 10);
    }
    
    /**
     * 绘制暂停菜单
     * 设计意图：绘制游戏暂停时的菜单界面
     */
    drawPauseMenu() {
        this.ctx.save();
        
        // 绘制半透明背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制暂停标题
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, 200);
        
        // 绘制暂停菜单按钮
        Object.entries(this.pauseMenuButtons).forEach(([key, button]) => {
            this.drawButton(button, button.hover ? '#D9534F' : '#C9302C');
        });
        
        // 绘制提示信息
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Press ESC to resume', this.canvas.width / 2, 400);
        
        this.ctx.restore();
    }
    
    /**
     * 绘制自定义菜单
     * 设计意图：绘制角色自定义界面
     */
    drawCustomizationMenu() {
        this.ctx.save();
        
        // 绘制背景
        this.drawCustomizationBackground();
        
        // 绘制标题
        this.drawCustomizationTitle();
        
        // 绘制分类按钮
        this.drawCustomizationCategories();
        
        // 绘制当前选择信息
        this.drawCustomizationSelection();
        
        // 绘制预览
        this.drawCustomizationPreview();
        
        // 绘制导航按钮
        this.drawCustomizationNavigation();
        
        // 绘制操作按钮
        this.drawCustomizationActions();
        
        this.ctx.restore();
    }
    
    /**
     * 绘制自定义界面背景
     * 设计意图：为自定义界面提供背景
     */
    drawCustomizationBackground() {
        // 绘制渐变背景
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#2C3E50');
        gradient.addColorStop(1, '#34495E');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制装饰性网格
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        // 绘制垂直线
        for (let x = 0; x < this.canvas.width; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // 绘制水平线
        for (let y = 0; y < this.canvas.height; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    /**
     * 绘制自定义界面标题
     * 设计意图：显示自定义界面的标题
     */
    drawCustomizationTitle() {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Customize Your Player', this.canvas.width / 2, 60);
    }
    
    /**
     * 绘制自定义分类按钮
     * 设计意图：绘制头像、球衣、号码等分类按钮
     */
    drawCustomizationCategories() {
        const categories = ['head', 'jersey', 'number'];
        
        categories.forEach(category => {
            const button = this.customizationButtons[category];
            const isActive = this.customization.selectedCategory === category;
            const color = isActive ? '#3498DB' : (button.hover ? '#5DADE2' : '#85C1E9');
            
            this.drawButton(button, color);
        });
    }
    
    /**
     * 绘制当前选择信息
     * 设计意图：显示当前选择的外观信息
     */
    drawCustomizationSelection() {
        const centerX = this.canvas.width / 2;
        const y = 250;
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        
        const category = this.customization.selectedCategory;
        const index = this.customization.selectedIndices[category];
        
        let displayName = '';
        switch (category) {
            case 'head':
                displayName = APPEARANCE_PRESETS.heads[index]?.name || 'Unknown';
                break;
            case 'jersey':
                displayName = APPEARANCE_PRESETS.jerseys[index]?.name || 'Unknown';
                break;
            case 'number':
                displayName = APPEARANCE_PRESETS.numbers[index] || 'Unknown';
                break;
        }
        
        this.ctx.fillText(`${category.charAt(0).toUpperCase() + category.slice(1)}: ${displayName}`, centerX, y);
    }
    
    /**
     * 绘制自定义预览
     * 设计意图：显示当前外观配置的预览
     */
    drawCustomizationPreview() {
        const centerX = this.canvas.width / 2;
        const centerY = 350;
        
        // 绘制预览背景
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        GameUtils.drawRoundedRect(this.ctx, centerX - 100, centerY - 80, 200, 160, 15);
        this.ctx.fill();
        
        // 绘制预览角色（如果渲染器可用）
        if (this.engine && this.engine.renderer) {
            this.engine.renderer.drawPlayerWithAppearance(
                centerX - 20, centerY - 50,
                this.customization.selectedIndices,
                2.0, // 放大显示
                this.engine.theme
            );
        }
    }
    
    /**
     * 绘制自定义导航按钮
     * 设计意图：绘制上一个/下一个按钮
     */
    drawCustomizationNavigation() {
        const buttons = ['prev', 'next'];
        
        buttons.forEach(buttonKey => {
            const button = this.customizationButtons[buttonKey];
            this.drawButton(button, button.hover ? '#E67E22' : '#F39C12');
        });
    }
    
    /**
     * 绘制自定义操作按钮
     * 设计意图：绘制应用和取消按钮
     */
    drawCustomizationActions() {
        // 应用按钮
        const applyButton = this.customizationButtons.apply;
        this.drawButton(applyButton, applyButton.hover ? '#27AE60' : '#2ECC71');
        
        // 取消按钮
        const cancelButton = this.customizationButtons.cancel;
        this.drawButton(cancelButton, cancelButton.hover ? '#E74C3C' : '#C0392B');
    }
    
    /**
     * 绘制游戏结束屏幕
     * 设计意图：显示游戏结束信息
     */
    drawGameOverScreen() {
        this.ctx.save();
        
        // 绘制半透明背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制游戏结束文字
        this.ctx.fillStyle = '#FF4444';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        // 绘制重试提示
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Press R to restart or ESC for menu', this.canvas.width / 2, this.canvas.height / 2 + 20);
        
        this.ctx.restore();
    }
    
    /**
     * 绘制胜利屏幕
     * 设计意图：显示游戏胜利信息
     */
    drawWinScreen() {
        this.ctx.save();
        
        // 绘制半透明背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制胜利文字
        const gradient = this.ctx.createLinearGradient(0, this.canvas.height / 2 - 50, 0, this.canvas.height / 2);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(1, '#FFA500');
        
        this.ctx.fillStyle = gradient;
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('VICTORY!', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        // 绘制庆祝文字
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Congratulations!', this.canvas.width / 2, this.canvas.height / 2);
        
        // 绘制继续提示
        this.ctx.font = '18px Arial';
        this.ctx.fillText('Press R to play again or ESC for menu', this.canvas.width / 2, this.canvas.height / 2 + 40);
        
        this.ctx.restore();
    }
    
    // === 工具方法 ===
    
    /**
     * 绘制通用按钮
     * 设计意图：统一的按钮绘制方法
     * 
     * @param {object} button - 按钮对象
     * @param {string} color - 按钮颜色
     */
    drawButton(button, color) {
        this.ctx.save();
        
        // 绘制按钮背景
        const gradient = this.ctx.createLinearGradient(
            button.x, button.y,
            button.x, button.y + button.height
        );
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, this.darkenColor(color, 20));
        
        this.ctx.fillStyle = gradient;
        GameUtils.drawRoundedRect(
            this.ctx,
            button.x, button.y,
            button.width, button.height,
            8
        );
        this.ctx.fill();
        
        // 绘制按钮边框
        this.ctx.strokeStyle = this.darkenColor(color, 40);
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // 绘制按钮文字
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
            button.text,
            button.x + button.width / 2,
            button.y + button.height / 2
        );
        
        this.ctx.restore();
    }
    
    /**
     * 颜色加深工具方法
     * 设计意图：为按钮提供渐变和边框效果
     * 
     * @param {string} color - 原始颜色
     * @param {number} percent - 加深百分比
     * @returns {string} 加深后的颜色
     */
    darkenColor(color, percent) {
        // 简单的颜色加深实现
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
    
    // === 事件处理方法 ===
    
    /**
     * 处理鼠标移动事件
     * 设计意图：更新按钮悬停状态
     * 
     * @param {MouseEvent} event - 鼠标事件
     * @param {object} mouse - 鼠标状态
     */
    handleMouseMove(event, mouse) {
        // 悬停状态在update方法中统一处理
    }
    
    /**
     * 处理鼠标按下事件
     * 设计意图：处理按钮点击
     * 
     * @param {MouseEvent} event - 鼠标事件
     * @param {object} mouse - 鼠标状态
     */
    handleMouseDown(event, mouse) {
        if (!this.engine) return;
        
        const gameState = this.engine.gameState;
        
        switch (gameState) {
            case GAME_CONFIG.GAME_STATES.MENU:
                this.handleMenuClick(mouse);
                break;
                
            case GAME_CONFIG.GAME_STATES.PAUSED:
                this.handlePauseMenuClick(mouse);
                break;
                
            case GAME_CONFIG.GAME_STATES.CUSTOMIZATION:
                this.handleCustomizationClick(mouse);
                break;
        }
    }
    
    /**
     * 处理主菜单点击
     * 设计意图：处理主菜单按钮点击事件
     * 
     * @param {object} mouse - 鼠标状态
     */
    handleMenuClick(mouse) {
        // 检查主要按钮
        Object.entries(this.menuButtons).forEach(([key, button]) => {
            if (GameUtils.pointInRect(mouse, button)) {
                this.onMenuButtonClick(key);
            }
        });
        
        // 检查辅助按钮
        Object.entries(this.secondaryButtons).forEach(([key, button]) => {
            if (GameUtils.pointInRect(mouse, button)) {
                this.onSecondaryButtonClick(key);
            }
        });
    }
    
    /**
     * 处理暂停菜单点击
     * 设计意图：处理暂停菜单按钮点击事件
     * 
     * @param {object} mouse - 鼠标状态
     */
    handlePauseMenuClick(mouse) {
        Object.entries(this.pauseMenuButtons).forEach(([key, button]) => {
            if (GameUtils.pointInRect(mouse, button)) {
                this.onPauseMenuButtonClick(key);
            }
        });
    }
    
    /**
     * 处理自定义界面点击
     * 设计意图：处理自定义界面按钮点击事件
     * 
     * @param {object} mouse - 鼠标状态
     */
    handleCustomizationClick(mouse) {
        Object.entries(this.customizationButtons).forEach(([key, button]) => {
            if (GameUtils.pointInRect(mouse, button)) {
                this.onCustomizationButtonClick(key);
            }
        });
    }
    
    /**
     * 处理主菜单按钮点击
     * 设计意图：执行主菜单按钮的功能
     * 
     * @param {string} buttonKey - 按钮键值
     */
    onMenuButtonClick(buttonKey) {
        if (!this.engine) return;
        
        switch (buttonKey) {
            case 'normal':
                this.engine.setDifficulty(GAME_CONFIG.DIFFICULTY_LEVELS.NORMAL);
                this.engine.setState(GAME_CONFIG.GAME_STATES.PLAYING);
                break;
                
            case 'hardcore':
                this.engine.setDifficulty(GAME_CONFIG.DIFFICULTY_LEVELS.HARDCORE);
                this.engine.setState(GAME_CONFIG.GAME_STATES.PLAYING);
                break;
        }
    }
    
    /**
     * 处理辅助按钮点击
     * 设计意图：执行辅助按钮的功能
     * 
     * @param {string} buttonKey - 按钮键值
     */
    onSecondaryButtonClick(buttonKey) {
        if (!this.engine) return;
        
        switch (buttonKey) {
            case 'customize':
                this.engine.setState(GAME_CONFIG.GAME_STATES.CUSTOMIZATION);
                break;
                
            case 'themeToggle':
                const currentTheme = this.engine.theme;
                const newTheme = currentTheme === GAME_CONFIG.THEMES.DAY ? 
                    GAME_CONFIG.THEMES.NIGHT : GAME_CONFIG.THEMES.DAY;
                this.engine.setTheme(newTheme);
                break;
        }
    }
    
    /**
     * 处理暂停菜单按钮点击
     * 设计意图：执行暂停菜单按钮的功能
     * 
     * @param {string} buttonKey - 按钮键值
     */
    onPauseMenuButtonClick(buttonKey) {
        if (!this.engine) return;
        
        switch (buttonKey) {
            case 'restart':
                this.engine.restart();
                this.engine.setState(GAME_CONFIG.GAME_STATES.PLAYING);
                break;
                
            case 'backToMenu':
                this.engine.setState(GAME_CONFIG.GAME_STATES.MENU);
                break;
        }
    }
    
    /**
     * 处理自定义按钮点击
     * 设计意图：执行自定义界面按钮的功能
     * 
     * @param {string} buttonKey - 按钮键值
     */
    onCustomizationButtonClick(buttonKey) {
        switch (buttonKey) {
            case 'head':
            case 'jersey':
            case 'number':
                this.setCustomizationCategory(buttonKey);
                break;
                
            case 'prev':
                this.navigateCustomization(-1);
                break;
                
            case 'next':
                this.navigateCustomization(1);
                break;
                
            case 'apply':
                this.applyCustomization();
                break;
                
            case 'cancel':
                this.cancelCustomization();
                break;
        }
    }
    
    /**
     * 设置自定义分类
     * 设计意图：切换自定义的分类（头像、球衣、号码）
     * 
     * @param {string} category - 分类名称
     */
    setCustomizationCategory(category) {
        this.customization.selectedCategory = category;
        
        // 更新分类按钮的激活状态
        Object.keys(this.customizationButtons).forEach(key => {
            if (['head', 'jersey', 'number'].includes(key)) {
                this.customizationButtons[key].active = (key === category);
            }
        });
    }
    
    /**
     * 导航自定义选项
     * 设计意图：在当前分类中切换选项
     * 
     * @param {number} direction - 方向（-1 或 1）
     */
    navigateCustomization(direction) {
        const category = this.customization.selectedCategory;
        const currentIndex = this.customization.selectedIndices[category];
        const maxIndex = this.getMaxIndex(category);
        
        let newIndex = currentIndex + direction;
        if (newIndex < 0) {
            newIndex = maxIndex - 1;
        } else if (newIndex >= maxIndex) {
            newIndex = 0;
        }
        
        this.customization.selectedIndices[category] = newIndex;
    }
    
    /**
     * 获取分类的最大索引
     * 设计意图：获取指定分类的选项数量
     * 
     * @param {string} category - 分类名称
     * @returns {number} 最大索引
     */
    getMaxIndex(category) {
        switch (category) {
            case 'head':
                return APPEARANCE_PRESETS.heads.length;
            case 'jersey':
                return APPEARANCE_PRESETS.jerseys.length;
            case 'number':
                return APPEARANCE_PRESETS.numbers.length;
            default:
                return 0;
        }
    }
    
    /**
     * 应用自定义设置
     * 设计意图：应用当前的自定义选择并返回菜单
     */
    applyCustomization() {
        // 保存到本地存储
        this.saveCustomizationToStorage();
        
        // 返回主菜单
        if (this.engine) {
            this.engine.setState(GAME_CONFIG.GAME_STATES.MENU);
        }
    }
    
    /**
     * 取消自定义设置
     * 设计意图：取消自定义修改并返回菜单
     */
    cancelCustomization() {
        // 重新加载保存的设置
        this.loadCustomizationFromStorage();
        
        // 返回主菜单
        if (this.engine) {
            this.engine.setState(GAME_CONFIG.GAME_STATES.MENU);
        }
    }
    
    /**
     * 处理键盘按下事件
     * 设计意图：处理UI相关的键盘输入
     * 
     * @param {KeyboardEvent} event - 键盘事件
     */
    handleKeyDown(event) {
        if (!this.engine) return;
        
        const gameState = this.engine.gameState;
        
        switch (event.code) {
            case 'Escape':
                this.handleEscapeKey(gameState);
                break;
                
            case 'KeyR':
                this.handleRestartKey(gameState);
                break;
        }
    }
    
    /**
     * 处理ESC键
     * 设计意图：处理ESC键的不同功能
     * 
     * @param {string} gameState - 当前游戏状态
     */
    handleEscapeKey(gameState) {
        switch (gameState) {
            case GAME_CONFIG.GAME_STATES.PLAYING:
                this.engine.pause();
                break;
                
            case GAME_CONFIG.GAME_STATES.PAUSED:
                this.engine.resume();
                break;
                
            case GAME_CONFIG.GAME_STATES.CUSTOMIZATION:
                this.cancelCustomization();
                break;
                
            case GAME_CONFIG.GAME_STATES.GAME_OVER:
            case GAME_CONFIG.GAME_STATES.WIN:
                this.engine.setState(GAME_CONFIG.GAME_STATES.MENU);
                break;
        }
    }
    
    /**
     * 处理重启键
     * 设计意图：处理R键的重启功能
     * 
     * @param {string} gameState - 当前游戏状态
     */
    handleRestartKey(gameState) {
        if (gameState === GAME_CONFIG.GAME_STATES.GAME_OVER || 
            gameState === GAME_CONFIG.GAME_STATES.WIN) {
            this.engine.restart();
            this.engine.setState(GAME_CONFIG.GAME_STATES.PLAYING);
        }
    }
    
    /**
     * 处理键盘释放事件
     * 设计意图：处理UI相关的键盘释放
     * 
     * @param {KeyboardEvent} event - 键盘事件
     */
    handleKeyUp(event) {
        // 目前没有特殊的键盘释放处理
    }
    
    /**
     * 处理状态变化
     * 设计意图：响应游戏状态变化
     * 
     * @param {string} oldState - 旧状态
     * @param {string} newState - 新状态
     */
    onStateChange(oldState, newState) {
        // 状态变化时的处理（如果需要）
    }
    
    /**
     * 销毁UI管理器
     * 设计意图：清理资源
     */
    destroy() {
        console.log('UI管理器已销毁');
    }
}