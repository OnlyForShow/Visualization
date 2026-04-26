
let xstart = 300;
let ystart = 300;

let width = 500;
let height = 500;

let data = [[1,5,Math.exp(1)],[2,10,Math.exp(2)],[3,15,Math.exp(3)]];

//If we want to rearrange the axes
let order = new Map();

let axes = [];

function parseData()
{
   
    for (let data_set of data)
    {
        for( let i = 0 ; i < data_set.length; i++)
        {
            
        }
    }

    let number_of_axes = data[0].length;

    //Set 
    order.set();
    
}

function loadCSV()
{
    
}

function drawAxes()
{
    //We draw 2 axes and the connections between them
    for(let i = 0; i < axises.length - 1; i++)
    {
        let axis_pos_1 = order.get(i);
        let axis_pos_2 = order.get(i+1);
        
        let current_axis = axes[axis_pos_1];
        let next_axis = axes[axis_pos_2];

        
    }
}
