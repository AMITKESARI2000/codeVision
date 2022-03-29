"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeViewProvider = void 0;
const getUri_1 = require("../utilities/getUri");
const weather = require("weather-js");
class TreeViewProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView, context, _token) {
        // Allow scripts in the webview
        webviewView.webview.options = {
            enableScripts: true,
        };
        // Set the HTML content that will fill the webview view
        webviewView.webview.html = this._getWebviewContent(webviewView.webview, this._extensionUri);
        // Sets up an event listener to listen for messages passed from the webview view context
        // and executes code based on the message that is recieved
        this._setWebviewMessageListener(webviewView);
    }
    _getWebviewContent(webview, extensionUri) {
        const toolkitUri = (0, getUri_1.getUri)(webview, extensionUri, [
            "node_modules",
            "@vscode",
            "webview-ui-toolkit",
            "dist",
            "toolkit.js",
        ]);
        const mainUri = (0, getUri_1.getUri)(webview, extensionUri, ["webview-ui", "main.js"]);
        const stylesUri = (0, getUri_1.getUri)(webview, extensionUri, ["webview-ui", "styles.css"]);
        // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
        return /*html*/ `
			<!DOCTYPE html>
			<html lang="en">
				<head>
					<meta charset="UTF-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<script type="module" src="${toolkitUri}"></script>
					<script type="module" src="${mainUri}"></script>
					<link rel="stylesheet" href="${stylesUri}">
					<title>Weather Checker</title>
				</head>
				<body>
          <h1>Weather Checker</h1>
          <code>update or not</code>

          <section id="search-container">
            <vscode-text-field
              id="location"
              placeholder="Location"
              value="Seattle, WA">
            </vscode-text-field>
            <vscode-dropdown id="unit">
              <vscode-option value="F">Fahrenheit</vscode-option>
              <vscode-option value="C">Celsius</vscode-option>
            </vscode-dropdown>
          </section>
          <vscode-button id="check-weather-button">Check</vscode-button>
          <h2>Current Weather</h2>
          <section id="results-container">
            <p id="icon"></p>
            <p id="summary"></p>
          </section>
				</body>
			</html>
		`;
    }
    _setWebviewMessageListener(webviewView) {
        webviewView.webview.onDidReceiveMessage((message) => {
            const command = message.command;
            const location = message.location;
            const unit = message.unit;
            switch (command) {
                case "weather":
                    weather.find({ search: location, degreeType: unit }, (err, result) => {
                        if (err) {
                            return;
                        }
                        // Get the weather forecast results
                        const weatherForecast = result[0];
                        // Pass the weather forecast object to the webview
                        webviewView.webview.postMessage({
                            command: "weather",
                            payload: JSON.stringify(weatherForecast),
                        });
                    });
                    break;
            }
        });
    }
}
exports.TreeViewProvider = TreeViewProvider;
TreeViewProvider.viewType = "weather.weatherView";
//# sourceMappingURL=WeatherViewProvider.js.map