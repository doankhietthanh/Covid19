const CASE_COLOR = {
  confirmed: "#0072ff",
  recovered: "#35CA68",
  deaths: "#ff3c60",
};
const CASE_STATUS = {
  confirmed: "confirmed",
  recovered: "recovered",
  deaths: "deaths",
};

let countries_list;
let all_time_chart;

const body = document.querySelector("body");

window.onload = async () => {
  startLoading();

  initCountryFilter();
  initAllTimeChart();

  await loadData("Global");
  await loadCountrySelectList();

  endLoading();
};

// Loading
startLoading = () => {
  body.classList.add("loading");
};
endLoading = () => {
  body.classList.remove("loading");
};
//

formatNumber = (number) => {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

showConfirmedTotal = (total) => {
  return (document.getElementById("total-confirmed").innerText =
    formatNumber(total));
};
showDeathsTotal = (total) => {
  return (document.getElementById("total-deaths").innerText =
    formatNumber(total));
};
showRecoveredTotal = (total) => {
  return (document.getElementById("total-recovered").innerText =
    formatNumber(total));
};

loadData = async (country) => {
  await loadSummary(country);
  await loadAllTimeChart(country);
  await getLocation(country);
};

isGlobal = (country) => {
  return country === "Global";
};

loadSummary = async (country) => {
  let summaryData = await covidApi.getSummary();
  let summary = summaryData.Global;

  if (!isGlobal(country)) {
    summary = summaryData.Countries.filter((e) => {
      return e.Country === country;
    })[0];
  }

  showConfirmedTotal(summary.TotalConfirmed);
  showRecoveredTotal(summary.TotalRecovered);
  showDeathsTotal(summary.TotalDeaths);

  //   load countries table
  let caseByCountries = summaryData.Countries.sort(
    (a, b) => b.TotalConfirmed - a.TotalConfirmed
  );
  let table_countries_body = document.querySelector("#table_countries tbody");
  table_countries_body.innerHTML = "";

  for (let i = 0; i < 10; i++) {
    let row = `
     <tr>
        <td>${caseByCountries[i].Country}</td>
        <td>${formatNumber(caseByCountries[i].TotalConfirmed)}</td>
        <td>${formatNumber(caseByCountries[i].TotalDeaths)}</td>
     </tr>
     `;
    table_countries_body.innerHTML += row;
  }
};

getLocation = async (country) => {
  let location, lat, lon;
  if (isGlobal(country)) {
    (lat = 0), (lon = 0);
  } else {
    location = await covidApi.getCountryAllTimeCases(
      country,
      CASE_STATUS.confirmed
    );
    lat = Number(location[0].Lat);
    lon = Number(location[0].Lon);
  }
  initMap(country, lat, lon);
  const p2 = new google.maps.LatLng(lat, lon);

  navigator.geolocation.getCurrentPosition((position) => {
    const latHere = position.coords.latitude;
    const lonHere = position.coords.longitude;
    const p1 = new google.maps.LatLng(latHere, lonHere);
    if (country === "Global") {
      document.querySelector(".distance").style = "display: none";
    } else {
      document.querySelector(".distance").style = "display: block";
      document.querySelector(
        ".distance"
      ).innerHTML = `<i class='bx bx-right-arrow-alt'></i> ${formatNumber(
        Math.floor(getDistance(p1, p2) / 1000)
      )} km`;
    }
  });
};

var rad = function (x) {
  return (x * Math.PI) / 180;
};

var getDistance = function (p1, p2) {
  var R = 6378137; // Earth’s mean radius in meter
  var dLat = rad(p2.lat() - p1.lat());
  var dLong = rad(p2.lng() - p1.lng());
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(p1.lat())) *
      Math.cos(rad(p2.lat())) *
      Math.sin(dLong / 2) *
      Math.sin(dLong / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d; // returns the distance in meter
};

handleSelectCountry = async (country, element) => {
  const actives = document.querySelectorAll("#country-select-list li");
  actives.forEach((active) => {
    if (active.classList.contains("active")) active.classList.remove("active");
  });
  element.classList.add("active");
  let summaryData = await covidApi.getSummary();
  let convertCountry = "";
  summaryData.Countries.forEach((e) => {
    if (e.CountryCode === country) {
      convertCountry = e.Country;
    }
    if (country === "Global") {
      convertCountry = "Global";
    }
  });
  await loadData(convertCountry);
  await getLocation(convertCountry);
  document.querySelector("#country-select").textContent = convertCountry;
};

renderCountrySelectList = (list) => {
  const country_select_list = document.querySelector("#country-select-list");
  country_select_list.innerHTML = "";
  list.forEach((e) => {
    let item = `
    <li onclick=handleSelectCountry("${e.CountryCode}",this)>
        <img alt="${e.Country}"
            src="http://purecatamphetamine.github.io/country-flag-icons/3x2/${
              e.CountryCode
            }.svg" /> ${e.Country}
        <span>${formatNumber(e.TotalConfirmed)}</span>
    </li>
    `;
    country_select_list.innerHTML += item;
  });
};

loadCountrySelectList = async () => {
  let summaryData = await covidApi.getSummary();

  countries_list = summaryData.Countries;

  const country_select_list = document.querySelector("#country-select-list");

  let item = `
    <li onclick=handleSelectCountry("Global",this)>
        <img alt="Global"
            src="http://cdn.onlinewebfonts.com/svg/img_542923.png" /> Global
        <span>${formatNumber(summaryData.Global.TotalConfirmed)}</span>
    </li>
    `;

  renderCountrySelectList(countries_list);
  country_select_list.innerHTML += item;
};

initCountryFilter = () => {
  const form = document.querySelector("form");
  const inputCountry = document.querySelector("#input-country");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let filterCountry = countries_list.filter((e) => {
      return e.Country.toLowerCase().includes(inputCountry.value.toLowerCase());
    });
    inputCountry.value = "";
    renderCountrySelectList(filterCountry);
  });
};

