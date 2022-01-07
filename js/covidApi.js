const covidApi = {
  getSummary: async () => {
    return await fetchRequest(covidApiEndPoints.summary());
  },
  getWorldAllTimeCases: async () => {
    return await fetchRequest(covidApiEndPoints.worldAllTimeCases());
  },
  getCountryAllTimeCases: async (country, status) => {
    return await fetchRequest(
      covidApiEndPoints.countryAllTimeCases(country, status)
    );
  },
};

const covid_api_base = "https://api.covid19api.com/";

const covidApiEndPoints = {
  summary: () => {
    return getApiPath("summary");
  },
  worldAllTimeCases: () => {
    return getApiPath("world");
  },
  countryAllTimeCases: (country, status) => {
    return getApiPath(`country/${country}/status/${status}`);
  },
};

const getApiPath = (end_point) => {
  return covid_api_base + end_point;
};
