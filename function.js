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
    tempString = tempString.replace(/strokeSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, '');
    tempString = tempString.replace(/fillSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, '');
    tempString = tempString.replace(/bulletSettings\s*:\s*\{[\s\S]*?\}\s*,?/g, '');
    tempString = tempString.replace(/,\s*(\})/g, '$1');
    tempString = tempString.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');
    if (tempString && !tempString.startsWith('[')) { tempString = '[' + tempString; }
    if (tempString && !tempString.endsWith(']')) { tempString = tempString + ']'; }
     if (!tempString || tempString === "[]" || tempString === "") { cleanedDataString = '[]'; }
     else { JSON.parse(tempString); cleanedDataString = tempString; console.log("DEBUG: Cleaned primary data string potentially valid JSON."); }
  } catch (cleaningError) { console.error("!!! Failed to clean primary data string !!!", cleaningError); cleanedDataString = '[]'; }
  console.log("DEBUG: Final string for primary data:", cleanedDataString);


  // --- HTML Template ---
  // Using backticks for the main template literal
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
      font-size: 0.85em;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <div id="chartdiv"></div>

<script>
am5.ready(function() {

  console.log("am5.ready() invoked.");

  // --- Configuration & Data ---
  const primaryDataString = ${JSON.stringify(cleanedDataString)};
  const overlayString = ${JSON.stringify(overlayDataJsonStringValue)};
  const intervalName = ${JSON.stringify(intervalNameValue)};
  const chartTypeLabel = ${JSON.stringify(chartTypeLabel)};
  const localStorageKey = "glideChartVisibility_SPX_Weekly"; // Standard double quotes

  const overlayColors = { "This Week": "#228B22", "Last Week": "#FFA500", "2 Weeks Ago": "#800080", "3 Weeks Ago": "#DC143C", "Default": "#888888" }; // Standard double quotes inside
  const primaryOutlineColor = "#09077b"; // Standard double quotes
  const primaryFillColor = "#b6dbee"; // Standard double quotes
  const primaryValue2TooltipBgColor = "#333333"; // Standard double quotes
  const positiveValue2Color = "#052f20"; // Standard double quotes
  const negativeValue2Color = "#78080e"; // Standard double quotes
  const tooltipFontSize = "0.6em"; // Standard double quotes
  const whiteColorHex = "#ffffff"; // Standard double quotes
  const blackColorHex = "#000000"; // Standard double quotes
  const hintLabelColorHex = "#888888"; // Standard double quotes
  const transparentWhiteHex = "#ffffff"; // Standard double quotes

  // --- Persistence Helper Functions ---
  function readVisibilityState() {
    try {
      const storedState = localStorage.getItem(localStorageKey);
      if (storedState) {
        console.log("Read state from localStorage: " + storedState); // Concatenation
        return JSON.parse(storedState);
      }
    } catch (e) {
      console.error("Error reading or parsing localStorage state:", e); // Console log
    }
    console.log("No valid state found in localStorage."); // Console log
    return {}; // Return empty object
  } // End readVisibilityState function

  function saveVisibilityState(seriesList) {
    try {
      const state = {};
      seriesList.forEach(series => {
        const seriesName = series.get("name");
        if (seriesName && series.get("toggleable") !== false) {
             state[seriesName] = series.get("visible");
        }
      }); // End forEach
      localStorage.setItem(localStorageKey, JSON.stringify(state));
      console.log("Saved state to localStorage: " + JSON.stringify(state)); // Concatenation
    } catch (e) {
      console.error("Error saving state to localStorage:", e); // Console log
    }
  } // End saveVisibilityState function

  // --- Load Initial Visibility State ---
  const initialVisibilityState = readVisibilityState();
  const hasInitialState = Object.keys(initialVisibilityState).length > 0;
  console.log("Initial visibility state loaded. Has stored state: " + hasInitialState); // Concatenation

  // --- Root Element and Theme ---
  var root = am5.Root.new("chartdiv"); // Standard double quotes
  root.setThemes([am5themes_Animated.new(root)]);
  console.log("Root created."); // Console log

  // --- Data Parsing Function ---
  function parseChartData(primaryStr, overlayStr) {
     console.log("Parsing chart data..."); // Console log
     let primaryData = []; let parsedOverlayData = null; let hasValidOverlay = false;
     try {
       let rawPrimary = JSON.parse(primaryStr);
       if (Array.isArray(rawPrimary)) {
           primaryData = rawPrimary.map(item => {
               if (!(item && typeof item === 'object' && item.hasOwnProperty('time') && typeof item.time === 'string' && item.hasOwnProperty('value') && typeof item.value === 'number')) {
                   return null;
               }
               if (item.hasOwnProperty('value2') && typeof item.value2 !== 'number') {
                   delete item.value2;
               }
               return item;
           }).filter(item => item !== null);
           console.log("Primary data parsed. Valid items: " + primaryData.length); // Concatenation
       } else {
           console.warn("Parsed primary data is not an array."); // Console log
           primaryData = [];
       }
     } catch (e) {
         console.error("Error parsing primary data JSON:", e); // Console log
         primaryData = [];
     } // End primary data try-catch

     try {
         if (overlayStr && overlayStr.trim() !== "" && overlayStr.trim() !== "{}") {
             let rawOverlay = JSON.parse(overlayStr);
             if (typeof rawOverlay === 'object' && rawOverlay !== null && !Array.isArray(rawOverlay)) {
                 parsedOverlayData = {};
                 let validKeys = 0;
                 for (const key in rawOverlay) {
                     if (Object.hasOwnProperty.call(rawOverlay, key)) {
                         const weekDataRaw = rawOverlay[key];
                         if (Array.isArray(weekDataRaw)) {
                             const processedWeekData = weekDataRaw.filter(item =>
                                 item && typeof item === 'object' &&
                                 item.hasOwnProperty('time') && typeof item.time === 'string' &&
                                 item.hasOwnProperty('value') && typeof item.value === 'number'
                             );
                             if (processedWeekData.length > 0) {
                                 parsedOverlayData[key] = processedWeekData;
                                 validKeys++;
                             } else { console.warn("Overlay key '" + key + "' had no valid items."); } // Concatenation
                         } else { console.warn("Overlay key '" + key + "' data is not an array.");} // Concatenation
                     } // End hasOwnProperty check
                 } // End for loop
                 if (validKeys > 0) {
                     hasValidOverlay = true;
                     console.log("Overlay data parsed. Valid keys: " + validKeys); // Concatenation
                 } else {
                     console.warn("Overlay data parsed, but no valid keys with data found."); // Console log
                     parsedOverlayData = null;
                 }
             } else {
                 console.warn("Parsed overlay data is not a valid object."); // Console log
                 parsedOverlayData = null;
             }
         } else { console.log("No overlay data string provided or it was empty."); } // Console log
     } catch (e) {
         console.error("Error parsing overlay JSON:", e); // Console log
         parsedOverlayData = null;
         hasValidOverlay = false;
     } // End overlay data try-catch
     return { primaryData, parsedOverlayData, hasValidOverlay };
   } // End parseChartData function

  // --- Axis Category Preparation ---
  function prepareAxisCategories(primaryData) {
     console.log("Preparing axis categories..."); // Console log
     if (!primaryData || primaryData.length === 0) { console.warn("Primary data is empty, axis will be empty."); return []; } // Console log
     try {
       let categoryStrings = primaryData.map(item => item.time);
       let uniqueCategoryStrings = categoryStrings.filter((value, index, self) => self.indexOf(value) === index);
       let xAxisData = uniqueCategoryStrings.map(timeStr => ({ time: timeStr }));
       console.log("Axis categories prepared: " + xAxisData.length); // Concatenation
       return xAxisData;
     } catch (e) {
         console.error("Error preparing axis categories:", e); // Console log
         return [];
     }
   } // End prepareAxisCategories function

  // --- Chart and Axes Creation ---
  function createChartAndAxes(root, xAxisData) {
    console.log("Creating chart and axes..."); // Console log
    var chart = root.container.children.push(am5xy.XYChart.new(root, { panX: true, panY: true, wheelX: "panX", wheelY: "zoomX", layout: root.verticalLayout, pinchZoomX: true }));
    var xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 70 });
    xRenderer.labels.template.setAll({ fontSize: 8, rotation: -90, centerY: am5.p50, centerX: am5.p100, paddingRight: 5 });
    var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, { categoryField: "time", renderer: xRenderer, tooltip: am5.Tooltip.new(root, {}) })); // Double quotes
    if (xAxisData.length > 0) { xAxis.data.setAll(xAxisData); console.log("Set " + xAxisData.length + " categories on X-Axis."); } // Concatenation
    var yRenderer = am5xy.AxisRendererY.new(root, {});
    var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { maxPrecision: 2, renderer: yRenderer }));
    console.log("Chart and axes created."); // Console log
    return { chart, xAxis, yAxis };
   } // End createChartAndAxes function


  // --- Primary Series Creation (Applies stored visibility) ---
  function createPrimarySeries(chart, root, primaryData, xAxis, yAxis) {
    console.log("Creating primary series..."); // Console log
    let lineSeries, fillSeries, value2Series;
    const lineSeriesName = intervalName;
    const value2SeriesName = intervalName + " (Cumulative)"; // Concatenation

    const initialLineVisible = initialVisibilityState.hasOwnProperty(lineSeriesName) ? initialVisibilityState[lineSeriesName] : true;
    const initialValue2Visible = initialVisibilityState.hasOwnProperty(value2SeriesName) ? initialVisibilityState[value2SeriesName] : true;
    console.log("Primary Series ('" + lineSeriesName + "'): Initial Visible = " + initialLineVisible); // Concatenation
    console.log("Primary Series ('" + value2SeriesName + "'): Initial Visible = " + initialValue2Visible); // Concatenation

    fillSeries = chart.series.push(am5xy.ColumnSeries.new(root, {
        name: intervalName + " (Fill)", // Concatenation
        xAxis: xAxis, yAxis: yAxis, valueYField: "value", categoryXField: "time", // Double quotes
        fill: am5.color(primaryFillColor), strokeOpacity: 0, width: am5.percent(100),
        toggleable: false,
        visible: initialLineVisible
    }));
    fillSeries.data.setAll(primaryData);

    value2Series = chart.series.push(am5xy.ColumnSeries.new(root, {
      name: value2SeriesName,
      xAxis: xAxis, yAxis: yAxis, valueYField: "value2", categoryXField: "time", // Double quotes
      visible: initialValue2Visible,
      tooltip: am5.Tooltip.new(root, {
          getFillFromSprite: false, labelTextColor: am5.color(whiteColorHex),
          fontSize: tooltipFontSize, labelText: value2SeriesName + ": {valueY.formatNumber('#.##')}" // Concatenation
      })
    }));
    value2Series.get("tooltip").get("background").set("fill", am5.color(primaryValue2TooltipBgColor)); // Double quotes
    value2Series.columns.template.adapters.add("fill", function(fill, target) { const v2 = target.dataItem?.get("valueY"); return typeof v2 === 'number'?(v2<0?am5.color(negativeValue2Color):am5.color(positiveValue2Color)):am5.color(transparentWhiteHex, 0); }); // Double quotes
    value2Series.columns.template.adapters.add("stroke", function(stroke, target) { const v2 = target.dataItem?.get("valueY"); return typeof v2 === 'number'?(v2<0?am5.color(negativeValue2Color):am5.color(positiveValue2Color)):am5.color(transparentWhiteHex, 0); }); // Double quotes
    value2Series.columns.template.setAll({ strokeWidth: 2, strokeOpacity: 1, width: am5.percent(60) });
    value2Series.data.setAll(primaryData);
    if (initialValue2Visible) value2Series.appear(1000);

    lineSeries = chart.series.push(am5xy.LineSeries.new(root, {
      name: lineSeriesName,
      xAxis: xAxis, yAxis: yAxis, valueYField: "value", categoryXField: "time", // Double quotes
      stroke: am5.color(primaryOutlineColor), fillOpacity: 0,
      visible: initialLineVisible,
      connect: false,
      tooltip: am5.Tooltip.new(root, {
          getFillFromSprite: true, labelTextColor: am5.color(whiteColorHex),
          fontSize: tooltipFontSize, labelText: lineSeriesName + ": {valueY.formatNumber('#.00')}" // Concatenation
      })
    }));
    lineSeries.get("tooltip").get("background").set("fill", am5.color(primaryOutlineColor)); // Double quotes
    lineSeries.strokes.template.set("strokeWidth", 2); // Double quotes
    lineSeries.data.setAll(primaryData);
    if (initialLineVisible) lineSeries.appear(1000);

    return { line: lineSeries, fill: fillSeries, bars: value2Series };
  } // End createPrimarySeries function


  // --- Overlay Series Creation (Applies stored visibility or defaults to hidden) ---
  function createOverlaySeries(chart, root, overlayData, colors, xAxis, yAxis) {
     console.log("Creating overlay series..."); // Console log
     let overlaySeriesList = [];
     if (!overlayData) { console.log("No valid overlay data to create series."); return overlaySeriesList; } // Console log
     const seriesToHideByDefault = ["3 Weeks Ago", "2 Weeks Ago", "Last Week", "This Week"]; // Double quotes

     try {
       for (const weekKey in overlayData) {
         if (Object.hasOwnProperty.call(overlayData, weekKey)) {
           const weekData = overlayData[weekKey];
           const seriesColor = colors[weekKey] || colors["Default"]; // Double quotes

           let initialVisible = true;
           if (hasInitialState) {
                initialVisible = initialVisibilityState.hasOwnProperty(weekKey) ? initialVisibilityState[weekKey] : true;
           } else {
               if (seriesToHideByDefault.includes(weekKey)) {
                   initialVisible = false;
               }
           }
           console.log("Overlay Series: '" + weekKey + "', Initial Visible = " + initialVisible + ", Has Stored State = " + hasInitialState); // Concatenation

           var lineSeries = chart.series.push(am5xy.LineSeries.new(root, {
             name: weekKey,
             xAxis: xAxis, yAxis: yAxis, valueYField: "value", categoryXField: "time", // Double quotes
             stroke: am5.color(seriesColor),
             visible: initialVisible,
             connect: false,
             tooltip: am5.Tooltip.new(root, {
               getFillFromSprite: false,
               labelTextColor: am5.color( (weekKey === "Last Week") ? blackColorHex : whiteColorHex ), // Double quotes
               fontSize: tooltipFontSize, labelText: "{name}: {valueY.formatNumber('#.00')}" // Double quotes
             })
           }));

           lineSeries.get("tooltip").get("background").set("fill", am5.color(seriesColor)); // Double quotes
           lineSeries.strokes.template.set("strokeWidth", 2); // Double quotes
           lineSeries.data.setAll(weekData);
           if (initialVisible) lineSeries.appear(1000);

           overlaySeriesList.push(lineSeries);
         } // End hasOwnProperty check
       } // End for loop
     } catch (e) { console.error("Error creating overlay series:", e); } // Console log
     console.log("Overlay series creation finished. Total overlay series: " + overlaySeriesList.length); // Concatenation
     return overlaySeriesList;
   } // End createOverlaySeries function

  // --- Legend Creation & Linking (Saves state on click) ---
  function createLegend(chart, root, mainLineSeries, fillSeriesToToggle, barsSeries, otherSeries) {
     const legendSeries = [mainLineSeries, barsSeries, ...otherSeries];
     if (legendSeries.length === 0) { console.log("Skipping legend (no series)."); return null; } // Console log

     console.log("Creating legend for " + legendSeries.length + " toggleable series."); // Concatenation

     var legend = chart.children.push(am5.Legend.new(root, {
         centerX: am5.p50, x: am5.p50,
         layout: am5.GridLayout.new(root, {
             maxColumns: 3
         }),
         marginTop: 15, marginBottom: 15
     }));

     let hintLabel = am5.Label.new(root, {
         text: '(Click legend items to toggle visibility - saved in browser)', // Single quotes okay here
         fontSize: "0.75em", fill: am5.color(hintLabelColorHex), // Double quotes
         centerX: am5.p50, x: am5.p50, paddingTop: 5
     });
     chart.children.push(hintLabel);

     legend.events.on("boundschanged", function(ev) { // Double quotes
        let legendHeight = ev.target.height();
        hintLabel.set("paddingTop", legendHeight + 5); // Double quotes
        hintLabel.set("dy", legendHeight + 5); // Double quotes
     }); // End boundschanged event listener

     legend.data.setAll(legendSeries);

     legend.itemContainers.template.events.on("click", function(ev) { // Double quotes
        const clickedSeries = ev.target.dataItem?.dataContext;
        if (!clickedSeries) return;
        console.log("Legend item clicked for series: " + clickedSeries.get("name")); // Concatenation

        setTimeout(() => {
            if (clickedSeries === mainLineSeries) {
                if (mainLineSeries.isHidden() || !mainLineSeries.get("visible")) { // Double quotes
                    fillSeriesToToggle.hide();
                } else {
                    fillSeriesToToggle.show();
                }
            }
            saveVisibilityState(legendSeries);
        }, 50); // End setTimeout callback
     }); // End click event listener

     console.log("Legend created."); // Console log
     return legend;
   } // End createLegend function

  // --- Final Chart Configuration ---
  function configureChart(chart, root, yAxis, xAxis, label) {
     console.log("Configuring final chart elements..."); // Console log
     var cursor = chart.set("cursor", am5xy.XYCursor.new(root, { behavior: "none" })); // Double quotes
     cursor.lineY.set("visible", false); // Double quotes
     yAxis.children.unshift(am5.Label.new(root, {
         rotation: -90, text: "Average " + label + " Points", // Concatenation
         y: am5.p50, centerX: am5.p50, paddingRight: 10
     }));
     xAxis.children.push(am5.Label.new(root, {
         text: "Time of Day", x: am5.p50, // Double quotes
         centerX: am5.percent(50), paddingTop: 10
     }));
     chart.set("scrollbarX", am5.Scrollbar.new(root, { orientation: "horizontal", marginBottom: 75 })); // Double quotes
     chart.appear(1000, 100);
     console.log("Chart configured."); // Console log
  } // End configureChart function


  // --- Main Execution Flow ---
  console.log("--- Starting Chart Build Process ---"); // Console log
  const { primaryData, parsedOverlayData, hasValidOverlay } = parseChartData(primaryDataString, overlayString);
  const xAxisData = prepareAxisCategories(primaryData);
  const { chart, xAxis, yAxis } = createChartAndAxes(root, xAxisData);

  const primarySeriesRefs = createPrimarySeries(chart, root, primaryData, xAxis, yAxis);
  const overlaySeries = createOverlaySeries(chart, root, parsedOverlayData, overlayColors, xAxis, yAxis);

  createLegend(chart, root, primarySeriesRefs.line, primarySeriesRefs.fill, primarySeriesRefs.bars, overlaySeries);

  configureChart(chart, root, yAxis, xAxis, chartTypeLabel);
  console.log("--- Chart Build Process Complete ---"); // Console log


}); // <--- This closing parenthesis and curly brace closes am5.ready()
</script>

</body>
</html>
`; // End of the main backtick template literal

  // --- Encode and Return URI ---
  const encodedHtml = encodeURIComponent(ht);
  // Using backticks here is fine as it's outside the generated HTML/JS context
  const dataUri = `data:text/html;charset=utf-8,${encodedHtml}`;
  return dataUri;
}
