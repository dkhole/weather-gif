import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

const lookup = require('country-code-lookup');
const apiKey = '6flguaZ4XstDNrv8tZpNurgUyFWCh3x6';
const weird = 0;

function Hourly(props) {
    const hourly = props.hour;
  
    return hourly.map((hour, index) => {
      if(hour) {
        const newHour = new Date(hour.dt * 1000);
        const temp = hour.temp.toString().slice(0,2);
        const hourImg = hour.weather[0].icon;
        const stringHour = newHour.toString().slice(16, 21);
        return (
          <div className="hourly-wrap" key={hour.dt}>
            <div key={index + 100} className="hourly">{stringHour}</div>
            <img key={index + 200} className="hourly-icon" alt="weather icon" src={`http://openweathermap.org/img/wn/${hourImg}@2x.png`}></img>
            <div key={index} className="hourly-temp">{temp}&#8451;</div>
          </div>
        );
      }
      return null;
    });
}

function Week(props) {
  const weekly = props.week;

  return weekly.map((day, index) => {
    if(day) {
      const newDay = new Date(day.dt * 1000);
      const temp = day.temp.day.toString().slice(0, 2);
      const dayImg = day.weather[0].icon;
      const stringDay = newDay.toString().slice(0, 3);
      return (
        <div className="weekly-wrap" key={day.dt}>
          <div key={index + 100} className="weekly">{stringDay}</div>
          <img key={index + 200} className="weekly-icon" alt="daily icon" src={`http://openweathermap.org/img/wn/${dayImg}@2x.png`}></img>
          <div key={index} className="weekly-temp">{temp}&#8451;</div>
        </div>
      );
    }
    return null;
  });
}

function WeatherInfo(props) {

  return (
    <div className="wrapper" style={{zIndex:props.zIndex, backgroundColor:props.bgCol}}>
      <div id="city-title">{props.city}</div>
      <div className="temp">{props.temp}&#8451;</div>
      <div className="main-icon"><img id="current-icon" alt="icon" src={props.currentIcon}></img></div>
      <div className="min">min {props.min}&#8451;</div>
      <div className="max">max {props.max}&#8451;</div>
      <div className="feels-like">feels like {props.feelsLike}&#8451;</div>
      <div className="description">{props.description}</div>
      <hr></hr>
      <div className="hourly-title">Hourly</div>
      <div className="hourly-wrapper"><Hourly hour={props.hourly}/></div>
      <div className="weekly-title">Week</div>
      <div className="weekly-wrapper"><Week week={props.weekly}/></div>
    </div>
  );
}

function Delete(props) {
  return <span onClick={props.onClick}>X</span>
}

function Cities(props) {
  const cityList = props.cityList;

  return cityList.map((city, index) => {
    return <div className="cities" onClick={(e) => props.onClick(e)} key={index}>{city}<Delete onClick={() => props.handleDel(city)}/></div>
  });
}

class Weather extends React.Component {

  constructor(props) {
    super();
    this.state = {
      country: 'country',
      city: '', 
      temp: 0, 
      min: 0,
      max: 0, 
      feelsLike: 0,
      hourly: Array(7).fill(null),
      weekly: Array(8).fill(null),
      currentIcon: '',
      cityList: [],
      zIndex: -1,
      gif: '',
      bgCol: 'var(--weather-bg-color)',
      description: '',
    };
  }

  processAPI(weather, weatherCollection, gif, city, countryInp, description) {
    const min = weather.main.temp_min;
    const minString = parseInt(min);
    const max = weather.main.temp_max;
    const maxString = parseInt(max);
    const feelsLike = parseInt(weather.main.feels_like);
    const hourly = weatherCollection.hourly.slice(0, 7);
    const weekly = weatherCollection.daily.slice(1);
    const currentIcon = `http://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`;

    const cityName = city.charAt(0).toUpperCase() + city.slice(1);
    let cities = this.state.cityList.slice();
    const citiesString = cityName + ', ' + countryInp;

    if(!cities.includes(citiesString)) {
      cities = cities.concat([citiesString]);
      localStorage.setItem("cityList", JSON.stringify(cities));
    } 
    this.setState({
      country: countryInp,
      city: city, 
      temp: weather.main.temp, 
      min: minString,
      max: maxString, 
      feelsLike: feelsLike,
      hourly: hourly,
      weekly: weekly,
      currentIcon: currentIcon,
      cityList: cities,
      zIndex: 0,
      gif: gif.data.images.original.url,
      bgCol: 'var(--weather-bg-color)',
      description: description,
    });
  }

  async weatherCity(city) {
    try {
      const response = await fetch(`http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=6b6a481228e382e26d9b7d7b23154bf7`, { mode: 'cors' })
      const weather = await response.json();
      
      const lat = weather.coord.lat;
      const lon = weather.coord.lon;
      const country = weather.sys.country;
      const description = weather.weather[0].description;

      const collection = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&units=metric&exclude=current,minutely&appid=6b6a481228e382e26d9b7d7b23154bf7`, { mode: 'cors' })
      const weatherCollection = await collection.json();
      const responseGiph = await fetch(`https://api.giphy.com/v1/gifs/translate?api_key=${apiKey}&s=${description}&weirdness=${weird}`, { mode: 'cors'})
      const gif = await responseGiph.json();
  
      this.processAPI(weather, weatherCollection, gif, city, country, description);
    } catch {
      alert("cant find locationheere");
    }

  }

