
let xstart = 800;
let ystart = 300;


let width = 1000;
let height = 500;
let yend = ystart + height;

let data = [[1,5,Math.exp(1),"Wow"],[2,10,Math.exp(2),"Cool"],[3,15,Math.exp(3),"Epic"]];

let axes = [];
let tuple_data = []; 
//If we want to rearrange the axes
let order = [];

class Axis
{
    constructor()
    {
        //Name that will be used for referencing the axis
        this.name = null;

        //Position data in screen space
        this.x1 = null;
        this.y1 = null;
        this.x2 = null;
        this.y2 = null;
        
        //a lambda function that returns a real number between 0 and 1
        //depending on the parameter
        //if the parameter is a numerical value its output maps to 0 -> min and 1 -> max
        //if the parameter is a categorical value its output maps to 0 -> first item 1 -> last item
        // let min = 11.2; let max = 323.23;
        // let LookUpTable = new Set(["Red","Green","Magenta"]);
        //Example: let pos = axis.interpolation(23.1);
        //         pos = 0.038137
        //Example: let pos = axis.interpolation("Green");
        //         pos = 0.5
        this.interpolation = null;

        //Display-Color
        this.color = null;
    }
};

function initAxis()
{
    loadCSV();
    parseData();
}




//let table = [[1,5,Math.exp(1),"Wow"],[2,10,Math.exp(2),"Cool"],[3,15,Math.exp(3),"Epic"]];
// Data[0] => [1,2,3]
// Data[1] => [5,10,15]
// Data[2] => [2.71,...]
// Data[3] => ["Wow",
function createInterpolation(data)
{
    if ( data.length === 0)
    {
        throw new Error("createInterpolation: Data must not be empty");
    }
    
    let MIN_VALUE = Infinity;
    let MAX_VALUE = -Infinity;
        
    //Check whether data is numerical or categorical
    //isFinite() checks whether it is number
    //Make the assumption that the first element type is representative of every element in the tuple
    if(Number.isFinite(data[0]))
    {
        //If numerical then get the maximum and minimum data element
        for(const elem in data)
        {
            if ( elem < MIN_VALUE ) MIN_VALUE = elem;
            if ( elem > MAX_VALUE ) MAX_VALUE = elem;
        }

        return (x) => {
            return (x - MIN_VALUE) / (MAX_VALUE - MIN_VALUE);
        };
        
    }else
    {
    	//If categorial then put the data into map datastructure
    	//Get the total number of elements and save the order

        let ReferenceMap = new Map();
        let index = 0;
        for(const elem in data)
        {
            if(ReferenceMap.has(elem)) continue;
            ReferenceMap.set(elem, index++);
        }

        MIN_VALUE = 0;
        MAX_VALUE = ReferenceMap.size - 1;

        return (x) => {
            return (ReferenceMap.get(x)/MAX_VALUE);
        };
    }

}

function parseData()
{

    for (let i = 0; i < data[0].length; i++)
    {
        tuple_data.push([]);
        for( let j = 0 ; j < data.length; j++)
        {
            tuple_data[i].push(data[j][i]);
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
        tmp.interpolation = createInterpolation(tuple_data[i]);
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

        //draw axis
        ctx.beginPath();
        ctx.moveTo(x_pos, ystart);
        ctx.lineTo(x_pos, yend);
        ctx.strokeStyle = current_axis.color;
        ctx.stroke();

        if(i < axes.length - 1)
        {
            
        	//draw connections

            for(const data_tuple in data)
            {
                const value_current_axis = data_tuple[axis_pos_1];
                const value_next_axis = data_tuple[axis_pos_2];

                current_axis_x_pos = current_axis.interpolation(value_current_axis);
            }
             
            current_axis.interpolation(
            
        	//ctx.beginPath();
        	//ctx.moveTo(x_pos + distance, ystart);
        	//ctx.lineTo(x_pos + distance, yend);
        	//ctx.strokeStyle = next_axis;
        	//ctx.stroke();

        }
    }
}
