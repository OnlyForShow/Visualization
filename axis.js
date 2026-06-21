                                                  

let example_data = [["id","id*5","e^id","Comment"],
                    [1,5,Math.exp(1),"Wow"],
                    [2,10,Math.exp(2),"Cool"],
                    [3,15,Math.exp(3),"Epic"],
                    [4,20,Math.exp(4),"Epic"],
                    [5,25,Math.exp(5),"Wow"],
                    [6,30,Math.exp(6),"Wow"],
                    [7,35,Math.exp(7),"Super"],
                    [8,40,Math.exp(8),"Zapper"],
                    [9,45,Math.exp(9),"Wow"],
                   ];

const global_axis_color           = "222222";
const global_line_segment_color   = "000000";
const global_selected_line_color  = "red";
const global_selection_text_color = "white";
const global_axis_text_color      = "white";

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

        this.border_x = width*0.1; //in px 
        this.border_y = height*0.1; //in px 

        this.xstart = this.x_pos + this.border_x;
        this.xend = this.width - this.border_x;

        
        this.ystart = this.y_pos + this.border_y;
        this.yend = this.y_pos + this.height - this.border_y;

        this.number_of_axes = 0;
        
        this.distance =  0;

        this.selectedLine = -1;

        // tuple_index -> [[LineSegment1, LineSegment2, ...] ,[...]]
        this.lines_of_tuple = []

        this.backgroundCanvas0 = document.createElement('canvas');
        this.axisCanvas1 = document.createElement('canvas');
        this.linesegmentCanvas2 = document.createElement('canvas');
        this.selectedlineCanvas3 = document.createElement('canvas');
        this.zoomCanvas4 = document.createElement('canvas');

        this.background_redraw = true;
        this.axis_redraw = true;
        this.linesegment_redraw = true;
        this.selectedline_redraw = true;
        this.zoom_redraw = true; 
        
        this.backgroundCtx0 = this.backgroundCanvas0.getContext('2d');
        this.axisCtx1 = this.axisCanvas1.getContext('2d');
        this.linesegmentCtx2 = this.linesegmentCanvas2.getContext('2d');
        this.selectedlineCtx3 = this.selectedlineCanvas3.getContext('2d');
        this.zoomCtx4 = this.zoomCanvas4.getContext('2d');

        this.container = null;

        
    }

    addEventListener(type, func)
    {
        this.container.addEventListener(type, func);
    }
    
    getBackgroundCanvas()
    {
        return this.backgroundCanvas0;
    }
    
    attachToBody(body)
    {
        this.container = document.createElement("div");

        body.appendChild(this.container);
        
        this.container.style = 'relative';
        
        const canvas_list = [this.backgroundCanvas0,
                             this.linesegmentCanvas2,
                             this.axisCanvas1,
                             this.selectedlineCanvas3,
                             this.zoomCanvas4
                            ];

        for(let it = 0; it < canvas_list.length; it++)
        {
            const c = canvas_list[it];
            c.style.position = "absolute";
            c.style.left = "0";
            c.style.right = "0";
            c.style.zIndex = it;

            this.container.appendChild(c);
        }
        

    }
    
    resizeCanvas()
    {
        const canvas_list = [this.backgroundCanvas0,
                       this.axisCanvas1,
                       this.linesegmentCanvas2,
                       this.selectedlineCanvas3,
                       this.zoomCanvas4
                      ];
        
        let canvas = null;
        for(let it = 0; it < canvas_list.length; it++)
        {
            canvas = canvas_list[it];
            canvas.width = window.innerWidth * window.devicePixelRatio;
            canvas.height = window.innerHeight * window.devicePixelRatio;
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';
        }

        this.background_redraw = true;
        this.axis_redraw = true;
        this.linesegment_redraw = true;
        this.selectedline_redraw = true;
        this.zoom_redraw = true;

        this.width = this.backgroundCanvas0.width;
        this.height = this.backgroundCanvas0.height;
        
        this.border_x = this.width*0.1; //in px 
        this.border_y = this.height*0.1; //in px 

        this.xstart = this.x_pos + this.border_x;
        this.xend = this.width - this.border_x;

        
        this.ystart = this.y_pos + this.border_y;
        this.yend = this.y_pos + this.height - this.border_y;

        this.calculatePosition();
        
    }
    
    resetVisualization()
    {
        this.axes = []; // Axis []
        this.axes_order = []; // int []

        this.data_line_segments = []; // LineSegment [][]
        

        this.number_of_axes = 0;
        
        this.distance =  0;

        this.selectedLine = -1;

        // tuple_index -> [[LineSegment1, LineSegment2, ...] ,[...]]
        this.lines_of_tuple = []

        this.background_redraw = true;
        this.axis_redraw = true;
        this.linesegment_redraw = true;
        this.selectedline_redraw = true;
        this.zoom_redraw = true; 

    }

    parseCSV(CSV_file)
    {
        Papa.parse(CSV_file, {
            header : false,
            skipEmptyLines : true,
            worker : true,
            complete : (results) =>
            {
                this.parseData(results.data);
            }
        });
    }



    // data[0][i] are the header values
    parseData(data)
    {
        this.resetVisualization();
        
        this.data = data;
        let tuple_data = []
        console.log(data);
        for (let i = 0; i < this.data[0].length; i++)
    	{
    	    tuple_data.push([]);
    	    for( let j = 1 ; j < data.length; j++)
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
    	    let current_axis = new Axis(this.data[0][i], //name
                                        this.x_pos + this.border_x + this.distance * i,
                                        this.y_pos + this.border_y,
                                        this.x_pos + this.border_x + this.distance * i,
                                        this.y_pos + this.height - this.border_y,
                                        global_axis_color,
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
            
            for(let j = 1; j < data.length; j++)
            {

                const value_current_axis = data[j][this.axes_order[i]];
                const value_next_axis = data[j][this.axes_order[i+1]];

                	
                const current_axis_relative_pos = current_axis.interpolation(value_current_axis);
                const next_axis_relative_pos = next_axis.interpolation(value_next_axis);
                	
                	
                	
                const y_current = this.yend - current_axis_relative_pos * (this.yend - this.ystart);
                const y_next = this.yend - next_axis_relative_pos * (this.yend - this.ystart);
                
                
                let line_segment = new LineSegment(x_pos, y_current,                //x1, y1
                                                   x_pos_next, y_next,              //x2, y2
                                                   global_line_segment_color,       //color
                                                   j                                //tuple-reference
                                                  );
                
                this.data_line_segments[i].push(line_segment); 

                this.lines_of_tuple[j].push(this.data_line_segments[i][this.data_line_segments[i].length - 1]);

            }
        }

    
        
    }

    calculatePosition()
    {

        //Determine distance
        this.distance = (this.width - 2 * this.border_x) / (this.number_of_axes - 1);


        //Generate Axis
    	for( let i = 0; i < this.number_of_axes; i++)
    	{
            //constructor(name, x1, y1, x2, y2, color, data_tuple)

    	    this.axes[i].x1 = this.x_pos + this.border_x + this.distance * i;
    	    this.axes[i].y1 = this.y_pos + this.border_y;
    	    this.axes[i].x2 = this.x_pos + this.border_x + this.distance * i;
    	    this.axes[i].y2 = this.y_pos + this.height - this.border_y;
    	    

    	}

        //Generate LineSegments
        for( let i = 0; i < this.number_of_axes - 1; i++)
        {
            

            let current_axis = this.axes[this.axes_order[i]];
            let next_axis = this.axes[this.axes_order[i+1]];

            const x_pos = current_axis.x1;
            const x_pos_next = next_axis.x1;
            
            for(let j = 1; j < this.data.length; j++)
            {

                const value_current_axis = this.data[j][this.axes_order[i]];
                const value_next_axis = this.data[j][this.axes_order[i+1]];

                	
                const current_axis_relative_pos = current_axis.interpolation(value_current_axis);
                const next_axis_relative_pos = next_axis.interpolation(value_next_axis);
                	
                	
                	
                const y_current = this.yend - current_axis_relative_pos * (this.yend - this.ystart);
                const y_next = this.yend - next_axis_relative_pos * (this.yend - this.ystart);
                

                

                this.data_line_segments[i][j-1].x1 = x_pos;
                this.data_line_segments[i][j-1].y1 = y_current;
                this.data_line_segments[i][j-1].x2 = x_pos_next;
                this.data_line_segments[i][j-1].y2 = y_next;
                
                                
            }
        }

    }
    
    
    render()
    {

        this.backgroundCtx0.clearRect(0, 0, this.backgroundCanvas0.width, this.backgroundCanvas0.height);
        
        //set background
        this.backgroundCtx0.fillStyle = "#555555";
        this.backgroundCtx0.fillRect(this.x_pos, this.y_pos, this.width, this.height);

       
        
        if(this.linesegment_redraw)
        {
            this.linesegment_redraw = false;
            
            this.linesegmentCtx2.clearRect(0, 0, this.linesegmentCanvas2.width, this.linesegmentCanvas2.height);
            //render LineSegment
            for(const arr of this.data_line_segments)
            {
                for(const line_segment of arr)
                {
                    
                    this.linesegmentCtx2.fillStyle = "#000000";
                    this.linesegmentCtx2.beginPath();
                    this.linesegmentCtx2.moveTo(line_segment.x1, line_segment.y1);
                    this.linesegmentCtx2.lineTo(line_segment.x2, line_segment.y2);
                    this.linesegmentCtx2.strokeStyle = line_segment.color;
                    this.linesegmentCtx2.stroke();
                    this.linesegmentCtx2.closePath();
                    
                }

            }
        }
        //render selected line and message box that displays tuple

        if(this.selectedline_redraw)
        {
            this.selectedline_redraw = false;
            
            this.selectedlineCtx3.clearRect(0, 0, this.selectedlineCanvas3.width, this.selectedlineCanvas3.height);
            if(this.selectedLine != -1)
            {
                const lines = this.lines_of_tuple[this.selectedLine];

                
                for(const line_segment of lines)
                {

                    this.selectedlineCtx3.beginPath();
                    this.selectedlineCtx3.moveTo(line_segment.x1, line_segment.y1);
                    this.selectedlineCtx3.lineTo(line_segment.x2, line_segment.y2);


                    //stylized the current selection
                    
                    this.selectedlineCtx3.lineWidth = 5;
                    this.selectedlineCtx3.shadowColor = "white";
                    this.selectedlineCtx3.shadowBlur = 15;
                    this.selectedlineCtx3.strokeStyle = global_selected_line_color;
                    this.selectedlineCtx3.lineCap = "round";
                    
                    this.selectedlineCtx3.stroke();
                    this.selectedlineCtx3.closePath();
                    
                }

                this.selectedlineCtx3.shadowColor = null;
                this.selectedlineCtx3.shadowBlur = null;
                this.selectedlineCtx3.font = "40px Arial";
                this.selectedlineCtx3.fillStyle = global_selection_text_color;
                this.selectedlineCtx3.textBaseline = "top";
                const tuple_display = this.data[this.selectedLine];
                this.selectedlineCtx3.fillText(`(${tuple_display.join(", ")})`, this.x_pos, this.y_pos);
            }



            
        }

        if(this.axis_redraw)
        {
            this.axis_redraw = false;
            
            this.axisCtx1.clearRect(0, 0, this.axisCanvas1.width, this.axisCanvas1.height);
            //render axes
            for(let it = 0; it < this.number_of_axes; it++)
            {
                let current_axis = this.axes[this.axes_order[it]];

                current_axis.render(this.axisCtx1);
            }
        }
    }
    //selectData(int, int)
    selectData(mouse_x, mouse_y)
    {


        this.selectedline_redraw = true;

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
        ctx.lineWidth = 5;
        //ctx.shadowColor = "white";
        //ctx.shadowBlur = 15;
        ctx.lineCap = "round";
        
        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x1, this.y2);
        ctx.strokeStyle = this.color;
        ctx.stroke();
        ctx.closePath();

        //Name
        ctx.fillStyle = global_axis_text_color;
        ctx.font = "40px Arial";
        ctx.textBaseline = "bottom";
        ctx.textAlign = "center";
        ctx.fillText(this.name, this.x2 ,this.y2 + 80);

                
        //Draw value in between 
        ctx.font = "20px Arial";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center ";


        let counter = 0;
        let distance = 0;
        
        if(this.category == "ReferenceMap")
        {
            if(this.data.size < max_number_of_inbetween_values_of_axis)
            {
                distance = (this.y2 - this.y1)/(this.data.size-1);

                
                for(const elem of this.data.keys())
                {
                    ctx.fillText(elem, this.x1, this.y1 + distance * counter);
                    counter++;               
                }
            }else
            {
                distance = (this.y2 - this.y1) / (max_number_of_inbetween_values_of_axis);

                const keys = [...this.data.keys()];
                const skip = parseInt(keys.length/max_number_of_inbetween_values_of_axis);
                
                for(let it = 0; it < max_number_of_inbetween_values_of_axis; it++)
                {

                    ctx.fillText(keys[it*skip], this.x1, this.y2 - distance * counter);
                    counter++;               
                }
                
                ctx.fillText(keys[keys.length-1], this.x1, this.y2 - distance * max_number_of_inbetween_values_of_axis);
            }
            
        }else if(this.category == "Number")
        {
          
          
            const min = this.min_value;
            const max = this.max_value;
            
            const diff = (max - min)*0.5;

            //Figure out where the diff value falls in between to figure a suitable step
            const ref_arr = [0.00001,0.0001,0.001, 0.01, 0.1, 1, 10, 100, 1000, 10000, 100000, 1000000]; 
            
            let step = null;
            for(let i = 0; i < ref_arr.length; i++)
            {
                if(ref_arr[i] > diff)
                {
                    if(i == 0)
                    {
                        step = ref_arr[i];
                    }else
                    {
                        step = ref_arr[i-1];
                    }
                    break;
                }
            }
            //if no step was found just go with the largest step value
            if(step == null)step = ref_arr[ref_arr.length-1];

           
            
            const total_length = this.y2 - this.y1;

            const k_min = Math.floor(min/step) + 1;
            const k_max = Math.ceil(max/step) - 1;
            
            const k = k_max - k_min;

            const L1 = (k_min*step - min)/(step);
            const L2 = (max - k_max*step)/(step);
            
            const diff_distance = (total_length)/(k + L1 + L2);
            
            

            ctx.fillText(this.min_value, this.x1, this.y2);            
            
            for(let counter = 0; counter <= k; counter++)
            {
                const display_value = k_min * step + counter * step;
                const y_position =  this.y2 - (L1*diff_distance + diff_distance * counter);
                ctx.fillText(display_value, this.x1, y_position);
            }
            
            ctx.fillText(this.max_value, this.x1, this.y1);                        
            
        }
            

    }
    
}





        
