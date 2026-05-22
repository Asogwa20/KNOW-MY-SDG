const climateConditionUser = window.ClimateApp.requireAuth();
if (!climateConditionUser) {
  throw new Error("Authentication required");
}

// Climate Condition script uses Open-Meteo + Open-Meteo air-quality + Nominatim.

const map = L.map('map').setView([6.5, 3.5], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19, attribution: '© OpenStreetMap contributors'
}).addTo(map);

let marker = null;
let lastLocation = { lat: 6.5, lon: 3.5 };

// ---------- Helpers ----------
function pm25toUSaqi(pm) {
  if (pm == null) return null;
  const ranges = [
    [0, 12, 0, 50],
    [12.1, 35.4, 51, 100],
    [35.5, 55.4, 101, 150],
    [55.5, 150.4, 151, 200],
    [150.5, 250.4, 201, 300],
    [250.5, 500, 301, 500],
  ];
  for (const [cLow, cHigh, aLow, aHigh] of ranges) {
    if (pm >= cLow && pm <= cHigh) {
      return Math.round(((aHigh - aLow) / (cHigh - cLow)) * (pm - cLow) + aLow);
    }
  }
  return 500;
}
function pm25toEUaqi(pm) {
  if (pm == null) return null;
  if (pm <= 10) return 1;
  if (pm <= 20) return 2;
  if (pm <= 25) return 3;
  if (pm <= 50) return 4;
  if (pm <= 75) return 5;
  return 6;
}
function classifyAQI(val, type = 'us') {
  if (val == null) return '';
  if (type === 'us') {
    if (val <= 50) return 'good';
    if (val <= 100) return 'moderate';
    if (val <= 150) return 'unhealthy';
    if (val <= 200) return 'veryunhealthy';
    return 'hazardous';
  } else {
    // simple for EU categories 1..6
    if (val <= 1) return 'good';
    if (val <= 2) return 'moderate';
    if (val <= 3) return 'unhealthy';
    if (val <= 4) return 'veryunhealthy';
    return 'hazardous';
  }
}

// generate small human-friendly alerts
function generateAlerts(weather, air, uv) {
  const alerts = [];
  if (air?.pm25 && pm25toUSaqi(air.pm25) > 150) alerts.push({ level: "danger", msg: "Air quality is unhealthy. Limit outdoor activities." });
  if (weather?.temp >= 35) alerts.push({ level: "warning", msg: "High heat detected. Stay hydrated & avoid midday sun." });
  if ((weather?.precip ?? 0) >= 20) alerts.push({ level: "warning", msg: "Heavy rainfall expected. Watch for flooding." });
  if (uv >= 8) alerts.push({ level: "danger", msg: "UV index very high. Use sunscreen and limit sun exposure." });
  return alerts;
}

