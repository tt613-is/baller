/**
 * 游戏管理器集合 - 输入、资源、配置、存储、特效管理
 */

import { GameConfig, PhysicsConfig, Events } from '../data/GameData.js';
import { StorageUtils, EventUtils, PerformanceUtils } from '../utils/GameUtils.js';

// 输入管理器
export class InputManager {
    constructor(canvas, eventBus) {
        this.canvas = canvas;
        this.eventBus = eventBus;
        this.keys = new Set();
        this.mouse = {
            x: 0,
            y: 0,
            isDown: false,
            justPressed: false,
            justReleased: false
        };
        this.lastMouseState = false;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 键盘事件
        this.keyDownHandler = (e) => {
            this.keys.add(e.key);
            this.eventBus.emit('input', { type: 'keydown', key: e.key, code: e.code });
            
            // 阻止某些默认行为
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        };

        this.keyUpHandler = (e) => {
            this.keys.delete(e.key);
            this.eventBus.emit('input', { type: 'keyup', key: e.key, code: e.code });
        };

        // 鼠标事件
        this.mouseMoveHandler = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
            this.eventBus.emit('mouseMove', { x: this.mouse.x, y: this.mouse.y });
        };

        this.mouseDownHandler = (e) => {
            this.mouse.isDown = true;
            this.mouse.justPressed = true;
            this.eventBus.emit('mouseDown', { x: this.mouse.x, y: this.mouse.y, button: e.button });
        };

        this.mouseUpHandler = (e) => {
            this.mouse.isDown = false;
            this.mouse.justReleased = true;
            this.eventBus.emit('mouseUp', { x: this.mouse.x, y: this.mouse.y, button: e.button });
        };

        this.clickHandler = (e) => {
            this.eventBus.emit('mouseClick', { x: this.mouse.x, y: this.mouse.y, button: e.button });
        };

        // 触摸事件 (移动端支持)
        this.touchStartHandler = (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = touch.clientX - rect.left;
            this.mouse.y = touch.clientY - rect.top;
            this.mouse.isDown = true;
            this.mouse.justPressed = true;
            this.eventBus.emit('mouseDown', { x: this.mouse.x, y: this.mouse.y, button: 0 });
        };

        this.touchMoveHandler = (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = touch.clientX - rect.left;
            this.mouse.y = touch.clientY - rect.top;
            this.eventBus.emit('mouseMove', { x: this.mouse.x, y: this.mouse.y });
        };

        this.touchEndHandler = (e) => {
            e.preventDefault();
            this.mouse.isDown = false;
            this.mouse.justReleased = true;
            this.eventBus.emit('mouseUp', { x: this.mouse.x, y: this.mouse.y, button: 0 });
            this.eventBus.emit('mouseClick', { x: this.mouse.x, y: this.mouse.y, button: 0 });
        };

        // 绑定事件
        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('keydown', this.keyDownHandler);
        document.addEventListener('keyup', this.keyUpHandler);
        
        this.canvas.addEventListener('mousemove', this.mouseMoveHandler);
        this.canvas.addEventListener('mousedown', this.mouseDownHandler);
        this.canvas.addEventListener('mouseup', this.mouseUpHandler);
        this.canvas.addEventListener('click', this.clickHandler);
        
        // 触摸事件
        this.canvas.addEventListener('touchstart', this.touchStartHandler, { passive: false });
        this.canvas.addEventListener('touchmove', this.touchMoveHandler, { passive: false });
        this.canvas.addEventListener('touchend', this.touchEndHandler, { passive: false });

        // 防止右键菜单
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    update() {
        // 重置单帧事件
        this.mouse.justPressed = false;
        this.mouse.justReleased = false;
    }

    isKeyPressed(key) {
        return this.keys.has(key);
    }

    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }

    isMouseDown() {
        return this.mouse.isDown;
    }

    wasMouseJustPressed() {
        return this.mouse.justPressed;
    }

    wasMouseJustReleased() {
        return this.mouse.justReleased;
    }

    destroy() {
        document.removeEventListener('keydown', this.keyDownHandler);
        document.removeEventListener('keyup', this.keyUpHandler);
        
        this.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
        this.canvas.removeEventListener('mousedown', this.mouseDownHandler);
        this.canvas.removeEventListener('mouseup', this.mouseUpHandler);
        this.canvas.removeEventListener('click', this.clickHandler);
        
        this.canvas.removeEventListener('touchstart', this.touchStartHandler);
        this.canvas.removeEventListener('touchmove', this.touchMoveHandler);
        this.canvas.removeEventListener('touchend', this.touchEndHandler);
    }
}

