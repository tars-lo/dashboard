// Keisen - Paper Template Generator
// Device dimensions in pixels (for PDF, we'll use mm)

const DEVICES = {
    remarkable: {
        name: 'reMarkable Paper Pro',
        width: 226.8,  // mm (1696px at ~190 DPI → ~224mm, using exact calc)
        height: 127.6, // mm (954px)
        ppi: 229
    },
    ipad: {
        name: 'iPad Pro 13"',
        width: 280.6,  // mm (11.04" diagonal, 4:3 aspect)
        height: 214.9, // mm
        ppi: 264
    }
};

const COLORS = {
    blue: { r: 168, g: 197, b: 226, hex: '#a8c5e2' },
    red: { r: 226, g: 168, b: 168, hex: '#e2a8a8' },
    gray: { r: 192, g: 192, b: 192, hex: '#c0c0c0' },
    // Authentic Japanese notebook colors
    tomoe: { r: 180, g: 200, b: 220, hex: '#b4c8dc' },      // Tomoe River blue-gray
    kokuyo: { r: 165, g: 190, b: 210, hex: '#a5bed2' },     // Kokuyo Campus blue
    hobonichi: { r: 200, g: 180, b: 170, hex: '#c8b4aa' }   // Hobonichi warm brown
};

const PAPERS = {
    white: { r: 255, g: 255, b: 255, hex: '#ffffff' },
    cream: { r: 250, g: 248, b: 243, hex: '#faf8f3' },
    aged: { r: 240, g: 235, b: 224, hex: '#f0ebe0' },
    // Authentic Japanese papers
    tomoe: { r: 255, g: 254, b: 250, hex: '#fffefa' },      // Tomoe River cream-white
    midori: { r: 253, g: 251, b: 244, hex: '#fdfbf4' },     // Midori MD cream
    hobonichi: { r: 255, g: 253, b: 245, hex: '#fffdf5' }   // Hobonichi Tomoe River
};

// State
let state = {
    device: 'remarkable',
    template: 'grid',
    color: 'blue',
    paper: 'white',
    cellSize: 5,      // mm
    lineWeight: 0.3,  // mm
    margin: 10,       // mm
    showHeader: false // Date/Subject header
};

// DOM Elements
const canvas = document.getElementById('preview');
const ctx = canvas.getContext('2d');

// Initialize
function init() {
    setupEventListeners();
    render();
}

function setupEventListeners() {
    // Device buttons
    document.querySelectorAll('.device-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.device-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.device = btn.dataset.device;
            render();
        });
    });

    // Template buttons
    document.querySelectorAll('.template-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.template = btn.dataset.template;
            render();
        });
    });

    // Color buttons
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.color = btn.dataset.color;
            render();
        });
    });

    // Paper buttons
    document.querySelectorAll('.paper-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.paper-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.paper = btn.dataset.paper;
            render();
        });
    });

    // Number inputs
    document.getElementById('cellSize').addEventListener('input', (e) => {
        state.cellSize = parseFloat(e.target.value) || 5;
        render();
    });

    document.getElementById('lineWeight').addEventListener('input', (e) => {
        state.lineWeight = parseFloat(e.target.value) || 0.3;
        render();
    });

    document.getElementById('margin').addEventListener('input', (e) => {
        state.margin = parseFloat(e.target.value) || 10;
        render();
    });

    // Header toggle
    const headerToggle = document.getElementById('showHeader');
    if (headerToggle) {
        headerToggle.addEventListener('change', (e) => {
            state.showHeader = e.target.checked;
            render();
        });
    }

    // Export button
    document.getElementById('exportBtn').addEventListener('click', exportPDF);
}

function mmToPixels(mm, scale = 3) {
    // 1mm = 3.78 pixels at 96 DPI, scale up for preview quality
    return mm * 3.78 * scale;
}

function getHeaderHeight(scale) {
    // Header takes about 8mm for text + underlines + spacing
    return state.showHeader ? mmToPixels(12, scale) : 0;
}

