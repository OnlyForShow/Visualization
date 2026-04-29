
let xstart = 800;
let ystart = 300;


let width = 1000;
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
        this.color = null;
    }
};

function initAxis()
{
    loadCSV();
    parseData();
}

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

class data_lookup_structure
{

}

function parseData()
{
   
    for (let data_set of data)
    {
        for( let i = 0 ; i < data_set.length; i++)
        {
            data_set[i]
        }
    }

    //assumption is here that first element represents the rest of the data set
    //TODO: replace it with evaluation function
    let number_of_axes = data[0].length;

    for( let i = 0; i < number_of_axes; i++)
    {
        tmp = new Axis();
        tmp.name = i + ".";
        
        //Set the interpolation function which calculates max and min of the data set
        tmp.interpolation = createInterpolation(data);
        tmp.color = "#000000";
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
    let distance = width/axes.length;
    //We draw 1 axis and the outgoing connections to the next axis
    for(let i = 0; i < axes.length; i++, x_pos+=distance)
    {
        let axis_pos_1 = order[i];
        let axis_pos_2 = order[i+1];
        
        let current_axis = axes[axis_pos_1];
        let next_axis = axes[axis_pos_2];

        //draw first axis
        ctx.beginPath();
        ctx.moveTo(x_pos, ystart);
        ctx.lineTo(x_pos, yend);
        ctx.strokeStyle = current_axis.color;
        ctx.stroke();

        if(i < axes.length - 1)
        {
            
        	//draw connections
        	//ctx.beginPath();
        	//ctx.moveTo(x_pos + distance, ystart);
        	//ctx.lineTo(x_pos + distance, yend);
        	//ctx.strokeStyle = next_axis;
        	//ctx.stroke();

        }
    }
}
