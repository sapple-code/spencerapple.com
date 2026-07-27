const d3 = global.d3
const path = require('path')
const prerenderGraphComponents = require('prerender-graph-components')

function parseNumber (numberString) {
    if (numberString === undefined) {
        return null;
    }
    if (! parseInt(numberString[0], 10)) {
        numberString = numberString.substring(1);
    }
    var number = parseFloat(numberString, 10);

    return isNaN(number) ? null : number;
};

function type (d) {
    d.date = new Date(d.date);
    d.amount = parseNumber(d.amount);
    return d;
}

function daysElapsed (start, end) {
    return Math.floor((end - start) / (1000*60*60*24));
}

// define module vars
var twoDecimalRound = d3.format("$,.2f"),
        alternateCountryNames = {
            'CostaRica': 'Costa Rica' },
        data = {};

module.exports.asyncLoad = function (htmlContent, filesInDirectory, files) {
    return new Promise(function (resolve, reject) {
        // read budget file
        var placesFile = files[path.join(htmlContent.directory, './data/places.json')],
            placesData = JSON.parse(placesFile.contents.toString());

        // calculate length of stay in each country
        data.countries = placesData.countries.map(function (country) {
            country.startAndEnds.forEach(function (dates) {
                dates.start = new Date(dates.start);
                dates.end = new Date(dates.end);
                dates.daysElapsed = daysElapsed(dates.start, dates.end);
            });

            // count the number of days in each country
            country.days = country.startAndEnds.reduce(function (prev, curr) {
                return prev + curr.daysElapsed;
            }, 0);

            return country;
        });

        // update places to have a country tag
        var re = /#(\w+)_/;
        data.places = placesData.places.map(function (place) {
            place.country = re.exec(place.id)[1];

            if (alternateCountryNames.hasOwnProperty(place.country)) {
                place.country = alternateCountryNames[place.country];
            }

            var endDate = new Date(place.endDate),
                startDate = new Date(place.startDate);

            place.days = daysElapsed(startDate, endDate);
            place.midDate = new Date(((endDate - startDate) / 2) + startDate.getTime());

            return place;
        });

        // total length (remember to add an extra day to the last place)
        data.totalDays = data.countries.reduce(function (prev, curr) {
            return prev + curr.days;
        }, 0);

        data.countryColors = data.countries.reduce(
            function (previousValue, currentValue, currentIndex, array) {
                previousValue[currentValue.name] = d3.schemeCategory20[currentIndex];
                return previousValue;
            }, {});

        // Relative Travel Effort by Country
        data.travelSpeedByCountry = d3.nest()
            .key(function (d) { return d.country; })
            .rollup(function (v, i) { return {
                totalTravelTime: d3.sum(v, function (d) { return d.travelTime; }),
            }; })
            .entries(data.places);

        data.travelSpeedByCountry.forEach(function (country, index) {
            country.days = data.countries[index].days;
            country.avgTravelSpeed = (country.value.totalTravelTime / 24) / country.days;
        });

        // update json file with processed data
        placesFile.contents = Buffer.from(JSON.stringify(data), 'utf-8');

        resolve();
    });
}

// highlight country names in color
module.exports.highlightCountryNames = function (querySelector) {
    data.countries.forEach(function (country) {
        d3.select(this.document)
            .selectAll('span.' + country.id).style('color', data.countryColors[country.name]);
    }, this);
}

module.exports.renderConclusions = function (querySelector) {
    var total = d3.nest()
        .rollup(function (v) { return {
            travelTime: d3.sum(v, function (d) { return d.travelTime; }),
        }; })
        .entries(data.places);

    d3.select(this.document).select('#totalDays').text(data.totalDays);
    d3.select(this.document).select('#totalTravelTime').text(d3.format(".0f")(total.travelTime));
    d3.select(this.document).select('#commuteTime').text(d3.format(".2f")(total.travelTime / 5 / 48));
}

module.exports.lengthOfStay = function (querySelector) {
    var lengthOfStay = prerenderGraphComponents.barChart()
        .x(function (d) { return d.name; })
        .y(function (d) { return d.days; })
        .yLabel('Length Of Stay (days)')
        .color(function (d) { return data.countryColors[d.name]; })
        .hoverText(function (d) { return d.days + ' days'; })
        .key(prerenderGraphComponents.key());

    d3.select(this.document).select('#lengthOfStay')
        .datum(data.countries)
        .call(lengthOfStay);
}

module.exports.lengthOfStayPerPlace = function () {
    var lengthOfStayPerPlace = prerenderGraphComponents.barChart()
        .x(function (d) { return d.id; })
        .y(function (d) { return d.days; })
        .xLabel('Places Stayed')
        .yLabel('Length Of Stay (days)')
        .color(function (d) { return data.countryColors[d.country]; })
        .hoverText(function (d) { return d.name; });

    d3.select(this.document).select('#lengthOfStayPerPlace')
        .datum(data.places)
        .call(lengthOfStayPerPlace);
}

module.exports.travelTimePerPlace = function () {
    var travelTimePerPlace = prerenderGraphComponents.barChart()
        .x(function (d) { return d.id; })
        .y(function (d) { return d.travelTime; })
        .xLabel('Places Stayed')
        .yLabel('Travel Time to reach destination (hours)')
        .color(function (d) { return data.countryColors[d.country]; })
        .hoverText(function (d) { return d.name; });

    d3.select(this.document).select('#travelTimePerPlace')
        .datum(data.places)
        .call(travelTimePerPlace);
}

module.exports.travelTimePerPlaceScatterplot = function () {
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

    d3.select(this.document).select('#travelTimePerPlaceScatterplot')
        .datum(data.places)
        .call(travelTimePerPlaceScatterplot);
}

module.exports.travelTimeOverTotalTime = function () {
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

    d3.select(this.document).select('#travelTimeOverTotalTimePoints')
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

     d3.select(this.document).select('#travelTimeOverTotalTimeLine')
        .datum(data.places)
        .call(travelTimeOverTotalTimeLine);
}

module.exports.travelSpeedCountry = function () {
    var travelSpeedCountry = prerenderGraphComponents.barChart()
        .x(function (d) { return d.key; })
        .y(function (d) { return d.avgTravelSpeed; })
        .yTickFormat(d3.format('.0%'))
        .yLabel('Travel Time / Time Spent (%)')
        .color(function (d) { return data.countryColors[d.key]; })
        .hoverText(function (d) { return d3.format(".1%")(d.avgTravelSpeed); })
        .key(prerenderGraphComponents.key());

    d3.select(this.document).select('#travelSpeedCountry')
        .datum(data.travelSpeedByCountry)
        .call(travelSpeedCountry);
}
