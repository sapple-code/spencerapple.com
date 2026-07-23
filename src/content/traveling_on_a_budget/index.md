---
title: Visualizing our yearlong budget through Latin America
author: Spencer Apple
layout: post.pug
withImage: budgetVis.png
publishDate: 2016-09-20 15:00
modifyDate: 2016-11-29 15:00
---

After working for two years post graduating, my girlfriend and I quit our jobs and bought one way tickets to Lima, Peru.
We made our way around South America and up Central America back to California.
Managing our budget was an everyday activity, and it inspired me to break it down further with different visualizations.

<span class="more"><span>

<link rel="stylesheet" href="css/main.css"></link>
<script type="text/javascript" src="lib/d3.min.js"></script>
<script type="text/javascript" src="src/graphComponents.js"></script>
<script type="text/javascript" src="src/main.js"></script>

Overall we traveled for **<span id="totalDays"></span> days**, spent **<span id="totalSpent"></span>** and ended spending **<span id="averageDailySpent"></span> per day** between the two of us.

We tracked our day to day spending in Google Docs and averaged it by the number of days to keep track of our Average Daily Spending. We also calculated an Average Daily Spending for each country. 

My girlfriend Lauren is learning to program with a focus on geography; she has been making an 
<a href="http://laurenmackey.com/route-map/" target="_blank">interactive route map</a> of our trip.
She created a list of places with start and end dates which I used to aggregate our spending by place and by country.

---
### Average Daily Spending per Country
<div id="budgetByCountry"></div>

We started out with a heavy budget; drinking, eating, and going on lots of tours. 
Then we mellowed out and spent less in Bolivia. 
Then by Chile we were in super budget mode. 
We realized that without a return date, the less we spent, the longer we could travel.

Determined to extend our trip up to a year, we volunteered in Southern Chile for a month on a dairy farm.
There we recieved room and board in exchange for working 5 hours a day.
Farther South through Chile and into Patagonia, we started camping and hitchhiking as we had heard Patagonia was exorbitantly expensive.

After Patagonia, through Argentina and Colombia, we were able to keep a fairly low budget, but over time our vigilance mellowed out. 
Going through Central America, we pretty much failed being budgety for several reasons. 
The trip was winding down, we were lazy, and the tropical beach vibe was too hard to resist.

---
### Average Daily Spending per Place
Here you can see our Average Daily Spending on the Y Axis, when we visited on the X Axis, and our length of stay via the size of the circle.
<div id="spendingPerPlace"></div>

---
### Average Daily Spending over Length of Stay
The same places now plotted with respect to the length of time we stayed.

The circles in the top left show our highest cost excursions, which include flights, expensive food and accommodation, staying in an ecolodge in the Amazon, and our sailing trip through the San Blas Islands.

In the bottom left corner, you will find many towns in the Chilean Patagonia when we were hitchhiking and camping.
<div id="avgVsLength"></div>

---
### Conclusions
All in all it was entertaining to make these visuals. 
I spent a lot of time making reusable D3 components which was a challenge in itself.

In the end, the length of our trip was determined by our budget, but how long one travels can also be determined by his or her tiredness, want of routine, and the desire to relax with friends and family.

Check out [Visualizing Travel Effort](/content/visualizing_travel_effort/) to see where we spent the most time traveling.
