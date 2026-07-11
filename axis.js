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


const reorder_box_color = "rgba(255,255,255,0.5)";
const selection_box_color_hover = "rgba(255,255,255,0.5)";
const selection_box_color_filter = "rgba(255,255,0,0.5)";
const selection_box_filter_boundary_color = "rgba(255,0,0,0.5)";

const global_background_color     = "555555";

const global_axis_color           = "222222";
const global_line_segment_color   = "000000";
const global_selected_line_color  = "red";
const global_selection_text_color = "white";
const global_axis_text_color      = "white";

//axis selection box
const width_selection_box = 40; //px

const reorder_box_offset = 20; //px

const SelectionStates = {
    NONE_SELECTED : 0,
    MIN_SELECTED : 1,    
    MAX_SELECTED : 2,
    MIDDLE_SELECTED : 3,
    RELEASED : 10
};

//utility functions
// p = {x , y}
// rect = {x, y, w, h}
// returns bool
function point_intersect_rect(p,rect)
{
    return (rect.x < p.x && p.x < rect.x + rect.w &&
            rect.y < p.y && p.y < rect.y + rect.h); 
}

function textBounds(ctx, text, x, y) {
    const m = ctx.measureText(text);

    return {
        x: x - m.actualBoundingBoxLeft,
        y: y - m.actualBoundingBoxAscent,
        w: m.actualBoundingBoxLeft + m.actualBoundingBoxRight,
        h: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent
    };
}

function clamp(value, min, max)
{
    return ((value <= min) ? min : (value >= max ? max : value));
}


class ParallelCoordinates
{
    constructor(x,y,width,height, window)
    {
        this.window = window;
        
        this.axes = []; // Axis []
        this.axes_order = []; // int []

        this.data_line_segments = []; // LineSegment [][]
        this.visible_data_line_segments = [];
        
        this.width = width;
        this.height = height;

        this.x_pos = x;
        this.y_pos = y;

        this.border_x = width*0.1; //in px 
        this.border_y = Axis.axis_name_offset + Axis.axis_name_font_size; //in px 

        this.xstart = this.x_pos + this.border_x;
        this.xend = this.width - this.border_x;

        
        this.ystart = this.y_pos + this.border_y;
        this.yend = this.y_pos + this.height - this.border_y;

        this.number_of_axes = 0;
        
        this.distance =  0;

        this.selectedLine = -1;
        this.selectedLines = [];

        this.selectedReorderAxis = null;
        this.selectedReorderAxisReference = null; // order_axis position index : integer
        this.selectedReorderAxisXPosReference = null; // order_axis x position  : integer

        this.selectedSelectionAxis = null;

        this.selectionSelectionState = 0;
        this.no_reset_but_dragging = true;
        
        // tuple_index -> [[LineSegment1, LineSegment2, ...] ,[...]]
        this.lines_of_tuple = []

        this.backgroundCanvas0 = document.createElement('canvas');
        this.linesegmentCanvas2 = document.createElement('canvas');
        this.selectedlineCanvas3 = document.createElement('canvas');
        this.axisCanvas1 = document.createElement('canvas');
        this.zoomCanvas4 = document.createElement('canvas');

        this.cursorCanvas = document.createElement('canvas');
        
        this.background_redraw = true;
        this.axis_redraw = true;
        this.linesegment_redraw = true;
        this.selectedline_redraw = true;
        this.zoom_redraw = true;
        this.selected_axis_redraw = true;
        
        this.backgroundCtx0 = this.backgroundCanvas0.getContext('2d');
        this.axisCtx1 = this.axisCanvas1.getContext('2d');
        this.linesegmentCtx2 = this.linesegmentCanvas2.getContext('2d');
        this.selectedlineCtx3 = this.selectedlineCanvas3.getContext('2d');
        this.zoomCtx4 = this.zoomCanvas4.getContext('2d');


        //div element where all canvases are stacked on top of each other
        this.container = null;

        this.total_data_element = 1;
        
        //I will stream the data
        //So that the user will see each element loading in and thus giving him the impression
        //that the program is currently working

        //We declare a state machine with two states (waiting_for_first_element, first_element_read)
        // we'll look at the first element (header) and determine number of axes and their names
        // after that we'll update the line-segments
        // but how the maximum and minimum for the interpolation is determined; no idea
        this.first_element_read = false;

        

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
                             this.selectedlineCanvas3,
                             this.axisCanvas1,
                             this.zoomCanvas4,
                             this.cursorCanvas
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

        this.calculatePosition();

    }
    
