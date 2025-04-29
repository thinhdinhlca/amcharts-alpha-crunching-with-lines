window.function = function (
    data, overlayDataJson, intervalName, type, // Core data/labels
    // Boolean flags are now less relevant for initial state, but kept for potential future use
    showCumulative, show3WeeksAgo, show2WeeksAgo, showLastWeek, showThisWeek,
    width, height // Dimensions
) {

  // --- Input Handling & Cleaning ---
  let dataStringValue = data.value ?? '[]';
  let overlayDataJsonStringValue = overlayDataJson.value ?? '{}';
  let intervalNameValue = intervalName.value ?? "Period";
  let chartWidth = width.value ?? 100;
  let chartHeight = height.value ?? 750; // Default height maintained
  let chartTypeLabel = type.value ?? "Value";

  // --- JSON Cleaning (same as before) ---
  let cleanedDataString = '[]';
  try {
    // ... (cleaning logic remains unchanged) ...
    let tempString = dataStringValue.trim();
    tempString = tempString.replace(/strokeSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, '');
    tempString = tempString.replace(/fillSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, '');
    tempString = tempString.replace(/bulletSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, '');
    tempString = tempString.replace(/,\s*(\})/g, '$1');
    tempString = tempString.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');
    if (tempString && !tempString.startsWith('[')) { tempString = '[' + tempString; }
    if (tempString && !tempString.endsWith(']')) { tempString = tempString + ']'; }
    if (!tempString || tempString === "[]" || tempString === "") { cleanedDataString = '[]'; }
    else { JSON.parse(tempString); cleanedDataString = tempString; }
  } catch (cleaningError) { console.error("!!! Failed to clean primary data string !!!", cleaningError); cleanedDataString = '[]'; }


  // --- HTML Template ---
  // *** MODIFICATION: Added button container and buttons ***
  let ht = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Glide Yes-Code Chart</title>
  <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/xy.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  <style>
    html, body { margin: 0; padding: 0; height: 100%; width: 100%; font-family: sans-serif; }
    /* *** MODIFICATION: Added styles for button container and buttons *** */
    #controls {
        width: ${chartWidth}%;
        text-align: center;
        padding: 10px 0;
        box-sizing: border-box; /* Include padding in width */
    }
    #controls button {
        padding: 5px 15px;
        margin: 0 5px;
        cursor: pointer;
        font-size: 0.9em;
        border: 1px solid #ccc;
        border-radius: 4px;
        background-color: #f0f0f0;
    }
     #controls button:hover {
        background-color: #e0e0e0;
     }
    #chartdiv { width: ${chartWidth}%; height: ${chartHeight}px; } /* Height applied here */
    .am5-tooltip { font-size: 0.85em; pointer-events: none; }
  </style>
</head>
<body>
  <!-- *** MODIFICATION: Added button container *** -->
  <div id="controls">
      <button id="toggleOnBtn">Show All Optional</button>
      <button id="toggleOffBtn">Hide All Optional</button>
  </div>
  <div id="chartdiv"></div>

