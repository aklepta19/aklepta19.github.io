// Global state to track the selected state
let selectedState = null;

// Object to hold the update functions for all charts
const chartUpdaters = {};

// Shared color scale for states
const color = d3.scaleOrdinal(d3.schemeObservable10); // Use a categorical color palette

// Function to register a chart's update logic
function registerChart(name, updateFunction) {
    chartUpdaters[name] = updateFunction;
}

// Function to update all charts
function updateCharts(selectedState) {
    Object.values(chartUpdaters).forEach(updateFn => updateFn(selectedState));
}


