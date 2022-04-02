import * as vscode from "vscode";
import { ExtensionContext, window, workspace } from "vscode";
import { TreeViewProvider } from "./providers/TreeViewProvider";
import { speakCurrentSelection, speakDocument, stopSpeaking, speakText } from "./utilities/speakUtilities";
import * as fs from "fs";
import { TextDecoder } from "util";

export function activate(context: ExtensionContext) {

  const filePath = "D:\\Projects\\codevision-vscode\\src\\treeContent\\treeviewcontent.txt";
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


function getFilePath(){
  
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
  vscode.workspace.openTextDocument(openPath).then( (doc) => {
    vscode.window.showTextDocument(doc);
    speakText(doc.getText());
  });

  // speakDocument(activeEditor);
}