function drawHeader(margin, scale) {
    if (!state.showHeader) return 0;
    
    const headerHeight = getHeaderHeight(scale);
    const startX = margin;
    const startY = margin;
    
    const color = COLORS[state.color];
    const textColor = '#555555';
    
    // Font size based on scale
    const fontSize = mmToPixels(3, scale);
    ctx.font = `${fontSize}px Inter, -apple-system, sans-serif`;
    ctx.fillStyle = textColor;
    
    // Fixed-width underlines (not full page width)
    const dateLineWidth = mmToPixels(25, scale);
    const subjectLineWidth = mmToPixels(50, scale);
    
    // Date label and line
    const dateLabel = 'Date:';
    ctx.fillText(dateLabel, startX, startY + fontSize);
    
    const dateLabelWidth = ctx.measureText(dateLabel).width;
    const dateLineStart = startX + dateLabelWidth + mmToPixels(2, scale);
    const dateLineEnd = dateLineStart + dateLineWidth;
    
    ctx.strokeStyle = color.hex;
    ctx.lineWidth = mmToPixels(state.lineWeight, scale);
    ctx.beginPath();
    ctx.moveTo(dateLineStart, startY + fontSize + mmToPixels(1, scale));
    ctx.lineTo(dateLineEnd, startY + fontSize + mmToPixels(1, scale));
    ctx.stroke();
    
    // Subject label and line
    const subjectLabel = 'Subject:';
    const subjectStart = dateLineEnd + mmToPixels(8, scale);
    ctx.fillText(subjectLabel, subjectStart, startY + fontSize);
    
    const subjectLabelWidth = ctx.measureText(subjectLabel).width;
    const subjectLineStart = subjectStart + subjectLabelWidth + mmToPixels(2, scale);
    
    ctx.beginPath();
    ctx.moveTo(subjectLineStart, startY + fontSize + mmToPixels(1, scale));
    ctx.lineTo(subjectLineStart + subjectLineWidth, startY + fontSize + mmToPixels(1, scale));
    ctx.stroke();
    
    return headerHeight;
}

function render() {
    const device = DEVICES[state.device];
    const scale = 2; // Preview scale
    
    // Set canvas size
    canvas.width = mmToPixels(device.width, scale);
    canvas.height = mmToPixels(device.height, scale);
    
    // Scale for retina
    canvas.style.width = `${mmToPixels(device.width, 1)}px`;
    canvas.style.height = `${mmToPixels(device.height, 1)}px`;
    
    // Clear and fill background
    const paper = PAPERS[state.paper];
    ctx.fillStyle = paper.hex;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw template
    const color = COLORS[state.color];
    ctx.strokeStyle = color.hex;
    ctx.lineWidth = mmToPixels(state.lineWeight, scale);
    
    const marginPx = mmToPixels(state.margin, scale);
    const cellPx = mmToPixels(state.cellSize, scale);
    
    // Draw header if enabled
    const headerOffset = drawHeader(marginPx, scale);
    
    switch (state.template) {
        case 'grid':
            drawGrid(marginPx, cellPx, headerOffset);
            break;
        case 'dot':
            drawDotGrid(marginPx, cellPx, headerOffset);
            break;
        case 'lined':
            drawLined(marginPx, cellPx, headerOffset);
            break;
        case 'cornell':
            drawCornell(marginPx, cellPx, headerOffset);
            break;
        case 'calligraphy-cn':
            drawCalligraphyCN(marginPx, headerOffset);
            break;
        case 'hobonichi':
            drawHobonichi(marginPx, headerOffset);
            break;
        case 'genkoyoshi':
            drawGenkoyoshi(marginPx, headerOffset);
            break;
        case 'blank':
            // Just margins, no lines
            break;
    }
}

