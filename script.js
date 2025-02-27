const canvas = document.getElementById("drawCanvas");
const ctx = canvas.getContext("2d");

let strokes = [];
let currentStroke = [];
let isDrawing = false;
let clusters = [];
let needsRedraw = false;

// **Resize Canvas to Full Screen**
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    needsRedraw = true;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas(); // Initial resize

// **Prevent Scrolling & Pull-to-Refresh**
document.addEventListener("touchmove", (e) => {
    if (isDrawing) e.preventDefault(); // Disable scrolling while drawing
}, { passive: false });


canvas.addEventListener("pointerdown", startDrawing);
canvas.addEventListener("pointermove", draw);
canvas.addEventListener("pointerup", stopDrawing);

// **Start Drawing**
function startDrawing(e) {
    isDrawing = true;
    currentStroke = [];
    strokes.push(currentStroke);
    addPoint(e);
    needsRedraw = true;
}

// **Draw in Real-Time**
function draw(e) {
    if (!isDrawing) return;
    addPoint(e);
    drawStroke(currentStroke); // Real-time stroke rendering
}

// **Stop Drawing & Cluster Objects**
function stopDrawing() {
    isDrawing = false;
    updateClusters();
}

// **Add Point to Current Stroke**
function addPoint(e) {
    const rect = canvas.getBoundingClientRect();
    currentStroke.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
    });
}

// **Efficient Redraw Function**
function redraw() {
    if (!needsRedraw) {
        requestAnimationFrame(redraw);
        return;
    }
    needsRedraw = false;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    clusters.forEach((cluster) => {
        const color = getRandomColor();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        cluster.forEach((stroke) => drawStroke(stroke));

        // Draw bounding box
        const { xMin, yMin, xMax, yMax } = getBoundingBox(cluster);
        ctx.strokeStyle = color;
        ctx.strokeRect(xMin, yMin, xMax - xMin, yMax - yMin);
    });

    requestAnimationFrame(redraw);
}

// **Real-Time Stroke Drawing**
function drawStroke(stroke) {
    if (stroke.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
    }
    ctx.stroke();
}

// **Update Clusters Only When Needed**
function updateClusters() {
    clusters = clusterStrokes(strokes, 30);
    needsRedraw = true;
}

// **Cluster Strokes Based on Proximity**
function clusterStrokes(strokes, threshold) {
    let clusters = [];

    strokes.forEach((stroke) => {
        let added = false;
        for (let cluster of clusters) {
            if (isClose(stroke, cluster, threshold)) {
                cluster.push(stroke);
                added = true;
                break;
            }
        }
        if (!added) clusters.push([stroke]);
    });

    return clusters;
}

// **Check if Stroke is Close to Cluster**
function isClose(stroke, cluster, threshold) {
    return cluster.some(
        (existingStroke) =>
            distanceBetweenStrokes(stroke, existingStroke) < threshold
    );
}

// **Compute Minimum Distance Between Two Strokes**
function distanceBetweenStrokes(stroke1, stroke2) {
    return Math.min(
        ...stroke1.map((p1) =>
            Math.min(...stroke2.map((p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y)))
        )
    );
}

// **Compute Bounding Box for a Cluster**
function getBoundingBox(cluster) {
    let xMin = Infinity,
        yMin = Infinity,
        xMax = -Infinity,
        yMax = -Infinity;
    cluster.flat().forEach((p) => {
        xMin = Math.min(xMin, p.x);
        yMin = Math.min(yMin, p.y);
        xMax = Math.max(xMax, p.x);
        yMax = Math.max(yMax, p.y);
    });
    return { xMin, yMin, xMax, yMax };
}

// **Generate a Random Color**
function getRandomColor() {
    return `hsl(${Math.random() * 360}, 100%, 50%)`;
}

// **Start Animation Loop**
requestAnimationFrame(redraw);
