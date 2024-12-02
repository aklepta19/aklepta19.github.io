const dashboardState = {
    selectedState: null,
    selectedIncidentId: null,
    selectedYear: null,
    selectedGender: null
};

// Object to hold update functions for all charts
const chartUpdaters = {};


// Shared color scale for states
const color = d3.scaleOrdinal(d3.schemeObservable10); // Use a categorical color palette

// Function to register a chart's update logic
function registerChart(name, updateFunction) {
    chartUpdaters[name] = updateFunction;
}

// Update all charts based on current state
function updateCharts({ state = null, incidentId = null, gender = null, year = null }) {   
    dashboardState.selectedState = state;
    dashboardState.selectedIncidentId = incidentId;
    dashboardState.selectedGender = gender;
    dashboardState.selectedYear = year;

    Object.values(chartUpdaters).forEach(updateFn => updateFn(dashboardState));
}