function drawGrid(margin, cell, headerOffset = 0) {
    const startX = margin;
    const startY = margin + headerOffset;
    const endX = canvas.width - margin;
    const endY = canvas.height - margin;
    
    // Calculate grid dimensions that fit evenly
    const availWidth = endX - startX;
    const availHeight = endY - startY;
    const cols = Math.floor(availWidth / cell);
    const rows = Math.floor(availHeight / cell);
    const gridWidth = cols * cell;
    const gridHeight = rows * cell;
    
    // Center the grid horizontally, keep top-aligned
    const offsetX = startX + (availWidth - gridWidth) / 2;
    const offsetY = startY;
    
    ctx.beginPath();
    
    // Vertical lines (cols + 1 to close the right edge)
    for (let i = 0; i <= cols; i++) {
        const x = offsetX + i * cell;
        ctx.moveTo(x, offsetY);
        ctx.lineTo(x, offsetY + gridHeight);
    }
    
    // Horizontal lines (rows + 1 to close the bottom edge)
    for (let i = 0; i <= rows; i++) {
        const y = offsetY + i * cell;
        ctx.moveTo(offsetX, y);
        ctx.lineTo(offsetX + gridWidth, y);
    }
    
    ctx.stroke();
}

function drawDotGrid(margin, cell, headerOffset = 0) {
    const startX = margin;
    const startY = margin + headerOffset;
    const endX = canvas.width - margin;
    const endY = canvas.height - margin;
    
    // Calculate grid that fits evenly
    const availWidth = endX - startX;
    const availHeight = endY - startY;
    const cols = Math.floor(availWidth / cell);
    const rows = Math.floor(availHeight / cell);
    const gridWidth = cols * cell;
    
    const offsetX = startX + (availWidth - gridWidth) / 2;
    
    const color = COLORS[state.color];
    ctx.fillStyle = color.hex;
    
    const dotRadius = mmToPixels(state.lineWeight * 1.5, 2);
    
    for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
            ctx.beginPath();
            ctx.arc(offsetX + i * cell, startY + j * cell, dotRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawLined(margin, cell, headerOffset = 0) {
    const startX = margin;
    const startY = margin + headerOffset;
    const endX = canvas.width - margin;
    const endY = canvas.height - margin;
    
    // Calculate rows that fit evenly
    const availHeight = endY - startY;
    const rows = Math.floor(availHeight / cell);
    
    ctx.beginPath();
    
    // Horizontal lines (rows + 1 for top and bottom bounds)
    for (let i = 0; i <= rows; i++) {
        const y = startY + i * cell;
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
    }
    
    ctx.stroke();
}

function drawCornell(margin, cell, headerOffset = 0) {
    const startX = margin;
    const startY = margin + headerOffset;
    const endX = canvas.width - margin;
    const endY = canvas.height - margin;
    
    const cueWidth = (endX - startX) * 0.3; // 30% for cue column
    const summaryHeight = (endY - startY) * 0.15; // 15% for summary
    
    ctx.beginPath();
    
    // Main dividers (thicker)
    ctx.lineWidth = mmToPixels(state.lineWeight * 2, 2);
    
    // Vertical divider (cue column)
    ctx.moveTo(startX + cueWidth, startY);
    ctx.lineTo(startX + cueWidth, endY - summaryHeight);
    
    // Horizontal divider (summary area)
    ctx.moveTo(startX, endY - summaryHeight);
    ctx.lineTo(endX, endY - summaryHeight);
    
    ctx.stroke();
    
    // Lined rules in note-taking area (thinner)
    ctx.lineWidth = mmToPixels(state.lineWeight, 2);
    ctx.beginPath();
    
    for (let y = startY + cell; y < endY - summaryHeight; y += cell) {
        ctx.moveTo(startX + cueWidth + margin/2, y);
        ctx.lineTo(endX, y);
    }
    
    ctx.stroke();
}

function drawCalligraphyCN(margin, headerOffset = 0) {
    // 米字格 (Rice character grid) - traditional Chinese calligraphy paper
    const startX = margin;
    const startY = margin + headerOffset;
    const endX = canvas.width - margin;
    const endY = canvas.height - margin;
    
    // Calculate cell size to fit nicely
    const availWidth = endX - startX;
    const availHeight = endY - startY;
    
    // Make cells square, fit as many as possible
    const cellSize = mmToPixels(state.cellSize * 3, 2); // Larger cells for calligraphy
    
    const cols = Math.floor(availWidth / cellSize);
    const rows = Math.floor(availHeight / cellSize);
    
    // Center the grid
    const gridWidth = cols * cellSize;
    const gridHeight = rows * cellSize;
    const offsetX = startX + (availWidth - gridWidth) / 2;
    const offsetY = startY + (availHeight - gridHeight) / 2;
    
    // Draw outer grid (thicker)
    ctx.lineWidth = mmToPixels(state.lineWeight * 2, 2);
    ctx.beginPath();
    
    for (let i = 0; i <= cols; i++) {
        ctx.moveTo(offsetX + i * cellSize, offsetY);
        ctx.lineTo(offsetX + i * cellSize, offsetY + gridHeight);
    }
    
    for (let i = 0; i <= rows; i++) {
        ctx.moveTo(offsetX, offsetY + i * cellSize);
        ctx.lineTo(offsetX + gridWidth, offsetY + i * cellSize);
    }
    
    ctx.stroke();
    
    // Draw inner guidelines (米 pattern - thinner, dashed-like)
    ctx.lineWidth = mmToPixels(state.lineWeight * 0.5, 2);
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = offsetX + col * cellSize;
            const y = offsetY + row * cellSize;
            const cx = x + cellSize / 2;
            const cy = y + cellSize / 2;
            
            // Horizontal center line
            ctx.moveTo(x, cy);
            ctx.lineTo(x + cellSize, cy);
            
            // Vertical center line
            ctx.moveTo(cx, y);
            ctx.lineTo(cx, y + cellSize);
            
            // Diagonal lines
            ctx.moveTo(x, y);
            ctx.lineTo(x + cellSize, y + cellSize);
            
            ctx.moveTo(x + cellSize, y);
            ctx.lineTo(x, y + cellSize);
        }
    }
    
    ctx.stroke();
    ctx.globalAlpha = 1;
}

