# 青蛙篮球游戏 - 换装功能设计方案

## 当前角色系统分析

当前游戏中的玩家角色具有以下可视化属性：
- **球衣颜色**: `bodyColor1` (主色) 和 `bodyColor2` (副色)
- **球衣号码**: `jerseyNumber` 
- **肤色**: 固定为 `#FFDBAC`
- **发色**: 固定为 `#3A2A1A`

## 三种换装系统设计方案

### 方案一：简单分类换装系统 (Simple Category System)

#### 设计理念
提供预设的外观组合，玩家可以快速选择不同的外观风格，适合休闲游戏的简单快捷体验。

#### 功能特点
- **预设外观包**: 提供8-10种完整的外观套装
- **分类选择**: 头部、身体、配色三大类别
- **一键换装**: 每个类别提供3-4种选择

#### 具体实现
```javascript
// 外观配置数据
const appearancePresets = {
    heads: [
        { name: "经典", skinColor: "#FFDBAC", hairColor: "#3A2A1A", hairStyle: "classic" },
        { name: "金发", skinColor: "#FFDBAC", hairColor: "#FFD700", hairStyle: "spiky" },
        { name: "深色", skinColor: "#8B4513", hairColor: "#000000", hairStyle: "curly" },
        { name: "白化", skinColor: "#FFEAA7", hairColor: "#FFFFFF", hairStyle: "long" }
    ],
    jerseys: [
        { name: "经典蓝", color1: "#00529B", color2: "#FFD700" },
        { name: "火焰红", color1: "#FF4444", color2: "#FF8888" },
        { name: "森林绿", color1: "#228B22", color2: "#90EE90" },
        { name: "紫罗兰", color1: "#8A2BE2", color2: "#DDA0DD" }
    ],
    numbers: ["1", "23", "88", "99", "7", "11", "33", "77"]
};
```

#### 界面设计
- 游戏主菜单添加"换装"按钮
- 换装界面分为三个区域：头部、球衣、号码
- 每个区域显示缩略图预览
- 底部有"应用"和"取消"按钮

#### 优点
- 开发简单，易于维护
- 用户体验简洁
- 适合快速游戏节奏

#### 缺点
- 自定义程度有限
- 组合数量相对较少

---

### 方案二：高级自定义换装系统 (Advanced Customization System)

#### 设计理念
提供细粒度的自定义选项，玩家可以独立调整每个部位的外观，创造独特的角色形象。

#### 功能特点
- **部位独立**: 头部、身体、配饰可独立自定义
- **颜色自定义**: HSL色彩选择器
- **样式选择**: 多种发型、球衣款式、配饰选择
- **实时预览**: 所有修改即时显示

#### 具体实现
```javascript
// 扩展的角色属性
this.player = {
    // 基础属性
    x: this.width / 2,
    y: 520,
    width: 40,
    height: 50,
    
    // 外观自定义属性
    appearance: {
        // 头部
        head: {
            skinColor: "#FFDBAC",
            hairColor: "#3A2A1A",
            hairStyle: "classic", // classic, spiky, curly, long, bald
            eyeColor: "#000000",
            eyeStyle: "normal" // normal, sleepy, angry, surprised
        },
        
        // 身体
        body: {
            jerseyStyle: "classic", // classic, tank, hoodie, vintage
            primaryColor: "#00529B",
            secondaryColor: "#FFD700",
            patternType: "solid", // solid, stripes, gradient, spots
            jerseyNumber: "1",
            numberStyle: "bold" // bold, italic, outline
        },
        
        // 配饰
        accessories: {
            shoes: { color: "#FFFFFF", style: "sneakers" },
            wristbands: { enabled: true, color: "#FF0000" },
            headband: { enabled: false, color: "#0000FF" },
            tattoos: { enabled: false, pattern: "none" }
        }
    }
};

// 自定义面板组件
class CustomizationPanel {
    constructor(game) {
        this.game = game;
        this.currentTab = 'head';
        this.tabs = ['head', 'body', 'accessories'];
        this.colorPickers = {};
        this.previewCanvas = null;
    }
    
    drawCustomizationUI() {
        // 绘制标签页
        this.drawTabs();
        
        // 绘制当前标签页的选项
        switch(this.currentTab) {
            case 'head':
                this.drawHeadOptions();
                break;
            case 'body':
                this.drawBodyOptions();
                break;
            case 'accessories':
                this.drawAccessoryOptions();
                break;
        }
        
        // 绘制预览区域
        this.drawPreview();
        
        // 绘制操作按钮
        this.drawActionButtons();
    }
}
```

#### 界面设计
- 分标签页式界面（头部、身体、配饰）
- 每个标签页包含多个自定义选项
- 实时预览窗口显示当前外观
- 颜色选择器支持HSL模式
- 保存/加载自定义方案
- 随机生成外观按钮

#### 优点
- 高度自定义，组合数量巨大
- 满足个性化需求
- 增加游戏可玩性和粘性

