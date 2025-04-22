window.function = function (data, overlayDataJson, intervalName, width, height, type) {

  // --- Input Handling & Cleaning ---
  let dataStringValue = data.value ?? '[]';
  let overlayDataJsonStringValue = overlayDataJson.value ?? '{}';
  let intervalNameValue = intervalName.value ?? "Period";
  let chartWidth = width.value ?? 100;
  let chartHeight = height.value ?? 550;
  let chartTypeLabel = type.value ?? "Value";
  let cleanedDataString = '[]';
  try {
    let tempString = dataStringValue.trim();
    // Keep cleaning steps as they are relevant for general input robustness
    tempString = tempString.replace(/strokeSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, '');
    tempString = tempString.replace(/fillSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, '');
    tempString = tempString.replace(/bulletSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, '');
    tempString = tempString.replace(/,\s*(\})/g, '$1');
    tempString = tempString.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');
    if (tempString && !tempString.startsWith('[')) { tempString = '[' + tempString; }
    if (tempString && !tempString.endsWith(']')) { tempString = tempString + ']'; }
     if (!tempString || tempString === "[]" || tempString === "") { cleanedDataString = '[]'; }
     else { JSON.parse(tempString); cleanedDataString = tempString; /* console.log("DEBUG: Cleaned primary data string potentially valid JSON."); */ }
  } catch (cleaningError) { console.error("!!! Failed to clean primary data string !!!", cleaningError); cleanedDataString = '[]'; }
  // console.log("DEBUG: Final string for primary data:", cleanedDataString);


  // --- HTML Template ---
  let ht = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Glide Yes-Code Chart</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/xy.js"></script> {/* Includes AreaSeries */}
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  <style>
    html, body { margin: 0; padding: 0; height: 100%; width: 100%; }
    #chartdiv { width: ${chartWidth}%; height: ${chartHeight}px; }
    .am5-tooltip {
      font-size: 0.85em;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <div id="chartdiv"></div>

<script>
am5.ready(function() {

  // console.log("am5.ready() invoked.");

  // --- Configuration & Data ---
  const primaryDataString = ${JSON.stringify(cleanedDataString)};
  const overlayString = ${JSON.stringify(overlayDataJsonStringValue)};
  const intervalName = ${JSON.stringify(intervalNameValue)};
  const chartTypeLabel = ${JSON.stringify(chartTypeLabel)};
  const overlayColors = { "This Week": "#228B22", "Last Week": "#FFA500", "2 Weeks Ago": "#800080", "3 Weeks Ago": "#DC143C" };
  const primaryOutlineColor = "#09077b";
  const primaryFillColor = "#b6dbee";
  const positiveValue2Color = "#052f20";
  const negativeValue2Color = "#78080e";
  const tooltipFontSize = "0.8em";

  // --- Root Element and Theme ---
  var root = am5.Root.new("chartdiv");
  root.setThemes([am5themes_Animated.new(root)]);
  // console.log("Root created.");

  // --- Data Parsing Function (Unchanged) ---
  function parseChartData(primaryStr, overlayStr) {
     let primaryData = []; let parsedOverlayData = null; let hasValidOverlay = false; try { let rawPrimary = JSON.parse(primaryStr); if (Array.isArray(rawPrimary)) { primaryData = rawPrimary.map(item => { if (!(item && typeof item === 'object' && item.hasOwnProperty('time') && typeof item.time === 'string' && item.hasOwnProperty('value') && typeof item.value === 'number')) { return null; } if (item.hasOwnProperty('value2') && typeof item.value2 !== 'number') { delete item.value2; } return item; }).filter(item => item !== null); /* console.log("Primary data parsed & filtered (kept valid value2):", primaryData.length); */ } else { console.warn("Parsed primary data is not an array."); } } catch (e) { console.error("Error parsing primary data JSON:", e); primaryData = []; } try { if (overlayStr && overlayStr.trim() !== "" && overlayStr.trim() !== "{}") { let rawOverlay = JSON.parse(overlayStr); if (typeof rawOverlay === 'object' && rawOverlay !== null && !Array.isArray(rawOverlay)) { parsedOverlayData = {}; let validKeys = 0; for (const key in rawOverlay) { if (Object.hasOwnProperty.call(rawOverlay, key)) { const weekDataRaw = rawOverlay[key]; if(Array.isArray(weekDataRaw)) { const processedWeekData = weekDataRaw.filter(item => item && typeof item === 'object' && item.hasOwnProperty('time') && typeof item.time === 'string' && item.hasOwnProperty('value') && typeof item.value === 'number' ); if (processedWeekData.length > 0) { parsedOverlayData[key] = processedWeekData; validKeys++; } else { console.warn("Overlay data for key \\"" + key + "\\" had no valid items after filtering."); } } else { console.warn("Overlay data for key \\"" + key + "\\" was not an array."); } } } if (validKeys > 0) { hasValidOverlay = true; /* console.log("Overlay data parsed. Valid keys with data:", validKeys); */ } else { console.warn("Overlay data parsed, but no valid keys/data found."); parsedOverlayData = null; } } else { console.warn("Parsed overlay data is not a valid object."); } } else { /* console.log("No overlay data string provided."); */ } } catch (e) { console.error("Error parsing overlay JSON:", e); parsedOverlayData = null; } return { primaryData, parsedOverlayData, hasValidOverlay };
   }

  // --- Axis Category Preparation (Unchanged) ---
  function prepareAxisCategories(primaryData) {
     if (!primaryData || primaryData.length === 0) { console.warn("Primary data is empty, axis will be empty."); return []; } try { /* console.log("Preparing axis categories assuming input primary data is sorted."); */ let categoryStrings = primaryData.map(item => item.time); let uniqueCategoryStrings = categoryStrings.filter((value, index, self) => self.indexOf(value) === index); let xAxisData = uniqueCategoryStrings.map(timeStr => ({ time: timeStr })); /* console.log("Axis categories prepared from primary data:", xAxisData.length); */ return xAxisData; } catch (e) { console.error("Error preparing axis categories:", e); return []; }
   }

  // --- Chart and Axes Creation (Unchanged) ---
  function createChartAndAxes(root, xAxisData) {
    // console.log("Creating chart and axes (using CategoryAxis)...");
    var chart = root.container.children.push(am5xy.XYChart.new(root, { panX: true, panY: true, wheelX: "panX", wheelY: "zoomX", layout: root.verticalLayout, pinchZoomX: true }));
    var xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 70 });
    xRenderer.labels.template.setAll({ fontSize: 8, rotation: -90, centerY: am5.p50, centerX: am5.p100, paddingRight: 5 });
    var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, { categoryField: "time", renderer: xRenderer, tooltip: am5.Tooltip.new(root, {}) }));
    if (xAxisData.length > 0) { xAxis.data.setAll(xAxisData); /* console.log("Set", xAxisData.length, "categories on X-Axis."); */ } else { console.warn("X-Axis has no data categories."); }
    var yRenderer = am5xy.AxisRendererY.new(root, {});
    var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { maxPrecision: 2, renderer: yRenderer }));
    // console.log("Chart and axes created.");
    return { chart, xAxis, yAxis };
   }


  // --- Primary Series Creation (MODIFIED) ---
  // *** Use AreaSeries for 'value', ColumnSeries for 'value2' ***
  function createPrimarySeries(chart, root, primaryData, xAxis, yAxis) {
    // console.log("Creating primary series (Area for value, Column for value2)...");

    let areaSeries, value2Series;

    // 1. Area Series for 'value' (Line + Fill)
    areaSeries = chart.series.push(am5xy.AreaSeries.new(root, {
        name: intervalName, // Name for the legend
        xAxis: xAxis, yAxis: yAxis, valueYField: "value", categoryXField: "time",
        stroke: am5.color(primaryOutlineColor), // Line color
        strokeWidth: 2, // Line width
        fill: am5.color(primaryFillColor), // Fill color
        fillOpacity: 0.7, // Opacity of the fill (adjust as needed, 0 to 1)
        connect: false, // Handle gaps in data
        toggleable: true, // Show in legend, allow toggling
        tooltip: am5.Tooltip.new(root, {
          getFillFromSprite: false, // Use explicit color for tooltip background
          labelTextColor: am5.color(0xffffff),
          fontSize: tooltipFontSize,
          labelText: intervalName + ": {valueY.formatNumber('#.00')}",
          background: am5.RoundedRectangle.new(root, { // Set tooltip background explicitly
             fill: am5.color(primaryOutlineColor), // Match line color or choose another
             fillOpacity: 0.8
           })
        })
    }));
    areaSeries.data.setAll(primaryData);
    areaSeries.appear(1000);

    // 2. Value2 Bar Series (Red/Green Columns, Tooltip, Toggleable) - Unchanged logic
    value2Series = chart.series.push(am5xy.ColumnSeries.new(root, {
      name: intervalName + " (Cumulative)", // Name that WILL appear in legend
      xAxis: xAxis, yAxis: yAxis, valueYField: "value2", categoryXField: "time",
      toggleable: true, // Keep this toggleable independently
      tooltip: am5.Tooltip.new(root, {
          getFillFromSprite: true, labelTextColor: am5.color(0xffffff), fontSize: tooltipFontSize,
          labelText: intervalName + " (Cumulative): {valueY.formatNumber('#.##')}"
      })
    }));
    value2Series.columns.template.adapters.add("fill", function(fill, target) { const v2 = target.dataItem?.get("valueY"); return typeof v2 === 'number'?(v2<0?am5.color(negativeValue2Color):am5.color(positiveValue2Color)):am5.color(0xffffff, 0); });
    value2Series.columns.template.adapters.add("stroke", function(stroke, target) { const v2 = target.dataItem?.get("valueY"); return typeof v2 === 'number'?(v2<0?am5.color(negativeValue2Color):am5.color(positiveValue2Color)):am5.color(0xffffff, 0); });
    value2Series.columns.template.setAll({ strokeWidth: 2, strokeOpacity: 1, width: am5.percent(60) });
    value2Series.data.setAll(primaryData);
    value2Series.appear(1000);

    // console.log("Primary series (Area, Column) created.");
    // Return references to the created series
    return { area: areaSeries, bars: value2Series };
  }


  // --- Overlay Series Creation (Unchanged) ---
  function createOverlaySeries(chart, root, overlayData, colors, xAxis, yAxis) {
     let overlaySeriesList = []; if (!overlayData) { /* console.log("No valid overlay data provided."); */ return overlaySeriesList; } /* console.log("Creating overlay series..."); */ try { for (const weekKey in overlayData) { if (Object.hasOwnProperty.call(overlayData, weekKey)) { const weekData = overlayData[weekKey]; /* console.log("Creating LineSeries for: " + weekKey); */ var lineSeries = chart.series.push(am5xy.LineSeries.new(root, { name: weekKey, xAxis: xAxis, yAxis: yAxis, valueYField: "value", categoryXField: "time", stroke: am5.color(colors[weekKey] || root.interfaceColors.get("grid")), connect: false, tooltip: am5.Tooltip.new(root, { getFillFromSprite: true, labelTextColor: am5.color(0xffffff), fontSize: tooltipFontSize, labelText: "{name}: {valueY.formatNumber('#.00')}" }) })); lineSeries.strokes.template.set("strokeWidth", 2); lineSeries.data.setAll(weekData); lineSeries.appear(1000); overlaySeriesList.push(lineSeries); } } } catch (e) { console.error("Error creating overlay series:", e); } /* console.log("Overlay series creation finished:", overlaySeriesList.length); */ return overlaySeriesList;
   }

  // --- Legend Creation & Linking (SIMPLIFIED) ---
  // *** Removed custom click listener, legend handles default toggling ***
  function createLegend(chart, root, mainAreaSeries, barsSeries, otherSeries) {
     // Combine series for the legend DATA (Area, Bars, Overlays)
     const legendSeries = [mainAreaSeries, barsSeries, ...otherSeries];

     if (legendSeries.length === 0) { console.log("Skipping legend (no series)."); return null; }

     // console.log("Creating legend for", legendSeries.length, "toggleable series...");
     // Create container for legend and hint (unchanged)
     var legendContainer = chart.children.push(am5.Container.new(root, {
        width: am5.percent(100),
        layout: root.verticalLayout,
        x: am5.p50, centerX: am5.p50,
        paddingBottom: 10
     }));

     var legend = legendContainer.children.push(am5.Legend.new(root, {
         x: am5.percent(50), centerX: am5.percent(50),
         layout: root.horizontalLayout,
         marginTop: 5,
         marginBottom: 5
     }));

     legendContainer.children.push(am5.Label.new(root, {
         text: "(Click legend items to toggle visibility)",
         fontSize: "0.75em",
         fill: am5.color(0x888888),
         x: am5.p50, centerX: am5.p50
     }));

     // Set data for the legend (now includes area series instead of line)
     legend.data.setAll(legendSeries);

     // NO custom click listener needed anymore.
     // The default legend behavior will toggle each series (Area, Bars, Overlays) correctly.

     // console.log("Legend created.");
     return legend;
   }

  // --- Final Chart Configuration (Unchanged) ---
  function configureChart(chart, root, yAxis, xAxis, label) {
    // console.log("Configuring final chart elements...");
    var cursor = chart.set("cursor", am5xy.XYCursor.new(root, { behavior: "none" }));
    cursor.lineY.set("visible", false);
    yAxis.children.unshift(am5.Label.new(root, { rotation: -90, text: "Average " + label + " Points", y: am5.p50, centerX: am5.p50, paddingRight: 10 }));
    xAxis.children.push(am5.Label.new(root, { text: "Time of Day", x: am5.p50, centerX: am5.percent(50), paddingTop: 10 }));
    chart.set("scrollbarX", am5.Scrollbar.new(root, { orientation: "horizontal", marginBottom: 25 }));
    chart.appear(1000, 100);
    // console.log("Chart configured.");
   }


  // --- Main Execution Flow (Adjusted for new series types) ---
  // console.log("--- Starting Chart Build Process ---");
  const { primaryData, parsedOverlayData, hasValidOverlay } = parseChartData(primaryDataString, overlayString);
  const xAxisData = prepareAxisCategories(primaryData);
  const { chart, xAxis, yAxis } = createChartAndAxes(root, xAxisData);

  // Create primary series using the updated function
  const primarySeriesRefs = createPrimarySeries(chart, root, primaryData, xAxis, yAxis);
  // primarySeriesRefs now contains { area: AreaSeries, bars: ColumnSeries }

  const overlaySeries = createOverlaySeries(chart, root, parsedOverlayData, overlayColors, xAxis, yAxis);

  // Create legend, passing the new area series reference
  createLegend(chart, root, primarySeriesRefs.area, primarySeriesRefs.bars, overlaySeries);

  configureChart(chart, root, yAxis, xAxis, chartTypeLabel);
  // console.log("--- Chart Build Process Complete ---");

}); // end am5.ready()
</script>

</body>
</html>`;

  // --- Encode and Return URI ---
  const encodedHtml = encodeURIComponent(ht);
  const dataUri = `data:text/html;charset=utf-8,${encodedHtml}`;
  return dataUri;
}