    resizeCanvas()
    {
        console.log("resize");
        const canvas_list = [this.backgroundCanvas0,
                             this.axisCanvas1,
                             this.linesegmentCanvas2,
                             this.selectedlineCanvas3,
                             this.zoomCanvas4,
                             this.cursorCanvas
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
        this.border_y = Axis.axis_name_offset + Axis.axis_name_font_size; //in px 
        
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
        this.visible_data_line_segments = [];

        this.number_of_axes = 0;
        
        this.distance =  0;

        this.selectedLine = -1;
        this.selectedLines = [];

        // tuple_index -> [[LineSegment1, LineSegment2, ...] ,[...]]
        this.lines_of_tuple = []

        this.background_redraw = true;
        this.axis_redraw = true;
        this.linesegment_redraw = true;
        this.selectedline_redraw = true;
        this.zoom_redraw = true;

        this.first_element_read = false;

        this.total_data_element = 1;

        //I will stream the data
        //So that the user will see each element loading in and thus giving him the impression
        //that the program is currently working

        //We declare a state machine with two states (waiting_for_first_element, first_element_read)
        // we'll look at the first element (header) and determine number of axes and their names
        // after that we'll update the line-segments
        // but how the maximum and minimum for the interpolation is determined; no idea
        this.first_element_read = false;

        
    }

    parseCSV(CSV_file)
    {

        
        //Papa.parse(CSV_file, {
        //    header : false,
        //    skipEmptyLines : true,
        //    worker : true,
        //    step : (row) =>
        //    {
        //        this.streamData(row.data);
        //    }
        //});

        
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

    streamData(elementRow)
    {
        if(!this.first_element_read)
        {
            this.resetVisualization();
            this.data = [];

    	    this.number_of_axes = elementRow.length;
            
            this.number_of_bins = this.number_of_axes - 1;

            
            this.first_element_read = true;

            //Determine distance
            this.distance = (this.width - 2 * this.border_x) / (this.number_of_axes - 1);


            //Generate Axis
    	    for( let i = 0; i < this.number_of_axes; i++)
    	    {
                //constructor(name, x1, y1, x2, y2, color, canvasContext, data_tuple)
    	        let current_axis = new Axis(elementRow[i], //we use the csv-header for the axis name 
                                            this.x_pos + this.border_x + this.distance * i,
                                            this.y_pos + this.border_y,
                                            this.x_pos + this.border_x + this.distance * i,
                                            this.y_pos + this.height - this.border_y,
                                            global_axis_color,
                                            this.axisCtx1,
                                            []
                                           );
                


    	        this.axes.push(current_axis);
    	        
    	        // Order position
    	        this.axes_order.push(i);
    	        
    	    }
            this.data.push(elementRow);
            return;
        }

        this.data.push(elementRow);

        //add Axis element
    	for( let i = 0; i < this.number_of_axes; i++)
    	{
            this.axes[i].addElement(elementRow[i]);	    
    	}

        
        this.lines_of_tuple.push(new Array());

        
        this.visible_data_line_segments.push(true);                    
        
        
        //Generate LineSegments
        for( let i = 0; i < this.number_of_axes - 1; i++)
        {
            this.data_line_segments.push([]);
            

            let current_axis = this.axes[this.axes_order[i]];
            let next_axis = this.axes[this.axes_order[i+1]];

            const x_pos = current_axis.x1;
            const x_pos_next = next_axis.x1;
            
            const value_current_axis = elementRow[this.axes_order[i]];
            const value_next_axis = elementRow[this.axes_order[i+1]];

            
            if(current_axis.interpolation === null)return;
            if(next_axis.interpolation === null)return;

            
            const current_axis_relative_pos = current_axis.interpolation(value_current_axis);
            const next_axis_relative_pos = next_axis.interpolation(value_next_axis);
            
            
            
            const y_current = this.yend - current_axis_relative_pos * (this.yend - this.ystart);
            const y_next = this.yend - next_axis_relative_pos * (this.yend - this.ystart);
            
            
            let line_segment = new LineSegment(x_pos, y_current,                //x1, y1
                                               x_pos_next, y_next,              //x2, y2
                                               global_line_segment_color,       //color
                                               this.total_data_element        //tuple-reference
                                              );
            
            this.data_line_segments[i].push(line_segment); 

            this.lines_of_tuple[this.total_data_element].push(this.data_line_segments[i][this.data_line_segments[i].length - 1]);

            this.total_data_element++;
        }

        
        
    }

    // data[0][i] are the header values
    parseData(data)
    {
        this.resetVisualization();
        
        this.data = data;
        let tuple_data = []

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

        this.number_of_bins = this.number_of_axes - 1;
        
        for(let it = 0; it < this.data.length; it++)
        {
            this.lines_of_tuple.push(new Array());
            this.visible_data_line_segments.push(true);
        }

        
        //Determine distance
        this.distance = (this.width - 2 * this.border_x) / (this.number_of_axes - 1);


        //Generate Axis
    	for( let i = 0; i < this.number_of_axes; i++)
    	{
            //constructor(name, x1, y1, x2, y2, color, canvasContext, data_tuple)
    	    let current_axis = new Axis(this.data[0][i], //we use the csv-header for the axis name 
                                        this.x_pos + this.border_x + this.distance * i,
                                        this.y_pos + this.border_y,
                                        this.x_pos + this.border_x + this.distance * i,
                                        this.y_pos + this.height - this.border_y,
                                        global_axis_color,
                                        this.axisCtx1,
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

                
                if(current_axis.interpolation === null)return;
                if(next_axis.interpolation === null)return;

                	
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


    //Used in redrawing 
    calculatePosition()
    {

        //Determine distance between each axis with new canvas size
        this.distance = (this.width - 2 * this.border_x) / (this.number_of_axes - 1);


        //Update Axis
    	for( let i = 0; i < this.number_of_axes; i++)
    	{
            const k = this.axes_order[i];
            if(!this.axes[k].being_reordered)
            {
    	        this.axes[k].x1 = this.x_pos + this.border_x + this.distance * i;
                this.axes[k].x2 = this.x_pos + this.border_x + this.distance * i;
            }
                
    	    this.axes[k].y1 = this.y_pos + this.border_y;
    	    this.axes[k].y2 = this.y_pos + this.height - this.border_y;

            this.axes[k].updateBoxes();

    	}

        //Update Bins
        

        for(let j = 1; j < this.data.length; j++)
        {
            this.visible_data_line_segments[j-1] = true;            
        }

        
        //Update LineSegments
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


                if(current_axis.interpolation === null)return;
                if(next_axis.interpolation === null)return;
                
                const current_axis_relative_pos = current_axis.interpolation(value_current_axis);
                const next_axis_relative_pos = next_axis.interpolation(value_next_axis);

                //Apply selection filter

                if(current_axis.selected_box_min > 1.0 - current_axis_relative_pos ||
                   current_axis.selected_box_max < 1.0 - current_axis_relative_pos ||
                   next_axis.selected_box_min > 1.0 - next_axis_relative_pos ||
                   next_axis.selected_box_max < 1.0 - next_axis_relative_pos 
                  )
                {
                    this.visible_data_line_segments[j-1] &= false;
                }
                
                
                //Apply zoom                	
                	
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
                for(let it = 0; it < arr.length; it++)
                {
                    if(!this.visible_data_line_segments[it])continue;
                    const line_segment = arr[it];
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
                const tuple_copy = this.data[this.selectedLine];

                let tuple_display = new Array(tuple_copy.length);
                for(let index = 0; index < this.axes_order.length; index++)
                {
                    tuple_display[index] = tuple_copy[this.axes_order[index]];
                }
                
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

                current_axis.render();
            }
        }
    }

    releaseData(mouse_x, mouse_y)
    {
        if(this.selectedReorderAxis != null)
        {
            

            let current_x = mouse_x - this.xstart;

            

            if(current_x > ( this.selectedReorderAxisReference) * this.distance)
            {
                this.selectedReorderAxis.x1 = this.xstart + Math.floor(current_x/this.distance) * this.distance;

            }else if(current_x < ( this.selectedReorderAxisReference) * this.distance)
            {
                this.selectedReorderAxis.x1 = this.xstart + Math.ceil(current_x/this.distance) * this.distance;
                
            }
            
            
            

            this.axis_redraw = true;
            this.linesegment_redraw = true;


            this.selectedReorderAxis.being_reordered = false;
            this.selectedReorderAxis = null;
            this.selectedReorderAxisReference = null;

            this.calculatePosition();
        }

        if(this.selectedSelectionAxis != null)
        {
            if(this.selectionSelectionState === SelectionStates.NONE_SELECTED && !this.no_reset_but_dragging)
            {
                this.selectedSelectionAxis.being_filtered = true;
            }
            this.selectionSelectionState = SelectionStates.RELEASED;
            this.selectedSelectionAxis = null;

        }

        
    }

    clickData(mouse_x, mouse_y)
    {
        let collision = false;

        
        for(let iter = 0; iter < this.axes_order.length; iter++)
        {
            
            let axis = this.axes[this.axes_order[iter]];
            axis.selected_reorder_box = false;
            axis.selected_selection_box = false;
            if(point_intersect_rect({x : mouse_x, y : mouse_y}, axis.reorder_box))
            {
             
                this.selectedReorderAxis = axis;
                this.selectedReorderAxis.selected_reorder_box = true;

                this.selectedReorderAxis.being_reordered = true;
                
                this.selectedReorderAxisReference = iter;
          
                
                this.cursorCanvas.style.cursor="ew-resize";
                collision = true;
                break;
            }
            if(point_intersect_rect({x : mouse_x, y : mouse_y}, axis.selectionBox))
            {
                this.selectedSelectionAxis = axis;
                
                this.selectedSelectionAxis.selected_selection_box_hover = true;
                this.selectedSelectionAxis.selected_selection_box_filter = true;

                console.log("being filtered: "+axis.being_filtered);


                if(point_intersect_rect({x : mouse_x, y : mouse_y}, axis.selectionMinimumBox) && axis.being_filtered)
                {
                    console.log("Minimum clicked");
                    this.selectionSelectionState = SelectionStates.MIN_SELECTED;
                    this.selectedSelectionAxis.setFilterMaxRef(this.selectedSelectionAxis.selected_box_max);

                }else if(point_intersect_rect({x : mouse_x, y : mouse_y}, axis.selectionMaximumBox) && axis.being_filtered)
                {
                    console.log("Maximum clicked");
                    this.selectionSelectionState = SelectionStates.MAX_SELECTED;
                    this.selectedSelectionAxis.setFilterMinRef(this.selectedSelectionAxis.selected_box_min);                    
                }
                else if(point_intersect_rect({x : mouse_x, y : mouse_y}, axis.selectionFilterBox) && axis.being_filtered)
                {
                    console.log("Middlesection clicked");
                    this.selectionSelectionState = SelectionStates.MIDDLE_SELECTED;
                    this.selectedSelectionAxis.setFilterTranslateRef((mouse_y - axis.selectionBox.y)/axis.selectionBox.h);
                }else
                {
                    this.selectionSelectionState = SelectionStates.NONE_SELECTED;
                    console.log("Outside clicked");

                    
                    this.selectedSelectionAxis.resetFilter();
                    this.no_reset_but_dragging = true;
                }            

                this.calculatePosition();
                
                this.axis_redraw = true;
                this.linesegment_redraw = true;
                this.selectedline_redraw = true;
                

                collision = true;                
                break;
            }



            if(point_intersect_rect({x : mouse_x, y : mouse_y}, axis.zoomBox))
            {
                
            }
        }

        
        
        if(!collision)
        {
            this.cursorCanvas.style.cursor = "default";
        }
    }
    
    //selectData(int, int)
    selectData(mouse_x, mouse_y, dragging)
    {

        if(dragging)
        {
            
            if(this.selectedReorderAxis != null)
            {


                
                let current_x = mouse_x - this.xstart;

                //we need canvas coordinates here
                this.selectedReorderAxis.x1 = mouse_x;

                let reordering_happening = false;
                let reorder_pos = this.selectedReorderAxisReference;
                if(current_x > ( this.selectedReorderAxisReference + 1) * this.distance)
                {
                    reorder_pos = Math.floor((current_x)/ this.distance);

                }else if(current_x < ( this.selectedReorderAxisReference - 1) * this.distance)
                {
                    reorder_pos = Math.ceil((current_x)/ this.distance);
                }
                
                //Switch the axes around if reordering happend
                

                const tmp = this.axes_order[reorder_pos];
                this.axes_order[reorder_pos] = this.axes_order[this.selectedReorderAxisReference];
                this.axes_order[this.selectedReorderAxisReference] = tmp;
                this.selectedReorderAxisReference = reorder_pos;
                
                this.calculatePosition();

                


                
                this.axis_redraw = true;
                this.linesegment_redraw = true;
                this.selectedline_redraw = true;
                
                
            }

            if(this.selectedSelectionAxis != null)
            {
                //Deactivate current selection
                this.selectedLine = -1;
                if(!this.selectedSelectionAxis.being_filtered)
                {

                    if(this.no_reset_but_dragging)
                    {
                        this.selectedSelectionAxis.setFilterMinRef((mouse_y - this.selectedSelectionAxis.selectionBox.y)/this.selectedSelectionAxis.selectionBox.h);
                        this.selectedSelectionAxis.setFilterMin((mouse_y - this.selectedSelectionAxis.selectionBox.y)/this.selectedSelectionAxis.selectionBox.h);
                        this.selectedSelectionAxis.setFilterMax(this.selectedSelectionAxis.selected_box_min);
                        this.no_reset_but_dragging = false;
                    }
                    this.selectedSelectionAxis.setFilterMax((mouse_y - this.selectedSelectionAxis.selectionBox.y)/this.selectedSelectionAxis.selectionBox.h);



                }else
                {
                    switch(this.selectionSelectionState)
                    {
                        case SelectionStates.MIN_SELECTED:
                        this.selectedSelectionAxis.setFilterMin((mouse_y - this.selectedSelectionAxis.selectionBox.y)/this.selectedSelectionAxis.selectionBox.h);
                        console.log("minimum dragged");
                        break;
                        case SelectionStates.MAX_SELECTED:
                        this.selectedSelectionAxis.setFilterMax((mouse_y - this.selectedSelectionAxis.selectionBox.y)/this.selectedSelectionAxis.selectionBox.h);
                        console.log("maximum dragged");
                        break;
                        case SelectionStates.MIDDLE_SELECTED:
                        this.selectedSelectionAxis.setOffsetFilterBox((mouse_y - this.selectedSelectionAxis.selectionBox.y)/this.selectedSelectionAxis.selectionBox.h);
                        console.log("middle dragged");                        
                        break;
                    }
                }

                
                this.selectedSelectionAxis.selected_selection_box_filter = true;
                this.calculatePosition();
                                
                this.axis_redraw = true;
                this.linesegment_redraw = true;
                this.selectedline_redraw = true;
            }

            if(this.selectionZoomAxis != null)
            {
                
            }
                
        }
        else
        {

            //handle axis selection

            this.selected_axis_redraw = true;
            this.axis_redraw = true;

            let collision = false;
            
            for(let iter of this.axes_order)
            {
                let axis = this.axes[iter];
                axis.selected_reorder_box = false;
                axis.selected_selection_box_hover = false;
                if(point_intersect_rect({x : mouse_x, y : mouse_y}, axis.reorder_box))
                {
                    
                    axis.selected_reorder_box = true;
                    this.cursorCanvas.style.cursor="ew-resize";
                    collision = true;
                    break;
                }
                if(point_intersect_rect({x : mouse_x, y : mouse_y}, axis.selectionBox))
                {
                    if(point_intersect_rect({x : mouse_x, y : mouse_y}, axis.selectionMinimumBox) && axis.being_filtered)
                    {
                        this.cursorCanvas.style.cursor="ns-resize";
                    }else if(point_intersect_rect({x : mouse_x, y : mouse_y}, axis.selectionMaximumBox) && axis.being_filtered)
                    {
                        this.cursorCanvas.style.cursor="ns-resize";
                    }
                    else if(point_intersect_rect({x : mouse_x, y : mouse_y}, axis.selectionFilterBox) && axis.being_filtered)
                    {
                        this.cursorCanvas.style.cursor="move";
                    }else
                    {
                        this.cursorCanvas.style.cursor="crosshair";
                    }            

                    axis.selected_selection_box_hover = true;

                    collision = true;                
                    break;
                }
            }

            if(!collision)
            {
                this.cursorCanvas.style.cursor = "default";
            }
            
            //handle selection_line

            this.selectedline_redraw = true;
            
            const p_x = mouse_x - this.xstart;
            const p_y = mouse_y - this.ystart;
            //GetSegment
            const segment = Math.floor(p_x / this.distance);



            if(segment >= this.number_of_axes - 1 || segment < 0)return;
            
            const segment_lines = this.data_line_segments[segment];

            if(!segment_lines)return;
            
            let d_min = Infinity;
            let min_line_segment = null;
            this.selectedLine = -1;
            //choose closest line
            for(let it = 0; it < segment_lines.length; it++)
            {
                if(!this.visible_data_line_segments[it])continue;
                let line_segment = segment_lines[it];
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
    static axis_name_font_size = 40; // in px
    static axis_name_offset = 80; // in px

    static BorderBoxOffset = 10; //ijn px
    
    constructor(name, x1, y1, x2, y2, color, canvas_context, data_tuple)
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

        this.max_value = Infinity;
        this.min_value = -Infinity;

        this.ReferenceMap = new Map();
        this.firstMapElement = null;
        this.lastMapElement = null;
        this.indexMapElement = 0;
        
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
        if(data_tuple.length != 0)
        {
            this.interpolation = this.createInterpolation(data_tuple);
        }

        this.ctx = canvas_context;
        
        this.reorder_box = {x: 0, y: 0, w: 0,h: 0};
        this.selected_reorder_box = false;

        
        this.selectionBox = {x: 0, y: 0, w: 0,h: 0};
        this.selected_selection_box_hover = false;

        this.selectionFilterBox = {x: 0, y: 0, w: 0,h: 0};
        this.selected_selection_box_filter = false;
        this.selected_box_min = 0.0;
        this.selected_box_max = 1.0;
        this.selected_box_min_ref = 0.0;
        this.selected_box_max_ref = 1.0;

        this.selected_box_offset_ref = 0.0;

        this.selectionMinimumBox = {x: 0, y: 0, w: 0,h: 0};
        this.selectionMaximumBox = {x: 0, y: 0, w: 0,h: 0};

        
        this.zoomBox = {x: 0, y: 0, w: 0, h: 0};
        this.selected_zoomBox = false;
        this.selected_zoom_min = 0.0;
        this.selected_zoom_max = 1.0;

        
        this.being_reordered = false;
        this.being_filtered = false;
        this.being_zoomed = false;
        
        //Display-Color
        this.color = color;

        this.updateBoxes();
    }

    addElement(elem)
    {
        //this interpolation creation has no return value
        //the interpolation gets set in the function
        this.streamInterpolation(elem);
    }

    resetFilter()
    {
        this.selected_selection_box_filter = false;
        this.being_filtered = false;
        this.selected_box_min = 0.0;
        this.selected_box_max = 1.0;
        this.selected_box_min_ref = 0.0;
        this.selected_box_max_ref = 1.0;
        this.selected_box_offset_ref = 0.0;
    }
    
    setFilterMinRef(min)
    {
        this.selected_box_min_ref = min;
    }

    setFilterMin(min)
    {
        this.setFilterMinMax(min, this.selected_box_max_ref);
    }

    setFilterMaxRef(max)
    {
        this.selected_box_max_ref = max;
    }
    
    setFilterMax(max)
    {
        this.setFilterMinMax(this.selected_box_min_ref, max);
    }
    
    setFilterTranslateRef(offset_ref)
    {
        this.selected_box_offset_ref = offset_ref;
    }

    setOffsetFilterBox(offset)
    {
        let m_min = (offset - this.selected_box_offset_ref) + this.selected_box_min;
        let m_max = (offset - this.selected_box_offset_ref) + this.selected_box_max;
        let m_offset = offset;

        
        m_min = clamp(m_min, 0.0, 1.0 - (this.selected_box_max - this.selected_box_min));
        m_max = clamp(m_max, this.selected_box_max - this.selected_box_min, 1.0);
        m_offset = clamp(m_offset, 0.0, 1.0);

        
        this.selected_box_offset_ref = m_offset;
        this.selected_box_min = m_min;
        this.selected_box_max = m_max;
    }
    
    setFilterMinMax(min,max)
    {
        let m_min = min;
        let m_max = max;
        if(max < min)
        {
            m_max = min;
            m_min = max
        }

        m_min = clamp(m_min,0.0,1.0);
        m_max = clamp(m_max,0.0,1.0);
        
        this.selected_box_min = m_min;
        this.selected_box_max = m_max;
    }
    
    
    updateBoxes()
    {
    

        this.ctx.moveTo(this.x1, this.y1);
        this.ctx.lineTo(this.x1, this.y2);
        this.ctx.closePath();
       
        this.ctx.font = Axis.axis_name_font_size+"px Arial"; 
        this.ctx.textBaseline = "top";
        this.ctx.textAlign = "center";
        
        //calculate reorder_box
        //You drag the Name of the axis in order to move it
        this.reorder_box = textBounds(this.ctx,
                                      this.name,
                                      this.x1,
                                      this.y1 - Axis.axis_name_offset);

        
        this.reorder_box.x -= reorder_box_offset;
        this.reorder_box.y -= reorder_box_offset;
        this.reorder_box.w += 2*reorder_box_offset;
        this.reorder_box.h += 2*reorder_box_offset;
        
        
        this.selectionBox = {x : this.x1 - width_selection_box/2,
                             y: this.y1,
                             w: width_selection_box,
                             h: this.y2 - this.y1};

        const upper_y = this.selected_box_min * this.selectionBox.h + this.selectionBox.y;
        const lower_y = this.selected_box_max * this.selectionBox.h + this.selectionBox.y;


        
        this.selectionFilterBox = {x: this.selectionBox.x,
                                   y: upper_y,
                                   w: this.selectionBox.w,
                                   h: lower_y - upper_y};            

        this.selectionMinimumBox = {x: this.selectionFilterBox.x,
                                    y: this.selectionFilterBox.y - Axis.BorderBoxOffset,
                                    w: this.selectionFilterBox.w,
                                    h: Axis.BorderBoxOffset * 2
                                   };

        this.selectionMaximumBox = {x: this.selectionFilterBox.x,
                                    y: this.selectionFilterBox.y + this.selectionFilterBox.h - Axis.BorderBoxOffset,
                                    w: this.selectionFilterBox.w,
                                    h: Axis.BorderBoxOffset * 2
                                   };
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
         
            
            return (x) => {
                return (x - MIN_VALUE) / (MAX_VALUE - MIN_VALUE);
            };
            
        }else
        {
    	    //If categorial then put the data into map datastructure
    	    //Get the total number of elements and save the order

            

            //Categorical data get a ReferenceMap
            this.category = "ReferenceMap";
            

            
            this.firstMapElement = data[0];
            this.lastMapElement = null;
            
            for(const elem of data)
            {
                if(this.ReferenceMap.has(elem)) continue;
                this.ReferenceMap.set(elem, this.indexMapElement++);
                this.lastMapElement = elem;
            }

            MIN_VALUE = 0;
            MAX_VALUE = this.ReferenceMap.size - 1;

            this.min_value = this.firstMapElement;
            this.max_value = this.lastMapElement;


                     
            return (x) => {
                return (this.ReferenceMap.get(x)/MAX_VALUE);
            };
        }

    }

    streamInterpolation(elem)
    {
 
        //Check whether data is numerical or categorical
        //isFinite() checks whether it is number
        //Make the assumption that the first element type is representative of every element in the tuple
        if(this.category === "Number")
        {
            //If numerical then get the maximum and minimum data element
            
            if ( elem < this.min_value ) this.min_value = Number(elem);
            if ( elem > this.max_value ) this.max_value = Number(elem);
            
            

            
            this.interpolation =  (x) => {
                
                return (x - this.min_value) / (this.max_value - this.min_value);
            };
            
        }else if(this.category === "ReferenceMap")
        {
    	    //If categorial then put the data into map datastructure
    	    //Get the total number of elements and save the order

            

            //Categorical data get a ReferenceMap

            
            if(this.ReferenceMap.size === 0)
            {
                this.firstMapElement = elem;
            }
            
            if(this.ReferenceMap.has(elem)) return;
            
            this.ReferenceMap.set(elem, this.indexMapElement++);
            this.lastMapElement = elem;
            


            let MAX_VALUE = this.ReferenceMap.size - 1;

            this.min_value = this.firstMapElement;
            this.max_value = this.lastMapElement;


                     
            this.interpolation = (x) => {
                return (this.ReferenceMap.get(x)/MAX_VALUE);
            };
        }

    }

    render()
    {

        
        if(this.selected_reorder_box)
        {
            //Draw reorder_box
            this.ctx.fillStyle = reorder_box_color;
            this.ctx.fillRect(this.reorder_box.x,
                         this.reorder_box.y,
                         this.reorder_box.w,
                         this.reorder_box.h);
        }

        if(this.selected_selection_box_hover)
        {
            //Draw selection box hover
            this.ctx.fillStyle = selection_box_color_hover;
            this.ctx.fillRect(this.selectionBox.x,
                         this.selectionBox.y,
                         this.selectionBox.w,
                         this.selectionBox.h);
        }

        if(this.selected_selection_box_filter)
        {
            //Draw selection box hover
            this.ctx.fillStyle = selection_box_color_filter;
            this.ctx.fillRect(this.selectionFilterBox.x,
                              this.selectionFilterBox.y,
                              this.selectionFilterBox.w,
                              this.selectionFilterBox.h);

            this.ctx.fillStyle = selection_box_filter_boundary_color;
            this.ctx.fillRect(this.selectionMinimumBox.x,
                              this.selectionMinimumBox.y + Axis.BorderBoxOffset,
                              this.selectionMinimumBox.w,
                              this.selectionMinimumBox.h - Axis.BorderBoxOffset);
            
            this.ctx.fillRect(this.selectionMaximumBox.x,
                              this.selectionMaximumBox.y,
                              this.selectionMaximumBox.w,
                              this.selectionMaximumBox.h - Axis.BorderBoxOffset);
        }
        
        
        
        
        //draw axis
        this.ctx.lineWidth = 5;
        //this.ctx.shadowColor = "white";
        //this.ctx.shadowBlur = 15;
        this.ctx.lineCap = "round";
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.x1, this.y1);
        this.ctx.lineTo(this.x1, this.y2);
        this.ctx.strokeStyle = this.color;
        this.ctx.stroke();
        this.ctx.closePath();

        //Name
        this.ctx.fillStyle = global_axis_text_color;
        this.ctx.font = Axis.axis_name_font_size+"px Arial"; 
        this.ctx.textBaseline = "top";
        this.ctx.textAlign = "center";
        this.ctx.fillText(this.name, this.x1 ,this.y1 - Axis.axis_name_offset);


        
                
        //Draw value in between 
        this.ctx.font = "20px Arial";
        this.ctx.textBaseline = "middle";
        this.ctx.textAlign = "center ";


        let counter = 0;
        let distance = 0;
        
        if(this.category == "ReferenceMap")
        {
            if(this.ReferenceMap.size < max_number_of_inbetween_values_of_axis)
            {
                distance = (this.y2 - this.y1)/(this.ReferenceMap.size-1);

                
                for(const elem of this.ReferenceMap.keys())
                {
                    this.ctx.fillText(elem, this.x1, this.y2 - distance * counter);
                    counter++;               
                }
            }else
            {
                distance = (this.y2 - this.y1) / (max_number_of_inbetween_values_of_axis);

                const keys = [...this.ReferenceMap.keys()];
                const skip = parseInt(keys.length/max_number_of_inbetween_values_of_axis);
                
                for(let it = 0; it < max_number_of_inbetween_values_of_axis; it++)
                {

                    this.ctx.fillText(keys[it*skip], this.x1, this.y2 - distance * counter);
                    counter++;               
                }
                
                this.ctx.fillText(keys[keys.length-1], this.x1, this.y2 - distance * max_number_of_inbetween_values_of_axis);
            }
            
        }else if(this.category == "Number")
        {
          
          
            const min = this.min_value;
            const max = this.max_value;

            //halving the diff makes an reasonable increment
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


            //Strict floor and ceil
            //Normal: ceil(9.2) = 10
            //        floor(9.2) = 9
            //        ceil(9.0) = 9
            //        floor(9.0) = 9
            //
            //Strict: sceil(9.2) = floor(9.2) + 1 = 10
            //        sfloor(9.2) = ceil(9.2) - 1 = 9
            //        sceil(9.0) = floor(9.0) + 1 = 10
            //        sfloor(9.0) = ceil(9.0) - 1 = 8
            const k_min = Math.floor(min/step) + 1;
            const k_max = Math.ceil(max/step) - 1;
            
            const k = k_max - k_min;

            const L1 = (k_min*step - min)/(step);
            const L2 = (max - k_max*step)/(step);
            
            const diff_distance = (total_length)/(k + L1 + L2);
            
            

            this.ctx.fillText(this.min_value, this.x1, this.y2);            
            
            for(let counter = 0; counter <= k; counter++)
            {
                const display_value = k_min * step + counter * step;
                const y_position =  this.y2 - (L1*diff_distance + diff_distance * counter);
                this.ctx.fillText(display_value, this.x1, y_position);
            }
            
            this.ctx.fillText(this.max_value, this.x1, this.y1);                        
            
        }
            

    }
    
}



class Bin
{
    /*
     * @param {number} dimension sets the number of rows and column (e.g 64 => 64x64, 400 => 400x400)
     * @param {number} ystart of axis for positioning
     * @param {number} yend of axis for positioning
     * @param {number} x_axis_last x position of left axis 
     * @param {number} x_axis_next x position of right axis
     *
     *
     */
      
    constructor(dimension, ystart, yend, x_axis_last, x_axis_next)
    {
        this.dimension = dimension;
        this.ystart = ystart;
        this.yend = yend;
        this.x_axis_last = x_axis_last;
        this.x_axis_next = x_axis_next;
        
        this.matrix = [];

        //initialize zero matrix
        for(let it = 0; it < dimension; it++)
        {
            let row = [];
            for(let jk = 0; jk < dimension; jk++)
            {
                row.push(0);
            }
                    
            this.matrix.push(row);
        }

        this.total_number = 0;
    }

    /*
     * x_value and y_value must be between 0.0 and 1.0
     * @param {number} x_value , value of the left axis
     * @param {number} y_value , value of the right axis
     *
     */
    addPair(x_value, y_value)
    {
        if(x_value < 0 || x_value > 1 || y_value < 0 || y_value > 1)return;

        let x_index = Math.ceil((this.dimension - 1) * x_value);
        let y_index = Math.ceil((this.dimension - 1) * y_value);

        this.matrix[x_value][y_value]++;

        this.total_number++;
    }

    render(ctx)
    {
        
    }
}


        
    
