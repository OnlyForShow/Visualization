
let xstart = 500;
let ystart = 100;


let width = 1000;
let height = 500;
let yend = ystart + height;

let data = [[1,5,Math.exp(1),"Wow"],
            [2,10,Math.exp(2),"Cool"],
            [3,15,Math.exp(3),"Epic"],
            [4,20,Math.exp(4),"Epic"],
            [5,25,Math.exp(5),"Wow"],
            [6,30,Math.exp(6),"Wow"],
            [7,35,Math.exp(7),"Super"],
            [8,40,Math.exp(8),"Zapper"],
            [9,45,Math.exp(9),"Wow"],
           ];




class ParallelCoordinates
{
    constructor(x,y,width,height)
    {
        this.axes = []; // Axis []
        this.axes_order = []; // int []

        this.data_line_segments = []; // LineSegment [][]
        
        this.width = width;
        this.height = height;

        this.x_pos = x;
        this.y_pos = y;
    }

    parseData(data)
    {
        this.data = data;
        let tuple_data = []
        for (let i = 0; i < this.data[0].length; i++)
    	{
    	    tuple_data.push([]);
    	    for( let j = 0 ; j < data.length; j++)
    	    {
    	        tuple_data[i].push(this.data[j][i]);
    	    }
    	}
    	
    	//assumption is here that first element represents the rest of the data set
    	//TODO: replace it with evaluation function
    	let number_of_axes = this.data[0].length;

        //Generate Axis
    	for( let i = 0; i < number_of_axes; i++)
    	{
    	    current_axis = new Axis();
    	    current_axis.name = i + ".";
    	    
    	    //Set the interpolation function which calculates max and min of the data set
    	    current_axis.interpolation = createInterpolation(current_axis, tuple_data[i]);
    	    current_axis.color = "#000000";
    	    this.axes.push(current_axis);
    	    
    	    // Order position
    	    this.axes_order.push(i);
    	
    	}

        //Generate LineSegments
        for( let i = 0; i < number_of_axes - 1; i++)
        {
            for(let j = 0; j < data.length; j++)
            {

                	const value_current_axis = data[j][axis_pos_1];
                	const value_next_axis = data[j][axis_pos_2];
                	
                	console.log(axis_pos_1);
                	console.log(axis_pos_2);
                	console.log(value_current_axis);
                	console.log(value_next_axis);
                	
                	
                	const current_axis_relative_pos = current_axis.interpolation(value_current_axis);
                	const next_axis_relative_pos = next_axis.interpolation(value_next_axis);
                	
                	
                	
                	
                	const y_current = current_axis_relative_pos * (yend - ystart) + ystart;
                	const y_next = next_axis_relative_pos * (yend - ystart) + ystart;
                	
                	
                	
                	ctx.beginPath();
                	ctx.moveTo(x_pos, y_current);
                	ctx.lineTo(x_pos + distance, y_next);
                	ctx.strokeStyle = "#000000";
                	ctx.stroke();

            

            }
        }
        
    }

    render(ctx)
    {

    }

    renderAxis(ctx)
    {

    }

    renderSegments(ctx)
    {
            
    

    
    }

}

class LineSegment
{
    // e.g. color = "#000000" Black
    //               #RRGGBB
    constructor(x1,y1,x2,y2,color,tuple)
    {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.tuple = tuple; // reference of the data tuple
        this.color = color; // String
        
    }
}

class Axis
{
    constructor(name, x1, y1, x2, y2, data_tuple)
    {
        //Name that will be used for referencing the axis
        this.name = name;

        //Position data in parallel_coordinate screen space
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        
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

        this.max_value = null;
        this.min_value = null;

        this.data = null;
        
        //Display-Color
        this.color = null;
    }

    render(ctx)
    {
                //draw axis
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1, y2);
        ctx.strokeStyle = current_axis.color;
        ctx.stroke();
        ctx.closePath();

        //Render max_value,min_value and name of axis
        //min
        ctx.font = "30px Arial";
        ctx.textBaseline = "bottom";
        ctx.textAlign = "center";
        ctx.fillText(String(current_axis.min_value), x1 ,y1);

        //max
        ctx.font = "30px Arial";
        ctx.textBaseline = "top";
        ctx.textAlign = "center";
        ctx.fillText(String(current_axis.max_value), x1 ,y2 );

        //Name
        ctx.font = "40px Arial";
        ctx.textBaseline = "top";
        ctx.textAlign = "center";
        ctx.fillText(current_axis.name, x1 ,y2 + 40);

                
        //Draw value in between
        ctx.font = "20px Arial";
        ctx.textBaseline = 0;
        ctx.textAlign = 0;


    }
    
};






//let table = [[1,5,Math.exp(1),"Wow"],[2,10,Math.exp(2),"Cool"],[3,15,Math.exp(3),"Epic"]];
// Data[0] => [1,2,3]
// Data[1] => [5,10,15]
// Data[2] => [2.71,...]
// Data[3] => ["Wow",
function createInterpolation(axis, __data)
{
    if ( __data.length === 0)
    {
        throw new Error("createInterpolation: Data must not be empty");
    }
    
    let MIN_VALUE = Infinity;
    let MAX_VALUE = -Infinity;
        
    //Check whether data is numerical or categorical
    //isFinite() checks whether it is number
    //Make the assumption that the first element type is representative of every element in the tuple
    if(Number.isFinite(__data[0]))
    {
        //If numerical then get the maximum and minimum data element
        for(const elem of __data)
        {
            if ( elem < MIN_VALUE ) MIN_VALUE = elem;
            if ( elem > MAX_VALUE ) MAX_VALUE = elem;
        }

        axis.min_value = MIN_VALUE.toFixed(2);
        axis.max_value = MAX_VALUE.toFixed(2);
        
        return (x) => {
            
            console.log("Numerical  x: "+x+" (x - MIN_VALUE) / (MAX_VALUE - MIN_VALUE): " + (x - MIN_VALUE) / (MAX_VALUE - MIN_VALUE));
            console.log("MAX_VALUE: "+MAX_VALUE+"   MIN_VALUE: "+MIN_VALUE);
            return (x - MIN_VALUE) / (MAX_VALUE - MIN_VALUE);
        };
        
    }else
    {
    	//If categorial then put the data into map datastructure
    	//Get the total number of elements and save the order

        let ReferenceMap = new Map();
        let index = 0;

        let first_element = __data[0];
        let last_element = null;
        
        for(const elem of __data)
        {
            console.log("DATA: "+__data);
            console.log("elem: "+elem);
            if(ReferenceMap.has(elem)) continue;
            ReferenceMap.set(elem, index++);
            last_element = elem;
        }

        MIN_VALUE = 0;
        MAX_VALUE = ReferenceMap.size - 1;

        axis.min_value = first_element;
        axis.max_value = last_element;
        
        return (x) => {
            console.log("Categorical  x: "+x+" (ReferenceMap.get(x)/MAX_VALUE): " + (ReferenceMap.get(x)/MAX_VALUE));
            console.log("MAX_VALUE: "+MAX_VALUE+"   ReferenceMap.get(x): "+ReferenceMap.get(x));            
            return (ReferenceMap.get(x)/MAX_VALUE);
        };
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

        
        
        
        if(i < axes.length - 1)
        {

        	//draw connections

             
            
          
        }
        
    }
}
