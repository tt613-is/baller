/**
 * 游戏核心引擎 - 包含事件总线、状态机和主引擎
 */

// 事件总线 - 处理组件间通信
class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (!this.listeners.has(event)) return;
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    emit(event, data = null) {
        if (!this.listeners.has(event)) return;
        const callbacks = this.listeners.get(event);
        callbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event handler for "${event}":`, error);
            }
        });
    }

    once(event, callback) {
        const onceCallback = (data) => {
            callback(data);
            this.off(event, onceCallback);
        };
        this.on(event, onceCallback);
    }

    clear() {
        this.listeners.clear();
    }
}

// 状态基类
class BaseState {
    constructor(name, engine) {
        this.name = name;
        this.engine = engine;
        this.eventBus = engine.eventBus;
    }

    enter(data = null) {
        // 子类重写此方法
    }

    exit() {
        // 子类重写此方法
    }

    update(deltaTime) {
        // 子类重写此方法
    }

    render(ctx) {
        // 子类重写此方法
    }

    handleInput(input) {
        // 子类重写此方法
    }

    handleMouseMove(x, y) {
        // 子类重写此方法
    }

    handleMouseClick(x, y) {
        // 子类重写此方法
    }
}

// 状态机
class StateMachine {
    constructor(engine) {
        this.engine = engine;
        this.eventBus = engine.eventBus;
        this.states = new Map();
        this.currentState = null;
        this.isChangingState = false;
        
        // 淡入淡出效果
        this.fadeState = null; // null, 'fadeOut', 'fadeIn'
        this.fadeAlpha = 0;
        this.fadeCallback = null;
        this.fadeDuration = 30; // 帧数
        this.fadeTimer = 0;
    }

    registerState(name, state) {
        this.states.set(name, state);
    }

    changeState(stateName, data = null, useFade = false) {
        if (this.isChangingState) return;
        
        const newState = this.states.get(stateName);
        if (!newState) {
            console.error(`State "${stateName}" not found`);
            return;
        }

        if (useFade && this.fadeState === null) {
            this.startFadeTransition(() => {
                this._doStateChange(newState, data);
            });
        } else {
            this._doStateChange(newState, data);
        }
    }

    _doStateChange(newState, data) {
        this.isChangingState = true;
        
        if (this.currentState) {
            this.currentState.exit();
        }
        
        this.currentState = newState;
        this.currentState.enter(data);
        
        this.eventBus.emit('stateChanged', { 
            state: this.currentState.name,
            data: data 
        });
        
        this.isChangingState = false;
    }

    startFadeTransition(callback) {
        this.fadeState = 'fadeOut';
        this.fadeAlpha = 0;
        this.fadeCallback = callback;
        this.fadeTimer = 0;
    }

    getCurrentState() {
        return this.currentState;
    }

    getCurrentStateName() {
        return this.currentState ? this.currentState.name : null;
    }

    update(deltaTime) {
        // 更新淡入淡出效果
        this.updateFade();
        
        // 更新当前状态
        if (this.currentState && !this.isChangingState) {
            this.currentState.update(deltaTime);
        }
    }

    render(ctx) {
        // 渲染当前状态
        if (this.currentState) {
            this.currentState.render(ctx);
        }
        
        // 渲染淡入淡出效果
        this.renderFade(ctx);
    }

    updateFade() {
        if (this.fadeState === null) return;
        
        this.fadeTimer++;
        const progress = this.fadeTimer / this.fadeDuration;
        
        if (this.fadeState === 'fadeOut') {
            this.fadeAlpha = Math.min(1, progress);
            if (this.fadeAlpha >= 1) {
                this.fadeState = 'fadeIn';
                this.fadeTimer = 0;
                if (this.fadeCallback) {
                    this.fadeCallback();
                    this.fadeCallback = null;
                }
            }
        } else if (this.fadeState === 'fadeIn') {
            this.fadeAlpha = Math.max(0, 1 - progress);
            if (this.fadeAlpha <= 0) {
                this.fadeState = null;
                this.fadeTimer = 0;
            }
        }
    }

    renderFade(ctx) {
        if (this.fadeState === null || this.fadeAlpha <= 0) return;
        
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.globalAlpha = this.fadeAlpha;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
    }

    handleInput(input) {
        if (this.currentState && !this.isChangingState) {
            this.currentState.handleInput(input);
        }
    }

    handleMouseMove(x, y) {
        if (this.currentState && !this.isChangingState) {
            this.currentState.handleMouseMove(x, y);
        }
    }

    handleMouseClick(x, y) {
        if (this.currentState && !this.isChangingState) {
            this.currentState.handleMouseClick(x, y);
        }
    }
}

// 游戏引擎主类
class GameEngine {
    constructor(canvasId) {
        // Canvas设置
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element with id "${canvasId}" not found`);
        }
        
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            throw new Error('Failed to get 2D context from canvas');
        }

        // 核心组件
        this.eventBus = new EventBus();
        this.stateMachine = new StateMachine(this);
        
        // 游戏状态
        this.isRunning = false;
        this.isDestroyed = false;
        this.animationFrameId = null;
        this.lastTime = 0;
        
        // 输入管理
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        this.boundHandlers = {};
        
        // 性能监控
        this.frameCount = 0;
        this.fps = 0;
        this.fpsTimer = 0;
        
        // 初始化
        this.setupInput();
        this.setupEventListeners();
    }

    setupInput() {
        // 键盘事件
        this.boundHandlers.keydown = (e) => {
            if (this.isDestroyed) return;
            this.keys[e.key] = true;
            this.stateMachine.handleInput({ type: 'keydown', key: e.key, event: e });
        };

        this.boundHandlers.keyup = (e) => {
            if (this.isDestroyed) return;
            this.keys[e.key] = false;
            this.stateMachine.handleInput({ type: 'keyup', key: e.key, event: e });
        };

        // 鼠标事件
        this.boundHandlers.mousemove = (e) => {
            if (this.isDestroyed) return;
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
            this.stateMachine.handleMouseMove(this.mouse.x, this.mouse.y);
        };

        this.boundHandlers.mousedown = (e) => {
            if (this.isDestroyed) return;
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.stateMachine.handleMouseClick(x, y);
        };

        // 绑定事件
        document.addEventListener('keydown', this.boundHandlers.keydown);
        document.addEventListener('keyup', this.boundHandlers.keyup);
        this.canvas.addEventListener('mousemove', this.boundHandlers.mousemove);
        this.canvas.addEventListener('click', this.boundHandlers.mousedown);
    }

    setupEventListeners() {
        // 监听引擎级别的事件
        this.eventBus.on('changeState', (data) => {
            this.stateMachine.changeState(data.state, data.data, data.fade);
        });

        this.eventBus.on('quit', () => {
            this.stop();
        });
    }

    registerState(name, state) {
        this.stateMachine.registerState(name, state);
    }

    start(initialState = null) {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastTime = performance.now();
        
        if (initialState) {
            this.stateMachine.changeState(initialState);
        }
        
        this.gameLoop();
        this.eventBus.emit('engineStarted');
    }

    stop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.eventBus.emit('engineStopped');
    }

    gameLoop() {
        if (!this.isRunning || this.isDestroyed) return;

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // 更新FPS
        this.updateFPS(deltaTime);

        // 更新游戏逻辑
        this.update(deltaTime);

        // 渲染画面
        this.render();

        // 继续循环
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        this.stateMachine.update(deltaTime);
        this.eventBus.emit('update', deltaTime);
    }

    render() {
        // 清屏
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 渲染状态
        this.stateMachine.render(this.ctx);
        
        this.eventBus.emit('render', this.ctx);
    }

    updateFPS(deltaTime) {
        this.frameCount++;
        this.fpsTimer += deltaTime;
        
        if (this.fpsTimer >= 1000) { // 每秒更新一次FPS
            this.fps = Math.round((this.frameCount * 1000) / this.fpsTimer);
            this.frameCount = 0;
            this.fpsTimer = 0;
        }
    }

    getFPS() {
        return this.fps;
    }

    getCanvas() {
        return this.canvas;
    }

    getContext() {
        return this.ctx;
    }

    isKeyPressed(key) {
        return !!this.keys[key];
    }

    getMousePosition() {
        return { ...this.mouse };
    }

    destroy() {
        this.isDestroyed = true;
        this.stop();
        
        // 移除事件监听器
        if (this.boundHandlers.keydown) {
            document.removeEventListener('keydown', this.boundHandlers.keydown);
        }
        if (this.boundHandlers.keyup) {
            document.removeEventListener('keyup', this.boundHandlers.keyup);
        }
        if (this.boundHandlers.mousemove) {
            this.canvas.removeEventListener('mousemove', this.boundHandlers.mousemove);
        }
        if (this.boundHandlers.mousedown) {
            this.canvas.removeEventListener('click', this.boundHandlers.mousedown);
        }
        
        // 清理
        this.eventBus.clear();
        this.keys = {};
        this.boundHandlers = {};
    }
}

// 导出类
export { GameEngine, StateMachine, EventBus, BaseState };