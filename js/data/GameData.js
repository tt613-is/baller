/**
 * 游戏配置和数据 - 集中管理所有游戏配置、预设和常量
 */

// 游戏基础配置
export const GameConfig = {
    // Canvas设置
    canvas: {
        width: 800,
        height: 600
    },
    
    // 游戏规则
    gameplay: {
        winningScore: 50,
        fadeDuration: 30,
        wallFlashDuration: 30
    },
    
    // 玩家配置
    player: {
        size: { width: 40, height: 50 },
        speed: 3,
        startX: 400, // width / 2
        startY: 520,
        animSpeed: 8
    },
    
    // 篮筐配置
    basket: {
        x: 375, // width / 2 - 25
        y: 120,
        width: 50,
        height: 10
    },
    
    // 篮板和篮圈视觉配置
    hoop: {
        x: 400, // width / 2
        y: 120,
        backboard: { width: 100, height: 80, color: 'rgba(255, 255, 255, 0.2)' },
        rim: { radiusX: 30, radiusY: 8, color: '#FF6600' },
        net: { color: '#FFFFFF' }
    },
    
    // 隐形墙配置
    invisibleWall: {
        x: 340, // width / 2 - 60
        y: 100,
        width: 120,
        height: 60
    },
    
    // Space按钮配置
    spaceButton: {
        width: 80,
        height: 30
    },
    
    // 投篮系统配置
    shooting: {
        range: Math.PI / 3, // 60度扇形范围
        aimSpeed: 0.05,
        powerSpeed: 0.02,
        maxPowerDistance: 100
    },
    
    // 游戏层级配置
    lanes: [
        { y: 450, direction: 1, speed: 2 },   // 第一层防守队员
        { y: 350, direction: -1, speed: 1.5 }, // 第二层防守队员
        { y: 250, direction: 1, speed: 1.8 }   // 第三层防守队员
    ],
    
    // 观众席配置
    audience: {
        rows: 2,
        perRow: 25,
        spacing: 28,
        rowSpacing: 18,
        startY: 5,
        cheerDuration: 90
    },
    
    // 星空特效配置
    starField: {
        count: 50,
        maxSize: 3,
        twinkleSpeed: 0.02
    },
    
    // 粒子系统配置
    particles: {
        scoreEffect: {
            count: 15,
            life: 80,
            spreadX: 12,
            spreadY: 15,
            gravity: 0.15,
            size: { min: 2, max: 6 }
        }
    },
    
    // 响应式间距系统
    spacing: {
        baseWidth: 800,
        baseHeight: 600,
        xs: 8, sm: 16, md: 24, lg: 32, xl: 48,
        panel: {
            margin: 20,
            gap: 40,
            padding: 15,
            titleOffset: 35,
            elementSpacing: 50
        },
        button: {
            margin: 20,
            padding: 12,
            gap: 20,
            groupSpacing: 120
        },
        text: {
            lineHeight: 25,
            sectionSpacing: 60,
            labelOffset: 30
        }
    }
};

// 外观预设数据
export const AppearancePresets = {
    heads: [
        { name: "Classic", skinColor: "#FFDBAC", hairColor: "#3A2A1A", hairStyle: "classic" },
        { name: "Blonde", skinColor: "#FFDBAC", hairColor: "#FFD700", hairStyle: "spiky" },
        { name: "Dark", skinColor: "#8B4513", hairColor: "#000000", hairStyle: "curly" },
        { name: "Light", skinColor: "#FFEAA7", hairColor: "#FFFFFF", hairStyle: "long" }
    ],
    jerseys: [
        { name: "Classic Blue", color1: "#00529B", color2: "#FFD700" },
        { name: "Flame Red", color1: "#FF4444", color2: "#FF8888" },
        { name: "Forest Green", color1: "#228B22", color2: "#90EE90" },
        { name: "Violet", color1: "#8A2BE2", color2: "#DDA0DD" }
    ],
    numbers: ["1", "23", "88", "99", "7", "11", "33", "77"]
};

// 颜色主题配置
export const ThemeColors = {
    day: {
        background: {
            sky: ['#87CEEB', '#98FB98'],
            court: ['#CD853F', '#DEB887'],
            wall: ['#8B4513', '#A0522D']
        },
        text: '#333333',
        lines: '#FFFFFF'
    },
    night: {
        background: {
            sky: ['#000033', '#1a1a2e'],
            court: ['#2C3E50', '#34495E'],
            wall: ['#1B2631', '#273746']
        },
        text: '#FFFFFF',
        lines: '#FFFFFF'
    }
};

