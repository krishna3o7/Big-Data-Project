import "./style.css";

const DATA_URL = "/data/traffic_accidents.csv";
let allRecords = [];
let activeSeverity = "All";

const $ = (selector) => document.querySelector(selector);

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift().split(",").map((h) => h.trim());
  return lines.map((line) => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((header, index) => [header, (values[index] ?? "").trim()]));
  }).filter((row) => row.accident_id);
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function filteredRecords() {
  const city = $("#cityFilter").value;
  const severity = $("#severityFilter").value;
  const month = $("#monthFilter").value;
  return allRecords.filter((record) =>
    (city === "All" || record.city === city) &&
    (severity === "All" || record.severity === severity) &&
    (month === "All" || record.date.slice(5, 7) === month)
  );
}

function setMetric(id, value) {
  $(id).textContent = value.toLocaleString("en-IN");
}

function renderMetrics(records) {
  const casualties = records.reduce((sum, r) => sum + number(r.casualties), 0);
  const fatalities = records.reduce((sum, r) => sum + number(r.fatalities), 0);
  const severe = records.filter((r) => ["Major", "Fatal"].includes(r.severity)).length;
  setMetric("#totalAccidents", records.length);
  setMetric("#totalCasualties", casualties);
  setMetric("#totalFatalities", fatalities);
  setMetric("#severeAccidents", severe);
}

function renderBars(container, items, valueLabel = "accidents") {
  if (!items.length) {
    container.innerHTML = '<p class="empty">No records match these filters.</p>';
    return;
  }
  const max = Math.max(...items.map((item) => item.value), 1);
  container.innerHTML = items.map((item) => `
    <div class="bar-row">
      <div class="bar-label"><span>${escapeHTML(item.label)}</span><strong>${item.value}</strong></div>
      <div class="bar-track"><div class="bar-fill" style="width:${(item.value / max) * 100}%"></div></div>
    </div>
  `).join("");
}

function renderCharts(records) {
  const bySeverity = countBy(records, "severity");
  const byCity = countBy(records, "city").sort((a, b) => b.value - a.value).slice(0, 7);
  const byWeather = countBy(records, "weather");
  renderBars($("#severityChart"), bySeverity);
  renderBars($("#cityChart"), byCity);
  renderBars($("#weatherChart"), byWeather);
}

function countBy(records, key) {
  const counts = new Map();
  records.forEach((record) => counts.set(record[key], (counts.get(record[key]) || 0) + 1));
  return [...counts.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

function renderTable(records) {
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
  $("#recordCount").textContent = `${sorted.length} records`;
  $("#accidentRows").innerHTML = sorted.slice(0, 100).map((r) => `
    <tr>
      <td>${escapeHTML(r.accident_id)}</td><td>${escapeHTML(r.date)}</td>
      <td>${escapeHTML(r.time)}</td><td>${escapeHTML(r.city)}</td>
      <td>${escapeHTML(r.vehicle_type)}</td>
      <td><span class="severity ${r.severity.toLowerCase()}">${escapeHTML(r.severity)}</span></td>
      <td>${number(r.casualties)}</td><td>${number(r.fatalities)}</td>
      <td>${escapeHTML(r.cause)}</td>
    </tr>
  `).join("");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function render() {
  const records = filteredRecords();
  renderMetrics(records);
  renderCharts(records);
  renderTable(records);
}

function populateFilters() {
  const citiesList = [...new Set(allRecords.map((r) => r.city))].sort();
  $("#cityFilter").innerHTML = '<option>All</option>' + citiesList.map((city) => `<option>${escapeHTML(city)}</option>`).join("");
  $("#monthFilter").innerHTML = '<option value="All">All months</option>' +
    Array.from({ length: 12 }, (_, i) => `<option value="${String(i + 1).padStart(2, "0")}">${new Date(2025, i).toLocaleString("en", { month: "long" })}</option>`).join("");
}

function downloadCSV(records) {
  const columns = ["accident_id", "date", "time", "city", "weather", "road_condition", "vehicle_type", "severity", "casualties", "fatalities", "cause"];
  const csv = [columns.join(","), ...records.map((r) => columns.map((c) => `"${String(r[c] ?? "").replaceAll('"', '""')}"`).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "filtered_traffic_accidents.csv";
  link.click();
  URL.revokeObjectURL(url);
}

async function init() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`Dataset request failed: ${response.status}`);
    allRecords = parseCSV(await response.text());
    if (!allRecords.length) throw new Error("The CSV dataset is empty.");
    populateFilters();
    render();
    $("#loadingState").hidden = true;
    $("#dashboard").hidden = false;
    ["#cityFilter", "#severityFilter", "#monthFilter"].forEach((selector) => $(selector).addEventListener("change", render));
    $("#resetFilters").addEventListener("click", () => {
      $("#cityFilter").value = "All";
      $("#severityFilter").value = "All";
      $("#monthFilter").value = "All";
      render();
    });
    $("#exportButton").addEventListener("click", () => downloadCSV(filteredRecords()));
  } catch (error) {
    $("#loadingState").textContent = `Could not load the dataset. ${error.message}`;
  }
}

init();
