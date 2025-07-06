/**
 * 游戏工具函数集
 * 
 * 设计意图：
 * - 提供游戏中常用的工具函数
 * - 减少代码重复，提高复用性
 * - 统一管理算法实现
 * - 提供性能优化的工具
 */

import { STORAGE_KEYS, PERFORMANCE_CONFIG } from '../Constants.js';

/**
 * 游戏工具类
 * 设计意图：提供静态方法，无状态设计，便于复用
 */
export class GameUtils {
    
    // === 对象池管理 ===
    static objectPools = new Map();
    
    /**
     * 从对象池获取对象
     * 设计意图：减少内存分配，提高性能
     * 
     * @param {string} type - 对象类型
     * @param {function} createFunction - 创建对象的函数
     * @returns {object} 对象实例
     */
    static getFromPool(type, createFunction) {
        if (!PERFORMANCE_CONFIG.poolEnabled) {
            return createFunction();
        }
        
        if (!this.objectPools.has(type)) {
            this.objectPools.set(type, []);
        }
        
        const pool = this.objectPools.get(type);
        
        if (pool.length > 0) {
            return pool.pop();
        } else {
            return createFunction();
        }
    }
    
    /**
     * 将对象返回到对象池
     * 设计意图：复用对象，减少垃圾回收
     * 
     * @param {string} type - 对象类型
     * @param {object} obj - 要返回的对象
     */
    static returnToPool(type, obj) {
        if (!PERFORMANCE_CONFIG.poolEnabled) return;
        
        if (!this.objectPools.has(type)) {
            this.objectPools.set(type, []);
        }
        
        const pool = this.objectPools.get(type);
        
        if (pool.length < PERFORMANCE_CONFIG.maxPoolSize) {
            // 重置对象状态
            if (obj.reset && typeof obj.reset === 'function') {
                obj.reset();
            }
            pool.push(obj);
        }
    }
    
    // === 碰撞检测工具 ===
    
    /**
     * 检查两个矩形是否碰撞
     * 设计意图：AABB碰撞检测，适用于大多数游戏对象
     * 
     * @param {object} rect1 - 第一个矩形 {x, y, width, height}
     * @param {object} rect2 - 第二个矩形 {x, y, width, height}
     * @returns {boolean} 是否碰撞
     */
    static isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    /**
     * 检查点是否在矩形内
     * 设计意图：用于鼠标点击检测
     * 
     * @param {object} point - 点坐标 {x, y}
     * @param {object} rect - 矩形 {x, y, width, height}
     * @returns {boolean} 点是否在矩形内
     */
    static pointInRect(point, rect) {
        return point.x >= rect.x &&
               point.x <= rect.x + rect.width &&
               point.y >= rect.y &&
               point.y <= rect.y + rect.height;
    }
    
    /**
     * 检查圆形是否与矩形碰撞
     * 设计意图：用于球体与矩形的碰撞检测
     * 
     * @param {object} circle - 圆形 {x, y, radius}
     * @param {object} rect - 矩形 {x, y, width, height}
     * @returns {boolean} 是否碰撞
     */
    static circleRectCollision(circle, rect) {
        const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
        
        const distanceX = circle.x - closestX;
        const distanceY = circle.y - closestY;
        
        return (distanceX * distanceX + distanceY * distanceY) <= (circle.radius * circle.radius);
    }
    
    /**
     * 检查两个圆形是否碰撞
     * 设计意图：用于球体间的碰撞检测
     * 
     * @param {object} circle1 - 第一个圆形 {x, y, radius}
     * @param {object} circle2 - 第二个圆形 {x, y, radius}
     * @returns {boolean} 是否碰撞
     */
    static circleCircleCollision(circle1, circle2) {
        const dx = circle1.x - circle2.x;
        const dy = circle1.y - circle2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance <= (circle1.radius + circle2.radius);
    }
    
    // === 数学工具函数 ===
    