function drawHobonichi(margin, headerOffset = 0) {
    // Hobonichi Techo style: 3.7mm grid with time axis (0-24) on left
    const startX = margin;
    const startY = margin + headerOffset;
    const endX = canvas.width - margin;
    const endY = canvas.height - margin;
    
    // Hobonichi uses 3.7mm grid
    const cellSize = mmToPixels(3.7, 2);
    const timeAxisWidth = mmToPixels(8, 2); // Space for time numbers
    
    const gridStartX = startX + timeAxisWidth;
    const availWidth = endX - gridStartX;
    const availHeight = endY - startY;
    
    const cols = Math.floor(availWidth / cellSize);
    const rows = Math.floor(availHeight / cellSize);
    const gridWidth = cols * cellSize;
    const gridHeight = rows * cellSize;
    
    const color = COLORS[state.color];
    
    // Draw main grid (very light)
    ctx.strokeStyle = color.hex;
    ctx.lineWidth = mmToPixels(0.15, 2); // Hobonichi has very fine lines
    ctx.globalAlpha = 0.6;
    
    ctx.beginPath();
    
    // Vertical lines
    for (let i = 0; i <= cols; i++) {
        const x = gridStartX + i * cellSize;
        ctx.moveTo(x, startY);
        ctx.lineTo(x, startY + gridHeight);
    }
    
    // Horizontal lines
    for (let i = 0; i <= rows; i++) {
        const y = startY + i * cellSize;
        ctx.moveTo(gridStartX, y);
        ctx.lineTo(gridStartX + gridWidth, y);
    }
    
    ctx.stroke();
    ctx.globalAlpha = 1;
    
    // Draw time axis (hours 0-24 or subset based on height)
    const fontSize = mmToPixels(2, 2);
    ctx.font = `${fontSize}px Inter, -apple-system, sans-serif`;
    ctx.fillStyle = color.hex;
    ctx.globalAlpha = 0.7;
    
    // Calculate how many hour markers fit
    const hourSpacing = cellSize * 2; // Every 2 cells = 1 hour
    const hoursToShow = Math.min(24, Math.floor(gridHeight / hourSpacing));
    
    for (let h = 0; h <= hoursToShow; h++) {
        const y = startY + h * hourSpacing + fontSize / 3;
        const hourLabel = h.toString().padStart(2, '0');
        ctx.fillText(hourLabel, startX, y);
    }
    
    ctx.globalAlpha = 1;
}

