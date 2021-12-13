'use strict';

/* check #plot aspect-ratio in CSS as well if you want to change it */
const plotWidth = 900;
const plotHeight = 500;
const plotPadding = 40;

function fetchGDP() {
    return fetch('https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/GDP-data.json')
        .then(response => response.json());
}

function setPlotSize() {
    d3.select('#plot').attr('viewBox', `0 0 ${plotWidth} ${plotHeight}`);

}

function handleMouseOver(event, data) {
    const offset = 20;

    d3.select('.tooltip')
        .html(`${data[0]}<br>$${data[1]} Billion`)
        .style('top', `${event.clientY + offset}px`)
        .style('left', `${event.clientX + offset}px`)
        .attr('data-date', data[0])
        .classed('hidden', false);
}

function handleMouseOut() {
    d3.select('.tooltip')
        .classed('hidden', true);
}

function getXScale(data) {
    const latestDate = new Date(data[data.length - 1][0]);
    // hack to prolong x-axis according to the last bin
    latestDate.setMonth(latestDate.getMonth() + 3);

    return d3
        .scaleTime()
        .domain([new Date(data[0][0]), latestDate])
        .range([plotPadding, plotWidth - plotPadding]);
}

function getYScale(data) {
    const maxResultValue = d3.max(data, ([_, value]) => value);

    return d3
        .scaleLinear()
        .domain([0, maxResultValue])
        .range([0, plotHeight - (plotPadding * 2)]);
}

function renderXAxis(xScale) {
    const xAxis = d3.axisBottom(xScale);

    d3.select('#plot')
        .append('g')
        .attr('id', 'x-axis')
        .attr('transform', `translate(0, ${plotHeight - plotPadding})`)
        .call(xAxis);
}

function renderYAxis(yScale) {
    const yAxisScale = yScale.range([plotHeight - (plotPadding * 2), 0])
    const yAxis =
        d3.axisLeft(yAxisScale)
            .tickSize(-plotWidth + (plotPadding * 2))
            .tickSizeOuter(0);

    d3.select('#plot')
        .append('g')
        .attr('id', 'y-axis')
        .attr('transform', `translate(${plotPadding}, ${plotPadding})`)
        .call(yAxis)
        .call(g => g.selectAll('.tick line')
            .attr('stroke-opacity', 0.5)
            .attr('stroke-dasharray', '2,2'));
}

function renderColumns(data) {
    const binWidth = (plotWidth - (plotPadding * 2)) / data.length;
    const xScale = getXScale(data);
    const yScale = getYScale(data);
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;


    d3.select('#plot')
        .selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('data-date', ([date]) => date)
        .attr('data-gdp', ([_, value]) => value)
        .attr('width', binWidth)
        .attr('x', ([date]) => xScale(new Date(date)))
        .attr('y', () => plotHeight - plotPadding - yScale(0))
        .on('mouseover', handleMouseOver)
        .on('mouseout', handleMouseOut);

    d3
        .select('#plot')
        .selectAll("rect")
        .transition()
        .ease(d3.easeCubicOut)
        .duration(isReducedMotion ? 0 : 1000)
        .attr('y', ([_, value]) => plotHeight - plotPadding - yScale(value))
        .attr('height', ([_, value]) => yScale(value))
        .delay((_, index) => isReducedMotion ? 0 : index * 5);

    renderXAxis(xScale);
    renderYAxis(yScale);
}

setPlotSize();

fetchGDP()
    .then(result => {
        renderColumns(result.data);
    })
    .catch(error => {
        console.warn(error);
    })
