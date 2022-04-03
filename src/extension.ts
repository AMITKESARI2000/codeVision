import * as vscode from "vscode";
import { ExtensionContext, window, workspace } from "vscode";
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

export function activate(context: ExtensionContext) {
  let baseDirProject = getProjectFilePath();
  executeCMDCommands(baseDirProject);

  // TODO: treecontent.txt should be added in the project folder in which you are running extension. Add try catch
  const filePath = baseDirProject + "\\treecontent.txt";
  let levelFileText: string = getFileText(filePath);
  // console.log("levelFileText", levelFileText);

  // open tree view structure file and read
  speakTreeDebugger(filePath);
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
      // console.log("edittttttor", window.activeTextEditor);
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
}

function getProjectFilePath() {
  // const content = 'exampleContent';
  // const filePath = path.join(vscode.workspace.rootPath, 'fileName.extension');
  // fs.writeFileSync(filePath, content, 'utf8');
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

  console.log("=>>>>>>>>>>>>>>>>>>>>>>>>", path);
  return path;
}

function getFileText(filePath: number | fs.PathLike) {
  let levelFileText = "initial amit is bad";

  let uint8array = fs.readFileSync(filePath);
  levelFileText = new TextDecoder().decode(uint8array);

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
  // TODO: run and generate tree from terminal automatically
  command = "bash";
  console.log("run 1 ", command);
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
  command = "cd " + baseDirProject;

  // command = "tree"+ ">> " + baseDirProject + "\\treecontent.txt";
  console.log("run 2 ", command);

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
