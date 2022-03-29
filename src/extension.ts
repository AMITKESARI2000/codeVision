import * as vscode from "vscode";
import * as say from "say";
import { ExtensionContext, window } from "vscode";
import { TreeViewProvider } from "./providers/TreeViewProvider";
import * as path from "path";
import * as fs from "fs";

export function activate(context: ExtensionContext) {
  // Instantiate a new instance of the TreeViewProvider class
  const provider = new TreeViewProvider(context.extensionUri);

  // Register the provider for a Webview View
  const treeViewDisposable = window.registerWebviewViewProvider(
    TreeViewProvider.viewType,
    provider
  );

  // open tree view structure file and read
  speakTreeDebugger();

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

/**
 * @desc opens and speaks the tree view content in file
 */
async function speakTreeDebugger() {
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    return;
  }

  // const content = 'exampleContent';
  // const filePath = path.join(vscode.workspace.rootPath, 'fileName.extension');
  // fs.writeFileSync(filePath, content, 'utf8');
  const filePath = "D:\\Projects\\codevision-vscode\\src\\treeContent\\treeviewcontent.txt";
  const openPath = vscode.Uri.file(filePath);
  vscode.workspace.openTextDocument(openPath).then((doc) => {
    vscode.window.showTextDocument(doc);
    speakText(doc.getText());
  });
  // speakDocument(activeEditor);
}


// Speech utility functions
const getVoice = (): string | undefined =>
  vscode.workspace.getConfiguration("speech").get<string>("voice");

const getSpeed = (): number | undefined =>
  vscode.workspace.getConfiguration("speech").get<number>("speed");

const getSubstitutions = (): { [key: string]: string } =>
  vscode.workspace.getConfiguration("speech").get<{ [key: string]: string }>("substitutions") || {};

const stopSpeaking = () => {
  say.stop();
};

const cleanText = (text: string): string => {
  text = text.trim();
  for (let [pattern, replacement] of Object.entries(getSubstitutions())) {
    text = text.replaceAll(pattern, replacement);
  }
  return text;
};

const speakText = (text: string) => {
  text = cleanText(text);
  if (text.length > 0) {
    say.speak(text, getVoice(), getSpeed());
  }
};

const speakCurrentSelection = (editor: vscode.TextEditor) => {
  const selection = editor.selection;
  if (!selection) return;

  speakText(editor.document.getText(selection));
};

const speakDocument = (editor: vscode.TextEditor) => {
  speakText(editor.document.getText());
};