    /**
     * 计算两点之间的距离
     * 设计意图：常用的距离计算
     * 
     * @param {object} p1 - 第一个点 {x, y}
     * @param {object} p2 - 第二个点 {x, y}
     * @returns {number} 距离
     */
    static distance(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * 计算两点之间的角度
     * 设计意图：用于方向计算
     * 
     * @param {object} from - 起点 {x, y}
     * @param {object} to - 终点 {x, y}
     * @returns {number} 角度（弧度）
     */
    static angle(from, to) {
        return Math.atan2(to.y - from.y, to.x - from.x);
    }
    
    /**
     * 线性插值
     * 设计意图：用于动画和平滑过渡
     * 
     * @param {number} start - 起始值
     * @param {number} end - 结束值
     * @param {number} t - 插值参数 (0-1)
     * @returns {number} 插值结果
     */
    static lerp(start, end, t) {
        return start + (end - start) * t;
    }
    
    /**
     * 限制值在指定范围内
     * 设计意图：防止数值越界
     * 
     * @param {number} value - 要限制的值
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @returns {number} 限制后的值
     */
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    /**
     * 生成指定范围内的随机数
     * 设计意图：便于生成随机值
     * 
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @returns {number} 随机数
     */
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    /**
     * 生成指定范围内的随机整数
     * 设计意图：便于生成随机整数
     * 
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @returns {number} 随机整数
     */
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    /**
     * 角度转弧度
     * 设计意图：角度单位转换
     * 
     * @param {number} degrees - 角度
     * @returns {number} 弧度
     */
    static degToRad(degrees) {
        return degrees * Math.PI / 180;
    }
    
    /**
     * 弧度转角度
     * 设计意图：角度单位转换
     * 
     * @param {number} radians - 弧度
     * @returns {number} 角度
     */
    static radToDeg(radians) {
        return radians * 180 / Math.PI;
    }
    
    /**
     * 标准化角度到0-2π范围
     * 设计意图：角度标准化
     * 
     * @param {number} angle - 角度（弧度）
     * @returns {number} 标准化后的角度
     */
    static normalizeAngle(angle) {
        while (angle < 0) angle += 2 * Math.PI;
        while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
        return angle;
    }
    
    // === 本地存储工具 ===
    
    /**
     * 保存数据到本地存储
     * 设计意图：统一管理本地存储操作
     * 
     * @param {string} key - 存储键
     * @param {any} data - 要存储的数据
     * @returns {boolean} 是否成功
     */
    static saveToStorage(key, data) {
        try {
            const serializedData = JSON.stringify(data);
            localStorage.setItem(key, serializedData);
            return true;
        } catch (error) {
            console.error('保存数据到本地存储失败:', error);
            return false;
        }
    }
    
    /**
     * 从本地存储加载数据
     * 设计意图：统一管理本地存储操作
     * 
     * @param {string} key - 存储键
     * @param {any} defaultValue - 默认值
     * @returns {any} 加载的数据
     */
    static loadFromStorage(key, defaultValue = null) {
        try {
            const serializedData = localStorage.getItem(key);
            if (serializedData === null) {
                return defaultValue;
            }
            return JSON.parse(serializedData);
        } catch (error) {
            console.error('从本地存储加载数据失败:', error);
            return defaultValue;
        }
    }
    
    /**
     * 删除本地存储中的数据
     * 设计意图：清理存储数据
     * 
     * @param {string} key - 存储键
     */
    static removeFromStorage(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('删除本地存储数据失败:', error);
        }
    }
    
    /**
     * 清空所有游戏相关的本地存储
     * 设计意图：重置游戏数据
     */
    static clearGameStorage() {
        Object.values(STORAGE_KEYS).forEach(key => {
            this.removeFromStorage(key);
        });
    }
    
    // === 性能优化工具 ===
    
    /**
     * 防抖函数
     * 设计意图：防止函数频繁调用
     * 
     * @param {function} func - 要防抖的函数
     * @param {number} wait - 等待时间（毫秒）
     * @returns {function} 防抖后的函数
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * 节流函数
     * 设计意图：限制函数调用频率
     * 
     * @param {function} func - 要节流的函数
     * @param {number} limit - 时间限制（毫秒）
     * @returns {function} 节流后的函数
     */
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // === 数组工具 ===
    
    /**
     * 从数组中随机选择一个元素
     * 设计意图：随机选择工具
     * 
     * @param {Array} array - 数组
     * @returns {any} 随机选择的元素
     */
    static randomChoice(array) {
        if (array.length === 0) return undefined;
        return array[Math.floor(Math.random() * array.length)];
    }
    
    /**
     * 打乱数组顺序
     * 设计意图：数组随机排列
     * 
     * @param {Array} array - 要打乱的数组
     * @returns {Array} 打乱后的数组
     */
    static shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    /**
     * 移除数组中的元素
     * 设计意图：安全地移除数组元素
     * 
     * @param {Array} array - 数组
     * @param {any} item - 要移除的元素
     * @returns {boolean} 是否成功移除
     */
    static removeFromArray(array, item) {
        const index = array.indexOf(item);
        if (index > -1) {
            array.splice(index, 1);
            return true;
        }
        return false;
    }
    
    // === 颜色工具 ===
    
