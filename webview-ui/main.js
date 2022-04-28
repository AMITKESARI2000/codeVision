// Get access to the VS Code API from within the webview context
const vscode = acquireVsCodeApi();

// Just like a regular webpage we need to wait for the webview
// DOM to load before we can reference any of the HTML elements
// or toolkit components
window.addEventListener("load", main);

// TODO: get tree here
let arr = [
  ["amit", "anand", "aditya", "sowmya"],
  ["abhi", "ani", "teju"],
];
let levelIndex = 0;
let nodeIndex = 0;

// Main function that gets executed once the webview DOM loads
function main() {

  
  window.addEventListener(
    "keydown",
    function (e) {
      if (e.keyCode === 49) {
        checkWeather();
      }
      if (e.keyCode === 50) {
        startParseFunc();
      }
      if (e.keyCode === 51) {
        nextNodeFunc();
      }
      if (e.keyCode === 52) {
        nextLevelFunc();
      }
      if (e.keyCode === 53) {
        prevLevelFunc();
      }
      if (e.keyCode === 54) {
        prevNodeFunc();
      }
      if (e.keyCode === 55) {
        stopSpeakBtn();
      }
    },
    false
  );

  const checkWeatherButton = document.getElementById("check-weather-button");
  checkWeatherButton.addEventListener("click", checkWeather);

  const startParseButton = document.getElementById("startParseBtn");
  startParseButton.addEventListener("click", startParseFunc);

  const nextNodeButton = document.getElementById("nextNodeBtn");
  nextNodeButton.addEventListener("click", nextNodeFunc);

  const nextLevelButton = document.getElementById("nextLevelBtn");
  nextLevelButton.addEventListener("click", nextLevelFunc);

  const prevLevelButton = document.getElementById("prevLevelBtn");
  prevLevelButton.addEventListener("click", prevLevelFunc);

  const prevNodeButton = document.getElementById("prevNodeBtn");
  prevNodeButton.addEventListener("click", prevNodeFunc);

  const stopSpeakButton = document.getElementById("stopSpeakBtn");
  stopSpeakButton.addEventListener("click", stopSpeakFunc);

  setVSCodeMessageListener();
}

function startParseFunc() {
  const treeDataTransfer = document.getElementById("treeDataTransfer").value;
  let parsedLevelFileText = treeDataTransfer.replaceAll("<br/>\\ ", "\r\n");
  console.log("treeDataTransfer string-----", parsedLevelFileText);

  // Passes a message back to the extension context with the data
  vscode.postMessage({
    command: "startParseTree",
    dataSend: "Start Parsing",
  });
  // dataSend contains the value that has to be passed and spoken by extension.ts
  console.log("Button 0 is Clicked Exit#");
  document.getElementById("output").innerHTML = "Navigate using NextNode and NextLevel";
}

function nextNodeFunc() {
  // First this runs and then data sent to _setWebviewMessageListener in TreeViewProvider

  // Passes a message back to the extension context with the data
  vscode.postMessage({
    command: "speakerNextNode",
  });
  nodeIndex++;
  console.log("Button 1 is Clicked Exit");
  //   document.getElementById("output").innerHTML = "LAST NODE OF LEVEL REACHED";
}

function nextLevelFunc() {
  levelIndex++;
  nodeIndex = 0;
  // Passes a message back to the extension context with the data
  vscode.postMessage({
    command: "speakerNextLevel",
    // dataSend: localParseText,
  });
  console.log("Button 2 is Clicked Exit>");
  //   document.getElementById("output").innerHTML = "LAST LEVEL REACHED";
}

function prevNodeFunc() {
  nodeIndex--;
  // Passes a message back to the extension context with the data
  vscode.postMessage({
    command: "speakerPrevNode",
    // dataSend: localParseText,
  });
  console.log("Button 3 is Clicked Exit>");
  //   document.getElementById("output").innerHTML = "LAST LEVEL REACHED";
}

function prevLevelFunc() {
  levelIndex--;
  nodeIndex = 0;
  // Passes a message back to the extension context with the data
  vscode.postMessage({
    command: "speakerPrevLevel",
    // dataSend: localParseText,
  });
  console.log("Button 4 is Clicked Exit>");
  //   document.getElementById("output").innerHTML = "LAST LEVEL REACHED";
}

function stopSpeakFunc() {
  // First this runs and then data sent to _setWebviewMessageListener in TreeViewProvider

  // Passes a message back to the extension context with the location that
  vscode.postMessage({
    command: "speakerStop",
    dataSend: arr[levelIndex][nodeIndex],
  });
  console.log("Button 5 is Clicked Exit<");
}

function checkWeather() {
  const locationValue = document.getElementById("location").value;
  const unitValue = document.getElementById("unit").value;

  // Passes a message back to the extension context with the location that
  // should be searched for and the degree unit (F or C) that should be returned
  vscode.postMessage({
    command: "weather",
    location: locationValue,
    unit: unitValue,
  });
}

// Sets up an event listener to listen for messages passed from the extension context
// and executes code based on the message that is recieved
function setVSCodeMessageListener() {
  window.addEventListener("message", (event) => {
    const command = event.data.command;

    switch (command) {
      case "weather": {
        const weatherData = JSON.parse(event.data.payload);
        displayWeatherData(weatherData);
        break;
      }
      case "startParseTree": {
        console.log("logging startParseTree from main.js setVScodemessagelistner");
        break;
      }
      case "speakerNextNode": {
        const text = event.data.payload;
        console.log("logging speakerNextNode from main.js setVScodemessagelistner");
        document.getElementById("output").innerHTML = text;

        break;
      }
      case "speakerNextLevel": {
        const text = event.data.payload;
        console.log("logging speakerNextLevel from main.js setVScodemessagelistner");
        document.getElementById("output").innerHTML = text;
        break;
      }
      case "speakerPrevNode": {
        const text = event.data.payload;
        console.log("logging speakerPrevNode from main.js setVScodemessagelistner");
        document.getElementById("output").innerHTML = text;
        break;
      }
      case "speakerPrevLevel": {
        const text = event.data.payload;
        console.log("logging speakerPrevLevel from main.js setVScodemessagelistner");
        document.getElementById("output").innerHTML = text;
        break;
      }
      case "speakerStop": {
        console.log("logging speakerStop from main.js setVScodemessagelistner");
        break;
      }
    }
  });
}

function displayWeatherData(weatherData) {
  const icon = document.getElementById("icon");
  const summary = document.getElementById("summary");
  summary.textContent = getWeatherSummary(weatherData);
  icon.textContent = getWeatherIcon(weatherData);
}

function getWeatherSummary(weatherData) {
  const skyText = weatherData.current.skytext;
  const temperature = weatherData.current.temperature;
  const degreeType = weatherData.location.degreetype;

  return `${skyText}, ${temperature}${degreeType}`;
}

function getWeatherIcon(weatherData) {
  const skyText = weatherData.current.skytext.toLowerCase();
  let icon = "";

  switch (skyText) {
    case "sunny":
      icon = "☀️";
      break;
    case "mostly sunny":
      icon = "🌤";
      break;
    case "partly sunny":
      icon = "🌥";
      break;
    case "clear":
      icon = "☀️";
      break;
    case "fair":
      icon = "🌥";
      break;
    case "mostly cloudy":
      icon = "☁️";
      break;
    case "cloudy":
      icon = "☁️";
      break;
    case "rain showers":
      icon = "🌦";
      break;
    default:
      icon = "✨";
  }

  return icon;
}
