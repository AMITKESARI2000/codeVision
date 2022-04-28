import * as vscode from "vscode";
import * as say from "say";

  let i = 0;
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
    var splitted = text.split("$$"); 
    console.log("spllited is : ",splitted)
    for(var j = 0;j<splitted.length;j++) { 
      console.log("text is ",splitted[j][0]);
      if(splitted[j][0]=='1')
      say.speak(text, "Microsoft Zira Desktop", getSpeed());
      else
      say.speak(text, "Microsoft David Desktop", getSpeed());

      i++;
    }
  }
};

const speakCurrentSelection = (editor: vscode.TextEditor) => {
  const selection = editor.selection;
  if (!selection) {return;};

  speakText(editor.document.getText(selection));
};

const speakDocument = (editor: vscode.TextEditor) => {
  speakText(editor.document.getText());
};

export { speakCurrentSelection, speakDocument, stopSpeaking, speakText };