function drawGenkoyoshi(margin, headerOffset = 0) {
    // 原稿用紙 - Japanese manuscript paper (vertical writing, 400 squares typically)
    const startX = margin;
    const startY = margin + headerOffset;
    const endX = canvas.width - margin;
    const endY = canvas.height - margin;
    
    // Traditional genkoyoshi: 20 columns × 20 rows = 400 characters
    const availWidth = endX - startX;
    const availHeight = endY - startY;
    
    // Calculate cell size to fit nicely
    const targetCols = 20;
    const cellSize = Math.min(availWidth / targetCols, mmToPixels(8, 2));
    
    const cols = Math.floor(availWidth / cellSize);
    const rows = Math.floor(availHeight / cellSize);
    const gridWidth = cols * cellSize;
    const gridHeight = rows * cellSize;
    
    // Center the grid
    const offsetX = startX + (availWidth - gridWidth) / 2;
    const offsetY = startY + (availHeight - gridHeight) / 2;
    
    const color = COLORS[state.color];
    
    // Draw outer border (thicker)
    ctx.strokeStyle = color.hex;
    ctx.lineWidth = mmToPixels(0.4, 2);
    ctx.strokeRect(offsetX, offsetY, gridWidth, gridHeight);
    
    // Draw inner grid (thinner)
    ctx.lineWidth = mmToPixels(0.2, 2);
    ctx.beginPath();
    
    // Vertical lines (columns for vertical writing)
    for (let i = 1; i < cols; i++) {
        const x = offsetX + i * cellSize;
        ctx.moveTo(x, offsetY);
        ctx.lineTo(x, offsetY + gridHeight);
    }
    
    // Horizontal lines
    for (let i = 1; i < rows; i++) {
        const y = offsetY + i * cellSize;
        ctx.moveTo(offsetX, y);
        ctx.lineTo(offsetX + gridWidth, y);
    }
    
    ctx.stroke();
    
    // Center line in each cell (for character centering) - very faint
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = mmToPixels(0.1, 2);
    ctx.setLineDash([mmToPixels(1, 2), mmToPixels(1, 2)]);
    ctx.beginPath();
    
    for (let i = 0; i < cols; i++) {
        const x = offsetX + i * cellSize + cellSize / 2;
        ctx.moveTo(x, offsetY);
        ctx.lineTo(x, offsetY + gridHeight);
    }
    
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
}

async function drawHeaderPDF(page, width, height, margin, lineWidth, color) {
    const { StandardFonts } = PDFLib;
    const mmToPt = 2.835;
    
    const font = await page.doc.embedFont(StandardFonts.Helvetica);
    const fontSize = 3 * mmToPt * 2.5;
    const textColor = PDFLib.rgb(0.33, 0.33, 0.33);
    
    const startX = margin;
    const topY = height - margin;
    
    // Fixed-width underlines
    const dateLineWidth = 25 * mmToPt;
    const subjectLineWidth = 50 * mmToPt;
    
    // Date label
    const dateLabel = 'Date:';
    page.drawText(dateLabel, {
        x: startX,
        y: topY - fontSize,
        size: fontSize,
        font,
        color: textColor
    });
    
    const dateLabelWidth = font.widthOfTextAtSize(dateLabel, fontSize);
    const dateLineStart = startX + dateLabelWidth + 2 * mmToPt;
    const dateLineEnd = dateLineStart + dateLineWidth;
    
    page.drawLine({
        start: { x: dateLineStart, y: topY - fontSize - 1 * mmToPt },
        end: { x: dateLineEnd, y: topY - fontSize - 1 * mmToPt },
        thickness: lineWidth,
        color
    });
    
    // Subject label
    const subjectLabel = 'Subject:';
    const subjectStart = dateLineEnd + 8 * mmToPt;
    page.drawText(subjectLabel, {
        x: subjectStart,
        y: topY - fontSize,
        size: fontSize,
        font,
        color: textColor
    });
    
    const subjectLabelWidth = font.widthOfTextAtSize(subjectLabel, fontSize);
    const subjectLineStart = subjectStart + subjectLabelWidth + 2 * mmToPt;
    
    page.drawLine({
        start: { x: subjectLineStart, y: topY - fontSize - 1 * mmToPt },
        end: { x: subjectLineStart + subjectLineWidth, y: topY - fontSize - 1 * mmToPt },
        thickness: lineWidth,
        color
    });
}

