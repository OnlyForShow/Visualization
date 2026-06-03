
document.addEventListener('DOMContentLoaded', init);


let canvas;
let ctx;
let down_state = false;




function init() {
    canvas = document.createElement('canvas');
    canvas.style.margin = 0;
    canvas.style.backgroundColor = '#FAFAFA';

    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointerup', up)


    let body = document.getElementsByTagName('body')[0];
    body.appendChild(canvas);
    body.style.margin = 0;
    body.style.overflow = 'hidden';

    ctx = canvas.getContext('2d');

    resize();
    window.addEventListener('resize', resize);

    initAxis();
    
    window.requestAnimationFrame(draw);
}

function resize() {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    window.requestAnimationFrame(draw);
}

function move(evt) {
    //if (!down_state) return;
    //
    //ctx.beginPath();
    //ctx.arc(evt.x * window.devicePixelRatio, evt.y*window.devicePixelRatio, 4, 0, Math.PI * 2);
    //ctx.arc(evt.x, evt.y, 4, 0, Math.PI * 2);
    //ctx.fill();
}

function down(evt) {
    down_state = true;
}

function up(evt) {
    down_state = false;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);


    drawAxes(ctx);

}