<script>
am5.ready(function() {

  // --- Configuration & Data ---
  const primaryDataString = ${JSON.stringify(cleanedDataString)};
  const overlayString = ${JSON.stringify(overlayDataJsonStringValue)};
  const intervalName = ${JSON.stringify(intervalNameValue)};
  const chartTypeLabel = ${JSON.stringify(chartTypeLabel)};

  // --- Color/Style Constants (Unchanged) ---
  const overlayColors = { /* ... */ };
  const primaryOutlineColor = "#09077b";
  const primaryFillColor = "#b6dbee";
  const primaryValue2TooltipBgColor = "#333333";
  const positiveValue2Color = "#052f20";
  const negativeValue2Color = "#78080e";
  const tooltipFontSize = "0.6em";
  const whiteColorHex = "#ffffff";
  const blackColorHex = "#000000";
  const hintLabelColorHex = "#888888";
  const transparentWhiteHex = "#ffffff";

  // --- Root Element and Theme (Unchanged) ---
  var root = am5.Root.new("chartdiv");
  root.setThemes([am5themes_Animated.new(root)]);

  // --- Data Parsing Function (Unchanged) ---
  function parseChartData(primaryStr, overlayStr) { /* ... (same as before) ... */
    let primaryData = []; let parsedOverlayData = null; let hasValidOverlay = false; try { let rawPrimary = JSON.parse(primaryStr); if (Array.isArray(rawPrimary)) { primaryData = rawPrimary.map(item => { if (!(item && typeof item === 'object' && item.hasOwnProperty('time') && typeof item.time === 'string' && item.hasOwnProperty('value') && typeof item.value === 'number')) { return null; } if (item.hasOwnProperty('value2') && typeof item.value2 !== 'number') { delete item.value2; } return item; }).filter(item => item !== null); } else { console.warn("Parsed primary data is not an array."); } } catch (e) { console.error("Error parsing primary data JSON:", e); primaryData = []; } try { if (overlayStr && overlayStr.trim() !== "" && overlayStr.trim() !== "{}") { let rawOverlay = JSON.parse(overlayStr); if (typeof rawOverlay === 'object' && rawOverlay !== null && !Array.isArray(rawOverlay)) { parsedOverlayData = {}; let validKeys = 0; for (const key in rawOverlay) { if (Object.hasOwnProperty.call(rawOverlay, key)) { const weekDataRaw = rawOverlay[key]; if(Array.isArray(weekDataRaw)) { const processedWeekData = weekDataRaw.filter(item => item && typeof item === 'object' && item.hasOwnProperty('time') && typeof item.time === 'string' && item.hasOwnProperty('value') && typeof item.value === 'number' ); if (processedWeekData.length > 0) { parsedOverlayData[key] = processedWeekData; validKeys++; } else { /* Warn */ } } else { /* Warn */ } } } if (validKeys > 0) { hasValidOverlay = true; } else { parsedOverlayData = null; } } else { /* Warn */ } } else { /* No overlay data */ } } catch (e) { console.error("Error parsing overlay JSON:", e); parsedOverlayData = null; } return { primaryData, parsedOverlayData, hasValidOverlay };
   }

  // --- Axis Category Preparation (Unchanged) ---
  function prepareAxisCategories(primaryData) { /* ... (same as before) ... */
     if (!primaryData || primaryData.length === 0) { return []; } try { let categoryStrings = primaryData.map(item => item.time); let uniqueCategoryStrings = categoryStrings.filter((value, index, self) => self.indexOf(value) === index); let xAxisData = uniqueCategoryStrings.map(timeStr => ({ time: timeStr })); return xAxisData; } catch (e) { console.error("Error preparing axis categories:", e); return []; }
  }

  // --- Chart and Axes Creation (Unchanged) ---
  function createChartAndAxes(root, xAxisData) { /* ... (same as before) ... */
    var chart = root.container.children.push(am5xy.XYChart.new(root, { panX: true, panY: true, wheelX: "panX", wheelY: "zoomX", layout: root.verticalLayout, pinchZoomX: true })); var xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 70 }); xRenderer.labels.template.setAll({ fontSize: 8, rotation: -90, centerY: am5.p50, centerX: am5.p100, paddingRight: 5 }); var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, { categoryField: "time", renderer: xRenderer, tooltip: am5.Tooltip.new(root, {}) })); if (xAxisData.length > 0) { xAxis.data.setAll(xAxisData); } else { console.warn("X-Axis has no data categories."); } var yRenderer = am5xy.AxisRendererY.new(root, {}); var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { maxPrecision: 2, renderer: yRenderer })); return { chart, xAxis, yAxis };
   }

  // --- Primary Series Creation (Unchanged) ---
  function createPrimarySeries(chart, root, primaryData, xAxis, yAxis) { /* ... (same as before) ... */
    let lineSeries, fillSeries, value2Series;
    // Fill Series (Background for Line)
    fillSeries = chart.series.push(am5xy.ColumnSeries.new(root, { name: intervalName + " (Fill)", xAxis: xAxis, yAxis: yAxis, valueYField: "value", categoryXField: "time", fill: am5.color(primaryFillColor), strokeOpacity: 0, width: am5.percent(100), toggleable: false })); // Not toggleable via legend directly
    fillSeries.data.setAll(primaryData);
    // Value2 Series (Bars)
    value2Series = chart.series.push(am5xy.ColumnSeries.new(root, { name: intervalName + " (Bars)", xAxis: xAxis, yAxis: yAxis, valueYField: "value2", categoryXField: "time", tooltip: am5.Tooltip.new(root, { getFillFromSprite: false, labelTextColor: am5.color(whiteColorHex), fontSize: tooltipFontSize, labelText: intervalName + " (Bars): {valueY.formatNumber('#.##')}" }) }));
    value2Series.get("tooltip").get("background").set("fill", am5.color(primaryValue2TooltipBgColor));
    value2Series.columns.template.adapters.add("fill", function(fill, target) { const v2 = target.dataItem?.get("valueY"); return typeof v2 === 'number'?(v2<0?am5.color(negativeValue2Color):am5.color(positiveValue2Color)):am5.color(transparentWhiteHex, 0); });
    value2Series.columns.template.adapters.add("stroke", function(stroke, target) { const v2 = target.dataItem?.get("valueY"); return typeof v2 === 'number'?(v2<0?am5.color(negativeValue2Color):am5.color(positiveValue2Color)):am5.color(transparentWhiteHex, 0); });
    value2Series.columns.template.setAll({ strokeWidth: 2, strokeOpacity: 1, width: am5.percent(60) });
    value2Series.data.setAll(primaryData);
    // Line Series (Primary Value)
    lineSeries = chart.series.push(am5xy.LineSeries.new(root, { name: intervalName, xAxis: xAxis, yAxis: yAxis, valueYField: "value", categoryXField: "time", stroke: am5.color(primaryOutlineColor), fillOpacity: 0, connect: false, tooltip: am5.Tooltip.new(root, { getFillFromSprite: true, labelTextColor: am5.color(whiteColorHex), fontSize: tooltipFontSize, labelText: intervalName + ": {valueY.formatNumber('#.00')}" }) }));
    lineSeries.strokes.template.set("strokeWidth", 2);
    lineSeries.data.setAll(primaryData);
    return { line: lineSeries, fill: fillSeries, bars: value2Series };
  }

  // --- Overlay Series Creation (Unchanged) ---
  function createOverlaySeries(chart, root, overlayData, colors, xAxis, yAxis) { /* ... (same as before) ... */
     let overlaySeriesList = []; if (!overlayData) { return overlaySeriesList; }
     try {
       for (const weekKey in overlayData) {
         if (Object.hasOwnProperty.call(overlayData, weekKey)) {
           const weekData = overlayData[weekKey];
           const seriesColor = colors[weekKey] || colors["Default"];
           var lineSeries = chart.series.push(am5xy.LineSeries.new(root, { name: weekKey, xAxis: xAxis, yAxis: yAxis, valueYField: "value", categoryXField: "time", stroke: am5.color(seriesColor), connect: false, tooltip: am5.Tooltip.new(root, { getFillFromSprite: false, labelTextColor: am5.color( (weekKey === "1 Week Before") ? blackColorHex : whiteColorHex ), fontSize: tooltipFontSize, labelText: "{name}: {valueY.formatNumber('#.00')}" }) }));
           lineSeries.get("tooltip").get("background").set("fill", am5.color(seriesColor));
           lineSeries.strokes.template.set("strokeWidth", 2);
           lineSeries.data.setAll(weekData);
           overlaySeriesList.push(lineSeries);
         }
       }
     } catch (e) { console.error("Error creating overlay series:", e); }
     return overlaySeriesList;
  }

  // --- Legend Creation & Linking (Unchanged) ---
  function createLegend(chart, root, mainLineSeries, fillSeriesToToggle, barsSeries, otherSeries) { /* ... (same as before) ... */
     const legendSeries = [mainLineSeries, barsSeries, ...otherSeries];
     if (legendSeries.length === 0) { return null; }

     var legend = chart.children.push(am5.Legend.new(root, {
         centerX: am5.p50, x: am5.p50,
         layout: am5.GridLayout.new(root, { maxColumns: 3 }),
         marginTop: 15, marginBottom: 15
     }));

     let hintLabel = am5.Label.new(root, { text: "(Click legend items to toggle visibility)", fontSize: "0.75em", fill: am5.color(hintLabelColorHex), centerX: am5.p50, x: am5.p50, paddingTop: 5 });
     chart.children.push(hintLabel);

     legend.events.on("boundschanged", function(ev) {
        let legendHeight = ev.target.height();
        let verticalOffset = 2;
        hintLabel.set("paddingTop", legendHeight + verticalOffset);
        hintLabel.set("dy", legendHeight + verticalOffset);
     });

     legend.data.setAll(legendSeries);

     // Link primary line visibility to its fill series
     legend.itemContainers.template.events.on("click", function(ev) {
        if (!ev.target.dataItem || !ev.target.dataItem.dataContext) return;
        const clickedSeries = ev.target.dataItem.dataContext;
        if (clickedSeries === mainLineSeries) {
            // Use setTimeout to ensure the visibility state has updated after the click
            setTimeout(() => {
                 if (mainLineSeries.isHidden() || !mainLineSeries.get("visible")) {
                    fillSeriesToToggle.hide(0); // Hide fill instantly if line is hidden
                 } else {
                    fillSeriesToToggle.show(0); // Show fill instantly if line is shown
                 }
            }, 0);
        }
     });

     return legend;
  }

  // --- Final Chart Configuration (Unchanged) ---
  function configureChart(chart, root, yAxis, xAxis, label) { /* ... (same as before) ... */
     var cursor = chart.set("cursor", am5xy.XYCursor.new(root, { behavior: "none" })); cursor.lineY.set("visible", false); yAxis.children.unshift(am5.Label.new(root, { rotation: -90, text: "Average " + label + " Points", y: am5.p50, centerX: am5.p50, paddingRight: 10 })); xAxis.children.push(am5.Label.new(root, { text: "Time of Day", x: am5.p50, centerX: am5.percent(50), paddingTop: 10 })); chart.set("scrollbarX", am5.Scrollbar.new(root, { orientation: "horizontal", marginBottom: 65 }));
  }


  // --- Main Execution Flow ---
  const { primaryData, parsedOverlayData, hasValidOverlay } = parseChartData(primaryDataString, overlayString);
  const xAxisData = prepareAxisCategories(primaryData);
  const { chart, xAxis, yAxis } = createChartAndAxes(root, xAxisData);

  // Create ALL series first
  const primarySeriesRefs = createPrimarySeries(chart, root, primaryData, xAxis, yAxis);
  const overlaySeries = createOverlaySeries(chart, root, parsedOverlayData, overlayColors, xAxis, yAxis);

  // *** MODIFICATION: Combine all toggleable series ***
  const toggleableSeries = [primarySeriesRefs.bars, ...overlaySeries];

  // Set initial visibility (Primary line/fill ON, others OFF)
  primarySeriesRefs.line.show(0);
  primarySeriesRefs.fill.show(0);
  toggleableSeries.forEach(series => {
      if (series) { // Check if series exists (e.g., bars might not if no value2 data)
          series.hide(0);
      }
  });

  // Create the legend AFTER creating series and setting initial visibility.
  createLegend(chart, root, primarySeriesRefs.line, primarySeriesRefs.fill, primarySeriesRefs.bars, overlaySeries);

  // Configure remaining chart elements
  configureChart(chart, root, yAxis, xAxis, chartTypeLabel);

  // *** MODIFICATION: Add Button Event Listeners ***
  const toggleOnButton = document.getElementById('toggleOnBtn');
  const toggleOffButton = document.getElementById('toggleOffBtn');

  if (toggleOnButton) {
      toggleOnButton.addEventListener('click', () => {
          toggleableSeries.forEach(series => {
              if (series) {
                  series.show(); // Use default animation duration
              }
          });
      });
  }

  if (toggleOffButton) {
      toggleOffButton.addEventListener('click', () => {
          toggleableSeries.forEach(series => {
              if (series) {
                  series.hide(); // Use default animation duration
              }
          });
      });
  }

}); // end am5.ready()
</script>

</body>
</html>`;

  // --- Encode and Return URI ---
  const encodedHtml = encodeURIComponent(ht);
  const dataUri = `data:text/html;charset=utf-8,${encodedHtml}`;
  return dataUri;
}