// ---------- UI update ----------
function updateUI(place, lat, lon, weather, air, gases, dailyForecast, astro, uv) {
  document.getElementById('placeTitle').innerText = "Location: " + (place || `${lat.toFixed(2)}, ${lon.toFixed(2)}`);
  document.getElementById('coords').textContent = `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
  document.getElementById('temp').textContent = weather ? `🌡️ Temperature: ${weather.temp} °C` : "🌡️ Temperature: —";
  document.getElementById('weatherDesc').textContent = weather ? `${weather.desc}` : "—";
  document.getElementById('humidity').textContent = "💧 Humidity: " + (weather?.humidity ?? '—') + "%";
  document.getElementById('pressure').textContent = "🔽 Pressure: " + (weather?.pressure ?? '—') + " hPa";
  document.getElementById('wind').textContent = "🌬️ Wind: " + (weather?.windspeed ?? '—') + " m/s " + (weather?.winddir ?? '');
  document.getElementById('uv').textContent = "☀️ UV Index: " + (uv ?? '—');

  const usVal = pm25toUSaqi(air?.pm25), euVal = pm25toEUaqi(air?.pm25);
  const usClass = classifyAQI(usVal, 'us'), euClass = classifyAQI(euVal, 'eu');
  const usEl = document.getElementById('usAqi'), euEl = document.getElementById('euAqi');
  usEl.textContent = usVal ?? '—'; usEl.className = usClass;
  euEl.textContent = euVal ?? '—'; euEl.className = euClass;

  document.getElementById('pm25').textContent = air?.pm25 ?? '—';
  document.getElementById('pm10').textContent = air?.pm10 ?? '—';
  document.getElementById('no2').textContent = air?.no2 ?? '—';
  document.getElementById('co2').textContent = gases?.co2 ?? '—';
  document.getElementById('ch4').textContent = gases?.ch4 ?? '—';

  document.getElementById('sunrise').textContent = "🌅 Sunrise: " + (astro?.sunrise || '—');
  document.getElementById('sunset').textContent = "🌇 Sunset: " + (astro?.sunset || '—');

  // Forecast cards
  const forecastRow = document.getElementById('forecastRow');
  forecastRow.innerHTML = '';
  dailyForecast.slice(0, 5).forEach(d => {
    const div = document.createElement('div');
    div.className = 'forecast-day';
    const iconUrl = getWeatherIconUrl(d.code);
    div.innerHTML = `<strong>${d.date}</strong>
      <img src="${iconUrl}" alt="icon"/>
      <div>${d.min}°C / ${d.max}°C</div>
      <small>${d.precip} mm</small>`;
    forecastRow.appendChild(div);
  });

  renderChart(dailyForecast);

  // Alerts
  const alerts = generateAlerts(weather, air, uv);
  const alertsBox = document.getElementById('alertsBox');
  if (alerts.length) {
    alertsBox.classList.remove('hidden');
    alertsBox.innerHTML = alerts.map(a => `<div class="${a.level}">${a.msg}</div>`).join('');
  } else {
    alertsBox.classList.add('hidden');
  }
}

// basic icon helper using open-meteo icons mapping (fallback)
function getWeatherIconUrl(code) {
  // open-meteo static icon set (simple mapping). This is an example — icons exist on open-meteo site
  return `https://open-meteo.com/images/weathericons/${code}.png`;
}

// ---------- Chart ----------
let forecastChart;
function renderChart(daily) {
  if (!Array.isArray(daily) || !daily.length) return;
  const labels = daily.map(d => d.date);
  const max = daily.map(d => d.max);
  const min = daily.map(d => d.min);
  const precip = daily.map(d => d.precip);

  const ctx = document.getElementById('forecastChart').getContext('2d');
  if (forecastChart) forecastChart.destroy();
  forecastChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Max °C', data: max, borderColor: '#c62828', tension: 0.25, fill: false },
        { label: 'Min °C', data: min, borderColor: '#0277bd', tension: 0.25, fill: false },
        { label: 'Precip mm', data: precip, borderColor: '#2e7d32', tension: 0.25, fill: false, yAxisID: 'y1' }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      scales: {
        y: { title: { display: true, text: 'Temperature (°C)' } },
        y1: { position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Precip (mm)' }, beginAtZero: true }
      }
    }
  });
}

