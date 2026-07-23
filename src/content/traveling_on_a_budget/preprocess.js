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
  budget = new Promise(function (resolve, reject) {
    // read budget file
    var budgetFile = files[path.join(htmlContent.directory, './data/budget.csv')],
        placesFile = files[path.join(htmlContent.directory, './data/places.json')],
        budgetData = d3.csvParse(budgetFile.contents.toString(), type),
        placesData = JSON.parse(placesFile.contents.toString());

    // aggregate amount spent by date
    var byDate = d3.nest()
      .key(function (d) { return d.date; })
      .rollup(function (v) { return {
        amount: d3.sum(v, function (d) { return d.amount; }),
      }; })
      .entries(budgetData);

    data.byDate = byDate;

    var countries = placesData.countries,
        places = placesData.places;

    // calculate length of stay in each country
    countries.forEach(function (country) {
      country.startAndEnds.forEach(function (dates) {
        dates.start = new Date(dates.start);
        dates.end = new Date(dates.end);
        dates.daysElapsed = daysElapsed(dates.start, dates.end);
      });

      var totalDays = country.startAndEnds.reduce(function (prev, curr) {
        return prev + curr.daysElapsed;
      }, 0);

      country.days = totalDays;
    });

    // update places to have a country tag
    var re = /#(\w+)_/;
    data.places = places.map(function (place) {
      place.country = re.exec(place.id)[1];

      if (alternateCountryNames.hasOwnProperty(place.country)) {
          place.country = alternateCountryNames[place.country];
      }

      var days = [],
          endDate = new Date(place.endDate),
          startDate = new Date(place.startDate),
          difference = daysElapsed(startDate, endDate);

      place.midDate = new Date(((endDate - startDate) / 2) + startDate.getTime());

      byDate.forEach(function (day) {
        if (new Date(day.key) < endDate && new Date(day.key) >= startDate) {
          days.push(day);
        }
      });

      daysNest = d3.nest()
       .rollup(function (v) { return {
         'days': v.length,
         'amount': d3.sum(v, function (d) { return d.value.amount; })
       }; })
       .entries(days);

      // covers empty days that we didn't enter any money for
      if (difference !== daysNest.days) {
        daysNest.days = difference;
      }

      place.days = days;
      place.value = daysNest;

      return place;
    });

    // aggregate amount spent and num days by country
    data.budgetPerCountry = d3.nest()
      .key(function(d) { return d.country; })
      .rollup(function (v) {
        var days = d3.sum(v, function (d) { return d.value.days; });
        var amount = d3.sum(v, function (d) { return d.value.amount; });
        return {
          days: days,
          amount: amount,
          averageDailySpent: amount / days,
        };
      })
      .entries(data.places);

    // total length (remember to add an extra day to the last place)
    data.totalDays = countries.reduce(function (prev, curr) {
      return prev + curr.days;
    }, 0);

    data.totalAverage = d3.nest()
      .rollup(function (v) {
        var sum = d3.sum(v, function (d) { return d.value.amount; });
        return {
          sum: sum,
          days: data.totalDays,
          averageDailySpent: sum / data.totalDays,
        }; })
      .entries(data.byDate);

    data.countryColors = countries.reduce(
        function (previousValue, currentValue, currentIndex, array) {
            previousValue[currentValue.name] = d3.schemeCategory20[currentIndex];
            return previousValue;
        }, {});

    // update json file with processed data
    placesFile.contents = Buffer.from(JSON.stringify(data), 'utf-8');
    // no longer need budget file to be served
    delete files[path.join(htmlContent.directory, './data/budget.csv')];

    resolve();
  });

  return budget;
}

module.exports.totalDays = function (querySelector) {
  el = querySelector('#totalDays');
  el.innerHTML = data.totalAverage.days;
}

module.exports.totalSpent = function (querySelector) {
  el = querySelector('#totalSpent');
  el.innerHTML = twoDecimalRound(data.totalAverage.sum);
}

module.exports.averageDailySpent = function (querySelector) {
  el = querySelector('#averageDailySpent');
  el.innerHTML = twoDecimalRound(data.totalAverage.averageDailySpent);
}

module.exports.budgetByCountry = function (querySelector) {
    var barChart = prerenderGraphComponents.barChart()
        .x(function (d) { return d.key; })
        .y(function (d) { return d.value.averageDailySpent; })
        .yTickFormat(d3.format("$,"))
        .yLabel('Average Daily Spending')
        .color(function (d) { return data.countryColors[d.key]; })
        .hoverText(function (d) { return twoDecimalRound(d.value.averageDailySpent); })
        .key(prerenderGraphComponents.key());

    d3.select(this.document).select('#budgetByCountry')
        .datum(data.budgetPerCountry)
        .call(barChart);
}

module.exports.generateScatterplots = function (querySelector) {
    var rScale = d3.scaleLinear()
        .domain(d3.extent(data.places, function (d) { return d.value.days; }))
        .range([5, 15]);

    var scatterplotPlaces = prerenderGraphComponents.scatterplot()
        .x(function (d) { return new Date(d.midDate); })
        .y(function (d) { return d.value.amount / d.value.days; })
        .r(function (d) { return rScale(d.value.days); })
        .xScaleGenerator(function (data, width, height) {
            return d3.scaleTime()
                .domain(d3.extent(data, function (d) { return new Date(d.midDate); }))
                .range([0, width])
                .nice(); })
        .xTickFormat(d3.timeFormat("%b '%y"))
        .yTickFormat(d3.format("$,"))
        .yLabel('Average Daily Spending')
        .color(function (d) { return data.countryColors[d.country]; })
        .hoverText(function (d) { return d.name;});

    d3.select(this.document).select('#spendingPerPlace')
        .datum(data.places)
        .call(scatterplotPlaces);

    d3.select(this.document).selectAll('#spendingPerPlace .xAxis g text')
        .attr("transform", "rotate(30)")
        .attr("x", 3)
        .style("text-anchor", "start");

    var scatterplot1 = prerenderGraphComponents.scatterplot()
        .x(function (d) { return d.value.days; })
        .y(function (d) { return d.value.amount / d.value.days; })
        .r(function (d) { return rScale(d.value.days); })
        .xScaleGenerator(function (data, width, height) {
            return d3.scaleLinear()
                .domain([0, d3.max(data, function (d) { return d.value.days; })])
                .range([0, width]); })
        .yTickFormat(d3.format("$,"))
        .xLabel('Length of Stay (days)')
        .yLabel('Average Daily Spending')
        .color(function (d) { return data.countryColors[d.country]; })
        .hoverText(function (d) { return d.name;});

    d3.select(this.document).select('#avgVsLength')
        .datum(data.places)
        .call(scatterplot1);
}