// 资源管理器
export class AssetManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.images = new Map();
        this.sounds = new Map();
        this.fonts = new Map();
        this.loadingQueue = [];
        this.loadedAssets = 0;
        this.totalAssets = 0;
        this.isLoading = false;
    }

    // 预加载图片
    preloadImage(name, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.images.set(name, img);
                this.loadedAssets++;
                this.eventBus.emit('assetLoaded', { 
                    name, 
                    type: 'image', 
                    progress: this.loadedAssets / this.totalAssets 
                });
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`Failed to load image: ${src}`);
                reject(new Error(`Failed to load image: ${src}`));
            };
            img.src = src;
        });
    }

    // 预加载音频
    preloadSound(name, src) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.addEventListener('canplaythrough', () => {
                this.sounds.set(name, audio);
                this.loadedAssets++;
                this.eventBus.emit('assetLoaded', { 
                    name, 
                    type: 'sound', 
                    progress: this.loadedAssets / this.totalAssets 
                });
                resolve(audio);
            });
            audio.addEventListener('error', () => {
                console.warn(`Failed to load sound: ${src}`);
                reject(new Error(`Failed to load sound: ${src}`));
            });
            audio.src = src;
        });
    }

    // 预加载字体
    preloadFont(name, src) {
        return new Promise((resolve, reject) => {
            const font = new FontFace(name, `url(${src})`);
            font.load().then((loadedFont) => {
                document.fonts.add(loadedFont);
                this.fonts.set(name, loadedFont);
                this.loadedAssets++;
                this.eventBus.emit('assetLoaded', { 
                    name, 
                    type: 'font', 
                    progress: this.loadedAssets / this.totalAssets 
                });
                resolve(loadedFont);
            }).catch((error) => {
                console.warn(`Failed to load font: ${src}`, error);
                reject(error);
            });
        });
    }

    // 批量加载资源
    async loadAssets(assetList) {
        this.isLoading = true;
        this.loadedAssets = 0;
        this.totalAssets = assetList.length;
        
        this.eventBus.emit('assetsLoadingStarted', { total: this.totalAssets });

        const promises = assetList.map(asset => {
            switch (asset.type) {
                case 'image':
                    return this.preloadImage(asset.name, asset.src);
                case 'sound':
                    return this.preloadSound(asset.name, asset.src);
                case 'font':
                    return this.preloadFont(asset.name, asset.src);
                default:
                    console.warn(`Unknown asset type: ${asset.type}`);
                    return Promise.resolve();
            }
        });

        try {
            await Promise.all(promises);
            this.isLoading = false;
            this.eventBus.emit('assetsLoadingComplete');
            return true;
        } catch (error) {
            this.isLoading = false;
            this.eventBus.emit('assetsLoadingError', { error });
            console.error('Asset loading failed:', error);
            return false;
        }
    }

    // 获取资源
    getImage(name) {
        return this.images.get(name);
    }

    getSound(name) {
        return this.sounds.get(name);
    }

    getFont(name) {
        return this.fonts.get(name);
    }

    // 播放声音
    playSound(name, volume = 1, loop = false) {
        const sound = this.sounds.get(name);
        if (sound) {
            sound.volume = volume;
            sound.loop = loop;
            sound.currentTime = 0;
            sound.play().catch(e => console.warn(`Could not play sound ${name}:`, e));
        }
    }

    // 停止声音
    stopSound(name) {
        const sound = this.sounds.get(name);
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
        }
    }

    // 检查资源是否已加载
    hasAsset(name, type) {
        switch (type) {
            case 'image': return this.images.has(name);
            case 'sound': return this.sounds.has(name);
            case 'font': return this.fonts.has(name);
            default: return false;
        }
    }

    // 获取加载进度
    getLoadingProgress() {
        return this.totalAssets > 0 ? this.loadedAssets / this.totalAssets : 1;
    }

    // 清理资源
    clear() {
        this.images.clear();
        this.sounds.forEach(sound => {
            sound.pause();
            sound.src = '';
        });
        this.sounds.clear();
        this.fonts.clear();
    }
}