async function exportPDF() {
    const { PDFDocument, rgb } = PDFLib;
    const device = DEVICES[state.device];
    const color = COLORS[state.color];
    const paper = PAPERS[state.paper];
    
    // Create PDF (dimensions in points, 1mm = 2.835 points)
    const mmToPt = 2.835;
    const widthPt = device.width * mmToPt;
    const heightPt = device.height * mmToPt;
    
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([widthPt, heightPt]);
    
    // Background
    page.drawRectangle({
        x: 0,
        y: 0,
        width: widthPt,
        height: heightPt,
        color: rgb(paper.r / 255, paper.g / 255, paper.b / 255)
    });
    
    const marginPt = state.margin * mmToPt;
    const cellPt = state.cellSize * mmToPt;
    const lineWidth = state.lineWeight * mmToPt;
    const gridColor = rgb(color.r / 255, color.g / 255, color.b / 255);
    
    // Calculate header offset for PDF (if enabled)
    const headerOffsetPt = state.showHeader ? 12 * mmToPt : 0;
    
    // Draw header if enabled
    if (state.showHeader) {
        drawHeaderPDF(page, widthPt, heightPt, marginPt, lineWidth, gridColor);
    }
    
    // Draw template to PDF
    switch (state.template) {
        case 'grid':
            drawGridPDF(page, widthPt, heightPt, marginPt, cellPt, lineWidth, gridColor, headerOffsetPt);
            break;
        case 'dot':
            drawDotGridPDF(page, widthPt, heightPt, marginPt, cellPt, lineWidth, gridColor, headerOffsetPt);
            break;
        case 'lined':
            drawLinedPDF(page, widthPt, heightPt, marginPt, cellPt, lineWidth, gridColor, headerOffsetPt);
            break;
        case 'cornell':
            drawCornellPDF(page, widthPt, heightPt, marginPt, cellPt, lineWidth, gridColor, headerOffsetPt);
            break;
        case 'calligraphy-cn':
            drawCalligraphyCNPDF(page, widthPt, heightPt, marginPt, lineWidth, gridColor, headerOffsetPt);
            break;
        case 'hobonichi':
            drawHobonichiPDF(page, widthPt, heightPt, marginPt, lineWidth, gridColor, headerOffsetPt);
            break;
        case 'genkoyoshi':
            drawGenkoyoshiPDF(page, widthPt, heightPt, marginPt, lineWidth, gridColor, headerOffsetPt);
            break;
        case 'blank':
            // Just the background
            break;
    }
    
    // Export
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `keisen-${state.template}-${state.device}.pdf`;
    a.click();
    
    URL.revokeObjectURL(url);
}

function drawGridPDF(page, width, height, margin, cell, lineWidth, color, headerOffset = 0) {
    const startX = margin;
    const startY = margin;  // PDF Y is from bottom
    const endX = width - margin;
    const endY = height - margin - headerOffset;
    
    // Calculate grid that fits evenly
    const availWidth = endX - startX;
    const availHeight = endY - startY;
    const cols = Math.floor(availWidth / cell);
    const rows = Math.floor(availHeight / cell);
    const gridWidth = cols * cell;
    const gridHeight = rows * cell;
    
    const offsetX = startX + (availWidth - gridWidth) / 2;
    const offsetY = startY;
    
    // Vertical lines
    for (let i = 0; i <= cols; i++) {
        const x = offsetX + i * cell;
        page.drawLine({
            start: { x, y: offsetY },
            end: { x, y: offsetY + gridHeight },
            thickness: lineWidth,
            color
        });
    }
    
    // Horizontal lines
    for (let i = 0; i <= rows; i++) {
        const y = offsetY + i * cell;
        page.drawLine({
            start: { x: offsetX, y },
            end: { x: offsetX + gridWidth, y },
            thickness: lineWidth,
            color
        });
    }
}

