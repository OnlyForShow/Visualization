
document.addEventListener('DOMContentLoaded', init);



let parallelCoordinates_visual;
let CSVInput;

let dragging = false;

function init() {




    

    parallelCoordinates_visual = new ParallelCoordinates(0,0,window.innerWidth * window.devicePixelRatio,
                                                         window.innerHeight * window.devicePixelRatio);



    parallelCoordinates_visual.parseData(example_data);
    
    
        

   



    CSVInput = document.createElement("input");
    CSVInput.addEventListener("change", loadAndProcessCSV);
    CSVInput.type = "file";

    
    let body = document.getElementsByTagName('body')[0];
    body.appendChild(CSVInput);
    parallelCoordinates_visual.attachToBody(body);
    body.style.margin = 0;
    body.style.overflow = 'hidden';

    parallelCoordinates_visual.addEventListener('pointermove', move);
    parallelCoordinates_visual.addEventListener('pointerdown', down);
    parallelCoordinates_visual.addEventListener('pointerup', up);

    parallelCoordinates_visual.addEventListener("wheel", mouse_wheel);
    

    window.addEventListener('resize', resize);
    resize();
    
    //window.requestAnimationFrame(draw);
}

function resize() {

    parallelCoordinates_visual.resizeCanvas();
    window.requestAnimationFrame(draw);
}

function mouse_wheel(e)
{
    console.log("deltaX: "+e.deltaX);
    console.log("deltaY: "+e.deltaY);
    console.log("deltaMode: "+e.deltaMode);


    e.preventDefault();
}

function up(evt)
{

    dragging = false;
    
    const canvas = parallelCoordinates_visual.getBackgroundCanvas();
    const rect = canvas.getBoundingClientRect();
    
    parallelCoordinates_visual.selectData(evt.x*window.devicePixelRatio - rect.x,
                                          evt.y*window.devicePixelRatio - rect.y,
                                          );
    window.requestAnimationFrame(draw);
}

function down(evt)
{


    dragging = true;
    
    const canvas = parallelCoordinates_visual.getBackgroundCanvas();
    const rect = canvas.getBoundingClientRect();
    
    parallelCoordinates_visual.selectData(evt.x*window.devicePixelRatio - rect.x,
                                          evt.y*window.devicePixelRatio - rect.y,
                                          );
    window.requestAnimationFrame(draw);
}

function move(evt) {

    
    
    const canvas = parallelCoordinates_visual.getBackgroundCanvas();
    const rect = canvas.getBoundingClientRect();

    if(dragging)
    {
        
    }
    
    parallelCoordinates_visual.selectData(evt.x*window.devicePixelRatio - rect.x,
                                          evt.y*window.devicePixelRatio - rect.y,
                                          );
    window.requestAnimationFrame(draw);
}



function draw() {

    parallelCoordinates_visual.render();

}

function loadAndProcessCSV(evt)
{
    const file = evt.target.files[0];
    if(!file) return;

    parallelCoordinates_visual.parseCSV(file);
    window.requestAnimationFrame(draw);
}
