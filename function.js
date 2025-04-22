window.function = function (data, overlayDataJson, intervalName, width, height, type) {

  // --- Input Handling & Cleaning --- (No Changes)
  let dataStringValue = data.value ?? '[]';
  let overlayDataJsonStringValue = overlayDataJson.value ?? '{}';
  let intervalNameValue = intervalName.value ?? "Period";
  let chartWidth = width.value ?? 100;
  let chartHeight = height.value ?? 550;
  let chartTypeLabel = type.value ?? "Value";
  let cleanedDataString = '[]';
  try {
    console.log("--- Glide Input ---"); /*...*/
    let tempString = dataStringValue.trim();
    /* ... cleaning ... */
    if (!tempString || tempString === "[]" || tempString === "") { cleanedDataString = '[]'; }
    else { JSON.parse(tempString); cleanedDataString = tempString; console.log("DEBUG: Cleaned primary data string appears valid JSON."); }
  } catch (cleaningError) { /*...*/ cleanedDataString = '[]'; }
  console.log("DEBUG: Final string for primary data passed to chart:", cleanedDataString); /*...*/
  console.log("--- End Glide Input ---");


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
    .am5-tooltip { font-size: 0.85em; pointer-events: none; }
  </style>
</head>
<body>
  <div id="chartdiv"></div>

<script>
am5.ready(function() {

  console.log("am5.ready() invoked.");

  // --- Configuration & Data --- (Using version with valueOpen)
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
  const whiteColor = am5.color(0xffffff);

  console.log("Chart Constants Set:"); /*...*/

  // --- Root Element and Theme --- (No Changes)
  var root = am5.Root.new("chartdiv");
  root.setThemes([am5themes_Animated.new(root)]);
  console.log("Root created.");

  // --- Data Parsing Function --- (Includes valueOpen, filter logic fixed)
  function parseChartData(primaryStr, overlayStr) {
     console.log("--- Starting parseChartData ---");
     let primaryData = [];
     let parsedOverlayData = null;
     let hasValidOverlay = false;

     // Parse Primary Data
     console.log("Attempting to parse primary data string:", primaryStr);
     try {
         let rawPrimary = JSON.parse(primaryStr);
         console.log("Successfully parsed primary JSON:", rawPrimary);
         if (Array.isArray(rawPrimary)) {
             console.log("Primary JSON is an array. Processing items...");
             primaryData = rawPrimary.map((item, index) => {
                 if (!(item && typeof item === 'object' && item.hasOwnProperty('time') && typeof item.time === 'string' && item.hasOwnProperty('value') && typeof item.value === 'number')) {
                      console.log("Primary data item at index", index, "is invalid or missing required fields (time, value):", item);
                     return null;
                 }
                 if (item.hasOwnProperty('value2') && typeof item.value2 !== 'number') {
                      console.log("Primary data item at index", index, "has non-numeric value2, removing it:", item);
                     delete item.value2;
                 }
                 item.valueOpen = 0; // valueOpen IS included
                 return item;
             }).filter(item => item !== null);
             console.log("Primary data processed, filtered, and valueOpen added. Resulting array length:", primaryData.length);
         } else { console.log("WARNING: Parsed primary data is not an array."); }
     } catch (e) { /*...*/ primaryData = []; }

     // Parse Overlay Data
     console.log("Attempting to parse overlay data string:", overlayStr);
     try {
         if (overlayStr && overlayStr.trim() !== "" && overlayStr.trim() !== "{}") {
             let rawOverlay = JSON.parse(overlayStr);
              console.log("Successfully parsed overlay JSON:", rawOverlay);
             if (typeof rawOverlay === 'object' && rawOverlay !== null && !Array.isArray(rawOverlay)) {
                  console.log("Overlay JSON is an object. Processing keys...");
                 parsedOverlayData = {};
                 let validKeys = 0;
                 for (const key in rawOverlay) {
                     if (Object.hasOwnProperty.call(rawOverlay, key)) {
                          console.log("Processing overlay key:", key);
                         const weekDataRaw = rawOverlay[key];
                         if(Array.isArray(weekDataRaw)) {
                             console.log("Data for key", key, "is an array. Filtering items...");
                             const processedWeekData = weekDataRaw.filter(item => { // Filter logic is correct here
                                const isValid = item && typeof item === 'object' && item.hasOwnProperty('time') && typeof item.time === 'string' && item.hasOwnProperty('value') && typeof item.value === 'number';
                                if (!isValid) { console.log("Invalid item found in overlay data for key", key, ":", item); }
                                return isValid;
                             });
                             if (processedWeekData.length > 0) {
                                 parsedOverlayData[key] = processedWeekData; validKeys++;
                                 console.log("Key", key, "has", processedWeekData.length, "valid items after filtering.");
                             } else { console.log("Overlay data for key", key, "had no valid items after filtering."); }
                         } else { console.log("Overlay data for key", key, "was not an array. Skipping."); }
                     }
                 }
                 if (validKeys > 0) { hasValidOverlay = true; console.log("Overlay data parsed successfully."); }
                 else { console.log("WARNING: Overlay data parsed, but no valid keys/data found."); parsedOverlayData = null; }
             } else { console.log("WARNING: Parsed overlay data is not a valid object."); }
         } else { console.log("No overlay data string provided."); }
     } catch (e) { /*...*/ parsedOverlayData = null; }

     console.log("--- Finished parseChartData ---");
     return { primaryData, parsedOverlayData, hasValidOverlay };
   }


  // --- Axis Category Preparation --- (No Changes)
  function prepareAxisCategories(primaryData) {
    /* ... same as before ... */
    return xAxisData;
  }


  // --- Chart and Axes Creation --- (Keeping forceZero: true)
  function createChartAndAxes(root, xAxisData) {
    /* ... same as before ... */
    yAxis.set("forceZero", true);
    /* ... */
    return { chart, xAxis, yAxis };
   }


  // --- Primary Series Creation ---
  // *** REVERTED ORDER: Add line/area (valueAreaSeries) FIRST, then bars (value2Series) ***
  function createPrimarySeries(chart, root, primaryData, xAxis, yAxis) {
    console.log("--- Starting createPrimarySeries ---");
    let valueAreaSeries, value2Series;

    // *** 1. Add Value Area Series FIRST *** (Using openValueYField)
    console.log("Creating Value Area series (Line + Fill)...");
    valueAreaSeries = chart.series.push(am5xy.LineSeries.new(root, {
      name: intervalName,
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: "value",
      categoryXField: "time",
      openValueYField: "valueOpen", // Using openValueYField approach again
      stroke: am5.color(primaryOutlineColor),
      fill: am5.color(primaryFillColor),
      fillOpacity: 0.8, // Fill should be visible
      connect: false,
      toggleable: true,
      tooltip: am5.Tooltip.new(root, { // Keeping tooltip fixes
          pointerOrientation: "horizontal", getFillFromSprite: false,
          getStrokeFromSprite: true, labelTextColor: whiteColor,
          background: am5.RoundedRectangle.new(root, { fill: am5.color(primaryOutlineColor), fillOpacity: 0.9 }),
          fontSize: tooltipFontSize, labelText: intervalName + ": {valueY.formatNumber('#.00')}"
      })
    }));
    valueAreaSeries.strokes.template.set("strokeWidth", 2);
    console.log("Setting data for Value Area series. Item count:", primaryData.length);
    valueAreaSeries.data.setAll(primaryData); // Data includes valueOpen
    valueAreaSeries.appear(1000);
    console.log("Value Area series created and added. Fill opacity:", valueAreaSeries.get("fillOpacity"), "Fill color:", valueAreaSeries.get("fill"));


    // *** 2. Add Value2 Bar Series SECOND ***
    console.log("Creating Value2 Bar series (Columns)...");
    value2Series = chart.series.push(am5xy.ColumnSeries.new(root, {
      name: intervalName + " (Cumulative)",
      xAxis: xAxis, yAxis: yAxis, valueYField: "value2", categoryXField: "time",
      toggleable: true,
      tooltip: am5.Tooltip.new(root, {
          getFillFromSprite: true,
          labelTextColor: whiteColor,
          fontSize: tooltipFontSize,
          labelText: intervalName + " (Cumulative): {valueY.formatNumber('#.##')}"
      })
    }));
    // Adapters for color
    value2Series.columns.template.adapters.add("fill", function(fill, target) {
      const v2 = target.dataItem?.get("valueY");
      return typeof v2 === 'number' ? (v2 < 0 ? am5.color(negativeValue2Color) : am5.color(positiveValue2Color)) : am5.color(0xffffff, 0);
    });
    value2Series.columns.template.adapters.add("stroke", function(stroke, target) {
       const v2 = target.dataItem?.get("valueY");
       return typeof v2 === 'number' ? (v2 < 0 ? am5.color(negativeValue2Color) : am5.color(positiveValue2Color)) : am5.color(0xffffff, 0);
    });
    value2Series.columns.template.setAll({ strokeWidth: 1, strokeOpacity: 1, width: am5.percent(60) });
    console.log("Setting data for Value2 Bar series. Item count:", primaryData.length);
    value2Series.data.setAll(primaryData); // Data includes valueOpen, but ColumnSeries ignores it
    value2Series.appear(1000);
    console.log("Value2 Bar series created and added.");


    console.log("--- Finished createPrimarySeries ---");
    return { valueArea: valueAreaSeries, bars: value2Series };
  }


  // --- Overlay Series Creation --- (Keep tooltip fixes)
  function createOverlaySeries(chart, root, overlayData, colors, xAxis, yAxis) {
    /* ... same as before ... */
    return overlaySeriesList;
  }

  // --- Legend Creation --- (No Changes)
  function createLegend(chart, root, valueAreaSeries, barsSeries, otherSeries) {
     /* ... same as before ... */
     return legend;
  }

  // --- Final Chart Configuration --- (No Changes)
  function configureChart(chart, root, yAxis, xAxis, label) {
    /* ... same as before ... */
   }


  // --- Main Execution Flow --- (No Changes)
  console.log("--- Starting Chart Build Process ---");
  const { primaryData, parsedOverlayData, hasValidOverlay } = parseChartData(primaryDataString, overlayString);
  if (!primaryData || primaryData.length === 0) { /*...*/ return; }
  const xAxisData = prepareAxisCategories(primaryData);
  const { chart, xAxis, yAxis } = createChartAndAxes(root, xAxisData);
  // createPrimarySeries now adds Line/Area first, then Bars
  const primarySeriesRefs = createPrimarySeries(chart, root, primaryData, xAxis, yAxis);
  const overlaySeries = createOverlaySeries(chart, root, parsedOverlayData, overlayColors, xAxis, yAxis);
  createLegend(chart, root, primarySeriesRefs.valueArea, primarySeriesRefs.bars, overlaySeries);
  configureChart(chart, root, yAxis, xAxis, chartTypeLabel);
  console.log("--- Chart Build Process Complete ---");

}); // end am5.ready()
</script>

</body>
</html>`;

  // --- Encode and Return URI --- (No Changes)
  console.log("Encoding HTML and returning data URI...");
  const encodedHtml = encodeURIComponent(ht);
  const dataUri = `data:text/html;charset=utf-8,${encodedHtml}`;
  console.log("Data URI created.");
  return dataUri;
}
