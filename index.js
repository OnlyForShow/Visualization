
document.addEventListener('DOMContentLoaded', init);



let parallelCoordinates_visual;


function init() {




    
    parallelCoordinates_visual = new ParallelCoordinates(200,200,1400,900);
    parallelCoordinates_visual.parseData(example_data);
    
    
        

   



    CSVInput = document.createElement("input");
    CSVInput.addEventListener("change", loadAndProcessCSV);
    CSVInput.type = "file";

    
    let body = document.getElementsByTagName('body')[0];
    body.appendChild(CSVInput);
    parallelCoordinates_visual.attachToBody(body);
    body.style.margin = 0;
    body.style.overflow = 'hidden';

    parallelCoordinates_visual.addEventListener('pointermove', move)
    
    
    resize();
    window.addEventListener('resize', resize);

    
    window.requestAnimationFrame(draw);
}

function resize() {

    parallelCoordinates_visual.resizeCanvas();
    window.requestAnimationFrame(draw);
}

function move(evt) {

    let canvas = parallelCoordinates_visual.getBackgroundCanvas();
    const rect = canvas.getBoundingClientRect();
    
    parallelCoordinates_visual.selectData(evt.x - rect.x, evt.y - rect.y);
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