// 按钮配置
export const ButtonConfig = {
    // 主菜单按钮
    menu: {
        normal: {
            width: 200, height: 60,
            y: 280, text: 'Normal'
        },
        hardcore: {
            width: 200, height: 60,
            y: 360, text: 'Hardcore'
        }
    },
    
    // 辅助按钮
    secondary: {
        customize: {
            width: 120, height: 40,
            text: 'Customize'
        },
        themeToggle: {
            width: 100, height: 40,
            text: 'Day' // 动态更新
        }
    },
    
    // 暂停菜单按钮
    pause: {
        restart: {
            width: 250, height: 50,
            y: 250, text: 'Restart Game'
        },
        backToMenu: {
            width: 250, height: 50,
            y: 320, text: 'Back to Menu'
        }
    },
    
    // 换装界面按钮
    customization: {
        categories: {
            head: { x: 50, y: 120, width: 120, height: 40, text: 'Head' },
            jersey: { x: 180, y: 120, width: 120, height: 40, text: 'Jersey' },
            number: { x: 310, y: 120, width: 120, height: 40, text: 'Number' }
        },
        navigation: {
            prev: { x: 120, y: 180, width: 80, height: 40, text: '< Prev' },
            next: { x: 280, y: 180, width: 80, height: 40, text: 'Next >' }
        },
        actions: {
            apply: { x: 120, y: 560, width: 100, height: 50, text: 'Apply' },
            cancel: { x: 260, y: 560, width: 100, height: 50, text: 'Cancel' }
        }
    }
};

// 防守队员配置
export const DefenderConfig = {
    // 第1排：9个球员，3个3个连在一起
    lane0: {
        groupCount: 3,
        playersPerGroup: 3,
        groupSpacing: 250,
        playerSpacing: 40,
        startX: 100,
        size: { width: 35, height: 45 }
    },
    
    // 第2排：保持原有逻辑
    lane1: {
        count: 4, // 3 + 1
        spacing: 200,
        randomOffset: 100,
        size: { width: 70, height: 45 } // 变胖2倍
    },
    
    // 第3排：8个球员，2个2个手拉手
    lane2: {
        groupCount: 4,
        playersPerGroup: 2,
        groupSpacing: 180,
        playerSpacing: 50,
        startX: 120,
        size: { width: 35, height: 60 } // 变高
    }
};

// 动画配置
export const AnimationConfig = {
    player: {
        frameCount: 4,
        frameSpeed: 8
    },
    audience: {
        frameCount: 3,
        frameSpeed: 15
    },
    stars: {
        count: 50,
        speed: 0.5,
        twinkleSpeed: { min: 0.02, max: 0.03 }
    }
};

// 物理常量
export const PhysicsConfig = {
    gravity: 0.15,
    basketballSize: 8,
    collisionEpsilon: 0.01,
    pushForce: 5,
    teleportDuration: 30,
    countdownFrames: [180, 120, 60] // 3秒，2秒，1秒的帧数
};

// 本地存储键名
export const StorageKeys = {
    PLAYER_APPEARANCE: 'playerAppearance',
    GAME_SETTINGS: 'gameSettings',
    HIGH_SCORE: 'highScore'
};

// 事件名称常量
export const Events = {
    // 游戏状态事件
    STATE_CHANGED: 'stateChanged',
    GAME_STARTED: 'gameStarted',
    GAME_PAUSED: 'gamePaused',
    GAME_OVER: 'gameOver',
    GAME_WON: 'gameWon',
    
    // 游戏逻辑事件
    SCORE_CHANGED: 'scoreChanged',
    PLAYER_COLLISION: 'playerCollision',
    BASKETBALL_SCORED: 'basketballScored',
    BASKETBALL_MISSED: 'basketballMissed',
    
    // UI事件
    BUTTON_CLICKED: 'buttonClicked',
    THEME_CHANGED: 'themeChanged',
    APPEARANCE_CHANGED: 'appearanceChanged',
    
    // 特效事件
    AUDIENCE_CHEER: 'audienceCheer',
    SCREEN_FLASH: 'screenFlash',
    PARTICLE_EFFECT: 'particleEffect'
};

// 错误信息
export const ErrorMessages = {
    CANVAS_NOT_FOUND: 'Canvas element not found',
    CONTEXT_FAILED: 'Failed to get 2D context',
    STATE_NOT_FOUND: 'Game state not found',
    INVALID_CONFIG: 'Invalid configuration',
    STORAGE_FAILED: 'Local storage operation failed'
};