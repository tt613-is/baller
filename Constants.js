/**
 * 游戏常量定义文件
 * 
 * 设计意图：
 * - 集中管理所有游戏常量，避免魔法数字
 * - 便于游戏平衡性调整和配置管理
 * - 支持配置化和未来的本地化需求
 * - 提供清晰的常量分类和注释
 */

// ===== 游戏核心常量 =====
export const GAME_CONSTANTS = {
    // 游戏胜利条件
    WINNING_SCORE: 50,           // 获胜所需分数
    SCORE_PER_BASKET: 10,        // 进球得分
    SCORE_PER_SHOT: 2,           // 投篮得分
    
    // 动画和时间常量
    ANIMATION_SPEED: 60,         // 动画速度（帧数）
    PARTICLE_LIFETIME: 60,       // 粒子生命周期（帧）
    WALL_FLASH_DURATION: 30,     // 墙壁闪烁持续时间（帧）
    CELEBRATION_DELAY: 3000,     // 庆祝动画延迟（毫秒）
    FIREWORK_INTERVAL: 400,      // 烟花间隔（毫秒）
    
    // 游戏区域尺寸
    CANVAS_WIDTH: 800,           // 画布宽度
    CANVAS_HEIGHT: 600,          // 画布高度
    
    // 玩家相关常量
    PLAYER_SPEED: 3,             // 玩家移动速度
    PLAYER_WIDTH: 40,            // 玩家宽度
    PLAYER_HEIGHT: 50,           // 玩家高度
    
    // 篮筐相关常量
    BASKET_WIDTH: 50,            // 篮筐宽度
    BASKET_HEIGHT: 10,           // 篮筐高度
    
    // 投篮系统常量
    SPACE_BUTTON_INTERVAL: 350,  // 空间按钮间隔（帧）
    MISSED_COUNTDOWN_FRAMES: 120, // 投篮失败倒计时（帧）
    TELEPORT_DURATION: 30,       // 传送效果持续时间（帧）
    
    // 难度调整常量
    DEFENDER_SPEED_INCREASE: 0.1, // 防守者速度增加量
};

// ===== 游戏配置 =====
export const GAME_CONFIG = {
    // 游戏状态枚举
    GAME_STATES: {
        MENU: 'menu',
        PLAYING: 'playing',
        PAUSED: 'paused',
        GAME_OVER: 'gameover',
        WIN: 'win',
        CUSTOMIZATION: 'customization'
    },
    
    // 难度级别
    DIFFICULTY_LEVELS: {
        NORMAL: 'normal',
        HARDCORE: 'hardcore'
    },
    
    // 主题类型
    THEMES: {
        DAY: 'day',
        NIGHT: 'night'
    },
    
    // 投篮阶段
    SHOOTING_PHASES: {
        IDLE: null,
        ANGLE: 'angle',
        POWER: 'power'
    },
    
    // 失败状态
    MISSED_STATES: {
        IDLE: null,
        COUNTDOWN: 'countdown',
        TELEPORT: 'teleport'
    }
};

// ===== 游戏层级设置 =====
export const GAME_LANES = [
    { y: 450, direction: 1, speed: 2 },    // 第一层防守队员
    { y: 350, direction: -1, speed: 1.5 }, // 第二层防守队员
    { y: 250, direction: 1, speed: 1.8 }   // 第三层防守队员
];

// ===== 防守者配置 =====
export const DEFENDER_CONFIG = {
    // 第一排配置（3组，每组3个）
    LANE_0: {
        groupCount: 3,
        playersPerGroup: 3,
        groupSpacing: 250,
        playerSpacing: 40,
        baseX: 100,
        width: 35,
        height: 45
    },
    
    // 第二排配置（标准配置）
    LANE_1: {
        width: 70,  // 第二排加宽
        height: 45
    },
    
    // 第三排配置（4组，每组2个）
    LANE_2: {
        groupCount: 4,
        playersPerGroup: 2,
        groupSpacing: 180,
        playerSpacing: 50,
        baseX: 120,
        width: 35,
        height: 60  // 第三排加高
    }
};

