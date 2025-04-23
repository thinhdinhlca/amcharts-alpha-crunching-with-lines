window.function = function (data, overlayDataJson, intervalName, width, height, type) { // Added intervalName parameter

  // --- Input Handling & Cleaning ---
  let dataStringValue = data.value ?? '[]';
  let overlayDataJsonStringValue = overlayDataJson.value ?? '{}';
  let intervalNameValue = intervalName.value ?? "Period"; // Default to "Period"
  let chartWidth = width.value ?? 100;
  let chartHeight = height.value ?? 550;
  let chartTypeLabel = type.value ?? "Value";
  let cleanedDataString = '[]';
  try {
    let tempString = dataStringValue.trim();
    // Remove settings blocks that often cause JSON parsing issues if malformed
    tempString = tempString.replace(/strokeSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, '');
    tempString = tempString.replace(/fillSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, '');
    tempString = tempString.replace(/bulletSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, '');
    // Remove trailing commas before closing braces
    tempString = tempString.replace(/,\s*(\})/g, '$1');
    // Ensure keys are quoted
    tempString = tempString.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');
    // Attempt to wrap in brackets if missing (basic check)
    if (tempString && !tempString.startsWith('[')) { tempString = '[' + tempString; }
    if (tempString && !tempString.endsWith(']')) { tempString = tempString + ']'; }
     // Final check for empty or invalid state
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
  <script src="https://cdn.amcharts.com/lib/5/xy.js"></script>
  <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
  <style>
    html, body { margin: 0; padding: 0; height: 100%; width: 100%; }
    #chartdiv { width: ${chartWidth}%; height: ${chartHeight}px; }
    .am5-tooltip {
      font-size: 0.85em; /* Smaller font globally */
      pointer-events: none; /* Prevent tooltips from blocking cursor */
    }
  </style>
</head>
<body>
  <div id="chartdiv"></div>

<script>
am5.ready(function() {

  // --- Configuration & Data ---
  const primaryDataString = ${JSON.stringify(cleanedDataString)};
  const overlayString = ${JSON.stringify(overlayDataJsonStringValue)};
  const intervalName = ${JSON.stringify(intervalNameValue)};
  const chartTypeLabel = ${JSON.stringify(chartTypeLabel)};
  const localStorageKey = "glideChartVisibility_SPX_Weekly"; // Unique key for this chart's state

  const overlayColors = { "This Week": "#228B22", "Last Week": "#FFA500", "2 Weeks Ago": "#800080", "3 Weeks Ago": "#DC143C", "Default": "#888888" };
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

  // --- Persistence Helper Functions ---
  function readVisibilityState() {
    try {
      const storedState = localStorage.getItem(localStorageKey);
      if (storedState) {
        // console.log("Read state from localStorage:", storedState);
        return JSON.parse(storedState);
      }
    } catch (e) {
      console.error("Error reading or parsing localStorage state:", e);
    }
    // console.log("No valid state found in localStorage.");
    return {}; // Return empty object if nothing found or error
  }

  function saveVisibilityState(seriesList) {
    try {
      const state = {};
      seriesList.forEach(series => {
        // Make sure we only save state for series that actually have a name (are in the legend)
        const seriesName = series.get("name");
        if (seriesName && series.get("toggleable") !== false) { // Check if toggleable (fill series is not)
             state[seriesName] = series.get("visible");
        }
      });
      localStorage.setItem(localStorageKey, JSON.stringify(state));
      // console.log("Saved state to localStorage:", JSON.stringify(state));
    } catch (e) {
      console.error("Error saving state to localStorage:", e);
    }
  }

  // --- Load Initial Visibility State ---
  const initialVisibilityState = readVisibilityState();
  const hasInitialState = Object.keys(initialVisibilityState).length > 0;

  // --- Root Element and Theme ---
  var root = am5.Root.new("chartdiv");
  root.setThemes([am5themes_Animated.new(root)]);

  // --- Data Parsing Function ---
  function parseChartData(primaryStr, overlayStr) {
     let primaryData = []; let parsedOverlayData = null; let hasValidOverlay = false; try { let rawPrimary = JSON.parse(primaryStr); if (Array.isArray(rawPrimary)) { primaryData = rawPrimary.map(item => { if (!(item && typeof item === 'object' && item.hasOwnProperty('time') && typeof item.time === 'string' && item.hasOwnProperty('value') && typeof item.value === 'number')) { return null; } if (item.hasOwnProperty('value2') && typeof item.value2 !== 'number') { delete item.value2; } return item; }).filter(item => item !== null); } else { console.warn("Parsed primary data is not an array."); } } catch (e) { console.error("Error parsing primary data JSON:", e); primaryData = []; } try { if (overlayStr && overlayStr.trim() !== "" && overlayStr.trim() !== "{}") { let rawOverlay = JSON.parse(overlayStr); if (typeof rawOverlay === 'object' && rawOverlay !== null && !Array.isArray(rawOverlay)) { parsedOverlayData = {}; let validKeys = 0; for (const key in rawOverlay) { if (Object.hasOwnProperty.call(rawOverlay, key)) { const weekDataRaw = rawOverlay[key]; if(Array.isArray(weekDataRaw)) { const processedWeekData = weekDataRaw.filter(item => item && typeof item === 'object' && item.hasOwnProperty('time') && typeof item.time === 'string' && item.hasOwnProperty('value') && typeof item.value === 'number' ); if (processedWeekData.length > 0) { parsedOverlayData[key] = processedWeekData; validKeys++; } } } } if (validKeys > 0) { hasValidOverlay = true; } else { parsedOverlayData = null; } } } catch (e) { console.error("Error parsing overlay JSON:", e); parsedOverlayData = null; } return { primaryData, parsedOverlayData, hasValidOverlay };
   }

  // --- Axis Category Preparation ---
  function prepareAxisCategories(primaryData) {
     if (!primaryData || primaryData.length === 0) { return []; } try { let categoryStrings = primaryData.map(item => item.time); let uniqueCategoryStrings = categoryStrings.filter((value, index, self) => self.indexOf(value) === index); let xAxisData = uniqueCategoryStrings.map(timeStr => ({ time: timeStr })); return xAxisData; } catch (e) { console.error("Error preparing axis categories:", e); return []; }
   }

  // --- Chart and Axes Creation ---
  function createChartAndAxes(root, xAxisData) {
    var chart = root.container.children.push(am5xy.XYChart.new(root, { panX: true, panY: true, wheelX: "panX", wheelY: "zoomX", layout: root.verticalLayout, pinchZoomX: true })); var xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 70 }); xRenderer.labels.template.setAll({ fontSize: 8, rotation: -90, centerY: am5.p50, centerX: am5.p100, paddingRight: 5 }); var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, { categoryField: "time", renderer: xRenderer, tooltip: am5.Tooltip.new(root, {}) })); if (xAxisData.length > 0) { xAxis.data.setAll(xAxisData); } var yRenderer = am5xy.AxisRendererY.new(root, {}); var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { maxPrecision: 2, renderer: yRenderer })); return { chart, xAxis, yAxis };
   }


  // --- Primary Series Creation (Applies stored visibility) ---
  function createPrimarySeries(chart, root, primaryData, xAxis, yAxis) {
    let lineSeries, fillSeries, value2Series;
    const lineSeriesName = intervalName;
    const value2SeriesName = intervalName + " (Cumulative)";

    // Determine initial visibility based on localStorage or default (true)
    const initialLineVisible = initialVisibilityState.hasOwnProperty(lineSeriesName) ? initialVisibilityState[lineSeriesName] : true;
    const initialValue2Visible = initialVisibilityState.hasOwnProperty(value2SeriesName) ? initialVisibilityState[value2SeriesName] : true;

    // 1. Area Fill Series (Visibility tied to lineSeries)
    fillSeries = chart.series.push(am5xy.ColumnSeries.new(root, {
        name: intervalName + " (Fill)",
        xAxis: xAxis, yAxis: yAxis, valueYField: "value", categoryXField: "time",
        fill: am5.color(primaryFillColor), strokeOpacity: 0, width: am5.percent(100),
        toggleable: false, // Not directly toggleable via legend
        visible: initialLineVisible // Start hidden if line is hidden
    }));
    fillSeries.data.setAll(primaryData);
    // No appear() needed, visibility is controlled

    // 2. Value2 Bar Series (Toggleable, applies stored state)
    value2Series = chart.series.push(am5xy.ColumnSeries.new(root, {
      name: value2SeriesName,
      xAxis: xAxis, yAxis: yAxis, valueYField: "value2", categoryXField: "time",
      visible: initialValue2Visible, // Apply stored/default visibility
      tooltip: am5.Tooltip.new(root, {
          getFillFromSprite: false, labelTextColor: am5.color(whiteColorHex),
          fontSize: tooltipFontSize, labelText: value2SeriesName + ": {valueY.formatNumber('#.##')}"
      })
    }));
    value2Series.get("tooltip").get("background").set("fill", am5.color(primaryValue2TooltipBgColor));
    value2Series.columns.template.adapters.add("fill", function(fill, target) { const v2 = target.dataItem?.get("valueY"); return typeof v2 === 'number'?(v2<0?am5.color(negativeValue2Color):am5.color(positiveValue2Color)):am5.color(transparentWhiteHex, 0); });
    value2Series.columns.template.adapters.add("stroke", function(stroke, target) { const v2 = target.dataItem?.get("valueY"); return typeof v2 === 'number'?(v2<0?am5.color(negativeValue2Color):am5.color(positiveValue2Color)):am5.color(transparentWhiteHex, 0); });
    value2Series.columns.template.setAll({ strokeWidth: 2, strokeOpacity: 1, width: am5.percent(60) });
    value2Series.data.setAll(primaryData);
    if (initialValue2Visible) value2Series.appear(1000); // Only animate if initially visible

    // 3. Area Line Series (Toggleable, applies stored state)
    lineSeries = chart.series.push(am5xy.LineSeries.new(root, {
      name: lineSeriesName,
      xAxis: xAxis, yAxis: yAxis, valueYField: "value", categoryXField: "time",
      stroke: am5.color(primaryOutlineColor), fillOpacity: 0,
      visible: initialLineVisible, // Apply stored/default visibility
      connect: false,
      tooltip: am5.Tooltip.new(root, {
          getFillFromSprite: true, labelTextColor: am5.color(whiteColorHex),
          fontSize: tooltipFontSize, labelText: lineSeriesName + ": {valueY.formatNumber('#.00')}"
      })
    }));
    lineSeries.get("tooltip").get("background").set("fill", am5.color(primaryOutlineColor));
    lineSeries.strokes.template.set("strokeWidth", 2);
    lineSeries.data.setAll(primaryData);
    if (initialLineVisible) lineSeries.appear(1000); // Only animate if initially visible

    return { line: lineSeries, fill: fillSeries, bars: value2Series };
  }


  // --- Overlay Series Creation (Applies stored visibility or defaults to hidden) ---
  function createOverlaySeries(chart, root, overlayData, colors, xAxis, yAxis) {
     let overlaySeriesList = [];
     if (!overlayData) return overlaySeriesList;
     const seriesToHideByDefault = ["3 Weeks Ago", "2 Weeks Ago", "Last Week", "This Week"];

     try {
       for (const weekKey in overlayData) {
         if (Object.hasOwnProperty.call(overlayData, weekKey)) {
           const weekData = overlayData[weekKey];
           const seriesColor = colors[weekKey] || colors["Default"];

           // Determine initial visibility: Check localStorage FIRST, otherwise hide if in default list
           let initialVisible = true; // Default to visible unless overridden
           if (hasInitialState) {
                // If state exists, use it
                initialVisible = initialVisibilityState.hasOwnProperty(weekKey) ? initialVisibilityState[weekKey] : true; // Default true if state exists but missing this key
           } else {
               // No state exists, apply default hiding rules
               if (seriesToHideByDefault.includes(weekKey)) {
                   initialVisible = false;
               }
           }
           // console.log(`Series: ${weekKey}, HasInitialState: ${hasInitialState}, InitialVisible: ${initialVisible}`);


           var lineSeries = chart.series.push(am5xy.LineSeries.new(root, {
             name: weekKey,
             xAxis: xAxis, yAxis: yAxis, valueYField: "value", categoryXField: "time",
             stroke: am5.color(seriesColor),
             visible: initialVisible, // Apply determined visibility
             connect: false,
             tooltip: am5.Tooltip.new(root, {
               getFillFromSprite: false,
               labelTextColor: am5.color( (weekKey === "Last Week") ? blackColorHex : whiteColorHex ),
               fontSize: tooltipFontSize, labelText: "{name}: {valueY.formatNumber('#.00')}"
             })
           }));

           lineSeries.get("tooltip").get("background").set("fill", am5.color(seriesColor));
           lineSeries.strokes.template.set("strokeWidth", 2);
           lineSeries.data.setAll(weekData);
           if (initialVisible) lineSeries.appear(1000); // Animate only if visible

           overlaySeriesList.push(lineSeries);
         }
       }
     } catch (e) { console.error("Error creating overlay series:", e); }
     return overlaySeriesList;
   }

  // --- Legend Creation & Linking (Saves state on click) ---
  function createLegend(chart, root, mainLineSeries, fillSeriesToToggle, barsSeries, otherSeries) {
     const legendSeries = [mainLineSeries, barsSeries, ...otherSeries]; // All toggleable series
     const allSeriesForState = [mainLineSeries, fillSeriesToToggle, barsSeries, ...otherSeries]; // Include non-toggleable fill for saving state based on line
     if (legendSeries.length === 0) return null;

     var legend = chart.children.push(am5.Legend.new(root, {
         centerX: am5.p50, x: am5.p50,
         layout: am5.GridLayout.new(root, {
             maxColumns: 3 // *** Set to 3 columns ***
         }),
         marginTop: 15, marginBottom: 15
     }));

     let hintLabel = am5.Label.new(root, {
         text: "(Click legend items to toggle visibility - saved in browser)", // Updated hint
         fontSize: "0.75em", fill: am5.color(hintLabelColorHex),
         centerX: am5.p50, x: am5.p50, paddingTop: 5
     });
     chart.children.push(hintLabel);

     legend.events.on("boundschanged", function(ev) {
        let legendHeight = ev.target.height();
        hintLabel.set("paddingTop", legendHeight + 5);
        hintLabel.set("dy", legendHeight + 5);
     });

     legend.data.setAll(legendSeries); // Set data ONLY for toggleable series

     // Add event listener AFTER data is set
     legend.itemContainers.template.events.on("click", function(ev) {
        const clickedSeries = ev.target.dataItem?.dataContext;
        if (!clickedSeries) return;

        // Need a slight delay for amCharts to update the visible state internally
        setTimeout(() => {
            // Special handling for the main line series to toggle its fill counterpart
            if (clickedSeries === mainLineSeries) {
                if (mainLineSeries.isHidden() || !mainLineSeries.get("visible")) {
                    fillSeriesToToggle.hide();
                } else {
                    fillSeriesToToggle.show();
                }
            }
            // Save the state of ALL toggleable series after any click
            saveVisibilityState(legendSeries); // Pass only the legend series

        }, 50); // 50ms delay, adjust if needed
     });

     return legend;
   }

  // --- Final Chart Configuration ---
  function configureChart(chart, root, yAxis, xAxis, label) {
     var cursor = chart.set("cursor", am5xy.XYCursor.new(root, { behavior: "none" }));
     cursor.lineY.set("visible", false);
     yAxis.children.unshift(am5.Label.new(root, {
         rotation: -90, text: "Average " + label + " Points",
         y: am5.p50, centerX: am5.p50, paddingRight: 10
     }));
     xAxis.children.push(am5.Label.new(root, {
         text: "Time of Day", x: am5.p50,
         centerX: am5.percent(50), paddingTop: 10
     }));
     // Increased marginBottom for scrollbar to accommodate potentially taller legend + hint
     chart.set("scrollbarX", am5.Scrollbar.new(root, { orientation: "horizontal", marginBottom: 75 })); // Further increased margin
     chart.appear(1000, 100);
  }


  // --- Main Execution Flow ---
  const { primaryData, parsedOverlayData, hasValidOverlay } = parseChartData(primaryDataString, overlayString);
  const xAxisData = prepareAxisCategories(primaryData);
  const { chart, xAxis, yAxis } = createChartAndAxes(root, xAxisData);

  // Pass initial state info to series creation
  const primarySeriesRefs = createPrimarySeries(chart, root, primaryData, xAxis, yAxis);
  const overlaySeries = createOverlaySeries(chart, root, parsedOverlayData, overlayColors, xAxis, yAxis);

  // Create legend and attach state-saving listener
  createLegend(chart, root, primarySeriesRefs.line, primarySeriesRefs.fill, primarySeriesRefs.bars, overlaySeries);

  configureChart(chart, root, yAxis, xAxis, chartTypeLabel);

}); // end am5.ready()
</script>

</body>
</html>`;

  // --- Encode and Return URI ---
  const encodedHtml = encodeURIComponent(ht);
  const dataUri = `data:text/html;charset=utf-8,${encodedHtml}`;
  return dataUri;
}
