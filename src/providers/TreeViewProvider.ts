import {
  CancellationToken,
  Uri,
  Webview,
  WebviewView,
  WebviewViewProvider,
  WebviewViewResolveContext,
} from "vscode";
import { getUri } from "../utilities/getUri";
import * as weather from "weather-js";
// import { file_structure  } from "../Parsing/treeParsing.js";

export class TreeViewProvider implements WebviewViewProvider {
  public static readonly viewType = "weather.weatherView";

  constructor(private readonly _extensionUri: Uri, private readonly _levelFileText: String) {}

  public resolveWebviewView(
    webviewView: WebviewView,
    context: WebviewViewResolveContext,
    _token: CancellationToken
  ) {
    // Allow scripts in the webview
    webviewView.webview.options = {
      enableScripts: true,
    };

    // Set the HTML content that will fill the webview view
    webviewView.webview.html = this._getWebviewContent(webviewView.webview, this._extensionUri);

    // Sets up an event listener to listen for messages passed from the webview view context
    // and executes code based on the message that is received
    this._setWebviewMessageListener(webviewView);
  }

  private _getWebviewContent(webview: Webview, extensionUri: Uri) {
    const toolkitUri = getUri(webview, extensionUri, [
      "node_modules",
      "@vscode",
      "webview-ui-toolkit",
      "dist",
      "toolkit.js",
    ]);

    // Removes \r\n characters and replaces with <br> for code
    let parsedLevelFileText;
    if(this._levelFileText.includes("\r\n") === true)
      {parsedLevelFileText = this._levelFileText.replaceAll("\r\n","<br/>\\ ");}
    else
      {parsedLevelFileText = this._levelFileText.replaceAll("\n","<br/>\\ ");}
    console.log("parsedLevelFileText received", parsedLevelFileText);

    const mainUri = getUri(webview, extensionUri, ["webview-ui", "main.js"]);
    const stylesUri = getUri(webview, extensionUri, ["webview-ui", "styles.css"]);

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `
			<!DOCTYPE html>
			<html lang="en">
				<head>
					<meta charset="UTF-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<script type="module" src="${toolkitUri}"></script>
					<script type="module" src="${mainUri}"></script>


          <button name="inputfile" id="inputfile"> NextLevel </button>
          <br>
          <script type="text/javascript">

            const nextLevelButton = document.getElementById('inputfile');
            nextLevelButton.addEventListener('click', (e)=> {
              console.log("Button 1 is Clicked");
              document.getElementById('output').innerHTML="${parsedLevelFileText}";
              
            })
          </script>


					<link rel="stylesheet" href="${stylesUri}">
					<title>Debugger-Tree View</title>

				</head>
				<body>
          <h1>Tree View</h1>
          // Indented tree view.
          
<code>
<pre id="output">

<code>
<pre>
  - Initial Text
  - Level 1
      - Level 2
      - Level 2
  - Level 1
      - Level 2
          - Level 3
      - Level 2
      - Level 2
      - Level 2
  

  </pre>
</code>
</pre></code>

          <h3> Weather Cookie </h3>
          <section id="search-container">
            <vscode-text-field
              id="location"
              placeholder="Location"
              value="Seattle, WA">
            </vscode-text-field>
            <vscode-dropdown id="unit">
              <vscode-option value="C">Celsius</vscode-option>
              <vscode-option value="F">Fahrenheit</vscode-option>
            </vscode-dropdown>
          </section>
          <vscode-button id="check-weather-button">Check</vscode-button>
          <h4>Current Weather</h4>
          <section id="results-container">
            <p id="icon"></p>
            <p id="summary"></p>
          </section>
				</body>
			</html>
		`;
  }

  private _setWebviewMessageListener(webviewView: WebviewView) {
    webviewView.webview.onDidReceiveMessage((message) => {
      const command = message.command;
      const location = message.location;
      const unit = message.unit;

      switch (command) {
        case "weather":
          weather.find({ search: location, degreeType: unit }, (err: any, result: any) => {
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
