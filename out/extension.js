"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
const say = require("say");
const vscode_1 = require("vscode");
const TreeViewProvider_1 = require("./providers/TreeViewProvider");
function activate(context) {
    // Instantiate a new instance of the TreeViewProvider class
    const provider = new TreeViewProvider_1.TreeViewProvider(context.extensionUri);
    // Register the provider for a Webview View
    const treeViewDisposable = vscode_1.window.registerWebviewViewProvider(TreeViewProvider_1.TreeViewProvider.viewType, provider);
    speakTreeDebugger();
    const speakDocumentDisposable = vscode.commands.registerTextEditorCommand("speech.speakDocument", (editor) => {
        stopSpeaking();
        if (!editor) {
            return;
        }
        speakDocument(editor);
    });
    const speakSelectionDisposable = vscode.commands.registerTextEditorCommand("speech.speakSelection", (editor) => {
        // console.log("edittttttor", window.activeTextEditor);
        // window.createWebviewPanel("showGallery","New View",vscode.ViewColumn.One,);
        stopSpeaking();
        if (!editor) {
            return;
        }
        speakCurrentSelection(editor);
    });
    const stopSpeakingDisposable = vscode.commands.registerCommand("speech.stopSpeaking", () => {
        stopSpeaking();
    });
    context.subscriptions.push(treeViewDisposable);
    context.subscriptions.push(speakDocumentDisposable);
    context.subscriptions.push(speakSelectionDisposable);
    context.subscriptions.push(stopSpeakingDisposable);
}
exports.activate = activate;
function speakTreeDebugger() {
    return __awaiter(this, void 0, void 0, function* () {
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
    });
}
const getVoice = () => vscode.workspace.getConfiguration("speech").get("voice");
const getSpeed = () => vscode.workspace.getConfiguration("speech").get("speed");
const getSubstitutions = () => vscode.workspace.getConfiguration("speech").get("substitutions") || {};
const stopSpeaking = () => {
    say.stop();
};
const cleanText = (text) => {
    text = text.trim();
    for (let [pattern, replacement] of Object.entries(getSubstitutions())) {
        text = text.replaceAll(pattern, replacement);
    }
    return text;
};
const speakText = (text) => {
    text = cleanText(text);
    if (text.length > 0) {
        say.speak(text, getVoice(), getSpeed());
    }
};
const speakCurrentSelection = (editor) => {
    const selection = editor.selection;
    if (!selection)
        return;
    speakText(editor.document.getText(selection));
};
const speakDocument = (editor) => {
    speakText(editor.document.getText());
};
//# sourceMappingURL=extension.js.map