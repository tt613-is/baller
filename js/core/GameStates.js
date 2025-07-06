/**
 * 游戏状态集合 - 包含所有游戏状态的实现
 */

import { BaseState } from './GameEngine.js';
import { GameConfig, AppearancePresets, ThemeColors, ButtonConfig, Events } from '../data/GameData.js';
import { CanvasUtils, ColorUtils, StorageUtils } from '../utils/GameUtils.js';

// 主菜单状态
export class MenuState extends BaseState {
    constructor(engine) {
        super('menu', engine);
        this.theme = 'day';
        this.animationFrame = 0;
        this.menuButtons = this.createMenuButtons();
        this.secondaryButtons = this.createSecondaryButtons();
    }

    createMenuButtons() {
        const centerX = this.engine.canvas.width / 2;
        return {
            normal: {
                ...ButtonConfig.menu.normal,
                x: centerX - ButtonConfig.menu.normal.width / 2,
                hover: false
            },
            hardcore: {
                ...ButtonConfig.menu.hardcore,
                x: centerX - ButtonConfig.menu.hardcore.width / 2,
                hover: false
            }
        };
    }

    createSecondaryButtons() {
        const margin = 30;
        const canvasWidth = this.engine.canvas.width;
        const canvasHeight = this.engine.canvas.height;
        
        return {
            customize: {
                ...ButtonConfig.secondary.customize,
                x: margin,
                y: canvasHeight - ButtonConfig.secondary.customize.height - margin,
                hover: false
            },
            themeToggle: {
                ...ButtonConfig.secondary.themeToggle,
                x: canvasWidth - ButtonConfig.secondary.themeToggle.width - margin,
                y: canvasHeight - ButtonConfig.secondary.themeToggle.height - margin,
                text: this.theme === 'day' ? 'Day' : 'Night',
                hover: false
            }
        };
    }

    enter(data) {
        console.log('进入主菜单');
        this.eventBus.emit(Events.STATE_CHANGED, { state: 'menu' });
        this.updateTheme();
    }

    update(deltaTime) {
        this.animationFrame++;
    }

    render(ctx) {
        this.drawBackground(ctx);
        this.drawTitle(ctx);
        this.drawMenuButtons(ctx);
        this.drawSecondaryButtons(ctx);
        this.drawAnimatedStars(ctx);
    }

    drawBackground(ctx) {
        const colors = ThemeColors[this.theme];
        const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
        gradient.addColorStop(0, colors.background.sky[0]);
        gradient.addColorStop(1, colors.background.sky[1]);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    drawTitle(ctx) {
        CanvasUtils.withState(ctx, () => {
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 15;
            ctx.shadowOffsetY = 3;
            
            const gradient = ctx.createLinearGradient(0, 100, 0, 180);
            gradient.addColorStop(0, '#FFD700');
            gradient.addColorStop(1, '#FFA500');
            
            ctx.fillStyle = gradient;
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Frog Basketball', ctx.canvas.width / 2, 150);
            
            ctx.font = '24px Arial';
            ctx.fillStyle = ThemeColors[this.theme].text;
            ctx.fillText('选择游戏难度', ctx.canvas.width / 2, 200);
        });
    }

    drawMenuButtons(ctx) {
        Object.entries(this.menuButtons).forEach(([key, button]) => {
            this.drawButton(ctx, button, button.hover);
        });
    }

    drawSecondaryButtons(ctx) {
        Object.entries(this.secondaryButtons).forEach(([key, button]) => {
            this.drawSmallButton(ctx, button, button.hover);
        });
    }

    drawButton(ctx, button, isHover) {
        CanvasUtils.withState(ctx, () => {
            // 阴影效果
            if (isHover) {
                ctx.shadowColor = '#000000';
                ctx.shadowBlur = 20;
                ctx.shadowOffsetY = 5;
            }

            // 渐变背景
            const gradient = ctx.createLinearGradient(0, button.y, 0, button.y + button.height);
            if (isHover) {
                gradient.addColorStop(0, '#45a049');
                gradient.addColorStop(1, '#3d8b40');
            } else {
                gradient.addColorStop(0, '#4CAF50');
                gradient.addColorStop(1, '#45a049');
            }

            ctx.fillStyle = gradient;
            CanvasUtils.roundRect(ctx, button.x, button.y, button.width, button.height, 10);
            ctx.fill();

            // 边框
            ctx.strokeStyle = '#2E7D32';
            ctx.lineWidth = 2;
            ctx.stroke();

            // 文字
            ctx.fillStyle = 'white';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                button.text,
                button.x + button.width / 2,
                button.y + button.height / 2
            );
        });
    }

