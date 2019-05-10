var d3Scripts = (function () {
    let currentDay;
    let currentHours;
    let currentMinutes;
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

    let busLines = [];
    let busLine = {
        lineId: Number,
        lineNo: Number,
        courses: [],
        stops: []
    }
    let course = {
        id: Number,
        direction: String,
        day: String,
        startTime: {},
        endTime: {}
    }
    let busStop = {
        id: Number,
        name: String,
        arrivals: []
    }
    let arrival = {
        h: Number,
        m: Number,
        direction: String
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

    function setDate(day, hours, minutes) {
        currentDay = day;
        currentHours = hours;
        currentMinutes = minutes;
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
                    let arrLastItem = busLines.slice(-1)[0]
                    if (arrLastItem === undefined) {
                        busLines.push(busLine = {
                            lineId: 1,
                            lineNo: d.lineNo,
                            courses: [],
                            stops: [busStop = {
                                id: d.stopNo,
                                name: d.stopName,
                                arrivals: []
                            }]
                        })
                    } else if (arrLastItem.lineNo == d.lineNo) {
                        arrLastItem.stops.push(busStop = {
                            id: d.stopNo,
                            name: d.stopName,
                            arrivals: []
                        })
                    } else {
                        busLines.push(busLine = {
                            lineId: ++id,
                            lineNo: d.lineNo,
                            courses: [],
                            stops: [busStop = {
                                id: d.stopNo,
                                name: d.stopName,
                                arrivals: []
                            }]
                        })
                    }
                })
                let uniqueStops = distinctBy(data, d => d.stopName);
                drawBusStops(uniqueStops);
            }
        )
        d3.csv("csv/buses.csv").then(
            (data) => {
                data.forEach(d => {
                    let busLine = busLines.find(l => l.lineNo === d.lineNo)
                    if (busLine !== undefined) {
                        sCourse = busLine.courses.find(c => c.id === d.courseId);
                        if (sCourse === undefined) {
                            busLine.courses.push(course = {
                                id: d.courseId,
                                direction: d.direction,
                                day: d.day,
                                startTime: {
                                    ["h"]: getHours(d.time),
                                    ["m"]: getMinutes(d.time)
                                },
                                endTime: {
                                    ["h"]: getHours(d.time),
                                    ["m"]: getMinutes(d.time)
                                }
                            })
                        } else {
                            if (sCourse.startTime.h > getHours(d.time)) {
                                sCourse.startTime.h = getHours(d.time)
                                sCourse.startTime.m = getMinutes(d.time)
                            }
                            if (sCourse.startTime.h === getHours(d.time)) {
                                if (sCourse.startTime.m > getMinutes(d.time)) {
                                    sCourse.startTime.m = getMinutes(d.time)
                                }
                            }
                            if (sCourse.endTime.h < getHours(d.time)) {
                                sCourse.endTime.h = getHours(d.time)
                                sCourse.endTime.m = getMinutes(d.time)
                            }
                            if (sCourse.endTime.h === getHours(d.time)) {
                                if (sCourse.endTime.m < getMinutes(d.time)) {
                                    sCourse.endTime.m = getMinutes(d.time)
                                }
                            }
                        }

                        let stop = busLine.stops.find(s => s.name == d.stopName);
                        if (stop !== undefined) {
                            stop.arrivals.push(arrival = {
                                direction: d.direction,
                                h: getHours(d.time),
                                m: getMinutes(d.time)
                            })
                        }
                    }
                })
            }
        ).on("end", console.log("x"))
    }

    function getHours(s) {
        return parseInt(s.substring(0, 2));
    }

    function getMinutes(s) {
        return parseInt(s.substring(3));
    }

    function distinctBy(data, key) {
        let seen = new Set();
        return data.filter(item => {
            let k = key(item);
            return seen.has(k) ? false : seen.add(k);
        });
    }

    function drawBusStops(data) {
        for (let i = 0; i < data.length; i++) {
            if (i < data.length - 1 && data[i].lineNo === data[i + 1].lineNo) {
                drawLinesWithInitialData(data[i], data[i + 1], stopsConnectionColor);
                drawStopWithInitialData(data[i], stopsColor);
            } else {
                drawStopWithInitialData(data[i], stopsConnectionColor);
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
                        let id = busLines.find(l =>
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
                        let id = busLines.find(l =>
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
                        let id = busLines.find(l =>
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
                let ml = 0;
                busLines.forEach(l => {
                    if (l.stops.length > ml)
                        ml = l.stops.length;
                });
                scale = d3.scaleLinear()
                    .domain([0, ml + 1])
                    .range([0, width]);
            }
        } else if (axis === "y") {
            if (type === "map") {
                scale = d3.scaleLinear()
                    .domain([51.929143, 51.984604])
                    .range([height, 0]);
            } else {
                scale = d3.scaleLinear()
                    .domain([0, busLines.length + 1])
                    .range([height, 0]);
            }
        }
        return scale(d);
    }


    return {
        init: init,
        switchViewStyle: switchStyle,
        setDate: setDate
    }
})();