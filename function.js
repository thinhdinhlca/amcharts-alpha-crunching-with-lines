// https://www.amcharts.com/demos/line-with-changing-color

window.function = function (data, width, height, type) {

  // data
  data = data.value ?? "";
  width = width.value ?? 100;
  height = height.value ?? 500;
  type = type.value ?? "SPX";
 
  let ht = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Glide Yes-Code</title>
	
     <!-- Resources (HTML) -->
     <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
     <script src="https://cdn.amcharts.com/lib/5/xy.js"></script>
     <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  </head>
  <body>
  <div id="chartdiv"></div>

  <!-- Styles (CSS) -->
  <style>
    #chartdiv {
      width: ${width}%;
      height: ${height}px;
    }
  </style>
  
<script>
<!-- Chart code (JavaScript)  -->
// Create root element
var root = am5.Root.new("chartdiv");

// Set themes
root.setThemes([
  am5themes_Animated.new(root)
]);

// Create chart
var chart = root.container.children.push(am5xy.XYChart.new(root, {
  panX: true,
  panY: true,
  wheelX: "panX",
  wheelY: "zoomX",
  layout: root.verticalLayout,
  pinchZoomX:true
}));

// Add cursor
var cursor = chart.set("cursor", am5xy.XYCursor.new(root, {
  behavior: "none"
}));
cursor.lineY.set("visible", false);

var colorSet = am5.ColorSet.new(root, {colors: ["#FF0000", "#00008B", "#006400", "#FFDF00", "#FF8C00","#06038D"]});

//   *** The data ***
var data = [ ${data} ];

// Create axes
var xRenderer = am5xy.AxisRendererX.new(root, {});
xRenderer.grid.template.set("location", 0.5);
xRenderer.labels.template.setAll({
  dy: 20,
  fontSize: 8,
  location: 0.5,
  rotation: -90,
  multiLocation: 0.5
});

var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
  categoryField: "time",  //***
  renderer: xRenderer,
  paddingRight: 15,
  tooltip: am5.Tooltip.new(root, {})
}));

xAxis.data.setAll(data);

var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
  maxPrecision: 0,
  renderer: am5xy.AxisRendererY.new(root, {})
}));

var areaSeries = chart.series.push(am5xy.LineSeries.new(root, {
  xAxis: xAxis,
  yAxis: yAxis,
  valueYField: "value",
  categoryXField: "time",     //***
  tooltip: am5.Tooltip.new(root, {
    labelText: "{valueY}",
    dy:-5
  })
}));

areaSeries.strokes.template.setAll({
  templateField: "strokeSettings",
  strokeWidth: 2
});

areaSeries.fills.template.setAll({
  visible: true,
  fillOpacity: 0.5,
  templateField: "fillSettings"
});

areaSeries.bullets.push(function() {
  return am5.Bullet.new(root, {
    sprite: am5.Circle.new(root, {
      templateField: "bulletSettings",
      radius: 5
    })
  });
});

areaSeries.data.setAll(data);
areaSeries.appear(1000);

var columnSeries = chart.series.push(am5xy.ColumnSeries.new(root, {
  xAxis: xAxis,
  yAxis: yAxis,
  valueYField: "value2",
  categoryXField: "time",
  fill: am5.color("#023020"),
  stroke: am5.color("#023020"),
  tooltip: am5.Tooltip.new(root, {
    labelText: "{valueY}",
    dy:-10
  })
}));

columnSeries.columns.template.adapters.add("fill", function(fill, target) {
  if (target.dataItem.get("valueY") < 0) {
    return am5.color("#8B0000");
  }
  else {
    return fill;
  }
});

columnSeries.columns.template.adapters.add("stroke", function(stroke, target) {
  if (target.dataItem.get("valueY") < 0) {
    return am5.color("#8B0000");
  }
  else {
    return stroke;
  }
});

columnSeries.columns.template.setAll({
  fillOpacity: 1,
  strokeWidth: 2,
  cornerRadiusTL: 5,
  cornerRadiusTR: 5
});

columnSeries.data.setAll(data);
columnSeries.appear(1000);

xAxis.children.push(
  am5.Label.new(root, {
    text: "Time of Day",
    x: am5.p50,
    centerX: am5.percent(50),
    centerY: true
  })
);

yAxis.children.unshift(
  am5.Label.new(root, {
    rotation: -90,
    text: "Average ${type} Points",
    y: am5.p50,
    centerX: am5.p50
  })
);

// Add scrollbar
// https://www.amcharts.com/docs/v5/charts/xy-chart/scrollbars/
chart.set("scrollbarX", am5.Scrollbar.new(root, {
  orientation: "horizontal",
  marginBottom: 20
}));

// Make stuff animate on load
// https://www.amcharts.com/docs/v5/concepts/animations/
chart.appear(1000, 100);


</script>


  </body>
</html>`

  let enc = encodeURIComponent(ht);
  let uri = `data:text/html;charset=utf-8,${enc}`
  return uri; 
}