// ===== 外观预设数据 =====
export const APPEARANCE_PRESETS = {
    heads: [
        { 
            name: "Classic", 
            skinColor: "#FFDBAC", 
            hairColor: "#3A2A1A", 
            hairStyle: "classic" 
        },
        { 
            name: "Blonde", 
            skinColor: "#FFDBAC", 
            hairColor: "#FFD700", 
            hairStyle: "spiky" 
        },
        { 
            name: "Dark", 
            skinColor: "#8B4513", 
            hairColor: "#000000", 
            hairStyle: "curly" 
        },
        { 
            name: "Light", 
            skinColor: "#FFEAA7", 
            hairColor: "#FFFFFF", 
            hairStyle: "long" 
        }
    ],
    
    jerseys: [
        { 
            name: "Classic Blue", 
            color1: "#00529B", 
            color2: "#FFD700" 
        },
        { 
            name: "Flame Red", 
            color1: "#FF4444", 
            color2: "#FF8888" 
        },
        { 
            name: "Forest Green", 
            color1: "#228B22", 
            color2: "#90EE90" 
        },
        { 
            name: "Violet", 
            color1: "#8A2BE2", 
            color2: "#DDA0DD" 
        }
    ],
    
    numbers: ["1", "23", "88", "99", "7", "11", "33", "77"]
};

// ===== 按钮配置 =====
export const BUTTON_CONFIG = {
    // 主菜单按钮
    mainMenu: {
        normal: {
            y: 280,
            width: 200,
            height: 60,
            text: 'Normal'
        },
        hardcore: {
            y: 360,
            width: 200,
            height: 60,
            text: 'Hardcore'
        }
    },
    
    // 辅助按钮
    secondary: {
        customize: {
            x: 30,
            width: 120,
            height: 40,
            text: 'Customize'
        },
        themeToggle: {
            width: 100,
            height: 40,
            dayText: 'Day',
            nightText: 'Night'
        }
    },
    
    // 暂停菜单按钮
    pauseMenu: {
        restart: {
            y: 250,
            width: 250,
            height: 50,
            text: 'Restart Game'
        },
        backToMenu: {
            y: 320,
            width: 250,
            height: 50,
            text: 'Back to Menu'
        }
    },
    
    // 自定义界面按钮
    customization: {
        categories: {
            head: {
                x: 50, y: 120, width: 120, height: 40,
                text: 'Head'
            },
            jersey: {
                x: 180, y: 120, width: 120, height: 40,
                text: 'Jersey'
            },
            number: {
                x: 310, y: 120, width: 120, height: 40,
                text: 'Number'
            }
        },
        
        navigation: {
            prev: {
                x: 120, y: 180, width: 80, height: 40,
                text: '< Prev'
            },
            next: {
                x: 280, y: 180, width: 80, height: 40,
                text: 'Next >'
            }
        },
        
        actions: {
            apply: {
                x: 120, y: 560, width: 100, height: 50,
                text: 'Apply'
            },
            cancel: {
                x: 260, y: 560, width: 100, height: 50,
                text: 'Cancel'
            }
        }
    }
};

// ===== 视觉效果配置 =====
export const VISUAL_CONFIG = {
    // 篮筐视觉配置
    hoop: {
        backboard: { 
            width: 100, 
            height: 80, 
            color: 'rgba(255, 255, 255, 0.2)' 
        },
        rim: { 
            radiusX: 30, 
            radiusY: 8, 
            color: '#FF6600' 
        },
        net: { 
            color: '#FFFFFF' 
        }
    },
    
    // 隐形墙配置
    invisibleWall: {
        width: 120,
        height: 60,
        offsetX: 60,
        offsetY: 20
    },
    
    // 空间按钮配置
    spaceButton: {
        width: 80,
        height: 30,
        offsetY: 15
    },
    
    // 投篮系统配置
    shooting: {
        range: Math.PI / 3,      // 扇形范围（60度）
        aimSpeed: 0.05,          // 角度变化速度
        powerSpeed: 0.02,        // 力度指示器移动速度
        maxPowerDistance: 100    // 力度指示器最大距离
    },
    
    // 传送效果配置
    teleportEffect: {
        sourceMaxRadius: 50,
        targetMaxRadius: 50,
        duration: 30
    }
};

// ===== 响应式设计配置 =====
export const RESPONSIVE_CONFIG = {
    // 基准尺寸
    baseWidth: 800,
    baseHeight: 600,
    
    // 边距配置
    margins: {
        default: 30,
        panel: 20
    },
    
    // 断点配置
    breakpoints: {
        large: 1400,
        medium: 1200
    }
};

// ===== 观众席配置 =====
export const AUDIENCE_CONFIG = {
    rows: 2,              // 观众排数
    perRow: 25,           // 每排观众数量
    spacing: 28,          // 观众间距
    baseX: 50,            // 起始X坐标
    baseY: 5,             // 起始Y坐标
    rowHeight: 18,        // 排间距
    
    // 观众尺寸
    width: 24,
    height: 32,
    
    // 缩放配置
    baseScale: 1.2,
    scaleIncrement: 0.1
};