#### 缺点
- 开发复杂度高
- 界面可能过于复杂
- 需要更多的美术资源

---

### 方案三：解锁式进阶换装系统 (Unlockable Progression System)

#### 设计理念
结合游戏进度和成就系统，玩家通过游戏表现解锁新的外观选项，增加游戏的长期吸引力。

#### 功能特点
- **成就解锁**: 通过达成特定条件解锁新外观
- **等级系统**: 角色等级决定可用的自定义选项
- **稀有度系统**: 外观分为普通、稀有、史诗、传奇等级
- **收集元素**: 鼓励玩家持续游戏以收集完整外观

#### 具体实现
```javascript
// 解锁系统
class UnlockSystem {
    constructor() {
        this.unlockedItems = new Set(['classic_head', 'classic_jersey', 'number_1']);
        this.playerLevel = 1;
        this.achievements = {};
        this.unlockConditions = {
            'golden_hair': { type: 'score', requirement: 100, description: '累计得分100分' },
            'fire_jersey': { type: 'games', requirement: 10, description: '完成10场游戏' },
            'legendary_shoes': { type: 'achievement', requirement: 'perfect_game', description: '完成完美游戏' },
            'rainbow_pattern': { type: 'level', requirement: 10, description: '达到10级' }
        };
    }
    
    checkUnlocks(gameStats) {
        Object.keys(this.unlockConditions).forEach(itemId => {
            if (this.unlockedItems.has(itemId)) return;
            
            const condition = this.unlockConditions[itemId];
            let unlocked = false;
            
            switch(condition.type) {
                case 'score':
                    unlocked = gameStats.totalScore >= condition.requirement;
                    break;
                case 'games':
                    unlocked = gameStats.gamesPlayed >= condition.requirement;
                    break;
                case 'level':
                    unlocked = this.playerLevel >= condition.requirement;
                    break;
                case 'achievement':
                    unlocked = this.achievements[condition.requirement] === true;
                    break;
            }
            
            if (unlocked) {
                this.unlockItem(itemId);
            }
        });
    }
    
    unlockItem(itemId) {
        this.unlockedItems.add(itemId);
        this.showUnlockNotification(itemId);
    }
}

// 外观稀有度系统
const appearanceRarity = {
    common: { color: '#CCCCCC', items: ['classic_head', 'basic_jersey'] },
    rare: { color: '#0066CC', items: ['golden_hair', 'fire_jersey'] },
    epic: { color: '#9933CC', items: ['rainbow_pattern', 'legendary_shoes'] },
    legendary: { color: '#FF6600', items: ['diamond_skin', 'champion_jersey'] }
};
```

#### 解锁条件示例
- **发型解锁**:
  - 金发：累计得分达到100分
  - 爆炸头：连续投中10球
  - 长发：达到5级
  
- **球衣解锁**:
  - 火焰球衣：完成10场游戏
  - 彩虹球衣：达到最高分50分
  - 冠军球衣：完成困难模式
  
- **配饰解锁**:
  - 头带：投中100球
  - 护腕：完成连击成就
  - 特殊鞋子：达到10级

#### 界面设计
- 收集册界面显示所有外观及解锁状态
- 未解锁物品显示剪影和解锁条件
- 新解锁物品有特殊动画效果
- 稀有度用不同颜色和特效区分
- 进度条显示解锁进度

#### 优点
- 增加游戏长期可玩性
- 给玩家明确的目标感
- 增强成就感和收集欲望
- 可结合游戏货币系统

#### 缺点
- 需要平衡解锁难度
- 可能让新玩家感到选择受限
- 需要大量的游戏数据统计

---

## 推荐实现方案

### 分阶段实现建议

1. **第一阶段**: 实现方案一的简单分类换装系统
   - 快速上线，验证玩家对换装功能的接受度
   - 为后续复杂功能打基础

2. **第二阶段**: 在方案一基础上增加方案三的解锁元素
   - 保持界面简洁的同时增加游戏深度
   - 根据玩家反馈调整解锁条件

3. **第三阶段**: 根据需求决定是否实现方案二的高级自定义
   - 如果玩家对自定义需求强烈，则添加更多细节选项
   - 可以作为付费DLC或特殊奖励

### 技术实现要点

1. **数据结构设计**: 使用JSON配置文件存储外观数据，便于维护和扩展
2. **性能优化**: 预加载外观资源，使用缓存减少重复渲染
3. **存储方案**: 使用localStorage保存玩家自定义设置
4. **兼容性**: 确保新系统不影响现有游戏逻辑

### 美术资源需求

- 各种发型的像素艺术图案
- 不同颜色和样式的球衣设计
- 配饰物品的小图标
- 界面UI元素和按钮设计
- 解锁动画和特效素材

这三种方案各有特色，可根据游戏的目标用户群体、开发资源和时间安排来选择最适合的方案。