/**
 * 游戏工具函数 - 数学、Canvas、辅助函数等
 */

// 数学工具
export const MathUtils = {
    // 角度转弧度
    toRadians(degrees) {
        return degrees * Math.PI / 180;
    },

    // 弧度转角度
    toDegrees(radians) {
        return radians * 180 / Math.PI;
    },

    // 限制数值在指定范围内
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    // 线性插值
    lerp(start, end, factor) {
        return start + (end - start) * factor;
    },

    // 计算两点间距离
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },

    // 计算两点间距离的平方（性能优化版本）
    distanceSquared(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return dx * dx + dy * dy;
    },

    // 归一化向量
    normalize(x, y) {
        const length = Math.sqrt(x * x + y * y);
        if (length === 0) return { x: 0, y: 0 };
        return { x: x / length, y: y / length };
    },

    // 随机数生成
    random(min, max) {
        return Math.random() * (max - min) + min;
    },

    // 随机整数
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // 随机选择数组元素
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    // 检查数值是否接近
    isNear(a, b, epsilon = 0.001) {
        return Math.abs(a - b) < epsilon;
    },

    // 角度差值计算
    angleDifference(angle1, angle2) {
        let diff = angle2 - angle1;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        return diff;
    }
};

// Canvas工具
export const CanvasUtils = {
    // 圆角矩形绘制
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    },

    // 创建线性渐变
    createLinearGradient(ctx, x1, y1, x2, y2, colorStops) {
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        colorStops.forEach(stop => {
            gradient.addColorStop(stop.offset, stop.color);
        });
        return gradient;
    },

    // 创建径向渐变
    createRadialGradient(ctx, x1, y1, r1, x2, y2, r2, colorStops) {
        const gradient = ctx.createRadialGradient(x1, y1, r1, x2, y2, r2);
        colorStops.forEach(stop => {
            gradient.addColorStop(stop.offset, stop.color);
        });
        return gradient;
    },

    // 绘制带阴影的文本
    drawTextWithShadow(ctx, text, x, y, fillStyle, shadowColor = '#000', shadowBlur = 5, shadowOffset = { x: 2, y: 2 }) {
        ctx.save();
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = shadowOffset.x;
        ctx.shadowOffsetY = shadowOffset.y;
        ctx.fillStyle = fillStyle;
        ctx.fillText(text, x, y);
        ctx.restore();
    },

    // 测量文本尺寸
    measureText(ctx, text, font) {
        ctx.save();
        if (font) ctx.font = font;
        const metrics = ctx.measureText(text);
        ctx.restore();
        return {
            width: metrics.width,
            height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
        };
    },

    // 绘制虚线圆
    drawDashedCircle(ctx, x, y, radius, dashLength = 5) {
        const circumference = 2 * Math.PI * radius;
        const dashCount = Math.floor(circumference / (dashLength * 2));
        const angleStep = (2 * Math.PI) / dashCount;
        
        ctx.beginPath();
        for (let i = 0; i < dashCount; i++) {
            const startAngle = i * angleStep;
            const endAngle = startAngle + angleStep / 2;
            ctx.arc(x, y, radius, startAngle, endAngle);
        }
        ctx.stroke();
    },

    // 清除指定区域
    clearRect(ctx, x, y, width, height) {
        ctx.clearRect(x, y, width, height);
    },

    // 保存/恢复canvas状态的装饰器函数
    withState(ctx, drawFunction) {
        ctx.save();
        try {
            drawFunction(ctx);
        } finally {
            ctx.restore();
        }
    }
};

// 碰撞检测工具
export const CollisionUtils = {
    // 点与矩形碰撞
    pointInRect(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    },

    // 矩形与矩形碰撞（AABB）
    rectIntersects(r1x, r1y, r1w, r1h, r2x, r2y, r2w, r2h) {
        return !(r1x > r2x + r2w || 
                r1x + r1w < r2x || 
                r1y > r2y + r2h || 
                r1y + r1h < r2y);
    },

    // 圆与圆碰撞
    circleIntersects(c1x, c1y, c1r, c2x, c2y, c2r) {
        const distance = MathUtils.distance(c1x, c1y, c2x, c2y);
        return distance < (c1r + c2r);
    },

    // 点与圆碰撞
    pointInCircle(px, py, cx, cy, cr) {
        const distance = MathUtils.distance(px, py, cx, cy);
        return distance <= cr;
    },

    // 矩形与圆碰撞
    rectCircleIntersects(rx, ry, rw, rh, cx, cy, cr) {
        // 找到矩形上离圆心最近的点
        const closestX = MathUtils.clamp(cx, rx, rx + rw);
        const closestY = MathUtils.clamp(cy, ry, ry + rh);
        
        // 计算距离
        const distance = MathUtils.distance(cx, cy, closestX, closestY);
        return distance <= cr;
    }
};

