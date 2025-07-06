class FrogBasketballGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.gameRunning = false; // Start with menu instead of game
        this.gameWon = false;
        this.isCelebrating = false;
        this.winningScore = 50; // 达到50分胜利
        this.animationFrame = 0;
        this.theme = 'day'; // 'night' or 'day'
        
        // Game states
        this.gameState = 'menu'; // 'menu', 'playing', 'gameover', 'win', 'paused'
        this.difficulty = 'normal'; // 'normal' or 'hardcore'
        this.previousGameState = null; // Store state before pausing
        
        // Fade transition
        this.fadeState = null; // null, 'fadeOut', 'fadeIn'
        this.fadeAlpha = 0;
        this.fadeCallback = null;
        
        // Menu buttons - main game mode buttons
        this.menuButtons = {
            normal: {
                x: 0, // Will be calculated
                y: 280,
                width: 200,
                height: 60,
                text: 'Normal',
                hover: false
            },
            hardcore: {
                x: 0, // Will be calculated
                y: 360,
                width: 200,
                height: 60,
                text: 'Hardcore',
                hover: false
            }
        };
        
        // Secondary menu buttons - positioned in corners
        this.secondaryButtons = {
            customize: {
                x: 30, // Left bottom corner
                y: 0, // Will be calculated
                width: 120,
                height: 40,
                text: 'Customize',
                hover: false
            },
            themeToggle: {
                x: 0, // Will be calculated - right bottom corner
                y: 0, // Will be calculated
                width: 100,
                height: 40,
                text: this.theme === 'day' ? 'Day' : 'Night',
                hover: false
            }
        };
        
        // Pause menu buttons
        this.pauseMenuButtons = {
            restart: {
                x: 0, // Will be calculated
                y: 250,
                width: 250,
                height: 50,
                text: 'Restart Game',
                hover: false
            },
            backToMenu: {
                x: 0, // Will be calculated
                y: 320,
                width: 250,
                height: 50,
                text: 'Back to Menu',
                hover: false
            }
        };
        
        // 粒子效果系统
        this.particles = [];
        this.scorePopups = [];
        
        // 游戏区域设置
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // 游戏层级设置
        this.lanes = [
            { y: 450, direction: 1, speed: 2 }, // 第一层防守队员
            { y: 350, direction: -1, speed: 1.5 }, // 第二层防守队员
            { y: 250, direction: 1, speed: 1.8 }  // 第三层防守队员
        ];
        
        // --- Space 红色按钮设置 ---
        const dashedY = this.lanes[this.lanes.length - 1].y - 25; // 最后一排虚线的 y
        this.spaceButton = {
            width: 80,
            height: 30,
            x: 0, // 将在 positionSpaceButton 中确定
            y: dashedY - 15 // 让按钮中心对准虚线
        };
        this.spaceButtonSide = Math.random() < 0.5 ? 'left' : 'right';
        this.spaceButtonTimer = 0; // 计时器(帧)
        this.positionSpaceButton();
        
        // --- 投篮系统设置 ---
        this.shootingPhase = null; // 投篮阶段: null | 'angle' | 'power'
        this.aimAngle = 0; // 瞄准角度 (弧度)
        this.aimSpeed = 0.05; // 角度变化速度
        this.basketball = null; // 投出的篮球对象
        this.shootingRange = Math.PI / 3; // 扇形范围 (60度)
        
        // 力度系统
        this.powerIndicator = 0; // 力度指示器位置 (0-1)
        this.powerSpeed = 0.02; // 力度指示器移动速度
        this.powerDirection = 1; // 力度指示器移动方向
        this.lockedAngle = 0; // 锁定的角度
        this.maxPowerDistance = 100; // 力度指示器最大距离
        
        // 响应式间距系统
        this.spacing = this.calculateResponsiveSpacing();
        
        // 外观预设数据
        this.appearancePresets = {
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

        // 玩家设置
        this.player = {
            x: this.width / 2,
            y: 520,
            width: 40,
            height: 50,
            speed: 3,
            animFrame: 0,
            animSpeed: 8,
            dribbling: true,
            // 外观属性
            appearance: {
                headIndex: 0,
                jerseyIndex: 0,
                numberIndex: 0
            },
            // 保持向后兼容的旧属性
            jerseyNumber: '1',
            bodyColor1: '#00529B',
            bodyColor2: '#FFD700'
        };
        
        // 篮筐设置
        this.basket = { // 这个对象现在是得分触发器
            x: this.width / 2 - 25,
            y: 120,
            width: 50,
            height: 10
        };
        
        // 篮板和篮圈的视觉设置
        this.hoop = {
            x: this.width / 2,
            y: 120,
            backboard: { width: 100, height: 80, color: 'rgba(255, 255, 255, 0.2)' },
            rim: { radiusX: 30, radiusY: 8, color: '#FF6600' },
            net: { color: '#FFFFFF' }
        };
        
        // 隐形墙设置 - 在篮筐周围创建一个隐形屏障
        this.invisibleWall = {
            x: this.width / 2 - 60,
            y: 100,
            width: 120,
            height: 60
        };
        
        // 碰撞闪烁效果
        this.wallFlashTime = 0;
        this.wallFlashDuration = 30; // 闪烁持续帧数
        
        // 投篮失败重置效果
        this.missedState = null; // null | 'countdown' | 'teleport'
        this.missedCountdown = 0; // 倒计时（帧数）
        this.missedCountdownValue = 3; // 当前倒计时数字
        this.teleportEffect = {
            sourceCircle: { x: 0, y: 0, radius: 0, maxRadius: 50 },
            targetCircle: { x: 0, y: 0, radius: 100, maxRadius: 50 },
            duration: 30,
            timer: 0
        };
        
        // 观众设置
        this.audience = [];
        this.audienceCheerTime = 0;
        
        // 特效系统
        this.starField = [];
        this.initStarField();
        
        // 防守队员数组
        this.defenders = [];
        this.initDefenders();
        this.initAudience();
        
        // 控制设置
        this.keys = {};
        this.setupControls();
        
        // 换装界面数据
        this.customization = {
            selectedCategory: 'head', // 'head', 'jersey', 'number'
            selectedIndices: {
                head: 0,
                jersey: 0,
                number: 0
            },
            previewPlayer: null
        };

        // 换装界面按钮 - 重新布局
        this.customizationButtons = {
            head: {
                x: 50, y: 120, width: 120, height: 40,
                text: 'Head', hover: false, active: true
            },
            jersey: {
                x: 180, y: 120, width: 120, height: 40,
                text: 'Jersey', hover: false, active: false
            },
            number: {
                x: 310, y: 120, width: 120, height: 40,
                text: 'Number', hover: false, active: false
            },
            prev: {
                x: 120, y: 180, width: 80, height: 40,
                text: '< Prev', hover: false
            },
            next: {
                x: 280, y: 180, width: 80, height: 40,
                text: 'Next >', hover: false
            },
            apply: {
                x: 120, y: 560, width: 100, height: 50,
                text: 'Apply', hover: false
            },
            cancel: {
                x: 260, y: 560, width: 100, height: 50,
                text: 'Cancel', hover: false
            }
        };

        // 从本地存储加载外观设置
        this.loadAppearanceFromStorage();

        // 计算主菜单按钮位置 - 居中
        this.menuButtons.normal.x = this.width / 2 - this.menuButtons.normal.width / 2;
        this.menuButtons.hardcore.x = this.width / 2 - this.menuButtons.hardcore.width / 2;
        
        // 计算辅助按钮位置 - 响应式定位
        const margin = 30;
        this.secondaryButtons.customize.x = margin; // 左下角，保持边距
        this.secondaryButtons.customize.y = this.height - this.secondaryButtons.customize.height - margin;
        
        this.secondaryButtons.themeToggle.x = this.width - this.secondaryButtons.themeToggle.width - margin; // 右下角，保持边距
        this.secondaryButtons.themeToggle.y = this.height - this.secondaryButtons.themeToggle.height - margin;
        
        // 计算暂停菜单按钮位置
        this.pauseMenuButtons.restart.x = this.width / 2 - this.pauseMenuButtons.restart.width / 2;
        this.pauseMenuButtons.backToMenu.x = this.width / 2 - this.pauseMenuButtons.backToMenu.width / 2;
        
        // 开始游戏循环
        this.gameLoop();
    }
    
    calculateResponsiveSpacing() {
        // 基于屏幕尺寸计算响应式间距
        const baseWidth = 800;  // 基准宽度
        const baseHeight = 600; // 基准高度
        
        const widthRatio = this.width / baseWidth;
        const heightRatio = this.height / baseHeight;
        const avgRatio = (widthRatio + heightRatio) / 2;
        
        return {
            // 基础间距
            xs: Math.max(4, Math.round(8 * avgRatio)),    // 4-12px
            sm: Math.max(8, Math.round(16 * avgRatio)),   // 8-24px  
            md: Math.max(16, Math.round(24 * avgRatio)),  // 16-36px
            lg: Math.max(24, Math.round(32 * avgRatio)),  // 24-48px
            xl: Math.max(32, Math.round(48 * avgRatio)),  // 32-72px
            
            // 面板相关间距
            panel: {
                margin: Math.max(20, Math.round(this.width * 0.02)),     // 动态边距
                gap: this.width >= 1400 ? Math.min(80, (this.width - 600) / 8) : 
                     this.width >= 1200 ? 60 : 40,                       // 面板间距
                padding: Math.max(15, Math.round(20 * avgRatio)),        // 内边距
                titleOffset: Math.max(25, Math.round(35 * avgRatio)),    // 标题偏移
                elementSpacing: Math.max(40, Math.round(50 * avgRatio))  // 元素间距
            },
            
            // 按钮相关间距
            button: {
                margin: Math.max(15, Math.round(20 * avgRatio)),         // 按钮外边距
                padding: Math.max(8, Math.round(12 * avgRatio)),         // 按钮内边距
                gap: Math.max(15, Math.round(20 * avgRatio)),            // 按钮间距
                groupSpacing: Math.max(90, Math.round(120 * avgRatio))   // 按钮组间距
            },
            
            // 文本相关间距
            text: {
                lineHeight: Math.max(20, Math.round(25 * avgRatio)),     // 行高
                sectionSpacing: Math.max(45, Math.round(60 * avgRatio)), // 段落间距
                labelOffset: Math.max(25, Math.round(30 * avgRatio))     // 标签偏移
            }
        };
    }
    
    setTheme(theme) {
        this.theme = theme;
        
        // Update button text if secondary buttons exist
        if (this.secondaryButtons && this.secondaryButtons.themeToggle) {
            this.secondaryButtons.themeToggle.text = this.theme === 'day' ? 'Day' : 'Night';
        }
        
        // Update HTML theme class
        if (this.theme === 'day') {
            document.body.classList.add('day-theme');
        } else {
            document.body.classList.remove('day-theme');
        }
    }
    
    initDefenders() {
        this.lanes.forEach((lane, laneIndex) => {
            if (laneIndex === 0) {
                // 第1排：9个球员，3个3个连在一起
                const groupCount = 3; // 3组
                const playersPerGroup = 3; // 每组3个
                for (let group = 0; group < groupCount; group++) {
                    for (let i = 0; i < playersPerGroup; i++) {
                        this.defenders.push({
                            x: (group * 250) + (i * 40) + 100, // 组间距离250，组内间距40
                            y: lane.y,
                            width: 35,
                            height: 45,
                            speed: lane.speed,
                            direction: lane.direction,
                            laneIndex: laneIndex,
                            groupIndex: group,
                            playerInGroup: i,
                            color: `hsl(${120 + laneIndex * 60}, 70%, 50%)`,
                            jerseyNumber: Math.floor(Math.random() * 100), // 随机球衣号码
                            animOffset: Math.random() * 10 // 动画随机偏移
                        });
                    }
                }
            } else if (laneIndex === 2) {
                // 第3排：8个球员，2个2个手拉手
                const groupCount = 4; // 4组
                const playersPerGroup = 2; // 每组2个
                for (let group = 0; group < groupCount; group++) {
                    for (let i = 0; i < playersPerGroup; i++) {
                        this.defenders.push({
                            x: (group * 180) + (i * 50) + 120, // 组间距离180，组内间距50
                            y: lane.y,
                            width: 35,
                            height: 60, // 第3排变高
                            speed: lane.speed,
                            direction: lane.direction,
                            laneIndex: laneIndex,
                            groupIndex: group,
                            playerInGroup: i,
                            color: `hsl(${120 + laneIndex * 60}, 70%, 50%)`,
                            jerseyNumber: Math.floor(Math.random() * 100), // 随机球衣号码
                            animOffset: Math.random() * 10 // 动画随机偏移
                        });
                    }
                }
            } else {
                // 第2排：保持原有逻辑
                const defenderCount = 3 + laneIndex; // 每层防守队员数量递增
                for (let i = 0; i < defenderCount; i++) {
                    this.defenders.push({
                        x: (i * 200) + Math.random() * 100,
                        y: lane.y,
                        width: laneIndex === 1 ? 70 : 35, // 第2排（laneIndex=1）变胖2倍
                        height: 45,
                        speed: lane.speed,
                        direction: lane.direction,
                        laneIndex: laneIndex,
                        color: `hsl(${120 + laneIndex * 60}, 70%, 50%)`,
                        jerseyNumber: Math.floor(Math.random() * 100), // 随机球衣号码
                        animOffset: Math.random() * 10 // 动画随机偏移
                    });
                }
            }
        });
    }
    
    initAudience() {
        // 创建后两排观众，向上移动为篮筐上方留出空间
        const audienceRows = 2; // 从4排减少到2排
        const audiencePerRow = 25;
        
        for (let row = 0; row < audienceRows; row++) {
            for (let i = 0; i < audiencePerRow; i++) {
                this.audience.push({
                    x: 50 + (i * 28),
                    y: 5 + (row * 18), // 向上移动观众席，为篮筐上方留出更多空间
                    width: 24,
                    height: 32,
                    cheerFrame: 0,
                    baseY: 5 + (row * 18),
                    scale: 1.2 + (row * 0.1), // 调整缩放比例，让后排观众更明显
                    color: `hsl(${Math.random() * 360}, 70%, ${50 + Math.random() * 30}%)`,
                    shirtColor: `hsl(${Math.random() * 360}, 80%, ${40 + Math.random() * 20}%)`
                });
            }
        }
    }
    
    updateAudience() {
        if (this.audienceCheerTime > 0) {
            this.audienceCheerTime--;
            // 更新观众欢呼动画
            this.audience.forEach(spectator => {
                if (this.animationFrame % 15 === 0) {
                    spectator.cheerFrame = (spectator.cheerFrame + 1) % 3;
                }
            });
        }
    }
    
    triggerAudienceCheer() {
        this.audienceCheerTime = 90; // 欢呼持续90帧
    }
    
    drawAudience() {
        this.audience.forEach(spectator => {
            const isCheeringOffset = this.audienceCheerTime > 0 ? 
                Math.sin(this.animationFrame * 0.3 + spectator.x * 0.1) * 6 : 0;
            
            const size = spectator.scale;
            const baseWidth = 20 * size;
            const baseHeight = 28 * size;
            
            // 身体
            this.ctx.fillStyle = spectator.shirtColor;
            this.ctx.fillRect(
                spectator.x + 4 * size, 
                spectator.y + 12 * size + isCheeringOffset, 
                baseWidth - 8 * size, 
                baseHeight - 12 * size
            );
            
            // 头部
            this.ctx.fillStyle = spectator.color;
            this.ctx.beginPath();
            this.ctx.arc(
                spectator.x + baseWidth/2, 
                spectator.y + 8 * size + isCheeringOffset, 
                7 * size, 
                0, 
                Math.PI * 2
            );
            this.ctx.fill();
            
            // 眼睛
            this.ctx.fillStyle = '#000';
            this.ctx.beginPath();
            this.ctx.arc(spectator.x + baseWidth/2 - 2*size, spectator.y + 7*size + isCheeringOffset, 1*size, 0, Math.PI * 2);
            this.ctx.arc(spectator.x + baseWidth/2 + 2*size, spectator.y + 7*size + isCheeringOffset, 1*size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 如果在欢呼，画举起的手臂和嘴巴
            if (this.audienceCheerTime > 0) {
                // 手臂
                this.ctx.strokeStyle = spectator.color;
                this.ctx.lineWidth = 3 * size;
                this.ctx.beginPath();
                // 左臂
                this.ctx.moveTo(spectator.x + 6*size, spectator.y + 16*size);
                this.ctx.lineTo(spectator.x + 2*size, spectator.y + 4*size + isCheeringOffset);
                // 右臂
                this.ctx.moveTo(spectator.x + baseWidth - 6*size, spectator.y + 16*size);
                this.ctx.lineTo(spectator.x + baseWidth - 2*size, spectator.y + 4*size + isCheeringOffset);
                this.ctx.stroke();
                
                // 张开的嘴巴
                this.ctx.fillStyle = '#8B0000';
                this.ctx.beginPath();
                this.ctx.arc(spectator.x + baseWidth/2, spectator.y + 10*size + isCheeringOffset, 2*size, 0, Math.PI);
                this.ctx.fill();
            }
        });
    }
    
    initStarField() {
        // 创建背景星空
        for (let i = 0; i < 100; i++) {
            this.starField.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2 + 1,
                opacity: Math.random() * 0.8 + 0.2,
                twinkleSpeed: Math.random() * 0.02 + 0.01
            });
        }
    }
    
    updateStarField() {
        // 更新星星闪烁
        this.starField.forEach(star => {
            star.opacity += Math.sin(this.animationFrame * star.twinkleSpeed) * 0.01;
            star.opacity = Math.max(0.2, Math.min(1, star.opacity));
        });
    }
    
    createFireworks() {
        // 创建烟花效果
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.basket.x + this.basket.width / 2,
                y: this.basket.y,
                vx: (Math.random() - 0.5) * 12,
                vy: Math.random() * -12 - 3,
                life: 80,
                maxLife: 80,
                color: `hsl(${Math.random() * 360}, 100%, 60%)`,
                size: Math.random() * 4 + 2,
                gravity: 0.15
            });
        }
    }
    
    drawStarField() {
        this.starField.forEach(star => {
            this.ctx.save();
            this.ctx.globalAlpha = star.opacity;
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }
    
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            // ESC键处理 - 暂停/恢复游戏
            if (e.key === 'Escape') {
                if (this.gameState === 'playing' && this.fadeState === null) {
                    this.pauseGame();
                } else if (this.gameState === 'paused') {
                    this.resumeGame();
                }
                e.preventDefault();
            }
            
            // 空格键按下处理
            if (e.key === ' ' && this.gameState === 'playing') {
                if (this.shootingPhase === null && this.isPlayerInSpaceButtonArea()) {
                    // 第一阶段：开始角度选择
                    this.shootingPhase = 'angle';
                    this.aimAngle = -this.shootingRange / 2; // 从左边开始
                    e.preventDefault();
                } else if (this.shootingPhase === 'power') {
                    // 第三阶段：确认力度并投篮（瞄准过程中不受按钮位置影响）
                    this.shoot();
                    this.resetShooting();
                    e.preventDefault();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            
            // 空格键松开处理
            if (e.key === ' ' && this.shootingPhase === 'angle' && this.gameState === 'playing') {
                // 第二阶段：锁定角度，开始力度选择
                this.lockedAngle = this.aimAngle;
                this.shootingPhase = 'power';
                this.powerIndicator = 0;
                e.preventDefault();
            }
        });
        
        // Mouse move event for button hover
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            if (this.gameState === 'menu') {
                // Check hover state for main menu buttons
                Object.keys(this.menuButtons).forEach(key => {
                    const btn = this.menuButtons[key];
                    btn.hover = x >= btn.x && x <= btn.x + btn.width &&
                               y >= btn.y && y <= btn.y + btn.height;
                });
                
                // Check hover state for secondary buttons
                Object.keys(this.secondaryButtons).forEach(key => {
                    const btn = this.secondaryButtons[key];
                    btn.hover = x >= btn.x && x <= btn.x + btn.width &&
                               y >= btn.y && y <= btn.y + btn.height;
                });
            } else if (this.gameState === 'paused') {
                // Check hover state for pause menu buttons
                Object.keys(this.pauseMenuButtons).forEach(key => {
                    const btn = this.pauseMenuButtons[key];
                    btn.hover = x >= btn.x && x <= btn.x + btn.width &&
                               y >= btn.y && y <= btn.y + btn.height;
                });
            } else if (this.gameState === 'customization') {
                // Check hover state for customization buttons
                Object.keys(this.customizationButtons).forEach(key => {
                    const btn = this.customizationButtons[key];
                    btn.hover = x >= btn.x && x <= btn.x + btn.width &&
                               y >= btn.y && y <= btn.y + btn.height;
                });
            }
        });
        
        // Mouse click event
        this.canvas.addEventListener('click', (e) => {
            if (this.fadeState !== null) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            if (this.gameState === 'menu') {
                // Check main menu button clicks
                Object.keys(this.menuButtons).forEach(key => {
                    const btn = this.menuButtons[key];
                    if (x >= btn.x && x <= btn.x + btn.width &&
                        y >= btn.y && y <= btn.y + btn.height) {
                        this.onMenuButtonClick(key);
                    }
                });
                
                // Check secondary button clicks
                Object.keys(this.secondaryButtons).forEach(key => {
                    const btn = this.secondaryButtons[key];
                    if (x >= btn.x && x <= btn.x + btn.width &&
                        y >= btn.y && y <= btn.y + btn.height) {
                        this.onSecondaryButtonClick(key);
                    }
                });
            } else if (this.gameState === 'paused') {
                // Check pause menu button clicks
                Object.keys(this.pauseMenuButtons).forEach(key => {
                    const btn = this.pauseMenuButtons[key];
                    if (x >= btn.x && x <= btn.x + btn.width &&
                        y >= btn.y && y <= btn.y + btn.height) {
                        this.onPauseMenuButtonClick(key);
                    }
                });
            } else if (this.gameState === 'customization') {
                // Check customization button clicks
                Object.keys(this.customizationButtons).forEach(key => {
                    const btn = this.customizationButtons[key];
                    if (x >= btn.x && x <= btn.x + btn.width &&
                        y >= btn.y && y <= btn.y + btn.height) {
                        this.onCustomizationButtonClick(key);
                    }
                });
            }
        });
    }
    
    resetShooting() {
        this.shootingPhase = null;
        this.aimAngle = 0;
        this.lockedAngle = 0;
        this.powerIndicator = 0;
        this.powerDirection = 1;
    }
    
    onMenuButtonClick(buttonKey) {
        // Handle main menu buttons (Normal, Hardcore)
            this.difficulty = buttonKey;
            this.startFadeTransition(() => {
                this.startGame();
            });
    }
    
    onSecondaryButtonClick(buttonKey) {
        if (buttonKey === 'customize') {
            this.gameState = 'customization';
            this.initCustomization();
        } else if (buttonKey === 'themeToggle') {
            // Toggle theme
            this.theme = this.theme === 'day' ? 'night' : 'day';
            this.secondaryButtons.themeToggle.text = this.theme === 'day' ? 'Day' : 'Night';
            
            // Update HTML theme class
            if (this.theme === 'day') {
                document.body.classList.add('day-theme');
            } else {
                document.body.classList.remove('day-theme');
            }
        }
    }
    
    pauseGame() {
        this.previousGameState = this.gameState;
        this.gameState = 'paused';
        this.gameRunning = false;
    }
    
    resumeGame() {
        this.gameState = this.previousGameState || 'playing';
        this.gameRunning = true;
        this.previousGameState = null;
    }
    
    onPauseMenuButtonClick(buttonKey) {
        if (buttonKey === 'restart') {
            this.startFadeTransition(() => {
                this.restartGameFromPause();
            });
        } else if (buttonKey === 'backToMenu') {
            this.startFadeTransition(() => {
                this.backToMenuFromPause();
            });
        }
    }
    
    restartGameFromPause() {
        this.gameState = 'playing';
        this.gameRunning = true;
        this.score = 0;
        this.animationFrame = 0;
        document.getElementById('score').textContent = '0';
        
        // Reset all game elements
        this.player.x = this.width / 2;
        this.player.y = 520;
        this.defenders = [];
        this.initDefenders();
        this.particles = [];
        this.scorePopups = [];
        this.audienceCheerTime = 0;
        this.resetShooting();
        this.basketball = null;
        this.wallFlashTime = 0;
        this.missedState = null;
        this.spaceButtonTimer = 0;
        this.spaceButtonSide = Math.random() < 0.5 ? 'left' : 'right';
        this.positionSpaceButton();
    }
    
    backToMenuFromPause() {
        this.gameState = 'menu';
        this.gameRunning = false;
        this.score = 0;
        this.animationFrame = 0;
        document.getElementById('score').textContent = '0';
        
        // Reset pause menu button hover states
        Object.keys(this.pauseMenuButtons).forEach(key => {
            this.pauseMenuButtons[key].hover = false;
        });
        
        // Reset main menu button hover states
        Object.keys(this.menuButtons).forEach(key => {
            this.menuButtons[key].hover = false;
        });
    }
    
    startFadeTransition(callback) {
        this.fadeState = 'fadeOut';
        this.fadeAlpha = 0;
        this.fadeCallback = callback;
    }
    
    updateFadeTransition() {
        if (this.fadeState === 'fadeOut') {
            this.fadeAlpha += 0.05;
            if (this.fadeAlpha >= 1) {
                this.fadeAlpha = 1;
                this.fadeState = 'fadeIn';
                if (this.fadeCallback) {
                    this.fadeCallback();
                    this.fadeCallback = null;
                }
            }
        } else if (this.fadeState === 'fadeIn') {
            this.fadeAlpha -= 0.05;
            if (this.fadeAlpha <= 0) {
                this.fadeAlpha = 0;
                this.fadeState = null;
            }
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.gameRunning = true;
        this.score = 0;
        this.animationFrame = 0;
        document.getElementById('score').textContent = '0';
        
        // Reset all game elements
        this.player.x = this.width / 2;
        this.player.y = 520;
        this.defenders = [];
        this.initDefenders();
        this.particles = [];
        this.scorePopups = [];
        this.audienceCheerTime = 0;
        this.resetShooting();
        
        // Apply difficulty settings
        if (this.difficulty === 'hardcore') {
            // Hardcore mode settings will be added later
        }
    }
    
    update() {
        // Update fade transition
        this.updateFadeTransition();
        
        // Update based on game state
        if (this.gameState === 'menu') {
            // Menu animations
            this.animationFrame++;
            return;
        }
        
        if (this.gameState === 'paused') {
            // Pause menu animations only
            this.animationFrame++;
            return;
        }
        
        // 更新 Space 按钮计时器（即使游戏暂停也继续计时）
        this.updateSpaceButton();

        if (!this.gameRunning && !this.isCelebrating) return;
        
        // 视觉效果在游戏运行或庆祝时持续更新
        this.updateParticles();
        this.updateAudience();
        if (this.theme === 'night') {
            this.updateStarField();
        }

        // 核心游戏逻辑仅在游戏进行时更新
        if (this.gameRunning) {
            this.updatePlayer();
            this.updateDefenders();
            this.checkCollisions();
            this.checkScoring();
        }
        
        // 更新投篮相关逻辑
        this.updateShooting();
        
        // 更新墙壁闪烁时间
        if (this.wallFlashTime > 0) {
            this.wallFlashTime--;
        }
        
        // 更新投篮失败重置效果
        this.updateMissedEffect();
        
        this.animationFrame++;
    }
    
    updatePlayer() {
        // 在投篮失败重置期间，玩家不能移动
        if (this.missedState !== null) {
            return;
        }
        
        // 左右移动 (Arrow keys + WASD)
        if ((this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) && this.player.x > 0) {
            this.player.x -= this.player.speed;
        }
        if ((this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) && this.player.x < this.width - this.player.width) {
            this.player.x += this.player.speed;
        }
        
        // 上下移动 (Arrow keys + WASD)
        if ((this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) && this.player.y > 80) {
            this.player.y -= this.player.speed;
        }
        if ((this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) && this.player.y < this.height - this.player.height - 20) {
            this.player.y += this.player.speed;
        }
        
        // 更新动画帧
        if (this.animationFrame % this.player.animSpeed === 0) {
            this.player.animFrame = (this.player.animFrame + 1) % 4;
        }
    }
    
    updateDefenders() {
        this.defenders.forEach(defender => {
            // 水平移动
            defender.x += defender.speed * defender.direction;
            
            // 边界反弹
            if (defender.x <= 0 || defender.x >= this.width - defender.width) {
                defender.direction *= -1;
            }
        });
    }
    
    checkCollisions() {
        // 检查与防守队员的碰撞
        this.defenders.forEach(defender => {
            if (this.isColliding(this.player, defender)) {
                this.gameOver();
            }
        });
        
        // 检查与隐形墙的碰撞
        if (this.isColliding(this.player, this.invisibleWall)) {
            // 阻止玩家继续前进 - 将玩家推回
            const playerCenterX = this.player.x + this.player.width / 2;
            const playerCenterY = this.player.y + this.player.height / 2;
            const wallCenterX = this.invisibleWall.x + this.invisibleWall.width / 2;
            const wallCenterY = this.invisibleWall.y + this.invisibleWall.height / 2;
            
            // 计算推回方向
            const dx = playerCenterX - wallCenterX;
            const dy = playerCenterY - wallCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                // 将玩家推离墙壁
                this.player.x += (dx / distance) * 5;
                this.player.y += (dy / distance) * 5;
            }
            
            // 触发闪烁效果
            if (this.wallFlashTime <= 0) {
                this.wallFlashTime = this.wallFlashDuration;
            }
        }
    }
    
    checkScoring() {
        // 检查玩家是否到达篮筐
        if (this.isColliding(this.player, this.basket)) {
            // 庆祝期间防止重复计分和重置
            if (this.isCelebrating) return;

            this.score += 10;
            document.getElementById('score').textContent = this.score;
            
            // 共同的庆祝效果
            this.createScoreEffect(this.basket.x + this.basket.width / 2, this.basket.y);
            this.triggerAudienceCheer();
            this.createFireworks();
            
            this.increaseDifficulty();

            // 检查是否达到胜利分数
            if (this.score >= this.winningScore) {
                this.isCelebrating = true;
                this.gameRunning = false; // 暂停核心游戏逻辑
                
                // 获胜时，玩家停在篮下庆祝，不再重置位置
                
                // 来一波更盛大的烟花庆祝
                for(let i = 0; i < 5; i++) {
                    setTimeout(() => this.createFireworks(), i * 400);
                }
                
                // 3秒后触发胜利画面
                setTimeout(() => {
                    this.winGame();
                }, 3000);
            } else {
                 // 如果未胜利，则正常重置玩家位置继续游戏
                 this.player.x = this.width / 2;
                 this.player.y = 520;
            }
        }
    }
    
    increaseDifficulty() {
        // 随着得分增加，防守队员移动速度加快
        this.defenders.forEach(defender => {
            defender.speed += 0.1;
        });
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    createScoreEffect(x, y) {
        // 创建得分粒子效果
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: Math.random() * -8 - 2,
                life: 60,
                maxLife: 60,
                color: `hsl(${Math.random() * 60 + 30}, 80%, 60%)`
            });
        }
        
        // 添加得分文字
        this.scorePopups.push({
            x: x,
            y: y,
            text: '+10',
            life: 60,
            vy: -2
        });
        
        // 播放得分音效（模拟）
        this.playSound('score');
    }
    
    updateParticles() {
        // 更新粒子
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            if (particle.gravity) {
                particle.vy += particle.gravity;
            } else {
                particle.vy += 0.3; // 默认重力
            }
            particle.life--;
            return particle.life > 0;
        });
        
        // 更新得分文字
        this.scorePopups = this.scorePopups.filter(popup => {
            popup.y += popup.vy;
            popup.life--;
            return popup.life > 0;
        });
    }
    
    playSound(type) {
        // 模拟音效（由于是纯前端实现，这里用视觉反馈代替）
        switch (type) {
            case 'score':
                // 创建屏幕闪烁效果
                this.canvas.style.filter = 'brightness(1.3)';
                setTimeout(() => {
                    this.canvas.style.filter = 'none';
                }, 100);
                break;
            case 'collision':
                // 创建震动效果
                this.canvas.style.transform = 'translateX(5px)';
                setTimeout(() => {
                    this.canvas.style.transform = 'translateX(-5px)';
                    setTimeout(() => {
                        this.canvas.style.transform = 'none';
                    }, 50);
                }, 50);
                break;
        }
    }
    
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        if (this.gameState === 'menu') {
            this.drawMainMenu();
        } else if (this.gameState === 'paused') {
            // Draw game in background
            this.drawGameScene();
            // Draw pause menu overlay
            this.drawPauseMenu();
        } else if (this.gameState === 'customization') {
            this.drawCustomizationMenu();
        } else {
            this.drawGameScene();
        }
        
        // Draw fade overlay
        if (this.fadeAlpha > 0) {
            this.ctx.fillStyle = `rgba(0, 0, 0, ${this.fadeAlpha})`;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
    }
    
    drawBackground() {
        if (this.theme === 'night') {
            // 绘制渐变夜空背景
            const gradient = this.ctx.createRadialGradient(
                this.width/2, this.height/4, 0,
                this.width/2, this.height/4, this.width
            );
            gradient.addColorStop(0, '#1a1a2e'); // 深紫色中心
            gradient.addColorStop(0.5, '#16213e'); // 深蓝色
            gradient.addColorStop(1, '#0f0f23'); // 深夜色
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.width, this.height);
            
            // 绘制球场地面
            const courtGradient = this.ctx.createLinearGradient(0, this.height * 0.6, 0, this.height);
            courtGradient.addColorStop(0, '#2d5016'); // 深绿色
            courtGradient.addColorStop(1, '#1a3009'); // 更深的绿色
            
            this.ctx.fillStyle = courtGradient;
            this.ctx.fillRect(0, this.height * 0.6, this.width, this.height * 0.4);
            
            // 绘制发光的车道线
            this.ctx.shadowColor = '#00FFFF';
            this.ctx.shadowBlur = 10;
            this.ctx.strokeStyle = '#00FFFF';
            this.ctx.lineWidth = 3;
            this.lanes.forEach(lane => {
                this.ctx.beginPath();
                this.ctx.moveTo(0, lane.y + 25);
                this.ctx.lineTo(this.width, lane.y + 25);
                this.ctx.stroke();
                
                // 绘制发光虚线
                this.ctx.setLineDash([15, 15]);
                this.ctx.beginPath();
                this.ctx.moveTo(0, lane.y - 25);
                this.ctx.lineTo(this.width, lane.y - 25);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            });
            
            // 重置阴影
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
        } else {
            // Day theme - 室内篮球场风格
            // 绘制室内背景墙 - 木质风格
            const wallGradient = this.ctx.createLinearGradient(0, 0, 0, this.height * 0.6);
            wallGradient.addColorStop(0, '#DEB887'); // 浅木色
            wallGradient.addColorStop(1, '#D2B48C'); // 棕褐色
            
            this.ctx.fillStyle = wallGradient;
            this.ctx.fillRect(0, 0, this.width, this.height * 0.6);

            // 绘制篮球场木地板 - 参考图片配色
            const courtGradient = this.ctx.createLinearGradient(0, this.height * 0.6, 0, this.height);
            courtGradient.addColorStop(0, '#CD853F'); // 秘鲁色 - 更接近真实篮球场
            courtGradient.addColorStop(1, '#A0522D'); // 黄褐色
            
            this.ctx.fillStyle = courtGradient;
            this.ctx.fillRect(0, this.height * 0.6, this.width, this.height * 0.4);

            // 绘制木地板纹理线条
            this.ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)'; // 半透明的深褐色
            this.ctx.lineWidth = 1;
            for (let i = 0; i < this.width; i += 60) {
                this.ctx.beginPath();
                this.ctx.moveTo(i, this.height * 0.6);
                this.ctx.lineTo(i, this.height);
                this.ctx.stroke();
            }

            // 绘制球场线条 - 经典白色
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 4;
            this.lanes.forEach(lane => {
                this.ctx.beginPath();
                this.ctx.moveTo(0, lane.y + 25);
                this.ctx.lineTo(this.width, lane.y + 25);
                this.ctx.stroke();
                
                this.ctx.setLineDash([10, 10]);
                this.ctx.beginPath();
                this.ctx.moveTo(0, lane.y - 25);
                this.ctx.lineTo(this.width, lane.y - 25);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            });
        }
    }
    
    drawBasket() {
        const hoop = this.hoop;
        
        // 绘制篮板 - 根据主题调整颜色
        const backboardColor = this.theme === 'day' ? 'rgba(255, 255, 255, 0.9)' : hoop.backboard.color;
        this.ctx.fillStyle = backboardColor;
        this.ctx.shadowColor = this.theme === 'day' ? 'rgba(0, 0, 0, 0.3)' : '#FFFFFF';
        this.ctx.shadowBlur = 10;
        this.ctx.fillRect(hoop.x - hoop.backboard.width / 2, hoop.y - hoop.backboard.height + 30, hoop.backboard.width, hoop.backboard.height);
        
        // 绘制篮板内框
        const frameColor = this.theme === 'day' ? 'rgba(255, 0, 0, 0.8)' : 'rgba(255, 0, 0, 0.5)';
        this.ctx.strokeStyle = frameColor;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(hoop.x - 30, hoop.y - 25, 60, 40);
        this.ctx.shadowBlur = 0;

        // 绘制篮筐支架
        this.ctx.fillStyle = '#666666';
        this.ctx.beginPath();
        this.ctx.moveTo(hoop.x, hoop.y + 10);
        this.ctx.lineTo(hoop.x - 10, hoop.y + 20);
        this.ctx.lineTo(hoop.x + 10, hoop.y + 20);
        this.ctx.closePath();
        this.ctx.fill();

        // 绘制篮圈（椭圆）- 根据主题调整颜色
        const rimColor = this.theme === 'day' ? '#FF4500' : hoop.rim.color; // 白天使用橙红色
        this.ctx.fillStyle = rimColor;
        this.ctx.shadowColor = rimColor;
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.ellipse(hoop.x, hoop.y, hoop.rim.radiusX, hoop.rim.radiusY, 0, 0, Math.PI * 2);
        this.ctx.fill();
        const strokeColor = this.theme === 'day' ? '#B22222' : '#FFD700'; // 白天使用深红色描边
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // 绘制更逼真的篮网
        this.ctx.shadowColor = hoop.net.color;
        this.ctx.shadowBlur = 8;
        this.ctx.strokeStyle = hoop.net.color;
        this.ctx.lineWidth = 1.5;

        const netBottomY = hoop.y + 40;
        for (let i = 0; i <= 8; i++) {
            const angle = (i / 8) * Math.PI;
            const startX = hoop.x + Math.cos(angle) * hoop.rim.radiusX;
            const endX = hoop.x + Math.cos(angle) * (hoop.rim.radiusX * 0.5);

            // 绘制纵向网线
            if (i > 0 && i < 8) {
                 this.ctx.beginPath();
                 this.ctx.moveTo(startX, hoop.y);
                 this.ctx.quadraticCurveTo(startX, hoop.y + 20, endX, netBottomY);
                 this.ctx.stroke();
            }
        }
        
        // 绘制横向网线
        this.ctx.beginPath();
        this.ctx.moveTo(hoop.x - hoop.rim.radiusX, hoop.y);
        this.ctx.quadraticCurveTo(hoop.x, hoop.y + 15, hoop.x + hoop.rim.radiusX, hoop.y);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(hoop.x - hoop.rim.radiusX * 0.7, hoop.y + 20);
        this.ctx.quadraticCurveTo(hoop.x, hoop.y + 35, hoop.x + hoop.rim.radiusX * 0.7, hoop.y + 20);
        this.ctx.stroke();


        // 重置阴影
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
    }
    
    // --- 辅助方法：绘制圆角矩形 ---
    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawPlayer() {
        const p = this.player;
        this.drawPlayerWithAppearance(p.x, p.y, p.appearance);
    }

    drawPlayerWithAppearance(x, y, appearance) {
        this.drawPlayerWithAppearanceScaled(x, y, appearance, 1.0);
    }

    drawPlayerWithAppearanceScaled(x, y, appearance, scale) {
        const bodyY = y + 12 * scale;

        // 获取当前外观配置
        const headConfig = this.appearancePresets.heads[appearance.headIndex];
        const jerseyConfig = this.appearancePresets.jerseys[appearance.jerseyIndex];
        const numberConfig = this.appearancePresets.numbers[appearance.numberIndex];

        // 绘制身体（带渐变色和圆角）
        const gradient = this.ctx.createLinearGradient(x, bodyY, x, bodyY + 35 * scale);
        gradient.addColorStop(0, jerseyConfig.color1);
        gradient.addColorStop(1, jerseyConfig.color2);
        this.ctx.fillStyle = gradient;
        this.roundRect(x + 5 * scale, bodyY, 30 * scale, 35 * scale, 8 * scale);

        // 绘制球衣号码
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = `bold ${16 * scale}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(numberConfig, x + 20 * scale, y + 35 * scale);

        // 绘制头部
        this.ctx.fillStyle = headConfig.skinColor;
        this.ctx.beginPath();
        this.ctx.arc(x + 20 * scale, y + 8 * scale, 12 * scale, 0, Math.PI * 2);
        this.ctx.fill();

        // 绘制头发（不同发型）
        this.ctx.fillStyle = headConfig.hairColor;
        this.drawHairStyleScaled(x + 20 * scale, y + 5 * scale, headConfig.hairStyle, scale);

        // 运球动画 (0.7倍速)
        const ballOffset = Math.sin(this.animationFrame * (Math.PI / (30 / this.player.animSpeed)) * 0.7) * 10 * scale;
        const ballX = x + 40 * scale;
        const ballY = y + 35 * scale + ballOffset;

        // 篮球
        this.ctx.fillStyle = '#FF8C00';
        this.ctx.beginPath();
        this.ctx.arc(ballX, ballY, 8 * scale, 0, Math.PI * 2);
        this.ctx.fill();

        // 篮球纹理
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1 * scale;
        this.ctx.beginPath();
        this.ctx.arc(ballX, ballY, 8 * scale, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    drawHairStyle(x, y, style) {
        this.drawHairStyleScaled(x, y, style, 1.0);
    }

    drawHairStyleScaled(x, y, style, scale) {
        this.ctx.beginPath();
        switch (style) {
            case 'classic':
                this.ctx.arc(x, y, 10 * scale, Math.PI * 1.1, Math.PI * 1.9);
                break;
            case 'spiky':
                // 画几个尖状的头发
                this.ctx.moveTo(x - 8 * scale, y);
                this.ctx.lineTo(x - 10 * scale, y - 5 * scale);
                this.ctx.lineTo(x - 6 * scale, y - 3 * scale);
                this.ctx.lineTo(x - 4 * scale, y - 8 * scale);
                this.ctx.lineTo(x - 2 * scale, y - 2 * scale);
                this.ctx.lineTo(x, y - 6 * scale);
                this.ctx.lineTo(x + 2 * scale, y - 2 * scale);
                this.ctx.lineTo(x + 4 * scale, y - 8 * scale);
                this.ctx.lineTo(x + 6 * scale, y - 3 * scale);
                this.ctx.lineTo(x + 8 * scale, y - 5 * scale);
                this.ctx.lineTo(x + 10 * scale, y);
                break;
            case 'curly':
                // 画卷发
                this.ctx.arc(x - 6 * scale, y - 2 * scale, 4 * scale, 0, Math.PI * 2);
                this.ctx.arc(x + 6 * scale, y - 2 * scale, 4 * scale, 0, Math.PI * 2);
                this.ctx.arc(x, y - 6 * scale, 4 * scale, 0, Math.PI * 2);
                break;
            case 'long':
                // 画长发
                this.ctx.arc(x, y, 12 * scale, Math.PI * 1.1, Math.PI * 1.9);
                this.ctx.moveTo(x - 10 * scale, y + 2 * scale);
                this.ctx.lineTo(x - 8 * scale, y + 8 * scale);
                this.ctx.moveTo(x + 10 * scale, y + 2 * scale);
                this.ctx.lineTo(x + 8 * scale, y + 8 * scale);
                break;
        }
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawDefenders() {
        this.defenders.forEach(defender => {
            const animY = Math.sin(this.animationFrame * 0.1 + defender.animOffset) * 2; // 动态晃动效果
            
            // --- 身体 ---
            const bodyWidth = defender.width - 4;
            const bodyHeight = defender.laneIndex === 2 ? 45 : 35;
            const bodyX = defender.x + 2;
            const bodyY = defender.y + 5 + animY;

            const gradient = this.ctx.createLinearGradient(bodyX, bodyY, bodyX, bodyY + bodyHeight);
            const color1 = defender.color;
            const color2 = `hsl(${120 + defender.laneIndex * 60}, 70%, 30%)`; // 更深的颜色
            gradient.addColorStop(0, color1);
            gradient.addColorStop(1, color2);
            this.ctx.fillStyle = gradient;
            this.roundRect(bodyX, bodyY, bodyWidth, bodyHeight, 5);

            // --- 球衣号码 ---
            const jerseyFontSize = defender.laneIndex === 1 ? 22 : 14;
            this.ctx.fillStyle = 'white';
            this.ctx.font = `bold ${jerseyFontSize}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(defender.jerseyNumber, defender.x + defender.width / 2, bodyY + bodyHeight / 1.5);
            
            // --- 头部 ---
            const centerX = defender.x + defender.width / 2;
            const headY = defender.y + 8 + animY;
            let headRadius = 10;
            if (defender.laneIndex === 1) headRadius = 14;
            if (defender.laneIndex === 2) headRadius = 12;

            this.ctx.fillStyle = '#FFDBAC';
            this.ctx.beginPath();
            this.ctx.arc(centerX, headY, headRadius, 0, Math.PI * 2);
            this.ctx.fill();

            // --- 头发 ---
            this.ctx.fillStyle = '#6D4C41'; // 不同的发色
            this.ctx.beginPath();
            this.ctx.arc(centerX, headY - 3, headRadius * 0.9, Math.PI * 1.2, Math.PI * 1.8);
            this.ctx.closePath();
            this.ctx.fill();
            
            // --- 眼睛 (保持简单) ---
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(centerX - 4, headY - 2, 2, 2);
            this.ctx.fillRect(centerX + 2, headY - 2, 2, 2);

            // --- 手臂和连接线 ---
            const armY = defender.y + 25 + animY;

            // 第1排和第3排球员的手臂
            if (defender.laneIndex === 0 || defender.laneIndex === 2) {
                this.ctx.strokeStyle = '#FFDBAC';
                this.ctx.lineWidth = 4;
                this.ctx.lineCap = 'round';
                
                // 左臂
                this.ctx.beginPath();
                this.ctx.moveTo(bodyX + 5, defender.y + 20 + animY);
                this.ctx.lineTo(bodyX - 15, armY);
                this.ctx.stroke();

                // 右臂
                this.ctx.beginPath();
                this.ctx.moveTo(bodyX + bodyWidth - 5, defender.y + 20 + animY);
                this.ctx.lineTo(bodyX + bodyWidth + 15, armY);
                this.ctx.stroke();
            }

            // 为第1排的连续球员添加连接线效果
            if (defender.laneIndex === 0 && defender.playerInGroup < 2) {
                this.ctx.strokeStyle = defender.color;
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.moveTo(defender.x + defender.width, defender.y + 20 + animY);
                this.ctx.lineTo(defender.x + defender.width + 5, defender.y + 20 + animY);
                this.ctx.stroke();
            }

            // 第3排球员手拉手逻辑
            if (defender.laneIndex === 2 && defender.playerInGroup === 0) {
                const nextPlayerX = defender.x + 50;
                const nextPlayerBodyX = nextPlayerX + 2;
                
                this.ctx.strokeStyle = '#FFDBAC';
                this.ctx.lineWidth = 6;
                this.ctx.beginPath();
                this.ctx.moveTo(bodyX + bodyWidth + 15, armY); // 当前球员右手
                this.ctx.lineTo(nextPlayerBodyX - 15, armY); // 下一个球员左手
                this.ctx.stroke();

                const handshakeX = (bodyX + bodyWidth + 15 + nextPlayerBodyX - 15) / 2;
                this.ctx.fillStyle = '#FFDBAC';
                this.ctx.beginPath();
                this.ctx.arc(handshakeX, armY, 7, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }
    
    drawParticles() {
        // 绘制粒子效果
        this.particles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            
            // 为烟花粒子添加发光效果
            if (particle.size) {
                this.ctx.shadowColor = particle.color;
                this.ctx.shadowBlur = 10;
                this.ctx.fillStyle = particle.color;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                this.ctx.fillStyle = particle.color;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
            this.ctx.restore();
        });
        
        // 绘制发光得分文字
        this.scorePopups.forEach(popup => {
            const alpha = popup.life / 60;
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.shadowColor = '#FFD700';
            this.ctx.shadowBlur = 15;
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 28px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.strokeStyle = '#FF6600';
            this.ctx.lineWidth = 3;
            this.ctx.strokeText(popup.text, popup.x, popup.y);
            this.ctx.fillText(popup.text, popup.x, popup.y);
            this.ctx.restore();
        });
    }
    
    drawUI() {
        if (this.gameWon) {
            // 绘制游戏胜利画面
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.6)'; // 金色半透明背景
            this.ctx.fillRect(0, 0, this.width, this.height);
            
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 52px "Arial Black", Gadget, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = '#000000';
            this.ctx.shadowBlur = 10;
            this.ctx.fillText('YOU WIN!', this.width / 2, this.height / 2 - 50);
            this.ctx.shadowBlur = 0;

            this.ctx.font = '24px Arial';
            this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2);
            
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Press R to restart', this.width / 2, this.height / 2 + 50);

        } else if (!this.gameRunning) {
            // 绘制游戏结束画面
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', this.width / 2, this.height / 2 - 50);
            
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2);
            
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Press R to restart', this.width / 2, this.height / 2 + 50);
        }
    }
    
    gameOver() {
        this.gameRunning = false;
        this.gameState = 'gameover';
        this.playSound('collision');
        document.getElementById('gameOverText').textContent = 'Intercepted by defender!';
        document.getElementById('finalScore').textContent = `Final Score: ${this.score}`;
        document.getElementById('gameOver').style.display = 'block';
    }
    
    winGame() {
        this.gameWon = true;
        this.gameState = 'win';
        this.isCelebrating = false;
        // gameRunning 已经为 false
    }
    
    restart() {
        // Fade back to menu
        this.startFadeTransition(() => {
            this.gameRunning = false;
            this.gameWon = false;
            this.isCelebrating = false;
            this.gameState = 'menu';
            this.score = 0;
            this.animationFrame = 0;
            document.getElementById('score').textContent = '0';
            document.getElementById('gameOver').style.display = 'none';
            
            // 重置玩家位置
            this.player.x = this.width / 2;
            this.player.y = 520;
            this.player.animFrame = 0;
            
            // 重置防守队员
            this.defenders = [];
            
            // 清空粒子效果
            this.particles = [];
            this.scorePopups = [];
            
            // 重置观众
            this.audienceCheerTime = 0;
            
            // 重置 Space 按钮
            this.spaceButtonTimer = 0;
            this.spaceButtonSide = Math.random() < 0.5 ? 'left' : 'right';
            this.positionSpaceButton();
            
            // 重置投篮系统
            this.resetShooting();
            this.basketball = null;
            
            // Reset other states
            this.wallFlashTime = 0;
            this.missedState = null;
            
            // Reset all button hover states
            Object.keys(this.menuButtons).forEach(key => {
                this.menuButtons[key].hover = false;
            });
        Object.keys(this.secondaryButtons).forEach(key => {
            this.secondaryButtons[key].hover = false;
        });
            Object.keys(this.pauseMenuButtons).forEach(key => {
                this.pauseMenuButtons[key].hover = false;
            });
        });
    }
    
    gameLoop() {
        this.update();
        this.render();
        
        // 检查重启按键
        if (this.keys['r'] || this.keys['R']) {
            if ((this.gameState === 'gameover' || this.gameState === 'win') && this.fadeState === null) {
                this.restart();
            }
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }

    // --- Space 按钮：位置计算 ---
    positionSpaceButton() {
        const margin = 40;
        const halfWidth = this.width / 2;
        if (this.spaceButtonSide === 'left') {
            this.spaceButton.x = margin + Math.random() * (halfWidth - this.spaceButton.width - margin * 2);
        } else {
            this.spaceButton.x = halfWidth + margin + Math.random() * (halfWidth - this.spaceButton.width - margin * 2);
        }
    }

    // --- Space 按钮：计时与切换 ---
    updateSpaceButton() {
        this.spaceButtonTimer++;
        const intervalFrames = 350; // 10秒 * 60fps
        if (this.spaceButtonTimer >= intervalFrames) {
            // 切换左右半区
            this.spaceButtonSide = this.spaceButtonSide === 'left' ? 'right' : 'left';
            this.positionSpaceButton();
            this.spaceButtonTimer = 0;
        }
    }

    // --- Space 按钮：绘制 ---
    drawSpaceButton() {
        const btn = this.spaceButton;
        this.ctx.fillStyle = '#C62828'; // 红色
        this.roundRect(btn.x, btn.y, btn.width, btn.height, 6);

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Space', btn.x + btn.width / 2, btn.y + btn.height / 2);
    }

    // --- 投篮系统：检查玩家是否在Space按钮区域 ---
    isPlayerInSpaceButtonArea() {
        return this.isColliding(this.player, this.spaceButton);
    }

    // --- 投篮系统：更新投篮逻辑 ---
    updateShooting() {
        // 更新瞄准角度
        if (this.shootingPhase === 'angle') {
            this.aimAngle += this.aimSpeed;
            // 在扇形范围内来回摆动
            if (this.aimAngle > this.shootingRange / 2) {
                this.aimAngle = this.shootingRange / 2;
                this.aimSpeed = -this.aimSpeed;
            } else if (this.aimAngle < -this.shootingRange / 2) {
                this.aimAngle = -this.shootingRange / 2;
                this.aimSpeed = -this.aimSpeed;
            }
        }
        
        // 更新力度指示器
        if (this.shootingPhase === 'power') {
            this.powerIndicator += this.powerSpeed * this.powerDirection;
            // 在0-1范围内来回移动
            if (this.powerIndicator >= 1) {
                this.powerIndicator = 1;
                this.powerDirection = -1;
            } else if (this.powerIndicator <= 0) {
                this.powerIndicator = 0;
                this.powerDirection = 1;
            }
        }

        // 更新篮球飞行
        if (this.basketball) {
            this.basketball.x += this.basketball.vx;
            this.basketball.y += this.basketball.vy;
            this.basketball.vy += 0.3; // 重力

            // 检查篮球是否进筐
            if (this.isBasketballInHoop()) {
                this.score += 2;
                document.getElementById('score').textContent = this.score;
                this.createScoreEffect(this.basket.x + this.basket.width / 2, this.basket.y);
                this.triggerAudienceCheer();
                this.basketball = null;
                
                // 投篮成功，重置玩家位置到起点
                this.player.x = this.width / 2;
                this.player.y = 520;
                // 重置投篮状态
                this.resetShooting();
                
                // 检查胜利条件
                if (this.score >= this.winningScore) {
                    this.isCelebrating = true;
                    this.gameRunning = false;
                    for(let i = 0; i < 5; i++) {
                        setTimeout(() => this.createFireworks(), i * 400);
                    }
                    setTimeout(() => {
                        this.winGame();
                    }, 3000);
                }
            }
            // 篮球飞出屏幕或落地则移除，并重置玩家位置（投篮失败）
            else if (this.basketball.y > this.height || this.basketball.x < 0 || this.basketball.x > this.width) {
                this.basketball = null;
                // 开始投篮失败重置效果
                this.startMissedEffect();
            }
        }
    }

    // --- 投篮系统：投篮 ---
    shoot() {
        const basketCenterX = this.basket.x + this.basket.width / 2;
        const basketCenterY = this.basket.y;
        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;

        // 使用锁定的角度
        const baseAngle = Math.atan2(basketCenterY - playerCenterY, basketCenterX - playerCenterX);
        const finalAngle = baseAngle + this.lockedAngle;
        
        // 根据力度指示器计算力度 (0.3-1.0 的范围，避免力度太小)
        const powerMultiplier = 0.3 + this.powerIndicator * 0.7;
        const basePower = 8; // 基础力度
        const power = basePower * powerMultiplier;
        
        this.basketball = {
            x: playerCenterX,
            y: playerCenterY,
            vx: Math.cos(finalAngle) * power,
            vy: Math.sin(finalAngle) * power - 5, // 向上的初始速度
            size: 8
        };
    }

    // --- 投篮系统：检查篮球是否进筐 ---
    isBasketballInHoop() {
        if (!this.basketball) return false;
        
        const hoopCenterX = this.basket.x + this.basket.width / 2;
        const hoopCenterY = this.basket.y;
        const distance = Math.sqrt(
            Math.pow(this.basketball.x - hoopCenterX, 2) + 
            Math.pow(this.basketball.y - hoopCenterY, 2)
        );
        
        return distance < 25 && this.basketball.vy > 0; // 篮球必须向下运动才能进筐
    }

    // 绘制隐形墙闪烁效果
    drawWallFlash() {
        if (this.wallFlashTime > 0) {
            // 计算闪烁透明度
            const flashIntensity = (this.wallFlashTime / this.wallFlashDuration);
            const pulseEffect = Math.sin(this.wallFlashTime * 0.5) * 0.3 + 0.7; // 脉冲效果
            
            this.ctx.save();
            this.ctx.globalAlpha = flashIntensity * pulseEffect * 0.6;
            
            // 绘制红色警告边框
            this.ctx.strokeStyle = '#FF0000';
            this.ctx.lineWidth = 4;
            this.ctx.shadowColor = '#FF0000';
            this.ctx.shadowBlur = 20;
            
            // 绘制边框
            this.ctx.strokeRect(
                this.invisibleWall.x - 5, 
                this.invisibleWall.y - 5, 
                this.invisibleWall.width + 10, 
                this.invisibleWall.height + 10
            );
            
            // 绘制内部填充
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
            this.ctx.fillRect(
                this.invisibleWall.x, 
                this.invisibleWall.y, 
                this.invisibleWall.width, 
                this.invisibleWall.height
            );
            
            // 绘制警告文字
            if (this.wallFlashTime > this.wallFlashDuration * 0.5) {
                this.ctx.globalAlpha = flashIntensity;
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = 'bold 16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(
                    'BLOCKED!', 
                    this.invisibleWall.x + this.invisibleWall.width / 2, 
                    this.invisibleWall.y + this.invisibleWall.height / 2
                );
            }
            
            this.ctx.restore();
        }
    }
    
    // 开始投篮失败重置效果
    startMissedEffect() {
        this.missedState = 'countdown';
        this.missedCountdown = 120; // 2秒 * 60帧/秒 (从3秒改为2秒)
        this.missedCountdownValue = 3;
        // 记录玩家当前位置作为传送起点
        this.teleportEffect.sourceCircle.x = this.player.x + this.player.width / 2;
        this.teleportEffect.sourceCircle.y = this.player.y + this.player.height / 2;
        this.teleportEffect.targetCircle.x = this.width / 2 + 20; // 起点位置
        this.teleportEffect.targetCircle.y = 520 + 25;
    }
    
    // 更新投篮失败重置效果
    updateMissedEffect() {
        if (this.missedState === 'countdown') {
            this.missedCountdown--;
            
            // 每40帧（约0.67秒）更新倒计时数字
            if (this.missedCountdown > 0 && this.missedCountdown % 40 === 0) {
                this.missedCountdownValue = Math.ceil(this.missedCountdown / 40);
            }
            
            // 倒计时结束，开始传送效果
            if (this.missedCountdown <= 0) {
                this.missedState = 'teleport';
                this.teleportEffect.timer = 0;
                this.teleportEffect.sourceCircle.radius = 0;
                this.teleportEffect.targetCircle.radius = this.teleportEffect.targetCircle.maxRadius;
            }
        } else if (this.missedState === 'teleport') {
            this.teleportEffect.timer++;
            
            // 源位置光圈向外扩散
            if (this.teleportEffect.timer <= this.teleportEffect.duration / 2) {
                this.teleportEffect.sourceCircle.radius = 
                    (this.teleportEffect.timer / (this.teleportEffect.duration / 2)) * this.teleportEffect.sourceCircle.maxRadius;
            }
            
            // 目标位置光圈向内收缩
            if (this.teleportEffect.timer >= this.teleportEffect.duration / 2) {
                const progress = (this.teleportEffect.timer - this.teleportEffect.duration / 2) / (this.teleportEffect.duration / 2);
                this.teleportEffect.targetCircle.radius = 
                    this.teleportEffect.targetCircle.maxRadius * (1 - progress);
            }
            
            // 在传送效果中间时刻移动玩家
            if (this.teleportEffect.timer === Math.floor(this.teleportEffect.duration / 2)) {
                this.player.x = this.width / 2;
                this.player.y = 520;
                this.resetShooting();
            }
            
            // 传送效果结束
            if (this.teleportEffect.timer >= this.teleportEffect.duration) {
                this.missedState = null;
            }
        }
    }
    
    // 绘制投篮失败重置效果
    drawMissedEffect() {
        if (this.missedState === 'countdown') {
            this.ctx.save();
            
            // 绘制半透明背景
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            
            // 绘制提示框
            const boxWidth = 300;
            const boxHeight = 150;
            const boxX = this.width / 2 - boxWidth / 2;
            const boxY = this.height / 2 - boxHeight / 2;
            
            // 提示框背景
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 3;
            this.roundRect(boxX, boxY, boxWidth, boxHeight, 15);
            this.ctx.fill();
            this.ctx.stroke();
            
            // "Missed" 文字
            this.ctx.fillStyle = '#FF4444';
            this.ctx.font = 'bold 36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('Missed', this.width / 2, this.height / 2 - 20);
            
            // 倒计时数字
            this.ctx.fillStyle = '#333';
            this.ctx.font = 'bold 48px Arial';
            const scale = 1 + Math.sin(this.animationFrame * 0.3) * 0.1; // 跳动效果
            this.ctx.save();
            this.ctx.translate(this.width / 2, this.height / 2 + 30);
            this.ctx.scale(scale, scale);
            this.ctx.fillText(this.missedCountdownValue.toString(), 0, 0);
            this.ctx.restore();
            
            this.ctx.restore();
        } else if (this.missedState === 'teleport') {
            this.ctx.save();
            
            // 绘制源位置光圈（向外扩散）
            if (this.teleportEffect.sourceCircle.radius > 0) {
                const alpha = 1 - (this.teleportEffect.sourceCircle.radius / this.teleportEffect.sourceCircle.maxRadius);
                this.ctx.globalAlpha = alpha * 0.8;
                this.ctx.strokeStyle = '#00AAFF';
                this.ctx.lineWidth = 4;
                this.ctx.shadowColor = '#00AAFF';
                this.ctx.shadowBlur = 20;
                this.ctx.beginPath();
                this.ctx.arc(
                    this.teleportEffect.sourceCircle.x, 
                    this.teleportEffect.sourceCircle.y, 
                    this.teleportEffect.sourceCircle.radius, 
                    0, Math.PI * 2
                );
                this.ctx.stroke();
            }
            
            // 绘制目标位置光圈（向内收缩）
            if (this.teleportEffect.targetCircle.radius > 0) {
                const alpha = this.teleportEffect.targetCircle.radius / this.teleportEffect.targetCircle.maxRadius;
                this.ctx.globalAlpha = alpha * 0.8;
                this.ctx.strokeStyle = '#00FF88';
                this.ctx.lineWidth = 4;
                this.ctx.shadowColor = '#00FF88';
                this.ctx.shadowBlur = 20;
                this.ctx.beginPath();
                this.ctx.arc(
                    this.teleportEffect.targetCircle.x, 
                    this.teleportEffect.targetCircle.y, 
                    this.teleportEffect.targetCircle.radius, 
                    0, Math.PI * 2
                );
                this.ctx.stroke();
                
                // 绘制内部填充
                this.ctx.globalAlpha = alpha * 0.3;
                this.ctx.fillStyle = '#00FF88';
                this.ctx.fill();
            }
            
            this.ctx.restore();
        }
    }

    drawGameScene() {
        // 绘制背景
        this.drawBackground();
        
        // 绘制星空
        if (this.theme === 'night') {
            this.drawStarField();
        }
        
        // 绘制观众
        this.drawAudience();
        
        // 绘制篮筐
        this.drawBasket();
        
        // 绘制防守队员
        this.drawDefenders();
        
        // 绘制 Space 按钮
        this.drawSpaceButton();
        
        // 绘制玩家
        this.drawPlayer();

        // 绘制投篮瞄准指针和篮球
        this.drawShooting();
        
        // 绘制隐形墙闪烁效果
        this.drawWallFlash();
        
        // 绘制投篮失败重置效果
        this.drawMissedEffect();
        
        // 绘制粒子效果
        this.drawParticles();
        
        // 绘制UI元素
        this.drawUI();
    }
    
    drawPauseMenu() {
        // 绘制半透明黑色背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // 绘制暂停菜单框
        const menuWidth = 350;
        const menuHeight = 250;
        const menuX = this.width / 2 - menuWidth / 2;
        const menuY = this.height / 2 - menuHeight / 2;
        
        // 菜单背景
        this.ctx.fillStyle = 'rgba(30, 30, 50, 0.95)';
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.roundRect(menuX, menuY, menuWidth, menuHeight, 15);
        this.ctx.fill();
        this.ctx.stroke();
        
        // 暂停标题
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('PAUSED', this.width / 2, menuY + 50);
        
        // 绘制暂停菜单按钮
        Object.keys(this.pauseMenuButtons).forEach(key => {
            const btn = this.pauseMenuButtons[key];
            
            this.ctx.save();
            
            // Button shadow - consistent for both states
            this.ctx.shadowColor = '#000000';
            this.ctx.shadowBlur = 5;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 3;
            
            // Button background
            if (btn.hover) {
                const btnGradient = this.ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.height);
                btnGradient.addColorStop(0, '#FFD700');
                btnGradient.addColorStop(1, '#FFA500');
                this.ctx.fillStyle = btnGradient;
            } else {
                const btnGradient = this.ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.height);
                btnGradient.addColorStop(0, '#5A5A8A');
                btnGradient.addColorStop(1, '#3A3A5A');
                this.ctx.fillStyle = btnGradient;
            }
            
            this.roundRect(btn.x, btn.y, btn.width, btn.height, 8);
            this.ctx.fill();
            
            // Reset shadow for border and text
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
            
            // Button border
            this.ctx.strokeStyle = btn.hover ? '#FFFFFF' : '#7A7A9A';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Button text
            this.ctx.fillStyle = btn.hover ? '#000000' : '#FFFFFF';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + btn.height / 2);
            
            this.ctx.restore();
        });
        
        // ESC提示
        this.ctx.fillStyle = '#AAAAAA';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Press ESC to resume', this.width / 2, menuY + menuHeight - 25);
    }

    drawMainMenu() {
        // Menu background gradient
        const bgGradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        bgGradient.addColorStop(0, '#1a1a2e');
        bgGradient.addColorStop(0.5, '#16213e');
        bgGradient.addColorStop(1, '#0f0f23');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw animated stars
        this.ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 50; i++) {
            const x = (i * 137 + this.animationFrame * 0.5) % this.width;
            const y = (i * 89) % this.height;
            const size = Math.sin(i + this.animationFrame * 0.02) * 1.5 + 1.5;
            const alpha = Math.sin(i + this.animationFrame * 0.03) * 0.5 + 0.5;
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
        
        // Draw "Baller" logo with cool effects
        const logoY = 120;
        const bounce = Math.sin(this.animationFrame * 0.05) * 10;
        
        // Logo shadow and glow
        this.ctx.save();
        this.ctx.shadowColor = '#FFD700';
        this.ctx.shadowBlur = 30;
        this.ctx.shadowOffsetY = 5;
        
        // Main logo text with gradient
        const gradient = this.ctx.createLinearGradient(0, logoY - 40, 0, logoY + 40);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.5, '#FFA500');
        gradient.addColorStop(1, '#FF6347');
        
        this.ctx.fillStyle = gradient;
        this.ctx.font = 'bold 80px "Arial Black"';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('BALLER', this.width / 2, logoY + bounce);
        
        // Outline
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText('BALLER', this.width / 2, logoY + bounce);
        
        this.ctx.restore();
        
        // Basketball icon next to logo
        const ballX = this.width / 2 + 180;
        const ballY = logoY + bounce;
        const ballRadius = 25;
        
        // Basketball
        this.ctx.fillStyle = '#FF8C00';
        this.ctx.beginPath();
        this.ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Basketball lines
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Vertical line
        this.ctx.beginPath();
        this.ctx.moveTo(ballX, ballY - ballRadius);
        this.ctx.lineTo(ballX, ballY + ballRadius);
        this.ctx.stroke();
        
        // Horizontal line
        this.ctx.beginPath();
        this.ctx.moveTo(ballX - ballRadius, ballY);
        this.ctx.lineTo(ballX + ballRadius, ballY);
        this.ctx.stroke();
        
        // Draw main menu buttons
        Object.keys(this.menuButtons).forEach(key => {
            const btn = this.menuButtons[key];
            
            this.ctx.save();
            
            // Button shadow - consistent for both states
            this.ctx.shadowColor = '#000000';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 5;
            
            // Button background
            if (btn.hover) {
                const btnGradient = this.ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.height);
                btnGradient.addColorStop(0, '#FFD700');
                btnGradient.addColorStop(1, '#FFA500');
                this.ctx.fillStyle = btnGradient;
            } else {
                const btnGradient = this.ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.height);
                btnGradient.addColorStop(0, '#4A90E2');
                btnGradient.addColorStop(1, '#2E5CA5');
                this.ctx.fillStyle = btnGradient;
            }
            
            this.roundRect(btn.x, btn.y, btn.width, btn.height, 10);
            this.ctx.fill();
            
            // Reset shadow for border and text
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
            
            // Button border
            this.ctx.strokeStyle = btn.hover ? '#FFFFFF' : '#2E5CA5';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            
            // Button text
            this.ctx.fillStyle = btn.hover ? '#000000' : '#FFFFFF';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + btn.height / 2);
            
            this.ctx.restore();
        });
        
        // Draw secondary buttons (smaller style)
        Object.keys(this.secondaryButtons).forEach(key => {
            const btn = this.secondaryButtons[key];
            
            this.ctx.save();
            
            // Smaller shadow for secondary buttons
            this.ctx.shadowColor = '#000000';
            this.ctx.shadowBlur = 5;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 3;
            
            // Different styling for secondary buttons
            if (key === 'themeToggle') {
                // Theme toggle button styling
                if (btn.hover) {
                    const btnGradient = this.ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.height);
                    btnGradient.addColorStop(0, '#FF6B6B');
                    btnGradient.addColorStop(1, '#EE5A24');
                    this.ctx.fillStyle = btnGradient;
                } else {
                    const btnGradient = this.ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.height);
                    btnGradient.addColorStop(0, '#5F27CD');
                    btnGradient.addColorStop(1, '#341F97');
                    this.ctx.fillStyle = btnGradient;
                }
            } else {
                // Customize button styling
                if (btn.hover) {
                    const btnGradient = this.ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.height);
                    btnGradient.addColorStop(0, '#00D2D3');
                    btnGradient.addColorStop(1, '#54A0FF');
                    this.ctx.fillStyle = btnGradient;
                } else {
                    const btnGradient = this.ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.height);
                    btnGradient.addColorStop(0, '#2C2C54');
                    btnGradient.addColorStop(1, '#40407A');
                    this.ctx.fillStyle = btnGradient;
                }
            }
            
            this.roundRect(btn.x, btn.y, btn.width, btn.height, 8);
            this.ctx.fill();
            
            // Reset shadow for border and text
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
            
            // Button border
            this.ctx.strokeStyle = btn.hover ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Button text
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + btn.height / 2);
            
            this.ctx.restore();
        });
        
        // Instructions
        this.ctx.fillStyle = '#CCCCCC';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Choose your difficulty level', this.width / 2, 250);
    }

    // 绘制投篮瞄准指针和篮球
    drawShooting() {
        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;
        const basketCenterX = this.basket.x + this.basket.width / 2;
        const basketCenterY = this.basket.y;
        
        // 角度选择阶段
        if (this.shootingPhase === 'angle') {
            // 绘制扇形瞄准区域
            this.ctx.save();
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.moveTo(playerCenterX, playerCenterY);
            this.ctx.arc(playerCenterX, playerCenterY, 100, 
                Math.atan2(basketCenterY - playerCenterY, basketCenterX - playerCenterX) - this.shootingRange / 2,
                Math.atan2(basketCenterY - playerCenterY, basketCenterX - playerCenterX) + this.shootingRange / 2);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.restore();

            // 绘制摆动的瞄准线
            const aimDirection = Math.atan2(basketCenterY - playerCenterY, basketCenterX - playerCenterX) + this.aimAngle;
            const aimEndX = playerCenterX + Math.cos(aimDirection) * 100;
            const aimEndY = playerCenterY + Math.sin(aimDirection) * 100;
            
            this.ctx.strokeStyle = '#FF0000';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(playerCenterX, playerCenterY);
            this.ctx.lineTo(aimEndX, aimEndY);
            this.ctx.stroke();
        }
        
        // 力度选择阶段
        if (this.shootingPhase === 'power') {
            // 绘制锁定的瞄准线
            const lockedDirection = Math.atan2(basketCenterY - playerCenterY, basketCenterX - playerCenterX) + this.lockedAngle;
            const aimEndX = playerCenterX + Math.cos(lockedDirection) * this.maxPowerDistance;
            const aimEndY = playerCenterY + Math.sin(lockedDirection) * this.maxPowerDistance;
            
            this.ctx.strokeStyle = '#FF0000';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(playerCenterX, playerCenterY);
            this.ctx.lineTo(aimEndX, aimEndY);
            this.ctx.stroke();
            
            // 绘制力度指示器
            const powerX = playerCenterX + Math.cos(lockedDirection) * this.powerIndicator * this.maxPowerDistance;
            const powerY = playerCenterY + Math.sin(lockedDirection) * this.powerIndicator * this.maxPowerDistance;
            
            // 力度指示器颜色随力度变化：绿色->黄色->红色
            let powerColor;
            if (this.powerIndicator < 0.5) {
                // 绿色到黄色
                const ratio = this.powerIndicator * 2;
                powerColor = `rgb(${Math.floor(255 * ratio)}, 255, 0)`;
            } else {
                // 黄色到红色
                const ratio = (this.powerIndicator - 0.5) * 2;
                powerColor = `rgb(255, ${Math.floor(255 * (1 - ratio))}, 0)`;
            }
            
            this.ctx.fillStyle = powerColor;
            this.ctx.shadowColor = powerColor;
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(powerX, powerY, 8, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }

        // 绘制飞行中的篮球
        if (this.basketball) {
            this.ctx.fillStyle = '#FF8C00';
            this.ctx.beginPath();
            this.ctx.arc(this.basketball.x, this.basketball.y, this.basketball.size, 0, Math.PI * 2);
            this.ctx.fill();

            // 篮球纹理
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(this.basketball.x, this.basketball.y, this.basketball.size, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    // 换装系统方法
    loadAppearanceFromStorage() {
        const saved = localStorage.getItem('playerAppearance');
        if (saved) {
            try {
                const appearance = JSON.parse(saved);
                this.player.appearance = appearance;
                this.customization.selectedIndices = {
                    head: appearance.headIndex,
                    jersey: appearance.jerseyIndex,
                    number: appearance.numberIndex
                };
            } catch (e) {
                console.log('Failed to load appearance from storage');
            }
        }
    }

    saveAppearanceToStorage() {
        try {
            localStorage.setItem('playerAppearance', JSON.stringify(this.player.appearance));
        } catch (e) {
            console.log('Failed to save appearance to storage');
        }
    }

    initCustomization() {
        // 重置换装界面状态
        this.customization.selectedCategory = 'head';
        this.customization.selectedIndices = {
            head: this.player.appearance.headIndex,
            jersey: this.player.appearance.jerseyIndex,
            number: this.player.appearance.numberIndex
        };
        
        // 设置类别按钮状态
        Object.keys(this.customizationButtons).forEach(key => {
            if (['head', 'jersey', 'number'].includes(key)) {
                this.customizationButtons[key].active = (key === 'head');
            }
        });
    }

    drawCustomizationMenu() {
        // 绘制渐变背景
        const bgGradient = this.ctx.createRadialGradient(
            this.width/2, this.height/2, 0,
            this.width/2, this.height/2, Math.max(this.width, this.height)
        );
        bgGradient.addColorStop(0, '#34495E');
        bgGradient.addColorStop(0.6, '#2C3E50');
        bgGradient.addColorStop(1, '#1B2631');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 绘制装饰性网格背景
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.width; i += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.height);
            this.ctx.stroke();
        }
        for (let i = 0; i < this.height; i += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.width, i);
            this.ctx.stroke();
        }

        // 绘制主标题 - 居中对称
        this.ctx.save();
        this.ctx.shadowColor = '#000000';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowOffsetY = 3;
        
        const titleGradient = this.ctx.createLinearGradient(0, 50, 0, 90);
        titleGradient.addColorStop(0, '#FFD700');
        titleGradient.addColorStop(1, '#FFA500');
        this.ctx.fillStyle = titleGradient;
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Character Customization', this.width / 2, 70);
        
        // 标题描边
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeText('Character Customization', this.width / 2, 70);
        this.ctx.restore();

        // 绘制左右分栏布局
        this.drawSymmetricalLayout();
    }

    drawSymmetricalLayout() {
        const centerX = this.width / 2;
        const panelWidth = 300; // 增加面板宽度以适应宽屏
        
        // 使用响应式间距系统
        const panelGap = this.spacing.panel.gap;
        const totalPanelWidth = panelWidth * 2 + panelGap;
        
        // 响应式计算面板位置，优化宽屏显示
        const leftPanelX = centerX - totalPanelWidth / 2;
        const rightPanelX = centerX + panelGap / 2;
        
        // 确保面板不会超出屏幕边界，使用响应式边距
        const margin = this.spacing.panel.margin;
        const safeLeftX = Math.max(margin, leftPanelX);
        const safeRightX = Math.min(this.width - panelWidth - margin, rightPanelX);
        
        // 优化面板垂直位置，适应不同屏幕高度
        const panelY = Math.max(80, (this.height - 450) / 2);
        
        // 左侧控制面板
        this.drawControlPanel(safeLeftX, panelY);
        
        // 右侧预览面板  
        this.drawPreviewPanel(safeRightX, panelY);
        
        // 底部操作按钮 - 居中对称
        this.drawActionButtons();
    }

    drawControlPanel(x, y) {
        // 绘制控制面板背景
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetY = 10;
        
        const panelGradient = this.ctx.createLinearGradient(x, y, x, y + 400);
        panelGradient.addColorStop(0, 'rgba(52, 73, 94, 0.9)');
        panelGradient.addColorStop(1, 'rgba(44, 62, 80, 0.9)');
        this.ctx.fillStyle = panelGradient;
        this.roundRect(x, y, 300, 400, 15);
        this.ctx.fill();
        
        // 面板边框
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.restore();

        // 面板标题 - 使用响应式间距
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Customize Options', x + 150, y + this.spacing.panel.titleOffset);

        // 重新定位类别按钮到左侧面板 - 使用响应式间距
        this.drawCategoryButtonsInPanel(x + this.spacing.panel.padding, y + this.spacing.text.sectionSpacing);
        
        // 当前选择信息 - 使用响应式间距避免重叠，向下移动
        this.drawCurrentSelectionInPanel(x + 150, y + 220);
        
        // 导航按钮 - 使用响应式间距，相应向下移动
        this.drawNavigationButtonsInPanel(x + 70, y + 310);
    }

    drawPreviewPanel(x, y) {
        // 绘制预览面板背景
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetY = 10;
        
        const panelGradient = this.ctx.createLinearGradient(x, y, x, y + 400);
        panelGradient.addColorStop(0, 'rgba(41, 128, 185, 0.9)');
        panelGradient.addColorStop(1, 'rgba(52, 152, 219, 0.9)');
        this.ctx.fillStyle = panelGradient;
        this.roundRect(x, y, 300, 400, 15);
        this.ctx.fill();
        
        // 面板边框
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.restore();

        // 面板标题 - 使用响应式间距
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Character Preview', x + 150, y + this.spacing.panel.titleOffset);

        // 预览角色 - 使用响应式间距
        this.drawEnhancedPreview(x + 100, y + this.spacing.button.groupSpacing);
    }

    drawCustomizationButtons() {
        const categories = ['head', 'jersey', 'number'];
        categories.forEach(category => {
            const btn = this.customizationButtons[category];
            
            this.ctx.save();
            
            // 添加阴影
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            this.ctx.shadowBlur = 8;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 4;
            
            // 绘制按钮背景渐变
            let gradient;
            if (btn.active) {
                gradient = this.ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.height);
                gradient.addColorStop(0, '#4A90E2');
                gradient.addColorStop(1, '#2E5CA5');
            } else if (btn.hover) {
                gradient = this.ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.height);
                gradient.addColorStop(0, '#5DADE2');
                gradient.addColorStop(1, '#3498DB');
            } else {
                gradient = this.ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.height);
                gradient.addColorStop(0, '#95A5A6');
                gradient.addColorStop(1, '#7F8C8D');
            }
            
            this.ctx.fillStyle = gradient;
            this.roundRect(btn.x, btn.y, btn.width, btn.height, 10);
            
            // 重置阴影
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
            
            // 绘制按钮边框
            this.ctx.strokeStyle = btn.active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // 绘制按钮文字
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + btn.height / 2);
            
            this.ctx.restore();
        });

        // 绘制前进后退按钮
        const navButtons = ['prev', 'next'];
        navButtons.forEach(nav => {
            const btn = this.customizationButtons[nav];
            
            this.ctx.save();
            
            // 添加阴影
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            this.ctx.shadowBlur = 6;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 3;
            
            // 绘制渐变背景
            const gradient = this.ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.height);
            if (btn.hover) {
                gradient.addColorStop(0, '#E74C3C');
                gradient.addColorStop(1, '#C0392B');
            } else {
                gradient.addColorStop(0, '#C0392B');
                gradient.addColorStop(1, '#A93226');
            }
            
            this.ctx.fillStyle = gradient;
            this.roundRect(btn.x, btn.y, btn.width, btn.height, 8);
            
            // 重置阴影
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
            
            // 绘制边框
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + btn.height / 2);
            
            this.ctx.restore();
        });

        // 绘制应用/取消按钮
        const actionButtons = ['apply', 'cancel'];
        actionButtons.forEach(action => {
            const btn = this.customizationButtons[action];
            
            this.ctx.save();
            
            // 添加阴影
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 5;
            
            // 绘制渐变背景
            const gradient = this.ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.height);
            if (action === 'apply') {
                if (btn.hover) {
                    gradient.addColorStop(0, '#27AE60');
                    gradient.addColorStop(1, '#1E8449');
                } else {
                    gradient.addColorStop(0, '#2ECC71');
                    gradient.addColorStop(1, '#27AE60');
                }
            } else {
                if (btn.hover) {
                    gradient.addColorStop(0, '#E67E22');
                    gradient.addColorStop(1, '#D35400');
                } else {
                    gradient.addColorStop(0, '#F39C12');
                    gradient.addColorStop(1, '#E67E22');
                }
            }
            
            this.ctx.fillStyle = gradient;
            this.roundRect(btn.x, btn.y, btn.width, btn.height, 10);
            
            // 重置阴影
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
            
            // 绘制边框
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            
            this.ctx.fillStyle = action === 'apply' ? '#FFFFFF' : '#000000';
            this.ctx.font = 'bold 18px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + btn.height / 2);
            
            this.ctx.restore();
        });
    }

    drawCurrentSelection() {
        const category = this.customization.selectedCategory;
        const currentIndex = this.customization.selectedIndices[category];
        let currentData, totalCount;

        switch (category) {
            case 'head':
                currentData = this.appearancePresets.heads[currentIndex];
                totalCount = this.appearancePresets.heads.length;
                break;
            case 'jersey':
                currentData = this.appearancePresets.jerseys[currentIndex];
                totalCount = this.appearancePresets.jerseys.length;
                break;
            case 'number':
                currentData = this.appearancePresets.numbers[currentIndex];
                totalCount = this.appearancePresets.numbers.length;
                break;
        }

        // 绘制当前选择信息 - 调整位置
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 22px Arial';
        this.ctx.textAlign = 'center';
        
        const categoryText = category.charAt(0).toUpperCase() + category.slice(1);
        this.ctx.fillText(`${categoryText}:`, this.width / 2, 250);
        
        this.ctx.font = '18px Arial';
        const name = typeof currentData === 'string' ? currentData : currentData.name;
        this.ctx.fillText(name, this.width / 2, 280);
        
        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = '#CCCCCC';
        this.ctx.fillText(`${currentIndex + 1} / ${totalCount}`, this.width / 2, 300);
    }

    drawCustomizationPreview() {
        // 绘制预览框 - 扩大到200x150
        const previewX = this.width / 2 - 75; // 调整中心位置
        const previewY = 380; // 稍微上移
        
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = '#FFFFFF';
        this.ctx.shadowBlur = 10;
        this.ctx.strokeRect(previewX - 25, previewY - 25, 200, 150);
        this.ctx.shadowBlur = 0;
        
        // 绘制预览框标题
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Preview', previewX + 75, previewY - 35);
        
        // 绘制预览角色 - 1.5倍大小
        const previewAppearance = {
            headIndex: this.customization.selectedIndices.head,
            jerseyIndex: this.customization.selectedIndices.jersey,
            numberIndex: this.customization.selectedIndices.number
        };
        
        this.drawPlayerWithAppearanceScaled(previewX + 30, previewY + 20, previewAppearance, 1.5);
    }

    onCustomizationButtonClick(buttonKey) {
        const category = this.customization.selectedCategory;
        const currentIndex = this.customization.selectedIndices[category];
        
        switch (buttonKey) {
            case 'head':
            case 'jersey':
            case 'number':
                // 切换类别
                this.customization.selectedCategory = buttonKey;
                Object.keys(this.customizationButtons).forEach(key => {
                    if (['head', 'jersey', 'number'].includes(key)) {
                        this.customizationButtons[key].active = (key === buttonKey);
                    }
                });
                break;
                
            case 'prev':
                // 上一个选项
                let maxCount = this.getMaxCountForCategory(category);
                this.customization.selectedIndices[category] = 
                    (currentIndex - 1 + maxCount) % maxCount;
                break;
                
            case 'next':
                // 下一个选项
                let maxCount2 = this.getMaxCountForCategory(category);
                this.customization.selectedIndices[category] = 
                    (currentIndex + 1) % maxCount2;
                break;
                
            case 'apply':
                // 应用外观
                this.applyAppearance();
                break;
                
            case 'cancel':
                // 取消并返回菜单
                this.gameState = 'menu';
                break;
        }
    }

    getMaxCountForCategory(category) {
        switch (category) {
            case 'head':
                return this.appearancePresets.heads.length;
            case 'jersey':
                return this.appearancePresets.jerseys.length;
            case 'number':
                return this.appearancePresets.numbers.length;
            default:
                return 1;
        }
    }

    applyAppearance() {
        // 应用新的外观设置
        this.player.appearance = {
            headIndex: this.customization.selectedIndices.head,
            jerseyIndex: this.customization.selectedIndices.jersey,
            numberIndex: this.customization.selectedIndices.number
        };
        
        // 保存到本地存储
        this.saveAppearanceToStorage();
        
        // 返回主菜单
        this.gameState = 'menu';
    }

    drawCategoryButtonsInPanel(x, y) {
        const categories = ['head', 'jersey', 'number'];
        categories.forEach((category, index) => {
            const btn = this.customizationButtons[category];
            
            // 重新计算按钮位置到面板内 - 使用响应式间距
            const btnX = x;
            const btnY = y + index * this.spacing.panel.elementSpacing; // 使用响应式元素间距
            
            this.ctx.save();
            
            // 添加阴影
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            this.ctx.shadowBlur = 8;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 4;
            
            // 绘制按钮背景渐变
            let gradient;
            if (btn.active) {
                gradient = this.ctx.createLinearGradient(btnX, btnY, btnX, btnY + 40);
                gradient.addColorStop(0, '#4A90E2');
                gradient.addColorStop(1, '#2E5CA5');
            } else if (btn.hover) {
                gradient = this.ctx.createLinearGradient(btnX, btnY, btnX, btnY + 40);
                gradient.addColorStop(0, '#5DADE2');
                gradient.addColorStop(1, '#3498DB');
            } else {
                gradient = this.ctx.createLinearGradient(btnX, btnY, btnX, btnY + 40);
                gradient.addColorStop(0, '#95A5A6');
                gradient.addColorStop(1, '#7F8C8D');
            }
            
            this.ctx.fillStyle = gradient;
            this.roundRect(btnX, btnY, 260, 40, 10);
            
            // 重置阴影
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
            
            // 绘制按钮边框
            this.ctx.strokeStyle = btn.active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // 绘制按钮文字
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(btn.text, btnX + 130, btnY + 20);
            
            this.ctx.restore();
            
            // 更新按钮的实际位置用于点击检测
            btn.x = btnX;
            btn.y = btnY;
            btn.width = 260;
            btn.height = 40;
        });
    }

    drawCurrentSelectionInPanel(centerX, y) {
        const category = this.customization.selectedCategory;
        const currentIndex = this.customization.selectedIndices[category];
        let currentData, totalCount;

        switch (category) {
            case 'head':
                currentData = this.appearancePresets.heads[currentIndex];
                totalCount = this.appearancePresets.heads.length;
                break;
            case 'jersey':
                currentData = this.appearancePresets.jerseys[currentIndex];
                totalCount = this.appearancePresets.jerseys.length;
                break;
            case 'number':
                currentData = this.appearancePresets.numbers[currentIndex];
                totalCount = this.appearancePresets.numbers.length;
                break;
        }

        // 绘制当前选择信息 - 使用响应式间距
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        
        const categoryText = category.charAt(0).toUpperCase() + category.slice(1);
        this.ctx.fillText(`Current ${categoryText}:`, centerX, y);
        
        this.ctx.font = '16px Arial';
        const name = typeof currentData === 'string' ? currentData : currentData.name;
        this.ctx.fillText(name, centerX, y + this.spacing.text.labelOffset);
        
        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = '#CCCCCC';
        this.ctx.fillText(`${currentIndex + 1} / ${totalCount}`, centerX, y + this.spacing.text.labelOffset * 2);
    }

    drawNavigationButtonsInPanel(x, y) {
        const navButtons = ['prev', 'next'];
        
        // 计算按钮居中位置
        const panelWidth = 300; // 面板宽度
        const buttonWidth = 100; // 每个按钮的宽度
        const buttonGap = 20; // 按钮之间的间距
        const totalButtonWidth = buttonWidth * 2 + buttonGap; // 两个按钮的总宽度
        const startX = x + (panelWidth/2 - totalButtonWidth) / 2; // 居中的起始X位置
        
        navButtons.forEach((nav, index) => {
            const btn = this.customizationButtons[nav];
            const btnX = startX + index * (buttonWidth + buttonGap); // 居中计算按钮位置
            const btnY = y;
            
            this.ctx.save();
            
            // 添加阴影
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            this.ctx.shadowBlur = 6;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 3;
            
            // 绘制渐变背景
            const gradient = this.ctx.createLinearGradient(btnX, btnY, btnX, btnY + 40);
            if (btn.hover) {
                gradient.addColorStop(0, '#E74C3C');
                gradient.addColorStop(1, '#C0392B');
            } else {
                gradient.addColorStop(0, '#C0392B');
                gradient.addColorStop(1, '#A93226');
            }
            
            this.ctx.fillStyle = gradient;
            this.roundRect(btnX, btnY, 100, 40, 8);
            
            // 重置阴影
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
            
            // 绘制边框
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(btn.text, btnX + 50, btnY + 20);
            
            this.ctx.restore();
            
            // 更新按钮位置
            btn.x = btnX;
            btn.y = btnY;
            btn.width = 100;
            btn.height = 40;
        });
    }

    drawEnhancedPreview(x, y) {
        // 绘制增强的预览背景
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        this.ctx.shadowBlur = 15;
        
        const previewBg = this.ctx.createRadialGradient(x + 50, y + 75, 0, x + 50, y + 75, 80);
        previewBg.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        previewBg.addColorStop(1, 'rgba(255, 255, 255, 0.7)');
        this.ctx.fillStyle = previewBg;
        this.ctx.beginPath();
        this.ctx.arc(x + 50, y + 75, 80, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        this.ctx.restore();
        
        // 绘制预览角色 - 2倍大小，向右下移动
        const previewAppearance = {
            headIndex: this.customization.selectedIndices.head,
            jerseyIndex: this.customization.selectedIndices.jersey,
            numberIndex: this.customization.selectedIndices.number
        };
        
        this.drawPlayerWithAppearanceScaled(x + 5, y + 25, previewAppearance, 2.0);
    }

    drawActionButtons() {
        const centerX = this.width / 2;
        const buttonWidth = 120;
        const buttonGap = this.spacing.button.gap; // 使用响应式按钮间距
        const totalButtonWidth = buttonWidth * 2 + buttonGap;
        
        // 动态计算按钮Y位置，基于面板底部 - 使用响应式间距
        const panelY = Math.max(80, (this.height - 450) / 2); // 与面板Y位置保持一致
        const panelHeight = 400; // 面板高度
        const buttonMarginFromPanel = this.spacing.button.margin; // 使用响应式按钮边距
        const dynamicButtonY = panelY + panelHeight + buttonMarginFromPanel;
        
        // 确保按钮不会超出屏幕底部 - 使用响应式间距
        const maxButtonY = this.height - this.spacing.xl; // 使用响应式底部边距
        const btnY = Math.min(dynamicButtonY, maxButtonY);
        
        const actionButtons = ['apply', 'cancel'];
        actionButtons.forEach((action, index) => {
            const btn = this.customizationButtons[action];
            const btnX = centerX - totalButtonWidth / 2 + index * (buttonWidth + buttonGap);
            
            this.ctx.save();
            
            // 添加阴影
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 5;
            
            // 绘制渐变背景
            const gradient = this.ctx.createLinearGradient(btnX, btnY, btnX, btnY + 50);
            if (action === 'apply') {
                if (btn.hover) {
                    gradient.addColorStop(0, '#27AE60');
                    gradient.addColorStop(1, '#1E8449');
                } else {
                    gradient.addColorStop(0, '#2ECC71');
                    gradient.addColorStop(1, '#27AE60');
                }
            } else {
                if (btn.hover) {
                    gradient.addColorStop(0, '#E67E22');
                    gradient.addColorStop(1, '#D35400');
                } else {
                    gradient.addColorStop(0, '#F39C12');
                    gradient.addColorStop(1, '#E67E22');
                }
            }
            
            this.ctx.fillStyle = gradient;
            this.roundRect(btnX, btnY, 120, 50, 10);
            
            // 重置阴影
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
            
            // 绘制边框
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            
            this.ctx.fillStyle = action === 'apply' ? '#FFFFFF' : '#000000';
            this.ctx.font = 'bold 18px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(btn.text, btnX + 60, btnY + 25);
            
            this.ctx.restore();
            
            // 更新按钮位置
            btn.x = btnX;
            btn.y = btnY;
            btn.width = 120;
            btn.height = 50;
        });
    }
}

// 全局函数
function restartGame() {
    game.restart();
}

// 初始化游戏
const game = new FrogBasketballGame();
window.game = game;