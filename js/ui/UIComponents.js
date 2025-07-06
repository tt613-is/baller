/**
 * UI组件集合 - 按钮、菜单、面板等可重用UI组件
 */

import { ButtonConfig, ThemeColors } from '../data/GameData.js';
import { CanvasUtils, ColorUtils, MathUtils } from '../utils/GameUtils.js';

// UI组件基类
export class UIComponent {
    constructor(x = 0, y = 0, width = 0, height = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.visible = true;
        this.enabled = true;
        this.hover = false;
        this.pressed = false;
        this.focused = false;
        this.alpha = 1;
        this.callbacks = new Map();
    }

    // 事件回调注册
    on(event, callback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }
        this.callbacks.get(event).push(callback);
    }

    // 触发事件
    emit(event, data = {}) {
        if (this.callbacks.has(event)) {
            this.callbacks.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in UI component callback for ${event}:`, error);
                }
            });
        }
    }

    // 检查点是否在组件内
    contains(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }

    // 处理鼠标移动
    handleMouseMove(x, y) {
        const wasHover = this.hover;
        this.hover = this.enabled && this.contains(x, y);
        
        if (this.hover && !wasHover) {
            this.emit('mouseEnter', { x, y });
        } else if (!this.hover && wasHover) {
            this.emit('mouseLeave', { x, y });
        }
    }

    // 处理鼠标按下
    handleMouseDown(x, y, button = 0) {
        if (this.enabled && this.contains(x, y)) {
            this.pressed = true;
            this.focused = true;
            this.emit('mouseDown', { x, y, button });
        } else {
            this.focused = false;
        }
    }

    // 处理鼠标释放
    handleMouseUp(x, y, button = 0) {
        if (this.pressed) {
            this.pressed = false;
            if (this.enabled && this.contains(x, y)) {
                this.emit('click', { x, y, button });
            }
            this.emit('mouseUp', { x, y, button });
        }
    }

    // 更新组件（子类重写）
    update(deltaTime) {
        // 基类默认为空实现
    }

    // 渲染组件（子类重写）
    render(ctx) {
        // 基类默认为空实现
    }

    // 设置位置
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    // 设置尺寸
    setSize(width, height) {
        this.width = width;
        this.height = height;
    }

    // 设置可见性
    setVisible(visible) {
        this.visible = visible;
    }

    // 设置启用状态
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.hover = false;
            this.pressed = false;
        }
    }

    // 获取边界框
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

// 按钮组件
export class Button extends UIComponent {
    constructor(x, y, width, height, text = '') {
        super(x, y, width, height);
        this.text = text;
        this.style = {
            backgroundColor: '#4CAF50',
            backgroundColorHover: '#45a049',
            backgroundColorPressed: '#3d8b40',
            backgroundColorDisabled: '#cccccc',
            textColor: '#ffffff',
            textColorDisabled: '#666666',
            borderColor: '#2E7D32',
            borderWidth: 2,
            borderRadius: 8,
            fontSize: 16,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            shadowColor: 'rgba(0,0,0,0.3)',
            shadowBlur: 5,
            shadowOffset: { x: 2, y: 2 }
        };
        this.animationProgress = 0;
        this.animationSpeed = 0.1;
    }

    update(deltaTime) {
        // 动画效果
        const targetProgress = (this.hover || this.pressed) ? 1 : 0;
        this.animationProgress = MathUtils.lerp(
            this.animationProgress, 
            targetProgress, 
            this.animationSpeed
        );
    }

    render(ctx) {
        if (!this.visible) return;

        CanvasUtils.withState(ctx, () => {
            ctx.globalAlpha = this.alpha;

            // 计算颜色
            let backgroundColor = this.style.backgroundColor;
            if (!this.enabled) {
                backgroundColor = this.style.backgroundColorDisabled;
            } else if (this.pressed) {
                backgroundColor = this.style.backgroundColorPressed;
            } else if (this.hover) {
                backgroundColor = this.style.backgroundColorHover;
            }

            // 添加动画效果
            if (this.animationProgress > 0 && this.enabled) {
                const scale = 1 + this.animationProgress * 0.05;
                ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
                ctx.scale(scale, scale);
                ctx.translate(-this.width / 2, -this.height / 2);
            } else {
                ctx.translate(this.x, this.y);
            }

            // 阴影
            if (this.enabled && this.style.shadowBlur > 0) {
                ctx.shadowColor = this.style.shadowColor;
                ctx.shadowBlur = this.style.shadowBlur;
                ctx.shadowOffsetX = this.style.shadowOffset.x;
                ctx.shadowOffsetY = this.style.shadowOffset.y;
            }

            // 绘制背景
            ctx.fillStyle = backgroundColor;
            CanvasUtils.roundRect(ctx, 0, 0, this.width, this.height, this.style.borderRadius);
            ctx.fill();

            // 重置阴影
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            // 绘制边框
            if (this.style.borderWidth > 0) {
                ctx.strokeStyle = this.style.borderColor;
                ctx.lineWidth = this.style.borderWidth;
                ctx.stroke();
            }

            // 绘制文字
            const textColor = this.enabled ? this.style.textColor : this.style.textColorDisabled;
            ctx.fillStyle = textColor;
            ctx.font = `${this.style.fontWeight} ${this.style.fontSize}px ${this.style.fontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.text, this.width / 2, this.height / 2);
        });
    }

    // 设置样式
    setStyle(style) {
        this.style = { ...this.style, ...style };
    }

    // 设置文本
    setText(text) {
        this.text = text;
    }
}