    /**
     * HSL转RGB
     * 设计意图：颜色格式转换
     * 
     * @param {number} h - 色相 (0-360)
     * @param {number} s - 饱和度 (0-100)
     * @param {number} l - 亮度 (0-100)
     * @returns {string} RGB颜色字符串
     */
    static hslToRgb(h, s, l) {
        h = h % 360;
        s = s / 100;
        l = l / 100;
        
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        
        let r = 0, g = 0, b = 0;
        
        if (0 <= h && h < 60) {
            r = c; g = x; b = 0;
        } else if (60 <= h && h < 120) {
            r = x; g = c; b = 0;
        } else if (120 <= h && h < 180) {
            r = 0; g = c; b = x;
        } else if (180 <= h && h < 240) {
            r = 0; g = x; b = c;
        } else if (240 <= h && h < 300) {
            r = x; g = 0; b = c;
        } else if (300 <= h && h < 360) {
            r = c; g = 0; b = x;
        }
        
        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);
        
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    /**
     * 生成随机颜色
     * 设计意图：生成随机颜色
     * 
     * @returns {string} 随机颜色字符串
     */
    static randomColor() {
        const h = Math.floor(Math.random() * 360);
        const s = Math.floor(Math.random() * 50) + 50; // 50-100%
        const l = Math.floor(Math.random() * 40) + 30; // 30-70%
        return this.hslToRgb(h, s, l);
    }
    
    // === 时间工具 ===
    
    /**
     * 格式化时间
     * 设计意图：时间显示格式化
     * 
     * @param {number} milliseconds - 毫秒数
     * @returns {string} 格式化的时间字符串
     */
    static formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
        }
    }
    
    // === 画布工具 ===
    
    /**
     * 绘制圆角矩形
     * 设计意图：绘制圆角矩形
     * 
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} width - 宽度
     * @param {number} height - 高度
     * @param {number} radius - 圆角半径
     */
    static drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + width, y, x + width, y + height, radius);
        ctx.arcTo(x + width, y + height, x, y + height, radius);
        ctx.arcTo(x, y + height, x, y, radius);
        ctx.arcTo(x, y, x + width, y, radius);
        ctx.closePath();
    }
    
    /**
     * 绘制文本（支持描边）
     * 设计意图：增强文本绘制功能
     * 
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {string} text - 文本内容
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {object} options - 选项 {fillColor, strokeColor, strokeWidth, font}
     */
    static drawText(ctx, text, x, y, options = {}) {
        const {
            fillColor = '#000',
            strokeColor = null,
            strokeWidth = 2,
            font = '16px Arial'
        } = options;
        
        ctx.save();
        ctx.font = font;
        
        // 绘制描边
        if (strokeColor) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
            ctx.strokeText(text, x, y);
        }
        
        // 绘制填充
        ctx.fillStyle = fillColor;
        ctx.fillText(text, x, y);
        
        ctx.restore();
    }
    
    // === 调试工具 ===
    
    /**
     * 绘制调试信息
     * 设计意图：调试时显示对象边界
     * 
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {object} rect - 矩形对象
     * @param {string} color - 颜色
     */
    static drawDebugRect(ctx, rect, color = 'red') {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
        ctx.restore();
    }
    
    /**
     * 输出性能信息
     * 设计意图：性能监控
     * 
     * @param {string} label - 标签
     * @param {function} func - 要测试的函数
     * @returns {any} 函数返回值
     */
    static measurePerformance(label, func) {
        const startTime = performance.now();
        const result = func();
        const endTime = performance.now();
        console.log(`${label}: ${(endTime - startTime).toFixed(2)}ms`);
        return result;
    }
    
    // === 粒子系统工具 ===
    
    /**
     * 创建粒子对象
     * 设计意图：统一的粒子创建函数
     * 
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {object} options - 选项
     * @returns {object} 粒子对象
     */
    static createParticle(x, y, options = {}) {
        const {
            vx = this.random(-2, 2),
            vy = this.random(-2, 2),
            color = this.randomColor(),
            size = this.random(2, 5),
            life = 60,
            decay = 0.98
        } = options;
        
        return {
            x,
            y,
            vx,
            vy,
            color,
            size,
            life,
            maxLife: life,
            decay,
            alpha: 1,
            reset() {
                this.x = 0;
                this.y = 0;
                this.vx = 0;
                this.vy = 0;
                this.life = this.maxLife;
                this.alpha = 1;
            }
        };
    }
    
    /**
     * 更新粒子
     * 设计意图：统一的粒子更新逻辑
     * 
     * @param {object} particle - 粒子对象
     * @returns {boolean} 粒子是否仍然存活
     */
    static updateParticle(particle) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= particle.decay;
        particle.vy *= particle.decay;
        particle.life--;
        particle.alpha = particle.life / particle.maxLife;
        
        return particle.life > 0;
    }
    
    /**
     * 绘制粒子
     * 设计意图：统一的粒子绘制逻辑
     * 
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {object} particle - 粒子对象
     */
    static drawParticle(ctx, particle) {
        ctx.save();
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}