// 配置管理器
export class ConfigManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.config = { ...GameConfig };
        this.userSettings = this.loadUserSettings();
        this.applyUserSettings();
    }

    loadUserSettings() {
        const defaultSettings = {
            volume: {
                master: 1.0,
                music: 0.8,
                effects: 0.9
            },
            graphics: {
                quality: 'high',
                particles: true,
                shadows: true
            },
            controls: {
                sensitivity: 1.0,
                invertY: false
            },
            gameplay: {
                difficulty: 'normal',
                autoSave: true
            }
        };

        const saved = StorageUtils.getItem('gameSettings', defaultSettings);
        return { ...defaultSettings, ...saved };
    }

    saveUserSettings() {
        StorageUtils.setItem('gameSettings', this.userSettings);
        this.eventBus.emit(Events.SETTINGS_CHANGED, this.userSettings);
    }

    applyUserSettings() {
        // 应用音量设置
        if (this.config.audio) {
            this.config.audio.masterVolume = this.userSettings.volume.master;
            this.config.audio.musicVolume = this.userSettings.volume.music;
            this.config.audio.effectsVolume = this.userSettings.volume.effects;
        }

        // 应用图形设置
        if (this.config.graphics) {
            this.config.graphics.quality = this.userSettings.graphics.quality;
            this.config.graphics.particles = this.userSettings.graphics.particles;
            this.config.graphics.shadows = this.userSettings.graphics.shadows;
        }

        // 应用控制设置
        if (this.config.controls) {
            this.config.controls.sensitivity = this.userSettings.controls.sensitivity;
            this.config.controls.invertY = this.userSettings.controls.invertY;
        }
    }

    // 获取配置值
    get(path) {
        const keys = path.split('.');
        let value = this.config;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }
        
        return value;
    }

    // 设置配置值
    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = this.config;
        
        for (const key of keys) {
            if (!target[key] || typeof target[key] !== 'object') {
                target[key] = {};
            }
            target = target[key];
        }
        
        target[lastKey] = value;
        this.eventBus.emit('configChanged', { path, value });
    }

    // 获取用户设置
    getUserSetting(path) {
        const keys = path.split('.');
        let value = this.userSettings;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }
        
        return value;
    }

    // 设置用户设置
    setUserSetting(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = this.userSettings;
        
        for (const key of keys) {
            if (!target[key] || typeof target[key] !== 'object') {
                target[key] = {};
            }
            target = target[key];
        }
        
        target[lastKey] = value;
        this.applyUserSettings();
        this.saveUserSettings();
    }

    // 重置为默认设置
    resetToDefaults() {
        this.userSettings = this.loadUserSettings();
        this.applyUserSettings();
        this.saveUserSettings();
    }

    // 获取所有设置
    getAllSettings() {
        return {
            config: { ...this.config },
            userSettings: { ...this.userSettings }
        };
    }
}

