/**
 * 游戏启动入口文件
 * 
 * 设计意图：
 * - 作为应用程序的单一入口点
 * - 负责初始化和启动游戏引擎
 * - 保持极简，只负责启动逻辑
 * - 提供全局错误处理和日志记录
 */

// 导入游戏引擎
import { GameEngine } from './core/GameEngine.js';

/**
 * 全局游戏实例
 * @type {GameEngine}
 */
let gameInstance = null;

/**
 * 全局错误处理器
 * 设计意图：捕获未处理的错误，保持游戏的稳定性
 */
window.addEventListener('error', (event) => {
    console.error('游戏发生错误:', event.error);
    // 如果是严重错误，可以在此处添加错误恢复逻辑
    if (gameInstance) {
        // 可以尝试重启游戏或显示错误信息
        console.log('尝试恢复游戏状态...');
    }
});

/**
 * 处理未捕获的Promise错误
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的Promise错误:', event.reason);
    event.preventDefault(); // 阻止默认的错误处理
});

/**
 * 页面卸载时的清理工作
 * 设计意图：确保游戏资源得到正确释放
 */
window.addEventListener('beforeunload', () => {
    if (gameInstance) {
        console.log('正在清理游戏资源...');
        gameInstance.destroy();
        gameInstance = null;
    }
});

/**
 * 页面可见性变化处理
 * 设计意图：当页面不可见时自动暂停游戏，节省资源
 */
document.addEventListener('visibilitychange', () => {
    if (gameInstance) {
        if (document.hidden) {
            // 页面不可见时暂停游戏
            console.log('页面不可见，暂停游戏');
            gameInstance.pause();
        } else {
            // 页面可见时恢复游戏（如果之前是在游戏中）
            console.log('页面可见，检查是否需要恢复游戏');
            gameInstance.resume();
        }
    }
});

/**
 * 游戏初始化函数
 * 设计意图：
 * - 等待DOM完全加载
 * - 验证必要的HTML元素存在
 * - 创建并启动游戏引擎
 * - 提供启动失败的错误处理
 */
function initializeGame() {
    try {
        console.log('开始初始化游戏...');
        
        // 检查必要的DOM元素是否存在
        const gameCanvas = document.getElementById('gameCanvas');
        if (!gameCanvas) {
            throw new Error('找不到游戏画布元素 (id: gameCanvas)');
        }
        
        // 检查浏览器是否支持Canvas 2D
        const context = gameCanvas.getContext('2d');
        if (!context) {
            throw new Error('浏览器不支持Canvas 2D渲染');
        }
        
        // 创建游戏引擎实例
        gameInstance = new GameEngine();
        
        // 启动游戏
        gameInstance.start();
        
        console.log('游戏初始化完成！');
        
        // 添加调试信息（仅在开发模式下）
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('开发模式：可使用 window.game 访问游戏实例');
            window.game = gameInstance;
        }
        
    } catch (error) {
        console.error('游戏初始化失败:', error);
        
        // 显示友好的错误信息给用户
        showErrorMessage('游戏启动失败', error.message);
    }
}

/**
 * 显示错误信息给用户
 * 设计意图：提供友好的错误提示界面
 * 
 * @param {string} title - 错误标题
 * @param {string} message - 错误详情
 */
function showErrorMessage(title, message) {
    // 创建错误提示界面
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        z-index: 1000;
        font-family: Arial, sans-serif;
        max-width: 400px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    `;
    
    errorDiv.innerHTML = `
        <h3 style="margin: 0 0 10px 0; color: #ff4444;">${title}</h3>
        <p style="margin: 0 0 15px 0; color: #ccc;">${message}</p>
        <button onclick="location.reload()" style="
            background: #4CAF50;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        ">重新加载页面</button>
    `;
    
    document.body.appendChild(errorDiv);
}

/**
 * 页面加载完成时的处理
 * 设计意图：确保DOM完全加载后再初始化游戏
 */
if (document.readyState === 'loading') {
    // 如果文档还在加载中，等待DOMContentLoaded事件
    document.addEventListener('DOMContentLoaded', initializeGame);
} else {
    // 如果文档已经加载完成，直接初始化游戏
    initializeGame();
}

/**
 * 导出游戏实例获取函数（用于调试和测试）
 * 设计意图：提供安全的游戏实例访问方式
 * 
 * @returns {GameEngine|null} 游戏引擎实例
 */
export function getGameInstance() {
    return gameInstance;
}

/**
 * 重启游戏函数
 * 设计意图：提供程序化的游戏重启功能
 */
export function restartGame() {
    if (gameInstance) {
        try {
            gameInstance.restart();
            console.log('游戏重启成功');
        } catch (error) {
            console.error('游戏重启失败:', error);
            // 如果重启失败，尝试重新创建游戏实例
            gameInstance.destroy();
            initializeGame();
        }
    }
}

/**
 * 全局重启游戏函数（供HTML调用）
 * 设计意图：为HTML中的按钮提供重启功能
 */
window.restartGame = restartGame;

// 开发模式下的额外功能
if (process.env.NODE_ENV === 'development') {
    console.log('开发模式已启用');
    
    // 添加性能监控
    if (window.performance && window.performance.mark) {
        window.performance.mark('game-start');
        
        window.addEventListener('load', () => {
            window.performance.mark('game-loaded');
            window.performance.measure('game-load-time', 'game-start', 'game-loaded');
            
            const measures = window.performance.getEntriesByType('measure');
            const gameLoadTime = measures.find(m => m.name === 'game-load-time');
            if (gameLoadTime) {
                console.log(`游戏加载时间: ${gameLoadTime.duration.toFixed(2)}ms`);
            }
        });
    }
}

// 导出启动函数供其他模块使用
export { initializeGame };