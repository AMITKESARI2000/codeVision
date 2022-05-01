import * as vscode from "vscode";
import { ExtensionContext, window, workspace, TextEditor, Diagnostic, Position } from "vscode";
import { TreeViewProvider } from "./providers/TreeViewProvider";
import {
  speakCurrentSelection,
  speakDocument,
  stopSpeaking,
  speakText,
} from "./utilities/speakUtilities";
import * as fs from "fs";
import { TextDecoder } from "util";
import { exec } from "child_process";

const voices: string[] = [];
let diagnostics;

export function activate(context: ExtensionContext) {
  // get base directory path of the extension host project folder

  let baseDirProject = getProjectFilePath();
  setTimeout(() => {

    // get uri of current open file in editor
    const uri: any = vscode.window.activeTextEditor?.document.uri;
    diagnostics = vscode.languages.getDiagnostics(uri); // returns an array containing all errors and warnings
    const diagnosticFilePath = `${baseDirProject}\\diagnostics.txt`;

    console.log("Diagnostics ", diagnostics, "AtPath ", diagnosticFilePath);
    let allErrors: string = "";
    // parse errors into required string format
    for (let index = 0; index < diagnostics.length; index++) {
      const element = diagnostics[index];
      let range = element["range"]["start"];

      // Severity = 0, for error. Severity = 2, for warning.
      if (element["severity"] === 0){
        allErrors += `${uri.fsPath}; ${element["message"]} on ${range["line"]},${range["character"]} \n`;
      }
    }

    // write the errors to file for parsing into tree
    try {
      fs.writeFileSync(diagnosticFilePath, allErrors, {});
    } catch (err: any) {
      console.log(`Error writing ${diagnosticFilePath}:  ${err.message}`);
    }

    // generate the tree file in the dir
    executeCMDCommands(baseDirProject);

    const filePath = baseDirProject + "\\treecontent.txt";
    let levelFileText: string = getFileText(filePath);
    // console.log("levelFileText", levelFileText);

    // open tree view structure file and read
    // speakTreeDebugger(filePath);

    // Instantiate a new instance of the TreeViewProvider class
    const provider = new TreeViewProvider(context.extensionUri, levelFileText);

    // Register the provider for a Webview View
    const treeViewDisposable = window.registerWebviewViewProvider(
      TreeViewProvider.viewType,
      provider
    );

    // speak document registration
    const speakDocumentDisposable = vscode.commands.registerTextEditorCommand(
      "speech.speakDocument",
      (editor) => {
        stopSpeaking();
        if (!editor) {
          return;
        }
        speakDocument(editor);
      }
    );

    // speak selection registration
    const speakSelectionDisposable = vscode.commands.registerTextEditorCommand(
      "speech.speakSelection",
      (editor) => {
        // window.createWebviewPanel("showGallery","New View",vscode.ViewColumn.One,);

        stopSpeaking();
        if (!editor) {
          return;
        }
        speakCurrentSelection(editor);
      }
    );

    // stop speaking registration
    const stopSpeakingDisposable = vscode.commands.registerCommand("speech.stopSpeaking", () => {
      stopSpeaking();
    });

    // push all to subscriptions, to end life cycle
    context.subscriptions.push(treeViewDisposable);
    context.subscriptions.push(speakDocumentDisposable);
    context.subscriptions.push(speakSelectionDisposable);
    context.subscriptions.push(stopSpeakingDisposable);
  }, 20000);
}

/**
 * @desc gets the file path of the project directory in which Extension will open
 * @returns
 */
function getProjectFilePath() {
  let path: string = "path.txt";

  if (!workspace.workspaceFolders) {
    window.showErrorMessage("Open a project folder.");
  } else {
    if (workspace.workspaceFolders.length === 1) {
      // root = workspace.workspaceFolders[0];
    } else {
      // root = workspace.getWorkspaceFolder(resource);
    }
    path = workspace.workspaceFolders[0].uri.fsPath;
  }

  console.log("Extension Project path =>>>", path);
  return path;
}

/**
 * @desc opens filePath and returns the complete text of that file
 * @param filePath
 * @returns
 */
function getFileText(filePath: number | fs.PathLike) {
  let levelFileText = "bad init text";

  try {
    let uint8array = fs.readFileSync(filePath);
    levelFileText = new TextDecoder().decode(uint8array);
  } catch (err) {
    console.log(
      "File not found. treecontent.txt should be added in the project folder in which you are running extension."
    );
  }
  return levelFileText;
}

/**
 * @desc opens and speaks the tree view content in file
 */
async function speakTreeDebugger(filePath: string) {
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    return;
  }

  const openPath = vscode.Uri.file(filePath);
  vscode.workspace.openTextDocument(openPath).then((doc) => {
    vscode.window.showTextDocument(doc);
    speakText(doc.getText());
  });

  // speakDocument(activeEditor);
}

function executeCMDCommands(baseDirProject: string) {
  let command: string;

  command = "Add-Type -AssemblyName System.speech;";
  var spawn = require("child_process").spawn,
    child;
  child = spawn("powershell.exe", [
    "Add-Type -AssemblyName System.speech;",
    "$speak = New-Object System.Speech.Synthesis.SpeechSynthesizer;",
    "$speak.GetInstalledVoices()| foreach  { $_.VoiceInfo.Name } ;",
  ]);

  child.stdout.on("data", function (data: any) {
    console.log("Powershell Data: " + data);
    voices.push(data.split("\n"));
    console.log("Voices are : " + voices);
  });

  child.stderr.on("data", function (data: any) {
    console.log("Powershell Errors: " + data);
  });
  child.on("exit", function () {
    console.log("Powershell Script finished");
  });
  child.stdin.end();

  // run and generate tree from terminal automatically
  command = "tree /f " + baseDirProject + " > " + baseDirProject + "\\treecontent.txt";
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });

  // print current working directory
  exec("cd", (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
}
