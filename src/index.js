import './index.html';
import './styles.css';
import * as THREE from "three";
import html2canvas from 'html2canvas';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {TrackballControls} from "three/addons";

const apiKey = 'a185ab65134b4049bb4204901240203';
const city = 'Saint Petersburg';
const urlWeek = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=7&hour=24&lang=ru`;

function fetchWeekWeather() {
    fetch(urlWeek)
        .then(response => response.json())
        .then(data => {
            // Обновление текущей погоды
            const currentWeatherDiv = document.getElementById('currentWeather');
            const currentWeatherType = data.current.condition.text;

            currentWeatherDiv.classList.add(`weather-gradient-${data.current.condition.code}`);
            currentWeatherDiv.innerHTML = `
                <p>Текущая погода: ${currentWeatherType}, ${data.current.temp_c}°C</p>
                <img src="${data.current.condition.icon}" alt="${data.current.condition.text}">
            `;
            console.log(data.current.condition)

            // Обновление прогноза на следующие 7 суток
            const dailyForecastList = document.getElementById('daily__list');
            dailyForecastList.innerHTML = '';
            data.forecast.forecastday.forEach(day => {
                const listItem = document.createElement('li');
                listItem.classList.add('daily__list-item');
                const imageUrl = day.day.condition.icon;
                const partOfPath = imageUrl.split('//')[1];
                const imagePath = partOfPath.slice(partOfPath.indexOf('/'));
                console.log(imagePath)
                const imageAlt = day.day.condition.text;
                listItem.innerHTML = `
                    <p class="daily__item-time">${day.date}: ${day.day.condition.text}</p>
                    <p class="daily__item-text">Max: ${day.day.maxtemp_c}°C<br>Min: ${day.day.mintemp_c}°C</p>
                    <img src=".${imageUrl}" alt="${imageAlt}" class="daily__item-image">
                `;
                dailyForecastList.appendChild(listItem);
            });
            makeCubeTextures();
        })
        .catch(error => console.error('Ошибка при загрузке данных о погоде:', error));
}

function fetchDayWeather() {
    const currentDate = new Date();
    const currentHour = currentDate.getHours();
    console.log(currentHour)

    const endOfDay = new Date(currentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const formattedEndDate = endOfDay.toISOString().split('T')[0];
    const urlDay = `https://api.weatherapi.com/v1/history.json?key=${apiKey}&q=${city}&dt=${formattedEndDate}&hour=${currentHour}&lang=ru`;

    fetch(urlDay)
        .then(response => response.json())
        .then(data => {
            console.log(data)
            let remainingHours = 24 - currentHour;
            const hourlyForecastList = document.getElementById('hourly__list');
            hourlyForecastList.innerHTML = '';

            let forecast = data.forecast.forecastday[0].hour;

            // Если оставшееся количество часов в текущем дне меньше 24,
            // делаем запрос за прогнозом на следующий день
            if (remainingHours < 25) {
                const nextDay = new Date(currentDate);
                nextDay.setDate(nextDay.getDate() + 1);
                const formattedNextDay = nextDay.toISOString().split('T')[0];
                const urlNextDay = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&dt=${formattedNextDay}&days=1&lang=ru`;

                fetch(urlNextDay)
                    .then(response => response.json())
                    .then(nextDayData => {
                        console.log(nextDayData)
                        forecast = forecast.concat(nextDayData.forecast.forecastday[0].hour);
                        remainingHours = 24;
                        displayHourlyForecast(forecast, hourlyForecastList, remainingHours);
                    })
                    .catch(error => console.error('Ошибка при загрузке данных о погоде на следующий день:', error));
            } else {
                displayHourlyForecast(forecast, hourlyForecastList, remainingHours);
            }
        })
        .catch(error => console.error('Ошибка при загрузке данных о погоде:', error));
}

function displayHourlyForecast(forecast, listOfElements, remainingHours) {
    console.log(remainingHours)
    const currentTime = new Date().getTime();
    console.log(currentTime)
    const oneHour = 3600 * 1000;

    for (let i = 0; i < remainingHours; i++) {
        const forecastTime = new Date(currentTime + (i * oneHour));
        console.log(forecastTime)

        const forecastDate = forecastTime.toLocaleDateString('ru-RU', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });

        let timeLabel = '';
        if (i === 0) {
            timeLabel = 'Сейчас';
        } else {
            timeLabel = `${forecastTime.getHours()}:00`;
        }

        const temperature = forecast[i].temp_c;
        const condition = forecast[i].condition.text;

        const listItem = document.createElement('li');
        listItem.classList.add('hourly__list-item');
        const weatherIconUrl = forecast[i].condition.icon;
        const weatherIconAlt = forecast[i].condition.text;
        listItem.innerHTML = `
            <p class="hourly__item-time">${timeLabel}</p>
            <p class="hourly__item-text">${forecastDate}</p>
            <img src="${weatherIconUrl}" alt="${weatherIconAlt}" class="hourly__item-image">
            <p class="hourly__item-text">Погода: ${condition}</p>
            <p class="hourly__item-text">Температура: ${temperature}°C</p>
        `;
        listOfElements.appendChild(listItem);
    }
}

function makeScreenshot() {
    const elements = document.querySelectorAll('.hourly__list-item');
    elements.forEach(element => {
        html2canvas(element).then(function (canvas) {
            canvas.toBlob(function (blob) {
                const url = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = 'screenshot.png';

                document.body.appendChild(link);
                link.click();

                window.URL.revokeObjectURL(url);
                document.body.removeChild(link);
            });
        });
    });
}

function makeCubeTextures() {
    const elements = document.querySelectorAll('.daily__list-item');
    const textures = [];
    let loadedTexturesCount = 0;

    elements.forEach((element, index) => {
        html2canvas(element).then(function (canvas) {
            const texture = new THREE.CanvasTexture(canvas);
            textures[index] = texture;
            loadedTexturesCount++;

            if (loadedTexturesCount === elements.length) {
                updateCube(textures);
            }
        });
    });
}


function updateCube(textures) {
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setClearColor(0x000000, 0.3);
    const container = document.querySelector('.canvas-container');
    const width = container.offsetWidth;
    const height = Math.min(container.offsetHeight, window.innerHeight);
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);


    const controls = new TrackballControls(camera, renderer.domElement);

    const materials = textures.map(texture => new THREE.MeshBasicMaterial({ map: texture }));

    const geometry = new THREE.BoxGeometry(2, 2, 2);

    const cube = new THREE.Mesh(geometry, materials);

    const currentDate = new Date();
    const todayIndex = currentDate.getDay() - 1;

    const angle = -Math.PI / 2 * (todayIndex + 1);

    cube.rotation.y = angle;

    scene.add(cube);

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
}



function fetchWeatherData() {
    fetchDayWeather();
    fetchWeekWeather();
}

window.onload = fetchWeatherData;

