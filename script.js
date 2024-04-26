const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-btn");
const locationButton = document.querySelector(".location-btn");
const currentWeatherDiv = document.querySelector(".current-weather");
const weatherCardsDiv = document.querySelector(".weather-cards");

const API_KEY = "feb4cf05460c5c9140de085a02f9c5c1"; // API key for OpenWeatherMap API

const createWeatherCard = (cityName, weatherItem, index) => {
    if(index === 0) { // HTML for the main weather card
        return `<div class="details">
                    <h2>${cityName} (${weatherItem.dt_txt.split(" ")[0]})</h2>
                    <h6>Temperature: ${(weatherItem.main.temp - 273.15).toFixed(2)}°C</h6>
                    <h6>Wind: ${weatherItem.wind.speed} M/S</h6>
                    <h6>Humidity: ${weatherItem.main.humidity}%</h6>
                </div>
                <div class="icon">
                    <img src="./images/weather02-1024.webp" alt="weather-icon">
                    <h6>${weatherItem.weather[0].description}</h6>
                </div>`;
    } else { // HTML for the other five day forecast card
        return `<li class="card">
                    <h3>(${weatherItem.dt_txt.split(" ")[0]})</h3>
                    <img src="./images/weather02-1024.webp" alt="weather-icon">
                    <h6>Temp: ${(weatherItem.main.temp - 273.15).toFixed(2)}°C</h6>
                    <h6>Wind: ${weatherItem.wind.speed} M/S</h6>
                    <h6>Humidity: ${weatherItem.main.humidity}%</h6>
                </li>`;
    }
}

const getWeatherDetails = (cityName, latitude, longitude) => {
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`;

    fetch(WEATHER_API_URL).then(response => response.json()).then(data => {
        // Filter the forecasts to get only one forecast per day
        const uniqueForecastDays = [];
        const fiveDaysForecast = data.list.filter(forecast => {
            const forecastDate = new Date(forecast.dt_txt).getDate();
            if (!uniqueForecastDays.includes(forecastDate)) {
                return uniqueForecastDays.push(forecastDate);
            }
        });

        // Clearing previous weather data
        cityInput.value = "";
        currentWeatherDiv.innerHTML = "";
        weatherCardsDiv.innerHTML = "";

        // Creating weather cards and adding them to the DOM
        fiveDaysForecast.forEach((weatherItem, index) => {
            const html = createWeatherCard(cityName, weatherItem, index);
            if (index === 0) {
                currentWeatherDiv.insertAdjacentHTML("beforeend", html);
            } else {
                weatherCardsDiv.insertAdjacentHTML("beforeend", html);
            }
        });        
    }).catch(() => {
        alert("An error occurred while fetching the weather forecast!");
    });
}

const getCityCoordinates = () => {
    const cityName = cityInput.value.trim();
    if (cityName === "") return;
    const API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;
    
    // Get entered city coordinates (latitude, longitude, and name) from the API response
    fetch(API_URL).then(response => response.json()).then(data => {
        if (!data.length) return alert(`No coordinates found for ${cityName}`);
        const { lat, lon, name } = data[0];
        getWeatherDetails(name, lat, lon);
    }).catch(() => {
        alert("An error occurred while fetching the coordinates!");
    });
}

const getUserCoordinates = () => {
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords; // Get coordinates of user location
            // Get city name from coordinates using reverse geocoding API
            const API_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;
            fetch(API_URL).then(response => response.json()).then(data => {
                const { name } = data[0];
                getWeatherDetails(name, latitude, longitude);
            }).catch(() => {
                alert("An error occurred while fetching the city name!");
            });
        },
        error => { // Show alert if user denied the location permission
            if (error.code === error.PERMISSION_DENIED) {
                alert("Geolocation request denied. Please reset location permission to grant access again.");
            } else {
                alert("Geolocation request error. Please reset location permission.");
            }
        });
}

locationButton.addEventListener("click", getUserCoordinates);
searchButton.addEventListener("click", getCityCoordinates);
cityInput.addEventListener("keyup", e => e.key === "Enter" && getCityCoordinates());

// Array of predefined flood condition data
const predefinedFloodConditions = [
    {
        name: 'Low Risk',
        maxWindSpeed: 30, // Maximum allowable wind speed in km/h
        maxRainLevel: 30, // Maximum allowable rain level in mm
        maxTemperature: 25 // Maximum allowable temperature in Celsius
    },
    {
        name: 'Medium Risk',
        maxWindSpeed: 50, // Maximum allowable wind speed in km/h
        maxRainLevel: 50, // Maximum allowable rain level in mm
        maxTemperature: 30 // Maximum allowable temperature in Celsius
    },
    {
        name: 'High Risk',
        maxWindSpeed: 80, // Maximum allowable wind speed in km/h
        maxRainLevel: 60, // Maximum allowable rain level in mm
        maxTemperature: 35 // Maximum allowable temperature in Celsius
    }
];

// Function to fetch weather data from API based on user location
async function fetchWeatherData(location) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=feb4cf05460c5c9140de085a02f9c5c1&units=metric`);
        const data = await response.json();
        return {
            windSpeed: data.wind.speed,
            rainLevel: (data.rain && data.rain['1h']) ? data.rain['1h'] : 0, // Rainfall in the last 1 hour
            temperature: data.main.temp
        };
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return null;
    }
}

// Function to check for flood condition based on weather data
async function checkFloodCondition() {
    const location = document.getElementById('locationInput').value.trim();
    if (!location) {
        alert("Location not provided. Please enter your location to check for flood conditions.");
        return;
    }

    const weatherData = await fetchWeatherData(location);
    if (!weatherData) {
        alert("Failed to fetch weather data. Please try again later.");
        return;
    }

    let isFloodAlert = false;
    let alertMessage = '';

    // Check against each set of predefined flood conditions
    for (const condition of predefinedFloodConditions) {
        if (weatherData.windSpeed > condition.maxWindSpeed ||
            weatherData.rainLevel > condition.maxRainLevel ||
            weatherData.temperature > condition.maxTemperature) {
            isFloodAlert = true;
            alertMessage += `Flood alert for ${location} (${condition.name})! Please take necessary precautions.\n`;
        }
    }

    if (!isFloodAlert) {
        alert(`No flood alert for ${location}.`);
    } else {
        alert(alertMessage);
    }
}
