  // --- Primary Series Creation ---
  // *** MODIFIED: Use single LineSeries for Value area, keep Value2 Bars ***
  function createPrimarySeries(chart, root, primaryData, xAxis, yAxis) {
    // console.log("Creating primary series (Value Area, Value2 Bars)...");

    let valueAreaSeries, value2Series;

    // 1. Value Area Series (Line + Fill using 'value')
    valueAreaSeries = chart.series.push(am5xy.LineSeries.new(root, {
      name: intervalName, // Main name for the legend
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: "value",
      categoryXField: "time",
      stroke: am5.color(primaryOutlineColor), // Line color
      fill: am5.color(primaryFillColor),     // Fill color
      fillOpacity: 0.8, // Make the fill visible
      connect: false,
      toggleable: true, // Appears in legend, toggles the whole area
      tooltip: am5.Tooltip.new(root, {
          getFillFromSprite: false, // Use tooltip background, not series fill
          getStrokeFromSprite: true, // Use series stroke for pointer
          labelTextColor: am5.color(0xffffff),
          background: am5.RoundedRectangle.new(root, {
              // *** FIX: Removed .lighten(0.2) ***
              fill: am5.color(primaryOutlineColor), // Tooltip background color (use base color)
              fillOpacity: 0.8 // Opacity will provide visual distinction
          }),
          fontSize: tooltipFontSize,
          labelText: intervalName + ": {valueY.formatNumber('#.00')}"
      })
    }));
    valueAreaSeries.strokes.template.set("strokeWidth", 2);
    valueAreaSeries.data.setAll(primaryData);
    valueAreaSeries.appear(1000);

    // 2. Value2 Bar Series (Red/Green, Tooltip, Toggleable) - Unchanged
    value2Series = chart.series.push(am5xy.ColumnSeries.new(root, {
      name: intervalName + " (Cumulative)",
      xAxis: xAxis, yAxis: yAxis, valueYField: "value2", categoryXField: "time",
      toggleable: true,
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


    // console.log("Primary series created.");
    // Return object containing references needed for legend
    return { valueArea: valueAreaSeries, bars: value2Series };
  }
