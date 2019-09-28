var d3Scripts = (function () {
    let currentDay;
    let currentHour;
    let currentMinutes;
    let currentSeconds;
    let isInTransition = false;
    let width;
    let height;
    let svg;
    let margin = 30;
    let isInitialStyle = true;
    let timeMultiply = 1;
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
        endTime: {},
        arrivals: []
    }
    let busStop = {
        id: Number,
        name: String,
    }
    let arrival = {
        id: Number,
        busStopName: String,
        h: Number,
        m: Number
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

    function setDate(day, hours, minutes, seconds, multiply) {
        currentDay = day;
        currentHour = hours;
        currentMinutes = minutes;
        currentSeconds = seconds;
        timeMultiply = multiply;
        getBusesPositions();
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
                                name: d.stopName
                            }]
                        })
                    } else if (arrLastItem.lineNo == d.lineNo) {
                        arrLastItem.stops.push(busStop = {
                            id: d.stopNo,
                            name: d.stopName
                        })
                    } else {
                        busLines.push(busLine = {
                            lineId: ++id,
                            lineNo: d.lineNo,
                            courses: [],
                            stops: [busStop = {
                                id: d.stopNo,
                                name: d.stopName
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
                                },
                                arrivals: [arrival = {
                                    id: busLine.stops.find(s => s.name == d.stopName).id,
                                    busStopName: d.stopName,
                                    h: getHours(d.time),
                                    m: getMinutes(d.time)
                                }]
                            })
                        } else {
                            sCourse.arrivals.push(arrival = {
                                id: busLine.stops.find(s => s.name == d.stopName).id,
                                busStopName: d.stopName,
                                h: getHours(d.time),
                                m: getMinutes(d.time)
                            })
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
                    }
                })
            }
        )
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

    function getBusesPositions() {
        let activeCourses = [];
        busLines.forEach(bl => {
            activeCourses = bl.courses.filter(c => ((isHigherThanCurrentTime(c.startTime.h, c.startTime.m) == false || isEqualToCurrentTime(c.startTime.h, c.startTime.m) == true) && (isHigherThanCurrentTime(c.endTime.h, c.endTime.m) == true || isEqualToCurrentTime(c.endTime.h, c.endTime.m) == true)));
            activeCourses.forEach(c => {
                let busPosition = c.arrivals.find(s => isEqualToCurrentTime(s.h, s.m) == true);
                if (busPosition != undefined) {
                    drawBus(d3.select("[data-busStop-id = '" + busPosition.id + "']").attr("cx"), d3.select("[data-busStop-id = '" + busPosition.id + "']").attr("cy"), bl.lineId, c.id)
                } else {
                    let nextStop = c.arrivals.find(s => isHigherThanCurrentTime(s.h, s.m) == true);
                    let prevStop = c.arrivals.find(s => s.id == nextStop.id - 1);
                    let prevStopCx = parseFloat(d3.select("[data-busStop-id = '" + prevStop.id + "']").attr("cx"));
                    let prevStopCy = parseFloat(d3.select("[data-busStop-id = '" + prevStop.id + "']").attr("cy"));
                    let nextStopCx = parseFloat(d3.select("[data-busStop-id = '" + nextStop.id + "']").attr("cx"));
                    let nextStopCy = parseFloat(d3.select("[data-busStop-id = '" + nextStop.id + "']").attr("cy"));
                    let timeDif = (nextStop.h - prevStop.h) * 60 + nextStop.m - prevStop.m;
                    let timeFromPrevStop = (currentHour - prevStop.h) * 60 + (currentMinutes - prevStop.m) + currentSeconds / 60;
                    let busX = (timeFromPrevStop * (nextStopCx - prevStopCx) / timeDif) + prevStopCx;
                    let busY = (timeFromPrevStop * (nextStopCy - prevStopCy) / timeDif) + prevStopCy;
                    drawBus(busX, busY, bl.lineId, c.id);
                }
            })
        })
    }

    function drawBus(cx, cy, lineId, courseId) {
        if (isInTransition == false) {
            let id = 11 * parseInt(lineId) + 31 * parseInt(courseId);

            let bus = d3.select("[data-bus-id = '" + id + "']");
            if (bus._groups[0][0] == null) {
                svg.append("circle")
                    .attr("data-type", "bus")
                    .attr("data-bus-id", id)
                    .attr("cx", cx)
                    .attr("cy", cy)
                    .attr("r", 5)
                    .attr("fill", busColor)
            } else {
                d3.select("[data-bus-id = '" + id + "']").transition()
                    .duration(1000)
                    .attr("cx", cx)
                    .attr("cy", cy)
            }
        }

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
            .attr("data-busStop-id", data.stopNo)
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
                    if (type === "map") {
                        return getScale(type, "x", d3.select(this).attr("data-longitude"));
                    } else {
                        return getScale(type, "x", d3.select(this).attr("data-busStop-id"));
                    }
                })
                .attr("cy", () => {
                    bStop = $(this);
                    if (type === "map") {
                        return getScale(type, "y", d3.select(this).attr("data-latitude"));
                    } else {
                        let id = busLines.find(l =>
                            l.lineNo == d3.select(this).attr("data-line-number")
                        ).lineId
                        return getScale(type, "y", id)
                    }
                })
                .on("end", () => {
                    isInTransition = false
                    // getBusesPositions();
                });
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
                    if (type == "map") {
                        return getScale(type, "x", d3.select(this).attr("data-start-longitude"));
                    } else {
                        return getScale(type, "x", d3.select(this).attr("data-id"));
                    }
                })
                .attr("x2", () => {
                    if (type == "map") {
                        return getScale(type, "x", d3.select(this).attr("data-stop-longitude"));
                    } else {
                        return getScale(type, "x", parseInt(d3.select(this).attr("data-id")) + 1);
                    }
                })
                .attr("y1", () => {
                    if (type == "map")
                        return getScale(type, "y", d3.select(this).attr("data-start-latitude"));
                    else {
                        let id = busLines.find(l =>
                            l.lineNo == d3.select(this).attr("data-line-number")
                        ).lineId
                        return getScale(type, "y", id);
                    }
                })
                .attr("y2", () => {
                    if (type == "map")
                        return getScale(type, "y", d3.select(this).attr("data-stop-latitude"));
                    else {
                        let id = busLines.find(l =>
                            l.lineNo == d3.select(this).attr("data-line-number")
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

    function isHigherThanCurrentTime(h, m) {
        if (h > currentHour) {
            return true;
        }
        if (h == currentHour && m > currentMinutes) {
            return true;
        }
        return false;
    }

    function isEqualToCurrentTime(h, m) {
        if (h == currentHour && m == currentMinutes && currentSeconds == 0) {
            return true;
        }
        return false;
    }

    function ifFirstTimeIsHigher(fh, fm, sh, sm) {
        if (fh > sh) {
            return true;
        }
        if (fh == sh && fm > sm) {
            return true;
        }
        return false;
    }

    function ifTimeIsEqual(fh, fm, sh, sm) {
        if (fh == sh && fm == sm) {
            return true;
        }
        return false;
    }


    return {
        init: init,
        switchViewStyle: switchStyle,
        setDate: setDate
    }
})();