// ---------- Data fetchers (Open-Meteo) ----------
async function fetchClimate(lat, lon) {
  // weather + daily forecast + uv + astro
  const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,surface_pressure&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode,sunrise,sunset,uv_index_max&timezone=auto`;
  const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5,pm10,nitrogen_dioxide,carbon_dioxide,methane&timezone=auto`;

  const [wRes, aqRes] = await Promise.all([fetch(wUrl), fetch(aqUrl)]);
  if (!wRes.ok) throw new Error('Weather fetch failed');
  if (!aqRes.ok) throw new Error('Air quality fetch failed');

  const w = await wRes.json();
  const aq = await aqRes.json();

  // find last hour index in air-quality dataset
  const idx = (aq.hourly?.time?.length ?? 0) - 1;

  const air = {
    pm25: aq.hourly?.pm2_5?.[idx] ?? null,
    pm10: aq.hourly?.pm10?.[idx] ?? null,
    no2: aq.hourly?.nitrogen_dioxide?.[idx] ?? null
  };
  const gases = {
    co2: aq.hourly?.carbon_dioxide?.[idx] ?? null,
    ch4: aq.hourly?.methane?.[idx] ?? null
  };

  const weather = w.current_weather
    ? {
        temp: w.current_weather.temperature,
        desc: `Wind ${w.current_weather.windspeed} m/s`,
        windspeed: w.current_weather.windspeed,
        winddir: w.current_weather.winddirection + "°",
        // humidity/pressure can be taken from hourly fallback
        humidity: w.hourly?.relativehumidity_2m?.[0] ?? null,
        pressure: w.hourly?.surface_pressure?.[0] ?? null,
        precip: w.hourly?.precipitation?.[0] ?? 0
      }
    : null;

  const dailyForecast = (w.daily?.time ?? []).map((d, i) => ({
    date: d,
    max: w.daily.temperature_2m_max[i],
    min: w.daily.temperature_2m_min[i],
    precip: w.daily.precipitation_sum?.[i] ?? 0,
    code: w.daily.weathercode?.[i] ?? 0
  }));

  const astro = {
    sunrise: w.daily?.sunrise?.[0] ?? null,
    sunset: w.daily?.sunset?.[0] ?? null
  };
  const uv = w.daily?.uv_index_max?.[0] ?? null;

  return { air, gases, weather, dailyForecast, astro, uv };
}

// reverse geocode via Nominatim
async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.display_name ?? null;
  } catch {
    return null;
  }
}

// ---------- Main handler ----------
async function handleLocation(lat, lon, centerMap = true) {
  try {
    lastLocation = { lat, lon };
    if (marker) map.removeLayer(marker);
    marker = L.marker([lat, lon]).addTo(map);

    const place = await reverseGeocode(lat, lon);
    const data = await fetchClimate(lat, lon);
    updateUI(place, lat, lon, data.weather, data.air, data.gases, data.dailyForecast, data.astro, data.uv);

    marker.bindPopup(`<b>${place || "Selected location"}</b>`).openPopup();
    if (centerMap) map.setView([lat, lon], 10);
  } catch (err) {
    alert('Error fetching climate data: ' + (err.message || err));
    console.error(err);
  }
}

// ---------- Map click & controls ----------
map.on('click', e => handleLocation(e.latlng.lat, e.latlng.lng));

document.getElementById('searchBtn').addEventListener('click', async () => {
  const q = document.getElementById('placeSearch').value.trim();
  if (!q) return alert('Please type a place name');
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`);
    const results = await res.json();
    if (!results?.[0]) return alert('Location not found');
    const lat = parseFloat(results[0].lat), lon = parseFloat(results[0].lon);
    handleLocation(lat, lon);
  } catch (err) {
    alert('Search failed');
  }
});

document.getElementById('locBtn').addEventListener('click', () => {
  if (!navigator.geolocation) return alert('Geolocation not supported');
  navigator.geolocation.getCurrentPosition(p => {
    handleLocation(p.coords.latitude, p.coords.longitude);
  }, () => alert('Unable to detect location'));
});

document.getElementById('refreshBtn').addEventListener('click', () => {
  handleLocation(lastLocation.lat, lastLocation.lon, true);
});

document.getElementById('printBtn').addEventListener('click', () => window.print());

// ---------- Auto-refresh (every 15 minutes) ----------
let autoRefreshInterval = setInterval(() => {
  handleLocation(lastLocation.lat, lastLocation.lon, false);
}, 1000 * 60 * 15); // 15 mins

// ---------- Initial load ----------
handleLocation(6.5, 3.5);

// ---------- Extra helpful features added for you ----------
// 1) UV guidance shown in alerts -> OR numerical value displayed (uv index shown).
// 2) Wind info + direction displayed.
// 3) Auto-refresh (above).
// 4) Forecast chart + 5-day forecast cards.
// 5) Print Snapshot button to easily save PDF.
//
// You can further connect this UI to your backend when ready to save snapshots, push notifications, or user preferences.
