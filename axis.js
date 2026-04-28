
let xstart = 300;
let ystart = 300;


let width = 500;
let height = 500;
let yend = ystart + height;

let data = [[1,5,Math.exp(1)],[2,10,Math.exp(2)],[3,15,Math.exp(3)]];

//If we want to rearrange the axes
let order = [];

class Axis
{
    constructor()
    {
        this.name = null;
        this.interpolation = null;
    }
};

let axes = [];

function createInterpolation(data)
{
    //Check whether data is numerical or categorical

    //If numerical then get the maximum and minimum data element

    //If categorial then put the data into set datastructure
    //Get the total number of elements and save the order
    //the set-elements by converting it to an array
    //store this array or set in a seperate data structure
}

function parseData()
{
   
    //for (let data_set of data)
    //{
    //    for( let i = 0 ; i < data_set.length; i++)
    //    {
    //        
    //    }
    //}
    //
    //let number_of_axes = data[0].length;

    for( let i = 0; i < 5; i++)
    {
        tmp = new Axis();
        tmp.name = i + ".";
        
        //Set the interpolation function which calculates max and min of the data set
        tmp.interpolation = createInterpolation(data);
        
        axes.push(tmp);
        
        //Map
        order.push(i);

    }
        
}

function loadCSV()
{
    
}

function drawAxes(ctx)
{
    let x_pos = xstart;
    let distance = width/axises.length;
    //We draw 2 axes and the connections between them
    for(let i = 0; i < axises.length - 1; i++, x_pos+=distance)
    {
        let axis_pos_1 = order.get(i);
        let axis_pos_2 = order.get(i+1);
        
        let current_axis = axes[axis_pos_1];
        let next_axis = axes[axis_pos_2];

        //draw first axis
        ctx.beginPath();
        ctx.moveTo(x_pos, ystart);
        ctx.lineTo(x_pos, yend);
        ctx.strokeStyle = '#ff9999';
        ctx.stroke();

        //draw second axis
        ctx.beginPath();
        ctx.moveTo(x_pos + distance, ystart);
        ctx.lineTo(x_pos + distance, yend);
        ctx.strokeStyle = '#ff9999';
        ctx.stroke();

    }
}
