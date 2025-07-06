# 青蛙篮球游戏 - 代码审查 TODO 列表

## 🐛 严重Bug修复

### 1. 内存泄漏风险 - setTimeout清理
**问题**: 游戏中使用了多个setTimeout，但没有保存引用进行清理
**位置**: 
- 第1031行: 胜利烟花效果setTimeout
- 第1808行: 投篮成功烟花效果setTimeout
- 第1115行: 音效系统setTimeout

**修复建议**:
```javascript
// 添加setTimeout引用追踪
this.timeoutIds = [];

// 使用时保存引用
const timeoutId = setTimeout(() => this.createFireworks(), i * 400);
this.timeoutIds.push(timeoutId);

// 在destroy方法中清理
this.timeoutIds.forEach(id => clearTimeout(id));
this.timeoutIds = [];
```

### 2. 错误处理不完善
**问题**: 本地存储操作没有错误处理
**位置**: 第2478行 `loadAppearanceFromStorage()` 和第2509行 `saveAppearanceToStorage()`

**修复建议**:
```javascript
try {
    const saved = localStorage.getItem('frogBasketballAppearance');
    // ... 现有代码
} catch (error) {
    console.warn('Failed to load appearance settings:', error);
    // 使用默认设置
}
```

## ⚠️ 潜在问题修复

### 3. 数组边界检查
**问题**: 外观设置索引可能越界
**位置**: 第2856行开始的switch语句

**修复建议**:
```javascript
// 添加更严格的边界检查
const maxCount = this.appearancePresets.heads.length;
currentIndex = Math.max(0, Math.min(currentIndex, maxCount - 1));
```

### 4. 事件处理器重复绑定
**问题**: 如果多次实例化游戏对象，可能导致事件处理器重复绑定
**位置**: 第723-726行

**修复建议**:
```javascript
// 在绑定前先移除可能存在的监听器
this.removeEventListeners();
this.addEventListeners();
```

### 5. 画布上下文丢失处理
**问题**: 没有处理canvas context lost事件
**位置**: 构造函数

**修复建议**:
```javascript
this.canvas.addEventListener('webglcontextlost', this.handleContextLost.bind(this));
this.canvas.addEventListener('webglcontextrestored', this.handleContextRestored.bind(this));
```

## 🚀 性能优化

### 6. 减少不必要的DOM操作
**问题**: 频繁修改canvas样式可能影响性能
**位置**: 第1115行 `playSound` 方法

**修复建议**:
```javascript
// 使用CSS动画替代JavaScript样式修改
this.canvas.classList.add('screen-flash');
setTimeout(() => this.canvas.classList.remove('screen-flash'), 100);
```

### 7. 优化渲染循环
**问题**: 每帧都重新创建渐变对象
**位置**: 第1157行 `drawBackground` 方法

**修复建议**:
```javascript
// 缓存渐变对象
if (!this.cachedGradients.nightSky) {
    this.cachedGradients.nightSky = this.ctx.createRadialGradient(/*...*/);
}
```

### 8. 批量DOM更新
**问题**: 分数更新时直接操作DOM
**位置**: 第1013行

**修复建议**:
```javascript
// 使用requestAnimationFrame批量更新DOM
this.scheduleScoreUpdate(this.score);
```

## 🛠️ 代码质量改进

### 9. 提取魔术数字为常量
**问题**: 代码中存在大量魔术数字
**位置**: 全文件

**修复建议**:
```javascript
// 在类顶部定义常量
static CONSTANTS = {
    WINNING_SCORE: 50,
    ANIMATION_SPEED: 60,
    PARTICLE_LIFETIME: 60,
    WALL_FLASH_DURATION: 30,
    // ... 其他常量
};
```

### 10. 方法职责分离
**问题**: `updateShooting` 方法过长，职责过多
**位置**: 第1757行

**修复建议**:
```javascript
// 拆分为多个方法
updateShooting() {
    this.updateAimAngle();
    this.updatePowerIndicator();
    this.updateBasketballFlight();
}
```

### 11. 添加类型检查
**问题**: 没有参数类型检查
**位置**: 各个方法

**修复建议**:
```javascript
// 添加参数验证
drawPlayerWithAppearanceScaled(x, y, appearance, scale) {
    if (typeof x !== 'number' || typeof y !== 'number') {
        throw new Error('Invalid coordinates');
    }
    // ... 现有代码
}
```

## 🎨 用户体验改进

### 12. 添加加载状态
**问题**: 没有加载状态显示
**位置**: 初始化部分

**修复建议**:
```javascript
// 显示加载画面
showLoadingScreen() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    // ... 加载动画
}
```

### 13. 错误状态友好提示
**问题**: 错误时没有用户友好的提示
**位置**: 构造函数和其他可能出错的地方

**修复建议**:
```javascript
// 添加错误提示UI
showErrorMessage(message) {
    // 显示用户友好的错误信息
}
```

### 14. 键盘导航支持
**问题**: 菜单按钮不支持键盘导航
**位置**: 菜单系统

**修复建议**:
```javascript
// 添加Tab键导航支持
handleTabNavigation(e) {
    if (e.key === 'Tab') {
        this.focusNextButton();
    }
}
```

## 🔧 浏览器兼容性

### 15. 检查现代API支持
**问题**: 使用了一些现代API，可能不兼容旧浏览器
**位置**: 全文件

**修复建议**:
```javascript
// 添加特性检测
if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = window.webkitRequestAnimationFrame || 
                                  window.mozRequestAnimationFrame;
}
```

### 16. 添加回退方案
**问题**: localStorage不可用时没有回退
**位置**: 第2478行

**修复建议**:
```javascript
// 检查localStorage支持
if (typeof Storage !== 'undefined') {
    // 使用localStorage
} else {
    // 使用内存存储作为回退
}
```

## 📱 响应式设计

### 17. 移动设备触摸支持
**问题**: 只支持鼠标操作，不支持触摸
**位置**: 事件处理部分

**修复建议**:
```javascript
// 添加触摸事件支持
this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
```

### 18. 屏幕尺寸适应
**问题**: 固定canvas尺寸不适应不同屏幕
**位置**: 构造函数

**修复建议**:
```javascript
// 动态设置canvas尺寸
this.resizeCanvas();
window.addEventListener('resize', this.resizeCanvas.bind(this));
```

## 优先级排序

### 🔴 高优先级 (立即修复)
1. 内存泄漏风险 - setTimeout清理
2. 错误处理不完善

### 🟡 中优先级 (下个版本)
3. 数组边界检查
4. 事件处理器重复绑定
5. 画布上下文丢失处理
6. 减少不必要的DOM操作

### 🟢 低优先级 (后续优化)
7. 提取魔术数字
8. 方法职责分离
9. 添加加载状态
10. 移动设备支持

请确认您希望我优先修复哪些问题，我将按照您的指示执行修复工作。