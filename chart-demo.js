/* ==========================================================================
   INTERACTIVE CANDLESTICK CHART SIMULATOR: MBA CHART vala
   ========================================================================== */

class TradingSimulator {
    constructor() {
        // UI Elements
        this.canvas = document.getElementById('simChartCanvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        this.buyBtn = document.getElementById('btnBuy');
        this.sellBtn = document.getElementById('btnSell');
        this.closeBtn = document.getElementById('btnClosePos');
        this.pnlOverlay = document.getElementById('pnlOverlay');
        this.pnlValueEl = document.getElementById('pnlValue');
        
        this.balanceEl = document.getElementById('simBalance');
        this.activeTradesEl = document.getElementById('simActiveTrades');
        this.totalNetPnlEl = document.getElementById('simTotalNetPnl');
        this.winRateEl = document.getElementById('simWinRate');
        
        this.livePriceEl = document.getElementById('simLivePrice');
        this.liveChangeEl = document.getElementById('simLiveChange');
        this.patternStatusEl = document.getElementById('activePatternName');
        this.patternButtons = document.querySelectorAll('.btn-pattern');

        // Simulation Variables
        this.candles = [];
        this.maxCandles = 45;
        this.candleWidth = 14;
        this.candleSpacing = 6;
        
        this.currentPrice = 23450.50;
        this.startingPrice = 23450.50;
        
        // Portfolio Variables
        this.walletBalance = 100000.00;
        this.totalTrades = 0;
        this.winningTrades = 0;
        this.totalNetProfit = 0.00;
        
        // Position variables
        this.activePosition = null; // 'long', 'short', or null
        this.entryPrice = 0.00;
        this.positionSize = 10; // Number of units/lots
        this.currentPnl = 0.00;

        // Pattern Generator Variables
        this.currentPatternType = 'random'; // 'random', 'double-bottom', 'head-shoulders', 'ascending-triangle'
        this.patternStepsQueue = [];
        this.patternStatusText = 'Random Market Noise';

        // Timing
        this.tickCount = 0;
        this.ticksPerCandle = 12; // 12 updates per candle close (approx 3.6s total at 300ms/tick)

        this.init();
    }

    init() {
        // Event Listeners
        this.buyBtn.addEventListener('click', () => this.openPosition('long'));
        this.sellBtn.addEventListener('click', () => this.openPosition('short'));
        this.closeBtn.addEventListener('click', () => this.closePosition());
        
        // Pattern Selectors
        this.patternButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.patternButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.setPatternType(btn.getAttribute('data-pattern'));
            });
        });

        // Set up canvas dimensions
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Generate starting historical candlesticks
        this.generateHistory();

        // Start tick loop
        setInterval(() => this.tick(), 300);
    }

    resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.drawChart();
    }

    generateHistory() {
        let price = this.startingPrice - 150; // start slightly lower
        for (let i = 0; i < this.maxCandles; i++) {
            const candle = this.createCandle(price);
            this.candles.push(candle);
            price = candle.close;
        }
        this.currentPrice = price;
    }

    createCandle(openPrice) {
        const volatility = 25;
        const trend = (Math.random() - 0.48) * 12; // slight upward drift
        const close = openPrice + trend + (Math.random() - 0.5) * volatility;
        const high = Math.max(openPrice, close) + Math.random() * volatility * 0.5;
        const low = Math.min(openPrice, close) - Math.random() * volatility * 0.5;
        
        return {
            open: openPrice,
            high: high,
            low: low,
            close: close
        };
    }

    setPatternType(type) {
        this.currentPatternType = type;
        this.patternStepsQueue = []; // Clear current queue

        if (type === 'random') {
            this.patternStatusText = 'Random Market Noise';
        } else if (type === 'double-bottom') {
            this.patternStatusText = 'Forming Double Bottom...';
            // Queue up price moves (deltas) to form a W pattern
            // Down trend -> First bottom -> pullback -> Second bottom (slightly higher) -> breakout
            const steps = [
                // Phase 1: Downward leg (4 candles)
                -25, -30, -20, -15,
                // Phase 2: First bottom & bounce (4 candles)
                -5, 20, 25, 15,
                // Phase 3: Second bottom (4 candles)
                -18, -22, -10, 5,
                // Phase 4: Breakout (4 candles)
                30, 45, 35, 50
            ];
            this.patternStepsQueue = steps;
        } else if (type === 'head-shoulders') {
            this.patternStatusText = 'Forming Head & Shoulders...';
            // Left shoulder (up, down) -> Head (high up, down) -> Right shoulder (medium up, down) -> Breakdown
            const steps = [
                // Left shoulder (4 candles)
                20, 25, -15, -20,
                // Head (6 candles)
                35, 40, 25, -30, -35, -15,
                // Right shoulder (4 candles)
                22, 18, -25, -30,
                // Breakdown (4 candles)
                -45, -50, -35, -40
            ];
            this.patternStepsQueue = steps;
        } else if (type === 'ascending-triangle') {
            this.patternStatusText = 'Building Ascending Triangle...';
            // Flat tops, higher bottoms, then upwards breakout
            const steps = [
                // First swing up (4 candles)
                35, 10, -25, -15,
                // Second swing up, higher low (4 candles)
                30, 10, -15, -8,
                // Third swing up, higher low (4 candles)
                23, 10, -10, -3,
                // Breakout (4 candles)
                40, 50, 35, 45
            ];
            this.patternStepsQueue = steps;
        }
        this.patternStatusEl.textContent = this.patternStatusText;
    }

    tick() {
        this.tickCount++;
        
        // Get the current active candle (the last one in the array)
        let activeCandle = this.candles[this.candles.length - 1];
        
        // Generate simulated micro-price movements
        let priceDelta = 0;
        
        if (this.patternStepsQueue.length > 0) {
            // Get current target delta for the active candle phase
            const stepDelta = this.patternStepsQueue[0];
            // Distribute the candle delta across ticks
            priceDelta = (stepDelta / this.ticksPerCandle) + (Math.random() - 0.5) * 4;
        } else {
            // Pure random walk micro-movement
            priceDelta = (Math.random() - 0.495) * 6;
        }

        // Apply price delta
        this.currentPrice += priceDelta;
        
        // Update active candle prices
        activeCandle.close = this.currentPrice;
        if (this.currentPrice > activeCandle.high) activeCandle.high = this.currentPrice;
        if (this.currentPrice < activeCandle.low) activeCandle.low = this.currentPrice;

        // Check if candle period has closed
        if (this.tickCount >= this.ticksPerCandle) {
            this.tickCount = 0;
            
            // Advance pattern queue if we are processing one
            if (this.patternStepsQueue.length > 0) {
                this.patternStepsQueue.shift(); // remove the completed step
                
                // Update descriptive texts based on queue progression
                if (this.patternStepsQueue.length === 0) {
                    this.patternStatusText = 'Pattern Breakout Completed!';
                    // Revert back to random button status
                    setTimeout(() => {
                        this.setPatternType('random');
                        this.patternButtons.forEach(b => {
                            b.classList.remove('active');
                            if (b.getAttribute('data-pattern') === 'random') b.classList.add('active');
                        });
                    }, 4000);
                } else {
                    const remaining = this.patternStepsQueue.length;
                    if (this.currentPatternType === 'double-bottom') {
                        if (remaining > 12) this.patternStatusText = 'Forming Left Valley...';
                        else if (remaining > 8) this.patternStatusText = 'Bouncing to Neckline...';
                        else if (remaining > 4) this.patternStatusText = 'Forming Right Valley (Higher Low)...';
                        else this.patternStatusText = 'Bullish Neckline Breakout!';
                    } else if (this.currentPatternType === 'head-shoulders') {
                        if (remaining > 14) this.patternStatusText = 'Forming Left Shoulder...';
                        else if (remaining > 8) this.patternStatusText = 'Forming Head (Peak)...';
                        else if (remaining > 4) this.patternStatusText = 'Forming Right Shoulder...';
                        else this.patternStatusText = 'Neckline Breakdown Triggered!';
                    } else if (this.currentPatternType === 'ascending-triangle') {
                        if (remaining > 12) this.patternStatusText = 'Hitting Resistance at flat top...';
                        else if (remaining > 8) this.patternStatusText = 'Consolidating (Higher Low)...';
                        else if (remaining > 4) this.patternStatusText = 'Squeezing near apex...';
                        else this.patternStatusText = 'Triangle Breakout Upwards!';
                    }
                }
                this.patternStatusEl.textContent = this.patternStatusText;
            }

            // Create and push new candle
            const nextOpen = this.currentPrice;
            const newCandle = {
                open: nextOpen,
                high: nextOpen,
                low: nextOpen,
                close: nextOpen
            };
            
            this.candles.push(newCandle);
            if (this.candles.length > this.maxCandles) {
                this.candles.shift(); // Remove oldest candle
            }
        }

        // Calculate P&L for active position
        this.updatePnl();
        
        // Render tick values in UI
        this.updatePricesUI();
        
        // Draw canvas chart
        this.drawChart();
    }

    updatePnl() {
        if (!this.activePosition) return;
        
        if (this.activePosition === 'long') {
            this.currentPnl = (this.currentPrice - this.entryPrice) * this.positionSize;
        } else if (this.activePosition === 'short') {
            this.currentPnl = (this.entryPrice - this.currentPrice) * this.positionSize;
        }

        const formattedPnl = this.currentPnl.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        if (this.currentPnl >= 0) {
            this.pnlValueEl.className = 'bull-text';
            this.pnlValueEl.textContent = `+₹${formattedPnl}`;
            this.pnlOverlay.style.boxShadow = '0 0 15px rgba(0, 230, 118, 0.25)';
            this.pnlOverlay.style.borderColor = 'var(--bull-green)';
        } else {
            this.pnlValueEl.className = 'bear-text';
            this.pnlValueEl.textContent = `-₹${Math.abs(this.currentPnl).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
            this.pnlOverlay.style.boxShadow = '0 0 15px rgba(255, 61, 0, 0.25)';
            this.pnlOverlay.style.borderColor = 'var(--bear-red)';
        }
    }

    updatePricesUI() {
        const changePct = ((this.currentPrice - this.startingPrice) / this.startingPrice) * 100;
        this.livePriceEl.textContent = `₹ ${this.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        
        this.liveChangeEl.textContent = `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`;
        if (changePct >= 0) {
            this.liveChangeEl.className = 'sim-live-change bull-text';
        } else {
            this.liveChangeEl.className = 'sim-live-change bear-text';
        }
    }

    openPosition(direction) {
        if (this.activePosition) return; // position already open

        this.activePosition = direction;
        this.entryPrice = this.currentPrice;
        this.currentPnl = 0.00;

        // Update control buttons state
        this.buyBtn.disabled = true;
        this.sellBtn.disabled = true;
        this.closeBtn.disabled = false;
        
        // Show P&L card overlay
        this.pnlOverlay.classList.add('active');
        this.activeTradesEl.textContent = '1';
    }

    closePosition() {
        if (!this.activePosition) return;

        // Realize profit
        this.walletBalance += this.currentPnl;
        this.totalTrades++;
        if (this.currentPnl > 0) this.winningTrades++;
        this.totalNetProfit += this.currentPnl;

        // Reset positions
        this.activePosition = null;
        this.entryPrice = 0;
        
        // Update UI
        this.buyBtn.disabled = false;
        this.sellBtn.disabled = false;
        this.closeBtn.disabled = true;
        this.pnlOverlay.classList.remove('active');
        
        this.activeTradesEl.textContent = '0';
        this.balanceEl.textContent = `₹ ${this.walletBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
        
        // Net profit
        const netPnlSign = this.totalNetProfit >= 0 ? '+' : '-';
        this.totalNetPnlEl.textContent = `${netPnlSign}₹${Math.abs(this.totalNetProfit).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
        this.totalNetPnlEl.className = this.totalNetProfit >= 0 ? 'val bull-text' : 'val bear-text';
        
        // Win rate
        const winRate = ((this.winningTrades / this.totalTrades) * 100).toFixed(0);
        this.winRateEl.textContent = `${winRate}%`;

        this.currentPnl = 0.00;
    }

    // DRAWING CHART LOGIC
    drawChart() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const ctx = this.ctx;

        ctx.clearRect(0, 0, width, height);

        // Find min and max price ranges in the visible window
        let minPrice = Infinity;
        let maxPrice = -Infinity;

        this.candles.forEach(c => {
            if (c.low < minPrice) minPrice = c.low;
            if (c.high > maxPrice) maxPrice = c.high;
        });

        // Add padding to chart top/bottom
        const pricePadding = (maxPrice - minPrice) * 0.15 || 50;
        minPrice -= pricePadding;
        maxPrice += pricePadding;
        const priceRange = maxPrice - minPrice;

        // Helper to convert price to Y coordinate
        const getX = (index) => {
            const chartPaddingRight = 80;
            const usableWidth = width - chartPaddingRight;
            const totalWidthRequired = this.candles.length * (this.candleWidth + this.candleSpacing);
            // Draw candles starting from right side going left
            return usableWidth - (this.candles.length - 1 - index) * (this.candleWidth + this.candleSpacing);
        };

        const getY = (price) => {
            const chartPaddingTop = 30;
            const chartPaddingBottom = 30;
            const usableHeight = height - chartPaddingTop - chartPaddingBottom;
            return height - chartPaddingBottom - ((price - minPrice) / priceRange) * usableHeight;
        };

        // Draw grid lines (Horizontal price levels)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        ctx.fillStyle = '#6e6e7a';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';

        const gridLinesCount = 5;
        for (let i = 0; i < gridLinesCount; i++) {
            const gridPrice = minPrice + (priceRange / (gridLinesCount - 1)) * i;
            const y = getY(gridPrice);

            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width - 80, y);
            ctx.stroke();

            // Draw price labels on y-axis
            ctx.fillText(
                Math.round(gridPrice).toLocaleString('en-IN'),
                width - 15,
                y + 3
            );
        }

        // Draw vertical division line for right axis panel
        ctx.strokeStyle = 'rgba(229, 184, 66, 0.08)';
        ctx.beginPath();
        ctx.moveTo(width - 80, 0);
        ctx.lineTo(width - 80, height);
        ctx.stroke();

        // Calculate and Draw 20-period Simple Moving Average (SMA) line
        const smaPeriod = 12;
        ctx.beginPath();
        ctx.strokeStyle = '#e5b842';
        ctx.lineWidth = 2;
        let firstSmaPoint = true;

        for (let i = 0; i < this.candles.length; i++) {
            if (i >= smaPeriod - 1) {
                let sum = 0;
                for (let j = 0; j < smaPeriod; j++) {
                    sum += this.candles[i - j].close;
                }
                const sma = sum / smaPeriod;
                const x = getX(i) + this.candleWidth / 2;
                const y = getY(sma);

                if (firstSmaPoint) {
                    ctx.moveTo(x, y);
                    firstSmaPoint = false;
                } else {
                    ctx.lineTo(x, y);
                }
            }
        }
        ctx.stroke();

        // Draw Candlesticks
        this.candles.forEach((c, index) => {
            const x = getX(index);
            const yOpen = getY(c.open);
            const yClose = getY(c.close);
            const yHigh = getY(c.high);
            const yLow = getY(c.low);

            const isBullish = c.close >= c.open;
            
            // Set styles
            const wickColor = isBullish ? 'rgba(0, 230, 118, 0.5)' : 'rgba(255, 61, 0, 0.5)';
            const bodyColor = isBullish ? 'var(--bull-gradient)' : 'var(--bear-gradient)';
            const borderColor = isBullish ? 'rgba(0, 230, 118, 0.8)' : 'rgba(255, 61, 0, 0.8)';

            // 1. Draw Wicks (High / Low lines)
            ctx.strokeStyle = wickColor;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x + this.candleWidth / 2, yHigh);
            ctx.lineTo(x + this.candleWidth / 2, yLow);
            ctx.stroke();

            // 2. Draw Body
            ctx.fillStyle = bodyColor;
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 1;
            
            const bodyY = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(Math.abs(yOpen - yClose), 1.5); // Ensure thin candles are visible

            ctx.beginPath();
            ctx.roundRect(x, bodyY, this.candleWidth, bodyHeight, 2);
            ctx.fill();
            ctx.stroke();
        });

        // Draw Active Position Entry Dotted Line
        if (this.activePosition) {
            const entryY = getY(this.entryPrice);
            ctx.strokeStyle = this.activePosition === 'long' ? 'rgba(0, 230, 118, 0.6)' : 'rgba(255, 61, 0, 0.6)';
            ctx.setLineDash([5, 5]);
            ctx.lineWidth = 1.5;

            ctx.beginPath();
            ctx.moveTo(0, entryY);
            ctx.lineTo(width - 80, entryY);
            ctx.stroke();
            
            ctx.setLineDash([]); // Reset line dash

            // Draw entry label tag
            ctx.fillStyle = this.activePosition === 'long' ? '#00e676' : '#ff3d00';
            ctx.font = 'bold 9px sans-serif';
            ctx.fillRect(5, entryY - 9, 75, 18);
            ctx.fillStyle = '#121214';
            ctx.fillText(
                `${this.activePosition.toUpperCase()} @ ${Math.round(this.entryPrice)}`,
                75,
                entryY + 3
            );
        }

        // Draw live price line indicator tag on the right axis
        const currentY = getY(this.currentPrice);
        ctx.strokeStyle = 'rgba(229, 184, 66, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, currentY);
        ctx.lineTo(width - 80, currentY);
        ctx.stroke();

        // Live Price Label box on Y Axis
        ctx.fillStyle = 'var(--primary-gold)';
        ctx.fillRect(width - 78, currentY - 10, 75, 20);
        ctx.fillStyle = '#121214';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(
            Math.round(this.currentPrice).toLocaleString('en-IN'),
            width - 72,
            currentY + 4
        );
    }
}

// Instantiate the simulator once DOM has finished loading
window.addEventListener('load', () => {
    new TradingSimulator();
});