// 标签组件
export class Label extends UIComponent {
    constructor(x, y, text = '', style = {}) {
        super(x, y, 0, 0);
        this.text = text;
        this.style = {
            fontSize: 16,
            fontFamily: 'Arial',
            fontWeight: 'normal',
            color: '#000000',
            textAlign: 'left',
            textBaseline: 'top',
            shadowColor: 'transparent',
            shadowBlur: 0,
            shadowOffset: { x: 0, y: 0 },
            ...style
        };
        this.autoSize = true;
    }

    render(ctx) {
        if (!this.visible || !this.text) return;

        CanvasUtils.withState(ctx, () => {
            ctx.globalAlpha = this.alpha;
            
            // 设置字体
            ctx.font = `${this.style.fontWeight} ${this.style.fontSize}px ${this.style.fontFamily}`;
            ctx.textAlign = this.style.textAlign;
            ctx.textBaseline = this.style.textBaseline;

            // 阴影
            if (this.style.shadowBlur > 0) {
                ctx.shadowColor = this.style.shadowColor;
                ctx.shadowBlur = this.style.shadowBlur;
                ctx.shadowOffsetX = this.style.shadowOffset.x;
                ctx.shadowOffsetY = this.style.shadowOffset.y;
            }

            // 绘制文字
            ctx.fillStyle = this.style.color;
            ctx.fillText(this.text, this.x, this.y);

            // 自动调整尺寸
            if (this.autoSize) {
                const metrics = ctx.measureText(this.text);
                this.width = metrics.width;
                this.height = this.style.fontSize;
            }
        });
    }

    setText(text) {
        this.text = text;
    }

    setStyle(style) {
        this.style = { ...this.style, ...style };
    }
}