// 颜色工具
export const ColorUtils = {
    // HSL转RGB
    hslToRgb(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;
        
        const a = s * Math.min(l, 1 - l);
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color);
        };
        
        return [f(0), f(8), f(4)];
    },

    // RGB转HSL
    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        
        return [h * 360, s * 100, l * 100];
    },

    // 颜色插值
    interpolateColor(color1, color2, factor) {
        // 假设颜色格式为 '#RRGGBB'
        const hex1 = color1.slice(1);
        const hex2 = color2.slice(1);
        
        const r1 = parseInt(hex1.slice(0, 2), 16);
        const g1 = parseInt(hex1.slice(2, 4), 16);
        const b1 = parseInt(hex1.slice(4, 6), 16);
        
        const r2 = parseInt(hex2.slice(0, 2), 16);
        const g2 = parseInt(hex2.slice(2, 4), 16);
        const b2 = parseInt(hex2.slice(4, 6), 16);
        
        const r = Math.round(MathUtils.lerp(r1, r2, factor));
        const g = Math.round(MathUtils.lerp(g1, g2, factor));
        const b = Math.round(MathUtils.lerp(b1, b2, factor));
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    },

    // 获取随机颜色
    randomColor(saturation = 70, lightness = 50) {
        const hue = Math.random() * 360;
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
};

// 动画工具
export const AnimationUtils = {
    // 缓动函数
    easing: {
        linear: t => t,
        easeInQuad: t => t * t,
        easeOutQuad: t => t * (2 - t),
        easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        easeInCubic: t => t * t * t,
        easeOutCubic: t => (--t) * t * t + 1,
        easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
        bounce: t => {
            if (t < 1/2.75) return 7.5625 * t * t;
            if (t < 2/2.75) return 7.5625 * (t -= 1.5/2.75) * t + 0.75;
            if (t < 2.5/2.75) return 7.5625 * (t -= 2.25/2.75) * t + 0.9375;
            return 7.5625 * (t -= 2.625/2.75) * t + 0.984375;
        }
    },

    // 创建动画补间对象
    createTween(from, to, duration, easingFunction = 'linear') {
        return {
            from,
            to,
            duration,
            easing: this.easing[easingFunction] || this.easing.linear,
            elapsed: 0,
            getValue() {
                const progress = Math.min(this.elapsed / this.duration, 1);
                const easedProgress = this.easing(progress);
                return MathUtils.lerp(this.from, this.to, easedProgress);
            },
            update(deltaTime) {
                this.elapsed += deltaTime;
                return this.elapsed >= this.duration;
            },
            isComplete() {
                return this.elapsed >= this.duration;
            }
        };
    }
};

// 存储工具
export const StorageUtils = {
    // 安全的localStorage操作
    setItem(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(key, serialized);
            return true;
        } catch (error) {
            console.warn(`Failed to save to localStorage: ${error.message}`);
            return false;
        }
    },

    getItem(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn(`Failed to load from localStorage: ${error.message}`);
            return defaultValue;
        }
    },

    removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.warn(`Failed to remove from localStorage: ${error.message}`);
            return false;
        }
    },

    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.warn(`Failed to clear localStorage: ${error.message}`);
            return false;
        }
    },

    // 检查localStorage是否可用
    isAvailable() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch {
            return false;
        }
    }
};

// 性能工具
export const PerformanceUtils = {
    // 简单的对象池
    createObjectPool(createFn, resetFn, initialSize = 10) {
        const pool = [];
        const activeObjects = new Set();
        
        // 初始填充对象池
        for (let i = 0; i < initialSize; i++) {
            pool.push(createFn());
        }
        
        return {
            get() {
                let obj = pool.pop();
                if (!obj) {
                    obj = createFn();
                }
                activeObjects.add(obj);
                return obj;
            },
            
            release(obj) {
                if (activeObjects.has(obj)) {
                    activeObjects.delete(obj);
                    resetFn(obj);
                    pool.push(obj);
                }
            },
            
            releaseAll() {
                activeObjects.forEach(obj => {
                    resetFn(obj);
                    pool.push(obj);
                });
                activeObjects.clear();
            },
            
            getStats() {
                return {
                    poolSize: pool.length,
                    activeCount: activeObjects.size,
                    totalCreated: pool.length + activeObjects.size
                };
            }
        };
    },

    // 简单的FPS计数器
    createFPSCounter() {
        let frameCount = 0;
        let lastTime = performance.now();
        let fps = 0;
        
        return {
            update() {
                frameCount++;
                const currentTime = performance.now();
                
                if (currentTime - lastTime >= 1000) {
                    fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                    frameCount = 0;
                    lastTime = currentTime;
                }
                
                return fps;
            },
            
            getFPS() {
                return fps;
            }
        };
    },

    // 简单的性能监控
    time(label) {
        console.time(label);
    },

    timeEnd(label) {
        console.timeEnd(label);
    }
};

// 事件工具
export const EventUtils = {
    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // 节流函数
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// 调试工具
export const DebugUtils = {
    // 绘制碰撞边界框
    drawBounds(ctx, x, y, width, height, color = 'red') {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
        ctx.restore();
    },

    // 绘制圆形边界
    drawCircleBounds(ctx, x, y, radius, color = 'red') {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    },

    // 绘制FPS
    drawFPS(ctx, fps, x = 10, y = 30) {
        ctx.save();
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText(`FPS: ${fps}`, x, y);
        ctx.restore();
    },

    // 控制台日志包装器
    log: {
        info: (...args) => console.log('[INFO]', ...args),
        warn: (...args) => console.warn('[WARN]', ...args),
        error: (...args) => console.error('[ERROR]', ...args),
        debug: (...args) => {
            if (window.DEBUG) console.log('[DEBUG]', ...args);
        }
    }
};