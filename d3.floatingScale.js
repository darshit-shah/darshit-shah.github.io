d3.svg.floatingScale = function () {
    "use strict";
    var that = this;
    var scaleValues = [{ y: 0, value: 0 }, { y: 1, value: 1}];
    var tickValues = [];
    var scale = d3.scale.linear();
    var axis = d3.svg.axis().scale(scale).ticks(0);
    var duration = 250;
    var delay = 500;
    var updateChart = null;
    var chart = null;
    var min = +Infinity;
    var max = -Infinity;
    var tickFormat = null;
    var lineWidth = 3;

    function floatingScale(value) {
        if (!isFinite(value)) {
            throw "floatingScale() only accepts a number";
        }
        return scale(value);
    }

    function updateScale(delay, duration) {
        if (chart == undefined)
            return null;

        var scaleLines = [].concat(scaleValues);
        if (scaleLines.length === 2) {
            scaleLines.pop();
            scaleLines.shift();
        }
        var floatingLines = chart.selectAll(".y.axis.floating").data(scaleLines);
        floatingLines.enter().append("line")
            .attr("class", "y axis floating")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("stroke-dasharray", "5,5")
            .attr("index", function (d, i) { return i })
            .style("cursor", "pointer")
            .style("stroke-width", lineWidth + "px")
            .call(drag)//drag magic - built in d3 behavior: https://github.com/mbostock/d3/wiki/Drag-Behavior#wiki-drag;
            ;
        floatingLines.exit().remove();

        chart.selectAll(".y.axis.floating")
                .transition()
                .delay(delay)
                .duration(duration)
                .attr("y1", function (d) {
                    return floatingScale(d.value);
                })
                .attr("y2", function (d) {
                    return floatingScale(d.value);
                });

        var floatingCircle = chart.selectAll(".y.axis.floatingCircle").data(scaleLines);
        floatingCircle.enter().append("circle")
                            .attr("class", "y axis floatingCircle")
                            .attr("cx", width + 20)
                            .attr("r", 20)
                            .style("stroke", "red")
                            .style("stroke-width", "3")
                            .style("fill", "transparent")
                            .attr("index", function (d, i) { return i })
                            .style("cursor", "pointer")
                            .call(drag) //drag magic - built in d3 behavior: https://github.com/mbostock/d3/wiki/Drag-Behavior#wiki-drag;
                            ;
        floatingCircle.exit().remove();

        chart.selectAll(".y.axis.floatingCircle")
                        .transition()
                        .delay(delay)
                        .duration(duration)
                        .attr("cy", function (d) { return floatingScale(d.value) })
                        ;

        var floatingLabel = chart.selectAll(".y.axis.floatingLabel").data(scaleLines);
        floatingLabel.enter().append("text")
                .attr("class", "y axis floatingLabel")
                .attr("x", width + 20)
                .attr("index", function (d, i) { return i })
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .style("cursor", "pointer")
                //.style("font-size", "12px")
                .call(drag) //drag magic - built in d3 behavior: https://github.com/mbostock/d3/wiki/Drag-Behavior#wiki-drag;
                ;
        floatingLabel.exit().remove();

        chart.selectAll(".y.axis.floatingLabel")
            .transition()
            .delay(delay)
            .duration(duration)
            .attr("y", function (d) { return floatingScale(d.value) })
            .text(function (d) {
                if (tickFormat == undefined)
                    return parseInt(d.value * 10) / 10;
                return d3.format(tickFormat)(d.value);
            });



        return floatingScale;
    }

    function dragmove(dragged) {
        var index = parseInt(d3.select(dragged).attr("index"));
        if (index > 0 && index < (scaleValues.length - 1) && scaleValues[index].y + d3.event.dy <= (scaleValues[index - 1].y - 10) && scaleValues[index].y + d3.event.dy >= (scaleValues[index + 1].y + 10)) {
            scaleValues[index].y += d3.event.dy;
            updateLocalChart(0, 0);
        }
    }

    function dragstart(dragged) {
        var index = parseInt(d3.select(dragged).attr("index"));
        d3.selectAll(".floating[index='" + index + "']").style("stroke-width", (lineWidth * 2) + 'px');
    }

    function dragend(dragged) {
        var index = parseInt(d3.select(dragged).attr("index"));
        d3.selectAll(".floating[index='" + index + "']").style("stroke-width", lineWidth + 'px');
    }

    function updateLocalChart(delay, duration) {
        scale.domain(scaleValues.map(function (d) { return d.value })).range(scaleValues.map(function (d) { return d.y }));
        axis.tickValues(floatingScale.tickValues());
        if (updateChart != undefined)
            updateChart(delay, duration);
        updateScale(delay, duration);
    }

    floatingScale.scale = function (a) {
        if (a != undefined) {
            scale = a;
        }
        else
            return scale;
    }

    floatingScale.axis = function (a) {
        if (a != undefined) {
            axis = a;
        }
        else
            return axis;
    }

    floatingScale.ticks = function () {
        if (arguments == undefined) {
            return tickValues.length;
        }
        arguments[0] = parseFloat(arguments[0]);
        if (isFinite(arguments[0]) && arguments[0] > 0) {
            if (arguments[1] != undefined)
                tickFormat = arguments[1];
            axis.ticks.apply(this, arguments);
            var scaleValue = (height - 0) / arguments[0];
            tickValues = [];
            for (var i = 0; i < arguments[0] + 1; i++) {
                tickValues.push(0 + (scaleValue * i))
            }
        }
        updateLocalChart(0, 0);
        return floatingScale;
    }

    floatingScale.tickValues = function (values) {
        if (values == undefined) {
            values = [];
            for (var i = 0; i < tickValues.length; i++) {
                values[i] = scale.invert(tickValues[i]);
            }
            return values;
        }
        else {
            tickValues = values;
        }
        return floatingScale;
    }

    floatingScale.addFloatingScaleLine = function (value) {
        if (!isFinite(value)) {
            throw "addFloatingScaleLine() only accepts a number";
        }
        if (value <= scaleValues[0].value) {
            return { status: false, code: 100, message: "value should be between range:[" + min + " ," + max + "]" };
        }
        else if (value >= scaleValues[scaleValues.length - 1].value) {
            return { status: false, code: 100, message: "value should be between range:[" + min + " ," + max + "]" };
        }
        for (var i = 1; i < scaleValues.length; i++) {
            if (scaleValues[i].value === value) {
                return { status: false, code: 101, message: "already added" };
                return;
            }
            else if (scaleValues[i].value > value) {
                var index = i;
                var newY1 = floatingScale(value);
                var newY2 = (scaleValues[index].y + scaleValues[index - 1].y) / 2;
                scaleValues.splice(index, 0, { value: value, y: newY1 });
                updateLocalChart(0, 0);
                scaleValues[index].y = newY2;
                updateLocalChart(delay, duration);
                break;
            }
        }
    }

    floatingScale.invert = function (value) {
        if (!isFinite(value)) {
            throw "invert() only accepts a number";
        }
        return scale.invert(value);
    }

    floatingScale.range = function (values) {
        if (values == undefined) {
            return scale.range();
        }
        if (values.length !== 2) {
            throw "range() only accepts array of two";
        }
        scale.range(values);
        scaleValues[0].y = values[0];
        scaleValues[scaleValues.length - 1].y = values[1];
        return floatingScale;
    }
    floatingScale.domain = function (values) {
        if (values.length !== 2) {
            throw "range() only accepts array of two";
        }
        scale.domain(values);
        scaleValues[0].value = values[0];
        scaleValues[scaleValues.length - 1].value = values[1];
        axis.tickValues(floatingScale.tickValues());
        return floatingScale;
    }
    floatingScale.duration = function (d) {
        if (!isFinite(d)) {
            throw "duration() only accepts a number";
        }
        duration = d;
        return floatingScale;
    }

    floatingScale.delay = function (d) {
        if (!isFinite(d)) {
            throw "delay() only accepts a number";
        }
        delay = d;
        return floatingScale;
    }

    floatingScale.chart = function (c) {
        if (typeof c !== 'object') {
            throw "chart() only accepts an abject";
        }
        chart = c;
        //        d3.select(chart)
        //        .on("touchstart", nozoom)
        //        .on("touchmove", nozoom);
        return floatingScale;
    }

    floatingScale.updateChart = function (cb) {
        if (typeof cb !== 'function') {
            throw "updateChart() only accepts a function";
        }
        updateChart = cb;
        return floatingScale;
    }

    var drag = d3.behavior.drag()
            .origin(Object)
            .on("drag", function () { dragmove(this); })
            .on("dragstart", function () { dragstart(this); })
            .on("dragend", function () { dragend(this); });

    //    function nozoom() {
    //        d3.event.preventDefault();
    //    }
    return floatingScale;
};
