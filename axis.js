    

let example_data = [[1,5,Math.exp(1),"Wow"],
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

        this.border_x = 50; //in px 
        this.border_y = 50; //in px 

        this.xstart = this.x_pos + this.border_x;
        this.xend = this.width - this.border_x;

        
        this.ystart = this.y_pos + this.border_y;
        this.yend = this.height - this.border_y;

        this.number_of_axes = 0;
        
        this.distance =  0;

        this.selectedLine = -1;

        // tuple_index -> [[LineSegment1, LineSegment2, ...] ,[...]]
        this.lines_of_tuple = []
        
    }

    reset_visualization()
    {
        this.axes = []; // Axis []
        this.axes_order = []; // int []

        this.data_line_segments = []; // LineSegment [][]
        

        this.number_of_axes = 0;
        
        this.distance =  0;

        this.selectedLine = -1;

        // tuple_index -> [[LineSegment1, LineSegment2, ...] ,[...]]
        this.lines_of_tuple = []

    }

    parseCSV(CSV_file)
    {
        Papa.parse(CSV_file, {
            header : false,
            skipEmptyLines : true,
            complete : (results) =>
            {
                this.parseData(results.data);
            }
        });
    }
    
    parseData(data)
    {
        this.reset_visualization();
        
        this.data = data;
        let tuple_data = []
        console.log(data);
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
    	this.number_of_axes = this.data[0].length;

        
        for(let it = 0; it < this.data.length; it++)
        {
            this.lines_of_tuple.push(new Array());
        }


        
        //Determine distance
        this.distance = (this.width - 2 * this.border_x) / (this.number_of_axes - 1);


        //Generate Axis
    	for( let i = 0; i < this.number_of_axes; i++)
    	{
            //constructor(name, x1, y1, x2, y2, color, data_tuple)
    	    let current_axis = new Axis(String(i + "."), //name
                                        this.x_pos + this.border_x + this.distance * i,
                                        this.y_pos + this.border_y,
                                        this.x_pos + this.border_x + this.distance * (i + 1),
                                        this.height - this.border_y,
                                        "#000000",
                                        tuple_data[i]
                                       );
            


    	    this.axes.push(current_axis);
    	    
    	    // Order position
    	    this.axes_order.push(i);
    	
    	}

        //Generate LineSegments
        for( let i = 0; i < this.number_of_axes - 1; i++)
        {
            this.data_line_segments.push([]);
            

            let current_axis = this.axes[this.axes_order[i]];
            let next_axis = this.axes[this.axes_order[i+1]];

            const x_pos = current_axis.x1;
            const x_pos_next = next_axis.x1;
            
            for(let j = 0; j < data.length; j++)
            {

                const value_current_axis = data[j][this.axes_order[i]];
                const value_next_axis = data[j][this.axes_order[i+1]];

                	
                const current_axis_relative_pos = current_axis.interpolation(value_current_axis);
                const next_axis_relative_pos = next_axis.interpolation(value_next_axis);
                	
                	
                	
                const y_current = current_axis_relative_pos * (this.yend - this.ystart) + this.ystart;
                const y_next = next_axis_relative_pos * (this.yend - this.ystart) + this.ystart;
                
                
                let line_segment = new LineSegment(x_pos, y_current,                //x1, y1
                                                   x_pos_next, y_next,              //x2, y2
                                                   "#000000",                       //color
                                                   j                                //tuple-reference
                                                   
                                                  );
                
                this.data_line_segments[i].push(line_segment); 

                this.lines_of_tuple[j].push(this.data_line_segments[i][this.data_line_segments[i].length - 1]);

            }
        }

    
        
    }
    
    render(ctx)
    {

        //set background
        ctx.fillStyle = "#AAAAAA";
        ctx.fillRect(this.x_pos, this.y_pos, this.width, this.height);

        ctx.fillStyle = "#000000";
        


        //render LineSegment
        for(const arr of this.data_line_segments)
        {
            for(const line_segment of arr)
            {
                
                ctx.fillStyle = "#000000";
                ctx.beginPath();
                ctx.moveTo(line_segment.x1, line_segment.y1);
                ctx.lineTo(line_segment.x2, line_segment.y2);
                ctx.strokeStyle = line_segment.color;
                ctx.stroke();
                ctx.closePath();

            }

        }

        //render selected axis


        if(this.selectedLine != -1)
        {
            const lines = this.lines_of_tuple[this.selectedLine];


            
            for(const line_segment of lines)
            {

                ctx.beginPath();
                ctx.moveTo(line_segment.x1, line_segment.y1);
                ctx.lineTo(line_segment.x2, line_segment.y2);
                ctx.strokeStyle = "red";
                ctx.stroke();
                ctx.closePath();

            }
        } 
        //render axes
        for(let it = 0; it < this.number_of_axes; it++)
        {
            let current_axis = this.axes[this.axes_order[it]];

            current_axis.render(ctx);
        }
    }
    //selectData(int, int)
    selectData(mouse_x, mouse_y)
    {
        //GetSegment

        
        const p_x = mouse_x - this.xstart;
        const p_y = mouse_y - this.ystart;

        const segment = Math.floor(p_x / this.distance);



        if(segment >= this.number_of_axes - 1 || segment < 0)return;
        
        const segment_lines = this.data_line_segments[segment];

        let d_min = Infinity;
        let min_line_segment = null;
        //choose closest line
        for(let line_segment of segment_lines)
        {

            let nenner = ((line_segment.x2 - line_segment.x1)**2 + (line_segment.y2 - line_segment.y1)**2);
            
            let d = Math.abs((line_segment.y2 - line_segment.y1)*mouse_x -
                             (line_segment.x2 - line_segment.x1)*mouse_y +
                             (line_segment.x2 * line_segment.y1) -
                             (line_segment.y2 * line_segment.x1));

            d /= nenner;


            if(d < d_min)
            {
                d_min = d;
                min_line_segment = line_segment;
            }
        }

        
        if(min_line_segment != null)
            this.selectedLine = min_line_segment.tuple;


        
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
        this.tuple = tuple; // index of the data tuple
        this.color = color; // String
    }
}

