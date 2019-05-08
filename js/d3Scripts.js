var d3Scripts = (function () {
    let isInTransition = false;
    let width;
    let height;
    let svg;
    let margin = 30;
    let isInitialStyle = true;
    const stopsTransitionTime = 5000;
    const stopsColor = "#2A4B7C";
    const stopsConnectionColor = "#577284";
    const busColor = "#F96714";

    let busLine = {
        lineId: Number,
        lineNo: Number,
        stopsCount: Number
    }
    let loadedDataStats = {
        busLines: [],
    }

    var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    function init(w, h) {
        width = w;
        height = h;
        createSVG();
        loadStopsData();
    }

    function switchStyle() {
        if (isInTransition === false) {
            if (isInitialStyle) {
                positionStops("line");
                isInitialStyle = !isInitialStyle;
            } else {
                positionStops("map");
                isInitialStyle = !isInitialStyle;
            }
        }
    }

    function createSVG() {
        svg = d3.select("#svgContainer")
            .append("svg:svg")
            .attr("width", width)
            .attr("height", height)
    }

    function loadStopsData() {
        d3.csv("csv/stops.csv").then(
            (data) => {
                let id = 1;
                data.forEach(d => {
                    let arrLastItem = loadedDataStats.busLines.slice(-1)[0]
                    if (arrLastItem === undefined) {
                        loadedDataStats.busLines.push(busLine = {
                            lineId: 1,
                            lineNo: d.lineNo,
                            stopsCount: 1
                        })
                    } else if (arrLastItem.lineNo == d.lineNo) {
                        arrLastItem.stopsCount += 1;
                    } else {
                        loadedDataStats.busLines.push(busLine = {
                            lineId: ++id,
                            lineNo: d.lineNo,
                            stopsCount: 1
                        })
                    }
                })
                drawBusStops(data);
            }
        )
    }

    function drawBusStops(data) {
        for (let i = 0; i < data.length; i++) {
            if (i < data.length - 1 && data[i].lineNo === data[i + 1].lineNo) {
                drawStopWithInitialData(data[i], stopsColor);
                drawLinesWithInitialData(data[i], data[i + 1], stopsColor);
            } else {
                drawStopWithInitialData(data[i], stopsColor);
            }
        }
        positionStops("map");
    }

    function drawStopWithInitialData(data, color) {
        svg.append("circle")
            .attr("data-type", "busStop")
            .attr("data-line-number", data.lineNo)
            .attr("data-id", data.stopNo)
            .attr("data-longitude", data.longitude)
            .attr("data-latitude", data.latitude)
            .attr("cx", 0)
            .attr("cy", height)
            .attr("r", 5)
            .attr("fill", color)
            .on("mouseover", () => {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(data.stopName + "<br/>")
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", () => {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
    }

    function positionStops(type) {
        isInTransition = true;
        let busStops = svg.selectAll("[data-type = 'busStop']");

        busStops.each(function () {
            d3.select(this)
                .transition()
                .duration(stopsTransitionTime)
                .attr("cx", () => {
                    let bStop = $(this);
                    if (type === "map") {
                        return getScale(type, "x", bStop.attr("data-longitude"));
                    } else {
                        return getScale(type, "x", bStop.attr("data-id"));
                    }
                })
                .attr("cy", () => {
                    bStop = $(this);
                    if (type === "map") {
                        return getScale(type, "y", bStop.attr("data-latitude"));
                    } else {
                        let id = loadedDataStats.busLines.find(l =>
                            l.lineNo == bStop.attr("data-line-number")
                        ).lineId
                        return getScale(type, "y", id)
                    }
                })
                .on("end", () => isInTransition = false);
        })
        positionLines(type);
    }

    function drawLinesWithInitialData(startData, stopData, color) {
        svg.append("line")
            .attr("data-line-number", startData.lineNo)
            .attr("data-id", startData.stopNo)
            .attr("data-start-longitude", startData.longitude)
            .attr("data-start-latitude", startData.latitude)
            .attr("data-stop-longitude", stopData.longitude)
            .attr("data-stop-latitude", stopData.latitude)
            .attr("stroke", color)
            .attr("stroke-width", 1)
            .attr("fill", "none")
            .attr("x1", 0)
            .attr("y1", height)
            .attr("x2", 0)
            .attr("y2", height);
    }

    function positionLines(type) {
        isInTransition = true;
        let lines = svg.selectAll("line");

        lines.each(function () {
            d3.select(this)
                .transition()
                .duration(stopsTransitionTime)
                .attr("x1", () => {
                    let line = $(this);
                    if (type == "map") {
                        return getScale(type, "x", line.attr("data-start-longitude"));
                    } else {
                        return getScale(type, "x", line.attr("data-id"));
                    }
                })
                .attr("x2", () => {
                    line = $(this);
                    if (type == "map") {
                        return getScale(type, "x", line.attr("data-stop-longitude"));
                    } else {
                        return getScale(type, "x", parseInt(line.attr("data-id")) + 1);
                    }
                })
                .attr("y1", () => {
                    line = $(this);
                    if (type == "map")
                        return getScale(type, "y", line.attr("data-start-latitude"));
                    else {
                        let id = loadedDataStats.busLines.find(l =>
                            l.lineNo == line.attr("data-line-number")
                        ).lineId
                        return getScale(type, "y", id);
                    }
                })
                .attr("y2", () => {
                    line = $(this);
                    if (type == "map")
                        return getScale(type, "y", line.attr("data-stop-latitude"));
                    else {
                        let id = loadedDataStats.busLines.find(l =>
                            l.lineNo == line.attr("data-line-number")
                        ).lineId
                        return getScale(type, "y", id);
                    }
                })
                .on("end", () => isInTransition = false);
        })
    }

    function getScale(type, axis, d) {
        let scale;
        if (axis === "x") {
            if (type === "map") {
                scale = d3.scaleLinear()
                    .domain([20.088672, 20.212606])
                    .range([0, width]);
            } else {
                let c = 0;
                loadedDataStats.busLines.forEach(l => {
                    if (l.stopsCount > c)
                        c = l.stopsCount;
                });
                scale = d3.scaleLinear()
                    .domain([0, c + 1])
                    .range([0, width]);
            }
        } else if (axis === "y") {
            if (type === "map") {
                scale = d3.scaleLinear()
                    .domain([51.929143, 51.984604])
                    .range([height, 0]);
            } else {
                scale = d3.scaleLinear()
                    .domain([0, loadedDataStats.busLines.length + 1])
                    .range([height, 0]);
            }
        }
        return scale(d);
    }


    return {
        init: init,
        switchViewStyle: switchStyle
    }
})();