// 存储管理器
export class StorageManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.cache = new Map();
        this.autoSaveInterval = null;
        this.isDirty = false;
        
        this.setupAutoSave();
    }

    setupAutoSave() {
        // 每5秒自动保存脏数据
        this.autoSaveInterval = setInterval(() => {
            if (this.isDirty) {
                this.flush();
            }
        }, 5000);
    }

    // 保存游戏数据
    saveGameData(slot, data) {
        const gameData = {
            ...data,
            timestamp: Date.now(),
            version: '1.0'
        };
        
        const key = `gameData_slot_${slot}`;
        this.cache.set(key, gameData);
        this.isDirty = true;
        
        if (StorageUtils.setItem(key, gameData)) {
            this.eventBus.emit('gameSaved', { slot, data: gameData });
            return true;
        }
        return false;
    }

    // 加载游戏数据
    loadGameData(slot) {
        const key = `gameData_slot_${slot}`;
        
        // 先检查缓存
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        
        // 从存储加载
        const data = StorageUtils.getItem(key);
        if (data) {
            this.cache.set(key, data);
            this.eventBus.emit('gameLoaded', { slot, data });
        }
        
        return data;
    }

    // 删除游戏数据
    deleteGameData(slot) {
        const key = `gameData_slot_${slot}`;
        this.cache.delete(key);
        
        if (StorageUtils.removeItem(key)) {
            this.eventBus.emit('gameDeleted', { slot });
            return true;
        }
        return false;
    }

    // 获取所有存档
    getAllSaves() {
        const saves = [];
        
        for (let i = 0; i < 10; i++) {
            const data = this.loadGameData(i);
            saves.push({
                slot: i,
                data: data,
                exists: !!data,
                timestamp: data ? data.timestamp : null
            });
        }
        
        return saves.sort((a, b) => {
            if (!a.exists && !b.exists) return a.slot - b.slot;
            if (!a.exists) return 1;
            if (!b.exists) return -1;
            return b.timestamp - a.timestamp;
        });
    }

    // 保存高分
    saveHighScore(score, playerName = 'Anonymous') {
        const highScores = this.getHighScores();
        const newEntry = {
            score,
            playerName,
            timestamp: Date.now(),
            date: new Date().toLocaleDateString()
        };
        
        highScores.push(newEntry);
        highScores.sort((a, b) => b.score - a.score);
        highScores.splice(10); // 只保留前10名
        
        this.cache.set('highScores', highScores);
        this.isDirty = true;
        
        if (StorageUtils.setItem('highScores', highScores)) {
            this.eventBus.emit('highScoreSaved', { score, rank: highScores.findIndex(entry => entry === newEntry) + 1 });
            return true;
        }
        return false;
    }

    // 获取高分榜
    getHighScores() {
        if (this.cache.has('highScores')) {
            return [...this.cache.get('highScores')];
        }
        
        const highScores = StorageUtils.getItem('highScores', []);
        this.cache.set('highScores', highScores);
        return [...highScores];
    }

    // 保存成就
    saveAchievement(achievementId, data = {}) {
        const achievements = this.getAchievements();
        achievements[achievementId] = {
            ...data,
            unlocked: true,
            timestamp: Date.now()
        };
        
        this.cache.set('achievements', achievements);
        this.isDirty = true;
        
        if (StorageUtils.setItem('achievements', achievements)) {
            this.eventBus.emit('achievementUnlocked', { id: achievementId, data });
            return true;
        }
        return false;
    }

    // 获取成就
    getAchievements() {
        if (this.cache.has('achievements')) {
            return { ...this.cache.get('achievements') };
        }
        
        const achievements = StorageUtils.getItem('achievements', {});
        this.cache.set('achievements', achievements);
        return { ...achievements };
    }

    // 保存统计数据
    saveStats(stats) {
        this.cache.set('gameStats', stats);
        this.isDirty = true;
        
        return StorageUtils.setItem('gameStats', stats);
    }

    // 获取统计数据
    getStats() {
        if (this.cache.has('gameStats')) {
            return { ...this.cache.get('gameStats') };
        }
        
        const defaultStats = {
            gamesPlayed: 0,
            totalScore: 0,
            bestScore: 0,
            timePlayedMs: 0,
            ballsShot: 0,
            ballsMade: 0
        };
        
        const stats = StorageUtils.getItem('gameStats', defaultStats);
        this.cache.set('gameStats', stats);
        return { ...stats };
    }

    // 立即保存所有缓存数据
    flush() {
        let success = true;
        
        this.cache.forEach((value, key) => {
            if (!StorageUtils.setItem(key, value)) {
                success = false;
            }
        });
        
        if (success) {
            this.isDirty = false;
            this.eventBus.emit('dataFlushed');
        }
        
        return success;
    }

    // 清除所有数据
    clearAll() {
        this.cache.clear();
        StorageUtils.clear();
        this.eventBus.emit('dataCleared');
    }

    // 获取存储使用情况
    getStorageInfo() {
        const info = {
            available: StorageUtils.isAvailable(),
            cacheSize: this.cache.size,
            isDirty: this.isDirty
        };
        
        if (info.available) {
            try {
                const used = JSON.stringify(localStorage).length;
                const quota = 5 * 1024 * 1024; // 假设5MB限制
                info.usedBytes = used;
                info.quotaBytes = quota;
                info.usagePercentage = (used / quota) * 100;
            } catch (e) {
                info.error = 'Could not calculate storage usage';
            }
        }
        
        return info;
    }

    destroy() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        this.flush();
    }
}