// 进度条组件
export class ProgressBar extends UIComponent {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.value = 0; // 0-1
        this.style = {
            backgroundColor: '#e0e0e0',
            fillColor: '#4CAF50',
            borderColor: '#999999',
            borderWidth: 1,
            borderRadius: 4,
            textColor: '#000000',
            fontSize: 12,
            fontFamily: 'Arial',
            showPercentage: true
        };
        this.animatedValue = 0;
        this.animationSpeed = 0.05;
    }

    update(deltaTime) {
        // 平滑动画
        this.animatedValue = MathUtils.lerp(
            this.animatedValue,
            this.value,
            this.animationSpeed
        );
    }

    render(ctx) {
        if (!this.visible) return;

        CanvasUtils.withState(ctx, () => {
            ctx.globalAlpha = this.alpha;

            // 绘制背景
            ctx.fillStyle = this.style.backgroundColor;
            CanvasUtils.roundRect(ctx, this.x, this.y, this.width, this.height, this.style.borderRadius);
            ctx.fill();

            // 绘制填充
            if (this.animatedValue > 0) {
                const fillWidth = this.width * this.animatedValue;
                ctx.fillStyle = this.style.fillColor;
                CanvasUtils.roundRect(ctx, this.x, this.y, fillWidth, this.height, this.style.borderRadius);
                ctx.fill();
            }

            // 绘制边框
            if (this.style.borderWidth > 0) {
                ctx.strokeStyle = this.style.borderColor;
                ctx.lineWidth = this.style.borderWidth;
                CanvasUtils.roundRect(ctx, this.x, this.y, this.width, this.height, this.style.borderRadius);
                ctx.stroke();
            }

            // 绘制百分比文字
            if (this.style.showPercentage) {
                ctx.fillStyle = this.style.textColor;
                ctx.font = `${this.style.fontSize}px ${this.style.fontFamily}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const percentage = Math.round(this.animatedValue * 100);
                ctx.fillText(`${percentage}%`, 
                    this.x + this.width / 2, 
                    this.y + this.height / 2);
            }
        });
    }

    setValue(value) {
        this.value = MathUtils.clamp(value, 0, 1);
    }

    setStyle(style) {
        this.style = { ...this.style, ...style };
    }
}

// 面板组件
export class Panel extends UIComponent {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.children = [];
        this.style = {
            backgroundColor: 'rgba(0,0,0,0.8)',
            borderColor: '#ffffff',
            borderWidth: 2,
            borderRadius: 10,
            padding: 10,
            shadowColor: 'rgba(0,0,0,0.5)',
            shadowBlur: 15,
            shadowOffset: { x: 5, y: 5 }
        };
        this.dragEnabled = false;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
    }

    addChild(component) {
        this.children.push(component);
        // 调整子组件位置（相对于面板）
        component.parent = this;
    }

    removeChild(component) {
        const index = this.children.indexOf(component);
        if (index !== -1) {
            this.children.splice(index, 1);
            component.parent = null;
        }
    }

    update(deltaTime) {
        // 更新所有子组件
        this.children.forEach(child => {
            if (child.update) {
                child.update(deltaTime);
            }
        });
    }

    render(ctx) {
        if (!this.visible) return;

        CanvasUtils.withState(ctx, () => {
            ctx.globalAlpha = this.alpha;

            // 阴影
            if (this.style.shadowBlur > 0) {
                ctx.shadowColor = this.style.shadowColor;
                ctx.shadowBlur = this.style.shadowBlur;
                ctx.shadowOffsetX = this.style.shadowOffset.x;
                ctx.shadowOffsetY = this.style.shadowOffset.y;
            }

            // 绘制背景
            ctx.fillStyle = this.style.backgroundColor;
            CanvasUtils.roundRect(ctx, this.x, this.y, this.width, this.height, this.style.borderRadius);
            ctx.fill();

            // 重置阴影
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            // 绘制边框
            if (this.style.borderWidth > 0) {
                ctx.strokeStyle = this.style.borderColor;
                ctx.lineWidth = this.style.borderWidth;
                ctx.stroke();
            }
        });

        // 渲染子组件
        this.children.forEach(child => {
            if (child.visible && child.render) {
                child.render(ctx);
            }
        });
    }

    handleMouseMove(x, y) {
        super.handleMouseMove(x, y);

        if (this.isDragging && this.dragEnabled) {
            this.setPosition(
                x - this.dragOffset.x,
                y - this.dragOffset.y
            );
        }

        // 传递给子组件
        this.children.forEach(child => {
            if (child.handleMouseMove) {
                child.handleMouseMove(x, y);
            }
        });
    }

    handleMouseDown(x, y, button) {
        super.handleMouseDown(x, y, button);

        if (this.dragEnabled && this.contains(x, y)) {
            this.isDragging = true;
            this.dragOffset.x = x - this.x;
            this.dragOffset.y = y - this.y;
        }

        // 传递给子组件
        this.children.forEach(child => {
            if (child.handleMouseDown) {
                child.handleMouseDown(x, y, button);
            }
        });
    }

    handleMouseUp(x, y, button) {
        super.handleMouseUp(x, y, button);
        this.isDragging = false;

        // 传递给子组件
        this.children.forEach(child => {
            if (child.handleMouseUp) {
                child.handleMouseUp(x, y, button);
            }
        });
    }

    setDragEnabled(enabled) {
        this.dragEnabled = enabled;
    }

    setStyle(style) {
        this.style = { ...this.style, ...style };
    }
}

// 菜单组件
export class Menu extends Panel {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.items = [];
        this.selectedIndex = -1;
        this.itemHeight = 40;
        this.itemPadding = 5;
        this.itemStyle = {
            backgroundColor: 'transparent',
            backgroundColorHover: 'rgba(255,255,255,0.1)',
            backgroundColorSelected: 'rgba(255,255,255,0.2)',
            textColor: '#ffffff',
            textColorSelected: '#ffff00',
            fontSize: 16,
            fontFamily: 'Arial',
            padding: 10
        };
    }

    addItem(text, data = null) {
        const item = {
            text,
            data,
            enabled: true,
            hover: false
        };
        this.items.push(item);
        this.updateLayout();
    }

    removeItem(index) {
        if (index >= 0 && index < this.items.length) {
            this.items.splice(index, 1);
            if (this.selectedIndex >= index) {
                this.selectedIndex = Math.max(-1, this.selectedIndex - 1);
            }
            this.updateLayout();
        }
    }

    updateLayout() {
        const totalHeight = this.items.length * (this.itemHeight + this.itemPadding) - this.itemPadding + 
                           this.style.padding * 2;
        this.height = totalHeight;
    }

    render(ctx) {
        super.render(ctx); // 绘制面板背景

        if (!this.visible) return;

        CanvasUtils.withState(ctx, () => {
            ctx.globalAlpha = this.alpha;

            let currentY = this.y + this.style.padding;

            this.items.forEach((item, index) => {
                const itemX = this.x + this.style.padding;
                const itemWidth = this.width - this.style.padding * 2;

                // 绘制项目背景
                let backgroundColor = this.itemStyle.backgroundColor;
                if (index === this.selectedIndex) {
                    backgroundColor = this.itemStyle.backgroundColorSelected;
                } else if (item.hover) {
                    backgroundColor = this.itemStyle.backgroundColorHover;
                }

                if (backgroundColor !== 'transparent') {
                    ctx.fillStyle = backgroundColor;
                    ctx.fillRect(itemX, currentY, itemWidth, this.itemHeight);
                }

                // 绘制文字
                const textColor = (index === this.selectedIndex) ? 
                    this.itemStyle.textColorSelected : this.itemStyle.textColor;
                
                ctx.fillStyle = textColor;
                ctx.font = `${this.itemStyle.fontSize}px ${this.itemStyle.fontFamily}`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                    item.text,
                    itemX + this.itemStyle.padding,
                    currentY + this.itemHeight / 2
                );

                currentY += this.itemHeight + this.itemPadding;
            });
        });
    }

    handleMouseMove(x, y) {
        super.handleMouseMove(x, y);

        // 检查鼠标悬停的项目
        if (this.contains(x, y)) {
            const relativeY = y - this.y - this.style.padding;
            const itemIndex = Math.floor(relativeY / (this.itemHeight + this.itemPadding));
            
            this.items.forEach((item, index) => {
                item.hover = (index === itemIndex && itemIndex >= 0 && itemIndex < this.items.length);
            });
        } else {
            this.items.forEach(item => item.hover = false);
        }
    }

    handleMouseDown(x, y, button) {
        super.handleMouseDown(x, y, button);

        if (this.contains(x, y)) {
            const relativeY = y - this.y - this.style.padding;
            const itemIndex = Math.floor(relativeY / (this.itemHeight + this.itemPadding));
            
            if (itemIndex >= 0 && itemIndex < this.items.length) {
                this.selectedIndex = itemIndex;
                const item = this.items[itemIndex];
                this.emit('itemSelected', { index: itemIndex, item, data: item.data });
            }
        }
    }

    setSelectedIndex(index) {
        this.selectedIndex = MathUtils.clamp(index, -1, this.items.length - 1);
    }

    getSelectedItem() {
        if (this.selectedIndex >= 0 && this.selectedIndex < this.items.length) {
            return this.items[this.selectedIndex];
        }
        return null;
    }

    clear() {
        this.items = [];
        this.selectedIndex = -1;
        this.updateLayout();
    }
}

// 对话框组件
export class Dialog extends Panel {
    constructor(x, y, width, height, title = '', message = '') {
        super(x, y, width, height);
        this.title = title;
        this.message = message;
        this.buttons = [];
        this.titleStyle = {
            fontSize: 20,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            color: '#ffffff',
            padding: 15
        };
        this.messageStyle = {
            fontSize: 14,
            fontFamily: 'Arial',
            fontWeight: 'normal',
            color: '#ffffff',
            padding: 15,
            lineHeight: 1.4
        };
        this.modal = true; // 模态对话框
    }

    addButton(text, callback = null, style = {}) {
        const button = new Button(0, 0, 80, 30, text);
        button.setStyle(style);
        if (callback) {
            button.on('click', callback);
        }
        this.buttons.push(button);
        this.updateButtonLayout();
    }

    updateButtonLayout() {
        const buttonSpacing = 10;
        const totalButtonWidth = this.buttons.reduce((sum, btn) => sum + btn.width, 0) + 
                                (this.buttons.length - 1) * buttonSpacing;
        
        let currentX = this.x + (this.width - totalButtonWidth) / 2;
        const buttonY = this.y + this.height - 50;

        this.buttons.forEach(button => {
            button.setPosition(currentX, buttonY);
            currentX += button.width + buttonSpacing;
        });
    }

    render(ctx) {
        super.render(ctx); // 绘制面板背景

        if (!this.visible) return;

        CanvasUtils.withState(ctx, () => {
            ctx.globalAlpha = this.alpha;

            let currentY = this.y + this.titleStyle.padding;

            // 绘制标题
            if (this.title) {
                ctx.fillStyle = this.titleStyle.color;
                ctx.font = `${this.titleStyle.fontWeight} ${this.titleStyle.fontSize}px ${this.titleStyle.fontFamily}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(this.title, this.x + this.width / 2, currentY);
                currentY += this.titleStyle.fontSize + this.titleStyle.padding;
            }

            // 绘制消息
            if (this.message) {
                ctx.fillStyle = this.messageStyle.color;
                ctx.font = `${this.messageStyle.fontWeight} ${this.messageStyle.fontSize}px ${this.messageStyle.fontFamily}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';

                // 简单的文字换行
                const words = this.message.split(' ');
                const maxWidth = this.width - this.messageStyle.padding * 2;
                let line = '';
                
                words.forEach(word => {
                    const testLine = line + word + ' ';
                    const metrics = ctx.measureText(testLine);
                    
                    if (metrics.width > maxWidth && line !== '') {
                        ctx.fillText(line, this.x + this.width / 2, currentY);
                        currentY += this.messageStyle.fontSize * this.messageStyle.lineHeight;
                        line = word + ' ';
                    } else {
                        line = testLine;
                    }
                });
                
                if (line) {
                    ctx.fillText(line, this.x + this.width / 2, currentY);
                }
            }
        });

        // 渲染按钮
        this.buttons.forEach(button => {
            if (button.visible) {
                button.render(ctx);
            }
        });
    }

    handleMouseMove(x, y) {
        super.handleMouseMove(x, y);
        this.buttons.forEach(button => {
            button.handleMouseMove(x, y);
        });
    }

    handleMouseDown(x, y, button) {
        super.handleMouseDown(x, y, button);
        this.buttons.forEach(btn => {
            btn.handleMouseDown(x, y, button);
        });
    }

    handleMouseUp(x, y, button) {
        super.handleMouseUp(x, y, button);
        this.buttons.forEach(btn => {
            btn.handleMouseUp(x, y, button);
        });
    }

    setTitle(title) {
        this.title = title;
    }

    setMessage(message) {
        this.message = message;
    }

    show() {
        this.setVisible(true);
        this.emit('shown');
    }

    hide() {
        this.setVisible(false);
        this.emit('hidden');
    }
}

// UI管理器
export class UIManager {
    constructor(canvas, eventBus) {
        this.canvas = canvas;
        this.eventBus = eventBus;
        this.components = [];
        this.modalComponents = [];
        this.focusedComponent = null;
        this.draggedComponent = null;
    }

    addComponent(component) {
        this.components.push(component);
        if (component.modal) {
            this.modalComponents.push(component);
        }
    }

    removeComponent(component) {
        const index = this.components.indexOf(component);
        if (index !== -1) {
            this.components.splice(index, 1);
        }

        const modalIndex = this.modalComponents.indexOf(component);
        if (modalIndex !== -1) {
            this.modalComponents.splice(modalIndex, 1);
        }

        if (this.focusedComponent === component) {
            this.focusedComponent = null;
        }
    }

    update(deltaTime) {
        // 更新所有组件
        this.components.forEach(component => {
            if (component.visible && component.update) {
                component.update(deltaTime);
            }
        });
    }

    render(ctx) {
        // 渲染常规组件
        this.components.forEach(component => {
            if (component.visible && !component.modal && component.render) {
                component.render(ctx);
            }
        });

        // 渲染模态组件（在最上层）
        this.modalComponents.forEach(component => {
            if (component.visible && component.render) {
                component.render(ctx);
            }
        });
    }

    handleMouseMove(x, y) {
        const components = this.getInteractableComponents();
        components.forEach(component => {
            if (component.handleMouseMove) {
                component.handleMouseMove(x, y);
            }
        });
    }

    handleMouseDown(x, y, button) {
        const components = this.getInteractableComponents();
        
        // 从前往后检查（最上层的组件优先）
        for (let i = components.length - 1; i >= 0; i--) {
            const component = components[i];
            if (component.handleMouseDown && component.contains(x, y)) {
                component.handleMouseDown(x, y, button);
                this.focusedComponent = component;
                break; // 只处理最上层的组件
            }
        }
    }

    handleMouseUp(x, y, button) {
        const components = this.getInteractableComponents();
        components.forEach(component => {
            if (component.handleMouseUp) {
                component.handleMouseUp(x, y, button);
            }
        });
    }

    getInteractableComponents() {
        // 如果有模态组件，只返回模态组件
        if (this.modalComponents.length > 0) {
            return this.modalComponents.filter(c => c.visible);
        }
        return this.components.filter(c => c.visible);
    }

    clear() {
        this.components = [];
        this.modalComponents = [];
        this.focusedComponent = null;
        this.draggedComponent = null;
    }

    getFocusedComponent() {
        return this.focusedComponent;
    }

    setFocus(component) {
        if (this.components.includes(component)) {
            this.focusedComponent = component;
        }
    }
}