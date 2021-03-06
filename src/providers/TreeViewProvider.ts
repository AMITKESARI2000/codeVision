// importing important imports like vs-code

import {
  CancellationToken,
  Uri,
  Webview,
  WebviewView,
  WebviewViewProvider,
  WebviewViewResolveContext,
} from "vscode";
import {
  speakCurrentSelection,
  speakDocument,
  stopSpeaking,
  speakText,
} from "../utilities/speakUtilities";

import { getUri } from "../utilities/getUri";
import * as weather from "weather-js";
import { Tree, TreeNode, ReadFile } from "../Parsing/treeParsing.js";

// const treeNode = new TreeNode();
const readFile = new ReadFile();
let treeNeeded = readFile.read_file();
let treeNode = 0;

let currentNode = readFile.file_structure?.find("root");

// web-view for frontend

export class TreeViewProvider implements WebviewViewProvider {
  public static readonly viewType = "weather.weatherView";
  public parsedLevelFileText: string = "data";
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
    if (this._levelFileText.includes("\r\n") === true) {
      this.parsedLevelFileText = this._levelFileText.replaceAll("\r\n", "<br/>\\ ");
    } else {
      this.parsedLevelFileText = this._levelFileText.replaceAll("\n", "<br/>\\ ");
    }
    // console.log("parsedLevelFileText received", this.parsedLevelFileText);

    const mainUri = getUri(webview, extensionUri, ["webview-ui", "main.js"]);
    const stylesUri = getUri(webview, extensionUri, ["webview-ui", "styles.css"]);

    console.log("readFile structure: ", readFile.file_structure);
    // frontend of the extension
    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `
			<!DOCTYPE html>
			<html lang="en">
				<head>
					<meta charset="UTF-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<script type="module" src="${toolkitUri}"></script>
					<script type="module" src="${mainUri}"></script>
          
          <br/>
          <vscode-button appearance="primary" id="startParseBtn"> Start </vscode-button>
          <vscode-button appearance="primary" id="nextNodeBtn"> NextNode </vscode-button>
          <vscode-button appearance="primary" id="nextLevelBtn"> NextLevel </vscode-button>
          <vscode-button appearance="primary" id="prevNodeBtn"> prevNode </vscode-button>
          <vscode-button appearance="primary" id="prevLevelBtn"> prevLevel </vscode-button>
          <vscode-button appearance="primary" id="stopSpeakBtn"> Stop </vscode-button>
          <br/>

					<link rel="stylesheet" href="${stylesUri}">
					<title>Debugger-Tree View</title>

				</head>
				<body>
          <h1>Tree View</h1>
          <textarea hidden
          id="treeDataTransfer"
          value=${this.parsedLevelFileText}>
        </textarea>
          
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
      // console.log("MESSAGE TYPE", message);

      // conditions for speaking
      switch (command) {
        // if weather is checked, API will be called to check that
        case "weather": {
          const location = message.location;
          const unit = message.unit;
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
        // used to start parsing of the tree, restart of the function
        case "startParseTree": {
          const dataSend = message.dataSend;
          console.log("start the show and parse from TreeViewProvider", dataSend);
          treeNode = 0;
          currentNode = readFile.file_structure?.find("root");
          // spk_data = dataSend.map((e)=>{return "$$1"+e})
          speakText(dataSend);
          break;
        }
        // going to next node in the level
        case "speakerNextNode": {
          stopSpeaking();
          
          let text: any;
          treeNode++;
          if (
            currentNode.key === "root" ||
            currentNode.parent === undefined ||
            currentNode.parent.children.length <= treeNode
          ) {
            treeNode--;
            console.log("Last Node of the Level");
            text = "Last sibling ";
          } else {
            currentNode = currentNode.parent.children[treeNode];
          }
          console.log("At Node: ", currentNode);
          text = currentNode?.children.map((ch: { value: any }) => ch.value).join("<br/>- ");
          console.log("pass speaker from TreeViewProvider", text);
          
          webviewView.webview.postMessage({
            command: "speakerNextNode",
            payload: currentNode.value,
          });
          speakText(currentNode.value);
          break;
        }
        // going to next level in the tree node
        case "speakerNextLevel": {
          stopSpeaking();
          let text: any;
          let textToSpeech: any;
          // let type_of_folder = currentNode?.key.contains(".py") ? "Python file " : "Folder";
          text = currentNode?.children.map((ch: { value: any }) => ch.value).join("<br/>- ");
          text = "<br/>- " + text;

          textToSpeech = currentNode?.children.map((ch: { value: any }) => ch.value).join(" ");
          // textToSpeech = "This " + type_of_folder + " contains " + textToSpeech;
          
          treeNode = 0;
          if (currentNode.children.length <= treeNode) {
            text = "Leaf reached";
            textToSpeech = "end";
          } else {
            currentNode = currentNode.children[treeNode];
          }
          console.log("At Node: ", currentNode);
          console.log(text);

          webviewView.webview.postMessage({
            command: "speakerNextLevel",
            payload: text,
          });
          speakText(textToSpeech);
          break;
        }
        // going to previous node 
        case "speakerPrevNode": {
          stopSpeaking();
          
          let text: any;
          treeNode--;
          if (
            currentNode.key === "root" ||
            currentNode.parent === undefined ||
            treeNode < 0
          ) {
            treeNode++;
            console.log("Left-most Node");
            text = "Left-most node reached";
          } else {
            currentNode = currentNode.parent.children[treeNode];
          }
          console.log("At prev Node: ", currentNode);
          text = currentNode?.children.map((ch: { value: any }) => ch.value).join("<br/>- ");
          console.log("pass speaker from TreeViewProvider", text);
          
          webviewView.webview.postMessage({
            command: "speakerPrevNode",
            payload: currentNode.key,
          });
          speakText(currentNode.key);
          break;
        }
        // going to previous level
        case "speakerPrevLevel": {
          stopSpeaking();
          let text: any;
          let textToSpeech: any;
          
          treeNode = 0;
          if (currentNode.parent === undefined) {
            text = "Root reached";
            textToSpeech = "end";
          } else {
            currentNode = currentNode.parent;
          }

          text = currentNode?.children.map((ch: { value: any }) => ch.value).join("<br/>- ");
          textToSpeech = currentNode?.children.map((ch: { value: any }) => ch.value).join(" ");

          console.log("At Node: ", currentNode);
          console.log( text);

          webviewView.webview.postMessage({
            command: "speakerPrevLevel",
            payload: text,
          });
          speakText(textToSpeech);
          break;
        }
        // stop the speaker
        case "speakerStop": {
          const dataSend = message.dataSend;
          console.log("stop speaker from TreeViewProvider", dataSend);
          stopSpeaking();
          break;
        }
      }
    });
  }
}