initAllTimeChart = () => {
  const options = {
    chart: {
      type: "line",
    },
    colors: [CASE_COLOR.confirmed, CASE_COLOR.recovered, CASE_COLOR.deaths],
    series: [],
    stroke: {
      cure: "smooth",
    },
    xaxis: {
      categories: [],
      labels: {
        show: false,
      },
    },
    yaxis: [
      {
        axisTicks: {
          show: true,
        },
        axisBorder: {
          show: true,
          color: CASE_COLOR.confirmed,
        },
        labels: {
          style: {
            colors: CASE_COLOR.confirmed,
          },
        },
        title: {
          text: "Confirmed + Recovered",
          style: {
            color: CASE_COLOR.confirmed,
          },
        },
      },
      {
        opposite: true,
        axisTicks: {
          show: true,
        },
        axisBorder: {
          show: true,
          color: CASE_COLOR.deaths,
        },
        labels: {
          style: {
            colors: CASE_COLOR.deaths,
          },
        },
        title: {
          text: "Deaths",
          style: {
            color: CASE_COLOR.deaths,
          },
        },
      },
    ],
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      shared: false,
      intersect: true,
      x: {
        show: false,
      },
    },
  };

  all_time_chart = new ApexCharts(
    document.querySelector("#all-time-chart"),
    options
  );

  all_time_chart.render();
};

renderData = (country_data) => {
  let result = [];
  country_data.forEach((e) => result.push(e.Cases));
  return result;
};

renderWorldData = (world_data, status) => {
  let result = [];
  world_data.forEach((e) => {
    switch (status) {
      case CASE_STATUS.confirmed:
        result.push(e.TotalConfirmed);
        break;
      case CASE_STATUS.recovered:
        result.push(e.TotalRecovered);
        break;
      case CASE_STATUS.deaths:
        result.push(e.TotalDeaths);
        break;
    }
  });
  return result;
};

loadAllTimeChart = async (country) => {
  let labels = [];

  let confirm_data, recovered_data, deaths_data;

  if (isGlobal(country)) {
    let world_data = await covidApi.getWorldAllTimeCases();

    world_data.sort((a, b) => new Date(a.Date) - new Date(b.Date));

    world_data.forEach((e) => {
      let d = new Date(e.Date);
      labels.push(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`);
    });

    confirm_data = renderWorldData(world_data, CASE_STATUS.confirmed);
    recovered_data = renderWorldData(world_data, CASE_STATUS.recovered);
    deaths_data = renderWorldData(world_data, CASE_STATUS.deaths);
  } else {
    let confirmed = await covidApi.getCountryAllTimeCases(
      country,
      CASE_STATUS.confirmed
    );
    let recovered = await covidApi.getCountryAllTimeCases(
      country,
      CASE_STATUS.recovered
    );
    let deaths = await covidApi.getCountryAllTimeCases(
      country,
      CASE_STATUS.deaths
    );

    confirm_data = renderData(confirmed);
    recovered_data = renderData(recovered);
    deaths_data = renderData(deaths);

    confirmed.forEach((e) => {
      let d = new Date(e.Date);
      labels.push(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`);
    });
  }

  let series = [
    {
      name: "Confirmed",
      data: confirm_data,
    },
    {
      name: "Recovered",
      data: recovered_data,
    },
    {
      name: "Deaths",
      data: deaths_data,
    },
  ];
  all_time_chart.updateOptions({
    series: series,
    xaxis: {
      categories: labels,
    },
    title: {
      text: country.toUpperCase(),
      offsetX: 100,
    },
  });
};

initMap = async (country, lat, lng) => {
  // const location = await covidApi.
  const data = await covidApi.getSummary();
  // let country_data;
  // data.Countries.forEach((e) => {
  //   if (e.Country === country) {
  //     console.log(e.TotalConfirmed, country);
  //     country_data = e.TotalConfirmed;
  //   }
  // });
  const mapOptions = {
    zoom: country === "Global" || undefined ? 0 : 4,
    center: {
      lat: lat,
      lng: lng,
    },
  };

  const map = new google.maps.Map(document.getElementById("map"), mapOptions);

  const marker = new google.maps.Marker({
    position: { lat: lat, lng: lng },
    map: map,
    // icon: {
    //   path: google.maps.SymbolPath.CIRCLE,
    //   fillColor: "orange",
    //   fillOpacity: 0.2,
    //   strokeColor: "red",
    //   strokeWeight: 0.8,
    //   scale: Math.sqrt(country_data) / 10,
    // },
  });

  const infowindow = new google.maps.InfoWindow({
    content: "<p>Marker Location:" + marker.getPosition() + "</p>",
  });

  google.maps.event.addListener(marker, "click", () => {
    infowindow.open(map, marker);
  });
};