// 特效管理器
export class EffectsManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.screenShakes = [];
        this.fadeTransitions = [];
        this.flashEffects = [];
        this.isEnabled = true;
    }

    // 屏幕震动
    addScreenShake(intensity = 10, duration = 500, frequency = 20) {
        if (!this.isEnabled) return;
        
        this.screenShakes.push({
            intensity,
            duration,
            frequency,
            elapsed: 0,
            originalIntensity: intensity
        });
        
        this.eventBus.emit('screenShakeStarted', { intensity, duration });
    }

    // 渐入渐出过渡
    addFadeTransition(type = 'fadeOut', duration = 1000, color = 'rgba(0,0,0,1)') {
        if (!this.isEnabled) return;
        
        const transition = {
            type,
            duration,
            color,
            elapsed: 0,
            alpha: type === 'fadeOut' ? 0 : 1,
            active: true
        };
        
        this.fadeTransitions.push(transition);
        this.eventBus.emit('fadeTransitionStarted', { type, duration });
        
        return transition;
    }

    // 闪光效果
    addFlashEffect(color = 'rgba(255,255,255,0.8)', duration = 200) {
        if (!this.isEnabled) return;
        
        this.flashEffects.push({
            color,
            duration,
            elapsed: 0,
            alpha: 1
        });
        
        this.eventBus.emit('flashEffectStarted', { color, duration });
    }

    // 更新所有特效
    update(deltaTime) {
        this.updateScreenShakes(deltaTime);
        this.updateFadeTransitions(deltaTime);
        this.updateFlashEffects(deltaTime);
    }

    updateScreenShakes(deltaTime) {
        this.screenShakes = this.screenShakes.filter(shake => {
            shake.elapsed += deltaTime;
            
            if (shake.elapsed >= shake.duration) {
                return false;
            }
            
            // 衰减强度
            const progress = shake.elapsed / shake.duration;
            shake.intensity = shake.originalIntensity * (1 - progress);
            
            return true;
        });
    }

    updateFadeTransitions(deltaTime) {
        this.fadeTransitions = this.fadeTransitions.filter(transition => {
            if (!transition.active) return false;
            
            transition.elapsed += deltaTime;
            const progress = Math.min(transition.elapsed / transition.duration, 1);
            
            if (transition.type === 'fadeOut') {
                transition.alpha = progress;
            } else { // fadeIn
                transition.alpha = 1 - progress;
            }
            
            if (progress >= 1) {
                this.eventBus.emit('fadeTransitionComplete', { type: transition.type });
                return false;
            }
            
            return true;
        });
    }

    updateFlashEffects(deltaTime) {
        this.flashEffects = this.flashEffects.filter(flash => {
            flash.elapsed += deltaTime;
            const progress = Math.min(flash.elapsed / flash.duration, 1);
            
            flash.alpha = 1 - progress;
            
            return progress < 1;
        });
    }

    // 渲染所有特效
    render(ctx) {
        if (!this.isEnabled) return;
        
        this.renderScreenShake(ctx);
        this.renderFlashEffects(ctx);
        this.renderFadeTransitions(ctx);
    }

    renderScreenShake(ctx) {
        if (this.screenShakes.length === 0) return;
        
        // 计算总震动偏移
        let totalOffsetX = 0;
        let totalOffsetY = 0;
        
        this.screenShakes.forEach(shake => {
            const angle = Math.random() * Math.PI * 2;
            totalOffsetX += Math.cos(angle) * shake.intensity;
            totalOffsetY += Math.sin(angle) * shake.intensity;
        });
        
        if (totalOffsetX !== 0 || totalOffsetY !== 0) {
            ctx.save();
            ctx.translate(totalOffsetX, totalOffsetY);
        }
    }

    renderFlashEffects(ctx) {
        this.flashEffects.forEach(flash => {
            ctx.save();
            ctx.globalAlpha = flash.alpha;
            ctx.fillStyle = flash.color;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.restore();
        });
    }

    renderFadeTransitions(ctx) {
        this.fadeTransitions.forEach(transition => {
            if (transition.alpha > 0) {
                ctx.save();
                ctx.globalAlpha = transition.alpha;
                ctx.fillStyle = transition.color;
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.restore();
            }
        });
    }

    // 恢复屏幕震动变换
    restoreScreenShake(ctx) {
        if (this.screenShakes.length > 0) {
            ctx.restore();
        }
    }

    // 清除所有特效
    clear() {
        this.screenShakes = [];
        this.fadeTransitions = [];
        this.flashEffects = [];
    }

    // 启用/禁用特效
    setEnabled(enabled) {
        this.isEnabled = enabled;
        if (!enabled) {
            this.clear();
        }
    }

    // 获取特效统计
    getStats() {
        return {
            screenShakes: this.screenShakes.length,
            fadeTransitions: this.fadeTransitions.length,
            flashEffects: this.flashEffects.length,
            isEnabled: this.isEnabled
        };
    }
}