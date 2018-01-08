
var aeorplanes = [];
var airports = [];
var verif = true;

$(function() {

    airports[0] = new Airport(0,0,0);

    var $grid = $("#search_grid");
    var grid = new GraphSearch($grid, astar.search);

    for(var i=0; i < aeorplanes.length; i++){
        console.log("---------------AVIAO " + i + "-------------");
        console.log("Posicao inicial " + aeorplanes[i].start_x + " " +aeorplanes[i].start_y);
        console.log("Posicao final " + aeorplanes[i].end_x + " " +aeorplanes[i].end_y);
        console.log("Combustivel " + aeorplanes[i].fuel);
    }

    for(var i=0; i < airports.length; i++){
        console.log("---------------AEROPORTO " + i + "-------------");
        console.log("Posicao " + airports[i].x + " " + airports[i].y);
    }

    $("#btnCreateRoutes").click(function() {
        grid.makeRoute();
    });

});

function Airport(id, x, y){

    var nextId = 1; 

    this.id = nextId++;
    this.x = x;
    this.y = y;
}

function Aeorplane(id, start_x, start_y, end_x, end_y){
    
    var nextId = 1; 

    this.id = nextId++;
    this.start_x = start_x;
    this.start_y = start_y;
    this.end_x = end_x;
    this.end_y = end_y;
    this.fuel = Math.round(Math.random()*100);
}

Airport.prototype.setPositionX = function(x) {

    this.x = x;
}

Airport.prototype.setPositionY = function(y) {
    
    this.y = y;
}

Aeorplane.prototype.setPositionX = function(x) {

    this.start_x = x;
}

Aeorplane.prototype.setPositionY = function(y) {
    
    this.start_y = y;
}


var css = { start: "start", finish: "finish", airplane: "airplane", airport: "airport", active: "active" };

function GraphSearch($graph, implementation) {
    this.$graph = $graph;
    this.search = implementation;
    this.initialize();
}

GraphSearch.prototype.initialize = function() {
    this.grid = [];
    var self = this,
        nodes = [],
        $graph = this.$graph;

    $graph.empty();

    var cellWidth = ($graph.width()/40)-2,  // -2 for border
        cellHeight = ($graph.height()/40)-2,
        $cellTemplate = $("<span />").addClass("grid_item").width(cellWidth).height(cellHeight),
        startSet = false;

    for(var x = 0; x < 40; x++) {
        var $row = $("<div class='clear' />"),
            nodeRow = [],
            gridRow = [];

        for(var y = 0; y < 40; y++) {
            var id = "cell_"+x+"_"+y,
                $cell = $cellTemplate.clone();
            $cell.attr("id", id).attr("x", x).attr("y", y);
            $row.append($cell);
            gridRow.push($cell);

            var nAirport = Math.floor(Math.random() * 300);
            var nAeroplanes = Math.floor(Math.random() * 150);

            if(nAirport === 0) {
                nodeRow.push(1);
                $cell.addClass(css.airport);

                if(verif == true){
                    airports[0].setPositionX(x);
                    airports[0].setPositionY(y);
                    verif = false;
                }
                else airports.push(new Airport(airports.length,x,y));

            }

            if(nAeroplanes === 0 && verif == false) {
                nodeRow.push(0);
                $cell.addClass(css.airplane);

                //random airport destination
                if(airports.length == 1){
                    aeorplanes.push(new Aeorplane(aeorplanes.length,x,y,airports[0].x,airports[0].y));
                }
                else{

                    var airportDestination = Math.floor(Math.random() * ((airports.length-1) - 0 + 1)) + 0;
                    aeorplanes.push(new Aeorplane(aeorplanes.length,x,y,airports[airportDestination].x,airports[airportDestination].y));
                }
                
            }
            else  {
                var cell_weight =  1;
                nodeRow.push(cell_weight);
                $cell.addClass('weight' + cell_weight);
                
                if (!startSet) {
                    $cell.addClass(css.start);
                    startSet = true;
                }
            }
        }

        $graph.append($row);

        this.grid.push(gridRow);
        nodes.push(nodeRow);
    }

    this.graph = new Graph(nodes);

};
GraphSearch.prototype.makeRoute = async function() {

    aeorplanes.sort(compare);

    for(var i =0; i < aeorplanes.length; i++){

        var path = this.search(this.graph, [0][0], [0][0]);
        var start = this.graph.grid[aeorplanes[i].start_x][aeorplanes[i].start_y];
        
        while(path.length==0){

            var end = this.graph.grid[aeorplanes[i].end_x][aeorplanes[i].end_y];

            path = this.search(this.graph, start, end);

            if(path.length == 0){
                console.log("ENTROUUUU");
                do{
                    var newAirportDestination = Math.floor(Math.random() * ((airports.length-1) - 0 + 1)) + 0;
                } while(airports[newAirportDestination].x == aeorplanes[i].end_x && airports[newAirportDestination].y == aeorplanes[i].end_y); 

            aeorplanes[i].end_x = airports[newAirportDestination].x;
            aeorplanes[i].end_y = airports[newAirportDestination].y;

            }
        } 
    
        this.animatePath(path);

        await new Promise(resolve => setTimeout(resolve, 1000));

        for(var j=0; j < path.length-1; j++){
            this.graph.grid[path[j].x][path[j].y].weight = 0;
        }
    }
};

GraphSearch.prototype.animatePath = function(path) {
    var grid = this.grid,
        timeout = 1000 / grid.length,
        elementFromNode = function(node) {
        return grid[node.x][node.y];
    };

    var self = this;
    // will add start class if final
    var removeClass = function(path, i) {
        if(i >= path.length) { // finished removing path, set start positions
            return setStartClass(path, i);
        }
        elementFromNode(path[i]).removeClass(css.active);
        setTimeout(function() {
            removeClass(path, i+1);
        }, timeout*path[i].getCost());
    };
    var setStartClass = function(path, i) {
        if(i === path.length) {
            self.$graph.find("." + css.start).removeClass(css.start);
            elementFromNode(path[i-1]).addClass(css.start);
        }
    };
    var addClass = function(path, i) {
        if(i >= path.length) { // Finished showing path, now remove
            //return removeClass(path, 0);
        }
        elementFromNode(path[i]).addClass(css.active);
        setTimeout(function() {
            addClass(path, i+1);
        }, timeout*path[i].getCost());
    };

    addClass(path, 0);
    this.$graph.find("." + css.start).removeClass(css.start);
    this.$graph.find("." + css.finish).removeClass(css.finish).addClass(css.start);
};

function compare(a,b) {
  if (a.fuel < b.fuel)
    return -1;
  if (a.fuel > b.fuel)
    return 1;
  return 0;
}