const max_number_of_inbetween_values_of_axis = 10;

class Axis
{
    
    
    constructor(name, x1, y1, x2, y2, color, data_tuple)
    {
        //Name that will be used for referencing the axis
        this.name = name;

        //Position data in parallel_coordinate screen space
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;


        // this data field will be either a ReferenceMap or a number
        this.category = "";
        this.data = null;

        this.max_value = null;
        this.min_value = null;

        
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
        this.interpolation = this.createInterpolation(data_tuple);


       

        
        //Display-Color
        this.color = color;
    }


    //let table = [[1,5,Math.exp(1),"Wow"],[2,10,Math.exp(2),"Cool"],[3,15,Math.exp(3),"Epic"]];
    // table[0] => [1,2,3]
    // table[1] => [5,10,15]
    // table[2] => [2.71,...]
    // table[3] => ["Wow",...]
    createInterpolation(data)
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
        if(Number(data[0]) != NaN && Number.isFinite(Number(data[0])))
        {
            //If numerical then get the maximum and minimum data element
            for(const elem of data)
            {
                if ( elem < MIN_VALUE ) MIN_VALUE = Number(elem);
                if ( elem > MAX_VALUE ) MAX_VALUE = Number(elem);
            }

            this.min_value = MIN_VALUE;
            this.max_value = MAX_VALUE;

            this.category = "Number";
            this.data = 0;
            
            return (x) => {
                
                return (x - MIN_VALUE) / (MAX_VALUE - MIN_VALUE);
            };
            
        }else
        {
    	    //If categorial then put the data into map datastructure
    	    //Get the total number of elements and save the order

            let ReferenceMap = new Map();

            //Categorical data get a ReferenceMap
            this.category = "ReferenceMap";
            this.data = ReferenceMap;
            
            let index = 0;

            let first_element = data[0];
            let last_element = null;
            
            for(const elem of data)
            {
                if(ReferenceMap.has(elem)) continue;
                ReferenceMap.set(elem, index++);
                last_element = elem;
            }

            MIN_VALUE = 0;
            MAX_VALUE = ReferenceMap.size - 1;

            this.min_value = first_element;
            this.max_value = last_element;

            this.data = ReferenceMap;
            
            return (x) => {
                return (ReferenceMap.get(x)/MAX_VALUE);
            };
        }

    }


    render(ctx)
    {
        //draw axis
        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x1, this.y2);
        ctx.strokeStyle = this.color;
        ctx.stroke();
        ctx.closePath();

        ////Render max_value,min_value and name of axis
        ////min
        //ctx.font = "30px Arial";
        //ctx.textBaseline = "bottom";
        //ctx.textAlign = "center";
        //ctx.fillText(String(this.min_value), this.x1 ,this.y1);

        ////max
        //ctx.font = "30px Arial";
        //ctx.textBaseline = "top";
        //ctx.textAlign = "center";
        //ctx.fillText(String(this.max_value), this.x1 ,this.y2 );
        //
        ////Name
        //ctx.font = "40px Arial";
        //ctx.textBaseline = "top";
        //ctx.textAlign = "center";
        //ctx.fillText(this.name, this.x1 ,this.y2 + 40);

                
        //Draw value in between 
        ctx.font = "14px Arial";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center ";


        let counter = 0;
        let distance = 0;
        
        if(this.category == "ReferenceMap")
        {
            distance = (this.y2 - this.y1)/(this.data.size-1);

            for(const elem of this.data.keys())
            {
                ctx.fillText(elem, this.x1, this.y1 + distance * counter);
                counter++;               
            }
            
        }else if(this.category == "Number")
        {
            distance = (this.y2 - this.y1)/(max_number_of_inbetween_values_of_axis-1);
            const d_value = (this.max_value - this.min_value)/(max_number_of_inbetween_values_of_axis-1);



            let elem = this.min_value;
            for(let counter = 0; counter < 10; counter++)
            {
            
                ctx.fillText(elem.toFixed(2), this.x1, this.y1 + distance * counter);
                elem+=d_value
            }
        }
            

    }
    
}








function loadCSV()
{
    
}