function drawDotGridPDF(page, width, height, margin, cell, lineWidth, color, headerOffset = 0) {
    const startX = margin;
    const startY = margin;
    const endX = width - margin;
    const endY = height - margin - headerOffset;
    
    const availWidth = endX - startX;
    const availHeight = endY - startY;
    const cols = Math.floor(availWidth / cell);
    const rows = Math.floor(availHeight / cell);
    const gridWidth = cols * cell;
    
    const offsetX = startX + (availWidth - gridWidth) / 2;
    const dotRadius = lineWidth * 1.5;
    
    for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
            page.drawCircle({
                x: offsetX + i * cell,
                y: startY + j * cell,
                size: dotRadius,
                color
            });
        }
    }
}

function drawLinedPDF(page, width, height, margin, cell, lineWidth, color, headerOffset = 0) {
    const startX = margin;
    const startY = margin;
    const endX = width - margin;
    const endY = height - margin - headerOffset;
    
    const availHeight = endY - startY;
    const rows = Math.floor(availHeight / cell);
    
    for (let i = 0; i <= rows; i++) {
        const y = startY + i * cell;
        page.drawLine({
            start: { x: startX, y },
            end: { x: endX, y },
            thickness: lineWidth,
            color
        });
    }
}

function drawCornellPDF(page, width, height, margin, cell, lineWidth, color, headerOffset = 0) {
    const startX = margin;
    const startY = margin;
    const endX = width - margin;
    const endY = height - margin - headerOffset;
    
    const cueWidth = (endX - startX) * 0.3;
    const summaryHeight = (endY - startY) * 0.15;
    
    // Main dividers
    page.drawLine({
        start: { x: startX + cueWidth, y: startY + summaryHeight },
        end: { x: startX + cueWidth, y: endY },
        thickness: lineWidth * 2,
        color
    });
    
    page.drawLine({
        start: { x: startX, y: startY + summaryHeight },
        end: { x: endX, y: startY + summaryHeight },
        thickness: lineWidth * 2,
        color
    });
    
    // Lined rules
    for (let y = startY + summaryHeight + cell; y < endY; y += cell) {
        page.drawLine({
            start: { x: startX + cueWidth + margin/2, y },
            end: { x: endX, y },
            thickness: lineWidth,
            color
        });
    }
}

function drawCalligraphyCNPDF(page, width, height, margin, lineWidth, color, headerOffset = 0) {
    const mmToPt = 2.835;
    const startX = margin;
    const startY = margin;
    const endX = width - margin;
    const endY = height - margin - headerOffset;
    
    const cellSize = state.cellSize * 3 * mmToPt;
    const availWidth = endX - startX;
    const availHeight = endY - startY;
    
    const cols = Math.floor(availWidth / cellSize);
    const rows = Math.floor(availHeight / cellSize);
    
    const gridWidth = cols * cellSize;
    const gridHeight = rows * cellSize;
    const offsetX = startX + (availWidth - gridWidth) / 2;
    const offsetY = startY + (availHeight - gridHeight) / 2;
    
    // Outer grid
    for (let i = 0; i <= cols; i++) {
        page.drawLine({
            start: { x: offsetX + i * cellSize, y: offsetY },
            end: { x: offsetX + i * cellSize, y: offsetY + gridHeight },
            thickness: lineWidth * 2,
            color
        });
    }
    
    for (let i = 0; i <= rows; i++) {
        page.drawLine({
            start: { x: offsetX, y: offsetY + i * cellSize },
            end: { x: offsetX + gridWidth, y: offsetY + i * cellSize },
            thickness: lineWidth * 2,
            color
        });
    }
    
    // Inner guidelines (米 pattern)
    const innerColor = { ...color };
    // Note: pdf-lib doesn't support opacity directly on lines, so we'll use thinner lines
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = offsetX + col * cellSize;
            const y = offsetY + row * cellSize;
            const cx = x + cellSize / 2;
            const cy = y + cellSize / 2;
            
            // Center lines
            page.drawLine({
                start: { x, y: cy },
                end: { x: x + cellSize, y: cy },
                thickness: lineWidth * 0.5,
                color
            });
            
            page.drawLine({
                start: { x: cx, y },
                end: { x: cx, y: y + cellSize },
                thickness: lineWidth * 0.5,
                color
            });
            
            // Diagonals
            page.drawLine({
                start: { x, y },
                end: { x: x + cellSize, y: y + cellSize },
                thickness: lineWidth * 0.5,
                color
            });
            
            page.drawLine({
                start: { x: x + cellSize, y },
                end: { x, y: y + cellSize },
                thickness: lineWidth * 0.5,
                color
            });
        }
    }
}