// ===== 性能优化配置 =====
export const PERFORMANCE_CONFIG = {
    // 缓存配置
    cacheEnabled: true,
    maxCacheSize: 100,
    
    // 对象池配置
    poolEnabled: true,
    maxPoolSize: 50,
    
    // 渲染优化
    dirtyRectEnabled: true,
    staticCacheEnabled: true
};

// ===== 本地存储键名 =====
export const STORAGE_KEYS = {
    APPEARANCE: 'basketballGame_appearance',
    SETTINGS: 'basketballGame_settings',
    HIGH_SCORE: 'basketballGame_highScore'
};

// ===== 默认值配置 =====
export const DEFAULT_VALUES = {
    // 默认玩家外观
    playerAppearance: {
        headIndex: 0,
        jerseyIndex: 0,
        numberIndex: 0
    },
    
    // 默认游戏设置
    gameSettings: {
        theme: 'day',
        difficulty: 'normal',
        soundEnabled: true
    },
    
    // 默认玩家位置
    playerPosition: {
        x: 400,  // CANVAS_WIDTH / 2
        y: 520
    }
};

// ===== 调试配置 =====
export const DEBUG_CONFIG = {
    enabled: false,
    showCollisionBoxes: false,
    showPerformanceStats: false,
    logLevel: 'info'  // 'debug', 'info', 'warn', 'error'
};

/**
 * 获取响应式间距配置
 * @param {number} width - 屏幕宽度
 * @param {number} height - 屏幕高度
 * @returns {object} 间距配置对象
 */
export function getResponsiveSpacing(width, height) {
    const widthRatio = width / RESPONSIVE_CONFIG.baseWidth;
    const heightRatio = height / RESPONSIVE_CONFIG.baseHeight;
    const avgRatio = (widthRatio + heightRatio) / 2;
    
    return {
        // 基础间距
        xs: Math.max(4, Math.round(8 * avgRatio)),
        sm: Math.max(8, Math.round(16 * avgRatio)),
        md: Math.max(16, Math.round(24 * avgRatio)),
        lg: Math.max(24, Math.round(32 * avgRatio)),
        xl: Math.max(32, Math.round(48 * avgRatio)),
        
        // 面板相关间距
        panel: {
            margin: Math.max(20, Math.round(width * 0.02)),
            gap: width >= 1400 ? Math.min(80, (width - 600) / 8) : 
                 width >= 1200 ? 60 : 40,
            padding: Math.max(15, Math.round(20 * avgRatio)),
            titleOffset: Math.max(25, Math.round(35 * avgRatio)),
            elementSpacing: Math.max(40, Math.round(50 * avgRatio))
        },
        
        // 按钮相关间距
        button: {
            margin: Math.max(15, Math.round(20 * avgRatio)),
            padding: Math.max(8, Math.round(12 * avgRatio)),
            gap: Math.max(15, Math.round(20 * avgRatio)),
            groupSpacing: Math.max(90, Math.round(120 * avgRatio))
        },
        
        // 文本相关间距
        text: {
            lineHeight: Math.max(20, Math.round(25 * avgRatio)),
            sectionSpacing: Math.max(45, Math.round(60 * avgRatio)),
            labelOffset: Math.max(25, Math.round(30 * avgRatio))
        }
    };
}

/**
 * 获取主题相关的颜色配置
 * @param {string} theme - 主题名称 ('day' 或 'night')
 * @returns {object} 颜色配置对象
 */
export function getThemeColors(theme) {
    const isDay = theme === GAME_CONFIG.THEMES.DAY;
    
    return {
        // 背景色
        background: isDay ? '#87CEEB' : '#000033',
        backgroundGradient: isDay ? 
            'linear-gradient(180deg, #87CEEB 0%, #98FB98 100%)' :
            'linear-gradient(180deg, #000033 0%, #1a1a2e 100%)',
        
        // 文本色
        text: isDay ? '#333' : '#fff',
        textSecondary: isDay ? '#666' : '#ccc',
        
        // 按钮色
        buttonBg: isDay ? '#87CEEB' : '#4CAF50',
        buttonHover: isDay ? '#76bfe0' : '#45a049',
        
        // 边框色
        border: isDay ? '#000' : '#333',
        
        // 特效色
        particle: isDay ? '#FFD700' : '#FF6600',
        flash: isDay ? '#FFF' : '#FF0000'
    };
}