  async weatherCityCountry(city, country) {

    try {
      let countryInp = '';

      if(country.length > 2) {
        const countryName = country.charAt(0).toUpperCase() + country.slice(1);
        const countryObj = lookup.byCountry(countryName);
        if(!countryObj) {
          prompt("cant find country");
          return;
        }
        countryInp = countryObj.iso2;
      } else {
        //added this to allow us to lookup by iso
        const countryObj = lookup.byIso(country.toUpperCase());
        if(!countryObj) {
          prompt("cant find country");
          return;
        }
        countryInp = countryObj.iso2;
      }

      const response = await fetch(`http://api.openweathermap.org/data/2.5/weather?q=${city},${countryInp}&units=metric&appid=6b6a481228e382e26d9b7d7b23154bf7`, { mode: 'cors' })
      const weather = await response.json();

      const lat = weather.coord.lat;
      const lon = weather.coord.lon;

      const description = weather.weather[0].description;

      const collection = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&units=metric&exclude=current,minutely&appid=6b6a481228e382e26d9b7d7b23154bf7`, { mode: 'cors' })
      const weatherCollection = await collection.json();
      //call giphy api
      const responseGiph = await fetch(`https://api.giphy.com/v1/gifs/translate?api_key=${apiKey}&s=${description}&weirdness=${weird}`, { mode: 'cors'})
      const gif = await responseGiph.json();

      this.processAPI(weather, weatherCollection, gif, city, countryInp, description);
      
    } catch(err) {
      alert("cant find location");
    }
    
  }

  getWeather(city, country) {
      //const logo;
      if(!city && !country) {
        const city = this.state.cityList[0];
        if(city) {
          const cityString = city.slice(0, city.length - 4).toLowerCase();
          const country = city.slice(city.length - 2, city.length).toLowerCase();
          this.weatherCityCountry(cityString, country);
        }
      }
      else if(!country) {
        this.weatherCity(city);
      } else {
        this.weatherCityCountry(city, country);
    }
  }
  
  search(e) {
    const cityInput = document.getElementById("city-input");
    const countryInput = document.getElementById("country-input");
    
    this.setState({
      zIndex: -1,
      bgCol: 'rgb(0,51,78)',
    });

    if((!cityInput.value && !countryInput.value) || !cityInput.value) {
      return alert("At least a city is required");
    } else {
      this.getWeather(cityInput.value, countryInput.value);
      cityInput.value = '';
      countryInput.value = '';
    }
  }

  pickCity(e) {
    //convert city to country code and city name
    //use them to make another API call
    e.stopPropagation();
    //start loading
    this.setState({
      zIndex: -5,
      bgCol: 'rgb(0,51,78)',
    });

    const city = e.target.textContent;
    const length = city.length;
    const country = city.slice(length-3, length-1).toLowerCase();
    const cityString = city.slice(0, length-5).toLowerCase();

    this.getWeather(cityString,country);
  }

  delCity(city) {
    const cities = this.state.cityList.slice();
    console.log(city);
    const index = cities.indexOf(city);
    //found so remove and rerender
    if(index > -1) {
      cities.splice(index, 1);

      localStorage.setItem("cityList", JSON.stringify(cities));
      prompt(cities);
      this.setState({
        cityList: cities,
      });
    }
  }

  //set state calls render so if you call set state in render it will create infinite loop
  //to avoid this run inside component did mount. This function will only be called after render finished the first time
  componentDidMount() {

    if(localStorage.getItem('cityList')) {
      const cities = JSON.parse(localStorage.getItem('cityList'));

      if(cities[0]) {
        const city = cities[0];
        const cityString = city.slice(0, city.length - 4).toLowerCase();
        const country = city.slice(city.length - 2, city.length).toLowerCase();
  
        this.getWeather(cityString,country);
  
        this.setState({
          cityList: cities,
        });
      }

    } else {
      this.getWeather('eastwood','australia');
    }
  }

  render() {

    //if(this.state)

    const style = {
      backgroundImage: `url(${this.state.gif})`,
    }

    return (
      <div id="app">
        <div id="cities-wrapper">
          History
          <Cities cityList={this.state.cityList} onClick={(e) => {this.pickCity(e)}} handleDel={(city) => this.delCity(city)}/>
        </div>
        <div id="input-wrapper">
          <input type="text" id="country-input" placeholder="Country"></input><input type="text" id="city-input" placeholder="City"></input><input type="button" id="submit" value="submit" onClick={(e) => this.search(e)}></input>
        </div>
        <div id="overlay">
        <div id="background-overlay" style={style} ></div>
          <WeatherInfo 
            country={this.state.country}
            city={this.state.city}
            temp={this.state.temp}
            currentIcon={this.state.currentIcon}
            min={this.state.min}
            max={this.state.max}
            feelsLike={this.state.feelsLike}
            hourly={this.state.hourly}
            weekly={this.state.weekly}
            zIndex={this.state.zIndex}
            bgCol={this.state.bgCol}
            description={this.state.description}
          />
        </div>
      </div> 
      
    );
  }
}

// ========================================

ReactDOM.render(
  <Weather />,
  document.getElementById('root')
);