function drawHobonichiPDF(page, width, height, margin, lineWidth, color, headerOffset = 0) {
    const mmToPt = 2.835;
    const startX = margin;
    const startY = margin;
    const endX = width - margin;
    const endY = height - margin - headerOffset;
    
    const cellSize = 3.7 * mmToPt;
    const timeAxisWidth = 8 * mmToPt;
    
    const gridStartX = startX + timeAxisWidth;
    const availWidth = endX - gridStartX;
    const availHeight = endY - startY;
    
    const cols = Math.floor(availWidth / cellSize);
    const rows = Math.floor(availHeight / cellSize);
    const gridWidth = cols * cellSize;
    const gridHeight = rows * cellSize;
    
    // Very fine grid lines
    const fineLineWidth = 0.15 * mmToPt;
    const lightColor = PDFLib.rgb(
        color.red() * 0.6 + 0.4,
        color.green() * 0.6 + 0.4,
        color.blue() * 0.6 + 0.4
    );
    
    // Vertical lines
    for (let i = 0; i <= cols; i++) {
        const x = gridStartX + i * cellSize;
        page.drawLine({
            start: { x, y: startY },
            end: { x, y: startY + gridHeight },
            thickness: fineLineWidth,
            color: lightColor
        });
    }
    
    // Horizontal lines
    for (let i = 0; i <= rows; i++) {
        const y = startY + i * cellSize;
        page.drawLine({
            start: { x: gridStartX, y },
            end: { x: gridStartX + gridWidth, y },
            thickness: fineLineWidth,
            color: lightColor
        });
    }
}

function drawGenkoyoshiPDF(page, width, height, margin, lineWidth, color, headerOffset = 0) {
    const mmToPt = 2.835;
    const startX = margin;
    const startY = margin;
    const endX = width - margin;
    const endY = height - margin - headerOffset;
    
    const availWidth = endX - startX;
    const availHeight = endY - startY;
    
    const targetCols = 20;
    const cellSize = Math.min(availWidth / targetCols, 8 * mmToPt);
    
    const cols = Math.floor(availWidth / cellSize);
    const rows = Math.floor(availHeight / cellSize);
    const gridWidth = cols * cellSize;
    const gridHeight = rows * cellSize;
    
    const offsetX = startX + (availWidth - gridWidth) / 2;
    const offsetY = startY + (availHeight - gridHeight) / 2;
    
    // Outer border
    page.drawRectangle({
        x: offsetX,
        y: offsetY,
        width: gridWidth,
        height: gridHeight,
        borderColor: color,
        borderWidth: 0.4 * mmToPt
    });
    
    // Inner grid
    for (let i = 1; i < cols; i++) {
        const x = offsetX + i * cellSize;
        page.drawLine({
            start: { x, y: offsetY },
            end: { x, y: offsetY + gridHeight },
            thickness: 0.2 * mmToPt,
            color
        });
    }
    
    for (let i = 1; i < rows; i++) {
        const y = offsetY + i * cellSize;
        page.drawLine({
            start: { x: offsetX, y },
            end: { x: offsetX + gridWidth, y },
            thickness: 0.2 * mmToPt,
            color
        });
    }
}

// Start
init();
