
document.addEventListener('DOMContentLoaded', init);


let canvas;
let ctx;
let down_state = false;

let parallelCoordinates_visual;


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

    parallelCoordinates_visual = new ParallelCoordinates(200,200,1400,900);
    parallelCoordinates_visual.parseData(example_data);
    
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


    parallelCoordinates_visual.selectData(evt.x, evt.y);
    window.requestAnimationFrame(draw);
}

function down(evt) {
    down_state = true;
 }

function up(evt) {
    down_state = false;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);



    parallelCoordinates_visual.render(ctx);

}
