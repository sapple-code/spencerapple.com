var dispatch = d3.dispatch("loaded");

document.addEventListener("DOMContentLoaded", function () {
    d3.json("data/places.json").then(function (data) {
        dispatch.call("loaded", this, data);
    });
});

dispatch.on("loaded.lengthOfStay", function (data) {
    var lengthOfStay = prerenderGraphComponents.barChart()
        .x(function (d) { return d.name; })
        .y(function (d) { return d.days; })
        .yLabel('Length Of Stay (days)')
        .color(function (d) { return data.countryColors[d.name]; })
        .hoverText(function (d) { return d.days + ' days'; })
        .key(prerenderGraphComponents.key());

    d3.select('#lengthOfStay')
        .datum(data.countries)
        .call(lengthOfStay);
});

dispatch.on("loaded.lengthOfStayPerPlace", function (data) {
    var lengthOfStayPerPlace = prerenderGraphComponents.barChart()
        .x(function (d) { return d.id; })
        .y(function (d) { return d.days; })
        .xLabel('Places Stayed')
        .yLabel('Length Of Stay (days)')
        .color(function (d) { return data.countryColors[d.country]; })
        .hoverText(function (d) { return d.name; });

    d3.select('#lengthOfStayPerPlace')
        .datum(data.places)
        .call(lengthOfStayPerPlace);
});

dispatch.on("loaded.travelTimePerPlace", function (data) {
    var travelTimePerPlace = prerenderGraphComponents.barChart()
        .x(function (d) { return d.id; })
        .y(function (d) { return d.travelTime; })
        .xLabel('Places Stayed')
        .yLabel('Travel Time to reach destination (hours)')
        .color(function (d) { return data.countryColors[d.country]; })
        .hoverText(function (d) { return d.name; });

    d3.select('#travelTimePerPlace')
        .datum(data.places)
        .call(travelTimePerPlace);
});

dispatch.on("loaded.tavelTimePerPlaceScatterplot", function (data) {
    var travelTimePerPlaceScatterplot = prerenderGraphComponents.scatterplot()
        .x(function (d) { return new Date(d.midDate); })
        .y(function (d) { return d.travelTime; })
        .r(function (d) { return 5; })
        .xScaleGenerator(function (data, width, height) {
            return d3.scaleTime()
                .domain(d3.extent(data, function (d) { return new Date(d.midDate); }))
                .range([0, width])
                .nice(); })
        .xTickFormat(d3.timeFormat("%b '%y"))
        .xLabel('Date Visited')
        .yLabel('Travel Time to reach destination (hours)')
        .color(function (d) { return data.countryColors[d.country]; })
        .hoverText(function (d) { return d.name;});

    d3.select('#travelTimePerPlaceScatterplot')
        .datum(data.places)
        .call(travelTimePerPlaceScatterplot);

    // medellín selection
    var medellinSelection = d3.selectAll('#travelTimePerPlaceScatterplot .chart .point')
        .filter(function (d) { return d.name === 'Medellín'; });

    d3.select('#medellínMouse').on('mouseenter', function (d, i) {
        medellinSelection.classed('highlight', true);
    });

    d3.select('#medellínMouse').on('mouseleave', function (d, i) {
        medellinSelection.classed('highlight', false);
    });
});

dispatch.on("loaded.travelTimeOvertotalTime", function (data) {
    var travelSpeed = function (d) { return (d.travelTime / 24) / d.days; };

    var travelTimeOverTotalTimePoints = prerenderGraphComponents.scatterplot()
        .x(function (d) { return new Date(d.midDate); })
        .y(travelSpeed)
        .r(function (d) { return 5; })
        .xScaleGenerator(function (data, width, height) {
            return d3.scaleTime()
                .domain(d3.extent(data, function (d) { return new Date(d.midDate); }))
                .range([0, width])
                .nice(); })
        .xTickFormat(d3.timeFormat("%b '%y"))
        .yTickFormat(d3.format('.0%'))
        .xLabel('Date Visited')
        .yLabel('Travel Time / Time Spent (%)')
        .color(function (d) { return data.countryColors[d.country]; })
        .hoverText(function (d) { return d.name;});

    d3.select('#travelTimeOverTotalTimePoints')
        .datum(data.places)
        .call(travelTimeOverTotalTimePoints);

    var travelTimeOverTotalTimeLine = prerenderGraphComponents.lineChart()
        .x(function (d) { return new Date(d.midDate); })
        .y(travelSpeed)
        .r(function (d) { return 5; })
        .xScaleGenerator(function (data, width, height) {
            return d3.scaleTime()
                .domain(d3.extent(data, function (d) { return new Date(d.midDate); }))
                .range([0, width])
                .nice(); })
        .xTickFormat(d3.timeFormat("%b '%y"))
        .yTickFormat(d3.format('.0%'))
        .xLabel('Date Visited')
        .yLabel('Travel Time / Time Spent (%)');

    d3.select('#travelTimeOverTotalTimeLine')
        .datum(data.places)
        .call(travelTimeOverTotalTimeLine);

    // highlight selections
    var placeNumber = /#(\w+)_(\d+)/;
    var patagonianSelection = d3.selectAll('#travelTimeOverTotalTimePoints .chart .point')
        .filter(function (d) {
            var countryNumber = placeNumber.exec(d.id);
            return (countryNumber[1] === 'Chile' &&
                    countryNumber[2] >= 10 && countryNumber[2] <= 19) ||
                   (countryNumber[1] === 'Argentina' &&
                    countryNumber[2] >= 1 && countryNumber[2] <= 3);
        });

    d3.selectAll('.patagoniaMouse')
        .on('mouseenter', function (d, i) {
            patagonianSelection.classed('highlight', true); })
        .on('mouseleave', function (d, i) {
            patagonianSelection.classed('highlight', false); });

    var boliviaSelection = d3.selectAll('#travelTimeOverTotalTimePoints .chart .point')
        .filter(function (d) { return d.country === 'Bolivia'; });

    d3.select('#boliviaMouse')
        .on('mouseenter', function (d, i) {
            boliviaSelection.classed('highlight', true); })
        .on('mouseleave', function (d, i) {
            boliviaSelection.classed('highlight', false); });

    var colombiaSelection = d3.selectAll('#travelTimeOverTotalTimePoints .chart .point')
        .filter(function (d) { return d.country === 'Colombia'; });

    d3.select('#colombiaMouse')
        .on('mouseenter', function (d, i) {
            colombiaSelection.classed('highlight', true); })
        .on('mouseleave', function (d, i) {
            colombiaSelection.classed('highlight', false); });
});

dispatch.on("loaded.travelSpeedCountry", function (data) {
    var travelSpeedCountry = prerenderGraphComponents.barChart()
        .x(function (d) { return d.key; })
        .y(function (d) { return d.avgTravelSpeed; })
        .yTickFormat(d3.format('.0%'))
        .yLabel('Travel Time / Time Spent (%)')
        .color(function (d) { return data.countryColors[d.key]; })
        .hoverText(function (d) { return d3.format(".1%")(d.avgTravelSpeed); })
        .key(prerenderGraphComponents.key());

    d3.select('#travelSpeedCountry')
        .datum(data.travelSpeedByCountry)
        .call(travelSpeedCountry);
});