    drawSmallButton(ctx, button, isHover) {
        CanvasUtils.withState(ctx, () => {
            const gradient = ctx.createLinearGradient(0, button.y, 0, button.y + button.height);
            const baseColor = this.theme === 'day' ? '#87CEEB' : '#4CAF50';
            const hoverColor = this.theme === 'day' ? '#76bfe0' : '#45a049';
            
            if (isHover) {
                gradient.addColorStop(0, hoverColor);
                gradient.addColorStop(1, ColorUtils.interpolateColor(hoverColor, '#000000', 0.2));
            } else {
                gradient.addColorStop(0, baseColor);
                gradient.addColorStop(1, ColorUtils.interpolateColor(baseColor, '#000000', 0.2));
            }

            ctx.fillStyle = gradient;
            CanvasUtils.roundRect(ctx, button.x, button.y, button.width, button.height, 8);
            ctx.fill();

            ctx.strokeStyle = this.theme === 'day' ? '#000000' : '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = this.theme === 'day' ? '#000000' : '#FFFFFF';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                button.text,
                button.x + button.width / 2,
                button.y + button.height / 2
            );
        });
    }

    drawAnimatedStars(ctx) {
        CanvasUtils.withState(ctx, () => {
            ctx.fillStyle = '#FFFFFF';
            for (let i = 0; i < 50; i++) {
                const x = (i * 137 + this.animationFrame * 0.5) % ctx.canvas.width;
                const y = (i * 89) % ctx.canvas.height;
                const size = Math.sin(i + this.animationFrame * 0.02) * 1.5 + 1.5;
                const alpha = Math.sin(i + this.animationFrame * 0.03) * 0.5 + 0.5;
                
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    handleMouseMove(x, y) {
        // 检查主菜单按钮悬停
        Object.values(this.menuButtons).forEach(button => {
            button.hover = this.isPointInButton(x, y, button);
        });

        // 检查辅助按钮悬停
        Object.values(this.secondaryButtons).forEach(button => {
            button.hover = this.isPointInButton(x, y, button);
        });
    }

    handleMouseClick(x, y) {
        // 检查主菜单按钮点击
        Object.entries(this.menuButtons).forEach(([key, button]) => {
            if (this.isPointInButton(x, y, button)) {
                this.onMenuButtonClick(key);
            }
        });

        // 检查辅助按钮点击
        Object.entries(this.secondaryButtons).forEach(([key, button]) => {
            if (this.isPointInButton(x, y, button)) {
                this.onSecondaryButtonClick(key);
            }
        });
    }

    isPointInButton(x, y, button) {
        return x >= button.x && x <= button.x + button.width &&
               y >= button.y && y <= button.y + button.height;
    }

    onMenuButtonClick(buttonKey) {
        console.log(`点击了菜单按钮: ${buttonKey}`);
        this.eventBus.emit(Events.BUTTON_CLICKED, { button: buttonKey, state: 'menu' });
        this.eventBus.emit('changeState', { 
            state: 'playing', 
            data: { difficulty: buttonKey }, 
            fade: true 
        });
    }

    onSecondaryButtonClick(buttonKey) {
        if (buttonKey === 'customize') {
            this.eventBus.emit('changeState', { state: 'customization', fade: true });
        } else if (buttonKey === 'themeToggle') {
            this.toggleTheme();
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'day' ? 'night' : 'day';
        this.secondaryButtons.themeToggle.text = this.theme === 'day' ? 'Day' : 'Night';
        this.updateTheme();
        this.eventBus.emit(Events.THEME_CHANGED, { theme: this.theme });
    }

    updateTheme() {
        const body = document.body;
        if (this.theme === 'day') {
            body.classList.add('day-theme');
        } else {
            body.classList.remove('day-theme');
        }
    }
}

// 游戏进行状态
export class PlayingState extends BaseState {
    constructor(engine) {
        super('playing', engine);
        this.difficulty = 'normal';
        this.score = 0;
        this.theme = 'day';
        
        // 这里将在后续添加游戏逻辑
        // 暂时创建一个基础的游戏状态
        this.testMessage = '游戏进行中...';
    }

    enter(data) {
        console.log('进入游戏状态');
        if (data && data.difficulty) {
            this.difficulty = data.difficulty;
        }
        this.eventBus.emit(Events.GAME_STARTED, { difficulty: this.difficulty });
    }

    update(deltaTime) {
        // 临时的更新逻辑
    }

    render(ctx) {
        // 临时的渲染逻辑
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        ctx.fillStyle = 'white';
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('游戏进行状态', ctx.canvas.width / 2, ctx.canvas.height / 2);
        
        ctx.font = '18px Arial';
        ctx.fillText(`难度: ${this.difficulty}`, ctx.canvas.width / 2, ctx.canvas.height / 2 + 40);
        ctx.fillText('按ESC暂停游戏', ctx.canvas.width / 2, ctx.canvas.height / 2 + 70);
        ctx.fillText('按M返回主菜单', ctx.canvas.width / 2, ctx.canvas.height / 2 + 100);
    }

    handleInput(input) {
        if (input.type === 'keydown') {
            switch (input.key) {
                case 'Escape':
                    this.eventBus.emit('changeState', { state: 'paused' });
                    break;
                case 'm':
                case 'M':
                    this.eventBus.emit('changeState', { state: 'menu', fade: true });
                    break;
            }
        }
    }
}

// 暂停状态
export class PausedState extends BaseState {
    constructor(engine) {
        super('paused', engine);
        this.pauseButtons = this.createPauseButtons();
    }

    createPauseButtons() {
        const centerX = this.engine.canvas.width / 2;
        return {
            resume: {
                x: centerX - 125,
                y: 200,
                width: 250,
                height: 50,
                text: 'Resume Game',
                hover: false
            },
            restart: {
                ...ButtonConfig.pause.restart,
                x: centerX - ButtonConfig.pause.restart.width / 2,
                hover: false
            },
            backToMenu: {
                ...ButtonConfig.pause.backToMenu,
                x: centerX - ButtonConfig.pause.backToMenu.width / 2,
                hover: false
            }
        };
    }

    enter(data) {
        console.log('游戏暂停');
        this.eventBus.emit(Events.GAME_PAUSED);
    }

    render(ctx) {
        // 半透明覆盖层
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // 暂停标题
        CanvasUtils.withState(ctx, () => {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('游戏暂停', ctx.canvas.width / 2, 120);
        });

        // 绘制暂停菜单按钮
        Object.values(this.pauseButtons).forEach(button => {
            this.drawPauseButton(ctx, button);
        });
    }

    drawPauseButton(ctx, button) {
        CanvasUtils.withState(ctx, () => {
            const gradient = ctx.createLinearGradient(0, button.y, 0, button.y + button.height);
            if (button.hover) {
                gradient.addColorStop(0, '#45a049');
                gradient.addColorStop(1, '#3d8b40');
            } else {
                gradient.addColorStop(0, '#4CAF50');
                gradient.addColorStop(1, '#45a049');
            }

            ctx.fillStyle = gradient;
            CanvasUtils.roundRect(ctx, button.x, button.y, button.width, button.height, 10);
            ctx.fill();

            ctx.strokeStyle = '#2E7D32';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = 'white';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                button.text,
                button.x + button.width / 2,
                button.y + button.height / 2
            );
        });
    }

    handleMouseMove(x, y) {
        Object.values(this.pauseButtons).forEach(button => {
            button.hover = x >= button.x && x <= button.x + button.width &&
                          y >= button.y && y <= button.y + button.height;
        });
    }

    handleMouseClick(x, y) {
        Object.entries(this.pauseButtons).forEach(([key, button]) => {
            if (x >= button.x && x <= button.x + button.width &&
                y >= button.y && y <= button.y + button.height) {
                this.onPauseButtonClick(key);
            }
        });
    }

    handleInput(input) {
        if (input.type === 'keydown' && input.key === 'Escape') {
            this.eventBus.emit('changeState', { state: 'playing' });
        }
    }

    onPauseButtonClick(buttonKey) {
        console.log(`点击了暂停按钮: ${buttonKey}`);
        switch (buttonKey) {
            case 'resume':
                this.eventBus.emit('changeState', { state: 'playing' });
                break;
            case 'restart':
                this.eventBus.emit('changeState', { 
                    state: 'playing', 
                    data: { restart: true }, 
                    fade: true 
                });
                break;
            case 'backToMenu':
                this.eventBus.emit('changeState', { state: 'menu', fade: true });
                break;
        }
    }
}

// 换装状态
export class CustomizationState extends BaseState {
    constructor(engine) {
        super('customization', engine);
        this.selectedCategory = 'head';
        this.selectedIndices = { head: 0, jersey: 0, number: 0 };
        this.customizationButtons = this.createCustomizationButtons();
        this.previewPlayer = null;
        this.loadAppearanceFromStorage();
    }

    createCustomizationButtons() {
        return {
            // 分类按钮
            head: { ...ButtonConfig.customization.categories.head, active: true, hover: false },
            jersey: { ...ButtonConfig.customization.categories.jersey, active: false, hover: false },
            number: { ...ButtonConfig.customization.categories.number, active: false, hover: false },
            
            // 导航按钮
            prev: { ...ButtonConfig.customization.navigation.prev, hover: false },
            next: { ...ButtonConfig.customization.navigation.next, hover: false },
            
            // 操作按钮
            apply: { ...ButtonConfig.customization.actions.apply, hover: false },
            cancel: { ...ButtonConfig.customization.actions.cancel, hover: false }
        };
    }

    enter(data) {
        console.log('进入换装界面');
        this.initCustomization();
    }

    initCustomization() {
        // 重置换装界面状态
        this.selectedCategory = 'head';
        Object.keys(this.customizationButtons).forEach(key => {
            if (['head', 'jersey', 'number'].includes(key)) {
                this.customizationButtons[key].active = key === 'head';
            }
        });
    }

    loadAppearanceFromStorage() {
        const saved = StorageUtils.getItem('playerAppearance');
        if (saved && this.validateAppearanceData(saved)) {
            this.selectedIndices = {
                head: saved.headIndex || 0,
                jersey: saved.jerseyIndex || 0,
                number: saved.numberIndex || 0
            };
        }
    }

    validateAppearanceData(data) {
        return data &&
               typeof data.headIndex === 'number' &&
               typeof data.jerseyIndex === 'number' &&
               typeof data.numberIndex === 'number' &&
               data.headIndex >= 0 && data.headIndex < AppearancePresets.heads.length &&
               data.jerseyIndex >= 0 && data.jerseyIndex < AppearancePresets.jerseys.length &&
               data.numberIndex >= 0 && data.numberIndex < AppearancePresets.numbers.length;
    }

    update(deltaTime) {
        // 换装界面不需要复杂的更新逻辑
    }

    render(ctx) {
        this.drawBackground(ctx);
        this.drawTitle(ctx);
        this.drawCategoryButtons(ctx);
        this.drawCurrentSelection(ctx);
        this.drawNavigationButtons(ctx);
        this.drawPreview(ctx);
        this.drawActionButtons(ctx);
    }

    drawBackground(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
        gradient.addColorStop(0, '#2C3E50');
        gradient.addColorStop(1, '#1B2631');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    drawTitle(ctx) {
        CanvasUtils.withState(ctx, () => {
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 15;
            ctx.shadowOffsetY = 3;
            
            const gradient = ctx.createLinearGradient(0, 50, 0, 90);
            gradient.addColorStop(0, '#FFD700');
            gradient.addColorStop(1, '#FFA500');
            
            ctx.fillStyle = gradient;
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Character Customization', ctx.canvas.width / 2, 70);
        });
    }

    drawCategoryButtons(ctx) {
        ['head', 'jersey', 'number'].forEach(category => {
            const button = this.customizationButtons[category];
            this.drawCategoryButton(ctx, button, button.active);
        });
    }

    drawCategoryButton(ctx, button, isActive) {
        CanvasUtils.withState(ctx, () => {
            const gradient = ctx.createLinearGradient(0, button.y, 0, button.y + button.height);
            
            if (isActive) {
                gradient.addColorStop(0, '#4CAF50');
                gradient.addColorStop(1, '#45a049');
            } else if (button.hover) {
                gradient.addColorStop(0, '#5A6C7D');
                gradient.addColorStop(1, '#4A5A6B');
            } else {
                gradient.addColorStop(0, '#34495E');
                gradient.addColorStop(1, '#2C3E50');
            }

            ctx.fillStyle = gradient;
            CanvasUtils.roundRect(ctx, button.x, button.y, button.width, button.height, 8);
            ctx.fill();

            ctx.strokeStyle = isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                button.text,
                button.x + button.width / 2,
                button.y + button.height / 2
            );
        });
    }

    drawCurrentSelection(ctx) {
        const currentIndex = this.selectedIndices[this.selectedCategory];
        let currentData, totalCount;

        switch (this.selectedCategory) {
            case 'head':
                totalCount = AppearancePresets.heads.length;
                currentData = AppearancePresets.heads[Math.max(0, Math.min(currentIndex, totalCount - 1))];
                break;
            case 'jersey':
                totalCount = AppearancePresets.jerseys.length;
                currentData = AppearancePresets.jerseys[Math.max(0, Math.min(currentIndex, totalCount - 1))];
                break;
            case 'number':
                totalCount = AppearancePresets.numbers.length;
                currentData = AppearancePresets.numbers[Math.max(0, Math.min(currentIndex, totalCount - 1))];
                break;
            default:
                currentData = '';
                totalCount = 0;
                break;
        }

        CanvasUtils.withState(ctx, () => {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 22px Arial';
            ctx.textAlign = 'center';
            
            const categoryText = this.selectedCategory.charAt(0).toUpperCase() + this.selectedCategory.slice(1);
            ctx.fillText(`${categoryText}:`, ctx.canvas.width / 2, 250);
            
            ctx.font = '18px Arial';
            const name = currentData ? (typeof currentData === 'string' ? currentData : currentData.name) : 'None';
            ctx.fillText(name, ctx.canvas.width / 2, 280);
            
            ctx.font = '14px Arial';
            ctx.fillStyle = '#CCCCCC';
            ctx.fillText(`${currentIndex + 1} / ${totalCount}`, ctx.canvas.width / 2, 300);
        });
    }

    drawNavigationButtons(ctx) {
        ['prev', 'next'].forEach(key => {
            const button = this.customizationButtons[key];
            this.drawNavigationButton(ctx, button);
        });
    }

    drawNavigationButton(ctx, button) {
        CanvasUtils.withState(ctx, () => {
            const gradient = ctx.createLinearGradient(0, button.y, 0, button.y + button.height);
            
            if (button.hover) {
                gradient.addColorStop(0, '#5A6C7D');
                gradient.addColorStop(1, '#4A5A6B');
            } else {
                gradient.addColorStop(0, '#34495E');
                gradient.addColorStop(1, '#2C3E50');
            }

            ctx.fillStyle = gradient;
            CanvasUtils.roundRect(ctx, button.x, button.y, button.width, button.height, 8);
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                button.text,
                button.x + button.width / 2,
                button.y + button.height / 2
            );
        });
    }

    drawPreview(ctx) {
        // 绘制预览框
        const previewX = ctx.canvas.width / 2 - 100;
        const previewY = 350;
        
        CanvasUtils.withState(ctx, () => {
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3;
            ctx.strokeRect(previewX, previewY, 200, 150);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Preview', previewX + 100, previewY - 10);
            
            // 简单的预览图形
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(previewX + 100, previewY + 75, 30, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px Arial';
            ctx.fillText('Character Preview', previewX + 100, previewY + 130);
        });
    }

    drawActionButtons(ctx) {
        ['apply', 'cancel'].forEach(key => {
            const button = this.customizationButtons[key];
            this.drawActionButton(ctx, button, key === 'apply');
        });
    }

    drawActionButton(ctx, button, isApply) {
        CanvasUtils.withState(ctx, () => {
            const gradient = ctx.createLinearGradient(0, button.y, 0, button.y + button.height);
            
            if (button.hover) {
                if (isApply) {
                    gradient.addColorStop(0, '#27AE60');
                    gradient.addColorStop(1, '#229954');
                } else {
                    gradient.addColorStop(0, '#E67E22');
                    gradient.addColorStop(1, '#D35400');
                }
            } else {
                if (isApply) {
                    gradient.addColorStop(0, '#2ECC71');
                    gradient.addColorStop(1, '#27AE60');
                } else {
                    gradient.addColorStop(0, '#F39C12');
                    gradient.addColorStop(1, '#E67E22');
                }
            }

            ctx.fillStyle = gradient;
            CanvasUtils.roundRect(ctx, button.x, button.y, button.width, button.height, 10);
            ctx.fill();

            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.fillStyle = isApply ? '#FFFFFF' : '#000000';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                button.text,
                button.x + button.width / 2,
                button.y + button.height / 2
            );
        });
    }

    handleMouseMove(x, y) {
        Object.values(this.customizationButtons).forEach(button => {
            button.hover = x >= button.x && x <= button.x + button.width &&
                          y >= button.y && y <= button.y + button.height;
        });
    }

    handleMouseClick(x, y) {
        Object.entries(this.customizationButtons).forEach(([key, button]) => {
            if (x >= button.x && x <= button.x + button.width &&
                y >= button.y && y <= button.y + button.height) {
                this.onCustomizationButtonClick(key);
            }
        });
    }

    onCustomizationButtonClick(buttonKey) {
        console.log(`点击了换装按钮: ${buttonKey}`);
        
        if (['head', 'jersey', 'number'].includes(buttonKey)) {
            // 分类选择
            this.selectedCategory = buttonKey;
            Object.keys(this.customizationButtons).forEach(key => {
                if (['head', 'jersey', 'number'].includes(key)) {
                    this.customizationButtons[key].active = key === buttonKey;
                }
            });
        } else if (buttonKey === 'prev') {
            this.changeSelection(-1);
        } else if (buttonKey === 'next') {
            this.changeSelection(1);
        } else if (buttonKey === 'apply') {
            this.applyCustomization();
        } else if (buttonKey === 'cancel') {
            this.eventBus.emit('changeState', { state: 'menu', fade: true });
        }
    }

    changeSelection(direction) {
        const category = this.selectedCategory;
        let maxIndex;
        
        switch (category) {
            case 'head':
                maxIndex = AppearancePresets.heads.length - 1;
                break;
            case 'jersey':
                maxIndex = AppearancePresets.jerseys.length - 1;
                break;
            case 'number':
                maxIndex = AppearancePresets.numbers.length - 1;
                break;
            default:
                return;
        }
        
        this.selectedIndices[category] = Math.max(0, Math.min(
            this.selectedIndices[category] + direction,
            maxIndex
        ));
    }

    applyCustomization() {
        const appearanceData = {
            headIndex: this.selectedIndices.head,
            jerseyIndex: this.selectedIndices.jersey,
            numberIndex: this.selectedIndices.number
        };
        
        StorageUtils.setItem('playerAppearance', appearanceData);
        this.eventBus.emit(Events.APPEARANCE_CHANGED, appearanceData);
        this.eventBus.emit('changeState', { state: 'menu', fade: true });
    }
}

// 游戏结束状态
export class GameOverState extends BaseState {
    constructor(engine) {
        super('gameOver', engine);
        this.finalScore = 0;
    }

    enter(data) {
        console.log('游戏结束');
        if (data && data.score) {
            this.finalScore = data.score;
        }
        this.eventBus.emit(Events.GAME_OVER, { score: this.finalScore });
    }

    render(ctx) {
        // 半透明覆盖层
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        CanvasUtils.withState(ctx, () => {
            ctx.fillStyle = '#FF4444';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Game Over!', ctx.canvas.width / 2, 200);

            ctx.fillStyle = 'white';
            ctx.font = '24px Arial';
            ctx.fillText(`Final Score: ${this.finalScore}`, ctx.canvas.width / 2, 250);
            
            ctx.font = '18px Arial';
            ctx.fillText('Press R to restart or M for main menu', ctx.canvas.width / 2, 350);
        });
    }

    handleInput(input) {
        if (input.type === 'keydown') {
            switch (input.key.toLowerCase()) {
                case 'r':
                    this.eventBus.emit('changeState', { 
                        state: 'playing', 
                        data: { restart: true }, 
                        fade: true 
                    });
                    break;
                case 'm':
                    this.eventBus.emit('changeState', { state: 'menu', fade: true });
                    break;
            }
        }
    }
}

// 胜利状态
export class WinState extends BaseState {
    constructor(engine) {
        super('win', engine);
        this.finalScore = 0;
        this.animationFrame = 0;
    }

    enter(data) {
        console.log('游戏胜利');
        if (data && data.score) {
            this.finalScore = data.score;
        }
        this.eventBus.emit(Events.GAME_WON, { score: this.finalScore });
    }

    update(deltaTime) {
        this.animationFrame++;
    }

    render(ctx) {
        // 动态背景
        const gradient = ctx.createRadialGradient(
            ctx.canvas.width / 2, ctx.canvas.height / 2, 0,
            ctx.canvas.width / 2, ctx.canvas.height / 2, 400
        );
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(1, '#FF8C00');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // 庆祝效果
        this.drawCelebrationEffects(ctx);

        CanvasUtils.withState(ctx, () => {
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 10;
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Victory!', ctx.canvas.width / 2, 200);

            ctx.font = '24px Arial';
            ctx.fillText(`Final Score: ${this.finalScore}`, ctx.canvas.width / 2, 250);
            
            ctx.font = '18px Arial';
            ctx.fillText('Press R to play again or M for main menu', ctx.canvas.width / 2, 350);
        });
    }

    drawCelebrationEffects(ctx) {
        // 简单的庆祝粒子效果
        CanvasUtils.withState(ctx, () => {
            for (let i = 0; i < 20; i++) {
                const x = (ctx.canvas.width / 2) + Math.sin(this.animationFrame * 0.05 + i) * 200;
                const y = 100 + (i * 20) + Math.sin(this.animationFrame * 0.03 + i) * 30;
                const size = 3 + Math.sin(this.animationFrame * 0.1 + i) * 2;
                
                ctx.fillStyle = `hsl(${(this.animationFrame + i * 30) % 360}, 70%, 60%)`;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    handleInput(input) {
        if (input.type === 'keydown') {
            switch (input.key.toLowerCase()) {
                case 'r':
                    this.eventBus.emit('changeState', { 
                        state: 'playing', 
                        data: { restart: true }, 
                        fade: true 
                    });
                    break;
                case 'm':
                    this.eventBus.emit('changeState', { state: 'menu', fade: true });
                    break;
            }
        }
    }
}