/* eslint-disable @typescript-eslint/naming-convention */
const fs = require ('fs');
const {mainModule} = require ('process');
import { ExtensionContext, window, workspace } from "vscode";


let baseDirProject = getProjectFilePath();
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
  return path;
}
class TreeNode {
  key: string;
  value: string;
  parent: any;
  children: never[];
  path: string;
  constructor (key: string, value = key, parent = null, path: string) {
    this.key = key;
    this.value = value;
    this.parent = parent;
    this.children = [];
    this.path = path;
  }

  get isLeaf () {
    return this.children.length === 0;
  }

  get hasChildren () {
    return !this.isLeaf;
  }
}

class Tree {
  root: TreeNode;
  constructor (key: string, value = key, path:string) {
    this.root = new TreeNode (key, value, null, path);
  }

  *preOrderTraversal ({ node = this.root }: { node?: TreeNode; } = {}): any {
    yield node;
    if (node.children.length) {
      for (let child of node.children) {
        yield* this.preOrderTraversal ({ node: child });
      }
    }
  }

  *postOrderTraversal ({ node = this.root }: { node?: TreeNode; } = {}): any {
    if (node.children.length) {
      for (let child of node.children) {
        yield* this.postOrderTraversal ({ node: child });
      }
    }
    yield node;
  }

  insert (parentNodeKey: string, key: string, value = key) {
    for (let node of this.preOrderTraversal ()) {
      if (node.key === parentNodeKey) {
        let path = node.path + '\\' + key;
        node.children.push (new TreeNode (key, value, node, path));
        return true;
      }
    }
    return false;
  }

  remove (key: string) {
    for (let node of this.preOrderTraversal ()) {
      const filtered = node.children.filter ((c: { key: string; }) => c.key !== key);
      if (filtered.length !== node.children.length) {
        node.children = filtered;
        return true;
      }
    }
    return false;
  }

  find (key:string) {
    for (let node of this.preOrderTraversal ()) {
      if (node.key === key) {return node;}
    }
    return undefined;
  }

    
}
class ReadFile {
  
 treeData: any;
 file_structure: Tree | undefined;
  constructor () {
   }
  read_file() {
    fs.readFile (baseDirProject+'\\treecontent.txt', (err: any, data: { toString: () => string; }) => {
      if (err) {throw err;}
      this.treeData = data.toString ();
      this.mainParsing ();
      return this.file_structure;
    });
  }

  mainParsing () {
    let free = true;
    let wordList = [];
    let word = '';
    let odd = true;
    let level_list = [];
  
    var isWin = process.platform === "win32";

    if (isWin) {
      // parsing for Windows based tree generated file
      // used tree command: `tree /f <folder> > <extensionFolder/treecontent.txt>`
    
      let ign = 0;
      let char = 0;
      wordList.push("root");
      level_list.push(0);
      for (; char < this.treeData.length; char++) {
        if(this.treeData[char] === '\n') {ign++;}
        if(ign === 3) {break;}
      }
      for (; char < this.treeData.length; char++) {
        if(this.treeData[char] === '\n') {
          word = "";
        } else if (this.treeData[char].match(/^[0-9a-zA-Z._]+$/)) {
          level_list.push(word.length);
          word = "";
          while(this.treeData[char] !== '\r') {
            // TODO: make it work with LF
            word += this.treeData[char];
            char++;
          }
          wordList.push(word);
          word = "";
        } else {
            word += this.treeData[char];
        }
      }
    }
    else {
      // parsing for Linux based tree generated file
      // used tree command: `tree -q <folder> > <extensionFolder/treecontent.txt>`
    
      for (let char in this.treeData) {
        if (this.treeData[char] === 'm' && free) {
          free = false;
        } else if (this.treeData[char] === '') {
          if (!odd) {
            wordList.push (word);
          } else {
            level_list.push (word.length);
          }
          odd = !odd;
          word = '';
          free = true;
        } else if (free === false) {
          word += this.treeData[char];
        }
      }
    }

    let parent_list_stack = [];
  
    this.file_structure = new Tree (wordList[0], wordList[0], baseDirProject);
  
    for (let i:number = 1; i < wordList.length; i++) {      
      if (level_list[i] > level_list[i - 1]) {
        parent_list_stack.push (i - 1);
        this.file_structure?.insert (wordList[i - 1], wordList[i], wordList[i]);
      } else if (level_list[i] === level_list[i - 1]) {
        let top = parent_list_stack[parent_list_stack.length - 1];
        this.file_structure?.insert (wordList[top], wordList[i], wordList[i]);
      } else {
        let depth = level_list[i];
        while (depth <= level_list[parent_list_stack[parent_list_stack.length-1]]) {
          parent_list_stack.pop();
        }
  
        let top = parent_list_stack[parent_list_stack.length - 1];
        this.file_structure?.insert (wordList[top], wordList[i], wordList[i]);
      }
    }

    this.pythonFileReader();
    setTimeout(() => {
      for (let node of this.file_structure?.preOrderTraversal ()) {
        // console.log (node.value);
      }
    }, 10000);
  }

  async pythonFileReader(){
      for (let node of this.file_structure?.preOrderTraversal ()) {
        // console.log("I AM NODE", node);
        if (node.key.endsWith ('.py')) {
          // console.log("Found .py file");
          await this.readPythonFile (node);
        }
        else
          {console.log("!.py");}
      }      
  }


  find_gap(code: string){
    let tab_space = 0;
    for(let j = 0; j<code.length; j++){
        if(code[j] === ' '){
            tab_space ++;
        }else{
            break;
        }
        
    }
    return tab_space;
  }

  async readPythonFile(node: { path: string; key: string; } ){
      let python_file: string[] = [];
      await fs.readFile (node.path, (err:any, data:string) => {
        if (err) {throw err;}
        // eslint-disable-next-line @typescript-eslint/naming-convention
        let python_file_string = data.toString ();
        let temp = python_file_string.split ('\r\n');

        for (let k in temp) {
          if (temp[k] !== '') {
            python_file.push (temp[k]);
          }
        }
        

        this.file_structure?.insert (
          node.key,
          node.key + '_imports',
          'This file imports '
        );
        
        for (let i = 1; i < python_file.length; i++) {
          if (python_file[i].includes ('import')) {
            let node_import = this.file_structure?.find (node.key + '_imports');
            if (python_file[i].startsWith ('import')) {
              node_import.value =
                node_import.value + ' ' + python_file[i].slice (7) + ' , ';
            } else {
              node_import.value = node_import.value + ' ' + python_file[i];
            }
          } else if (python_file[i].startsWith ('class')) {
            this.file_structure?.insert (
              node.key,
              node.key + python_file[i].slice (6),
              'Class named ' + python_file[i].slice (6) + ' contains'
            );
            let node_class = this.file_structure?.find (
              node.key + python_file[i].slice (6)
            );
            i++;
            while (python_file[i] && python_file[i].startsWith (' ')) {
              if (python_file[i].includes ('def')) {
                let from = python_file[i].indexOf ('def');
                from += 3;
                let till = python_file[i].indexOf ('(');
    
                let function_name = python_file[i].slice (from, till);
    
                node_class.value += function_name + ',';
    
                this.file_structure?.insert (
                  node_class.key,
                  node_class.key + function_name + i,
                  'Function named ' + function_name + ' contains parameters '
                );
    
                let function_node = this.file_structure?.find (
                  node_class.key + function_name + i
                );

                let parameters = '';
    
                while(python_file[i].endsWith(":")){
                  parameters += python_file[i].trim();
                  i++;
                }
    
                from = parameters.indexOf ('(');
                till = parameters.lastIndexOf (':');
    
    
                function_node.value += parameters.slice(from,till).replace (':', ' of type ');
                function_node.value = function_node.value.replace (
                  '->',
                  ' returns '
                );

                this.file_structure?.insert(function_node.key, function_node.key + "_code", "");
                let is_in_function_key = function_node.key + "_code";

                let code_node = this.file_structure?.find(is_in_function_key);
                let code = "";
                let tab_space = this.find_gap(python_file[i]);
                

                while(this.find_gap(python_file[i]) >= tab_space){
                  code += python_file[i];
                  code += "\n";
                  i++;
                }
                i--;
                code_node.value = code;
              }
              i++;
            }
            i--;

          } else if (python_file[i].startsWith ('def')) {
            let from = python_file[i].indexOf ('def');
            from += 3;
            let till = python_file[i].indexOf ('(');
    
            let function_name = python_file[i]?.slice (from, till);
    
            this.file_structure?.insert (
              node.key,
              node.key + function_name + i,
              'Function named ' + function_name + ' contains parameters '
            );
    
            let function_node = this.file_structure?.find (node.key + function_name + i);
    
            let parameters = '';
    
            while (python_file[i].endsWith (':')) {
              parameters += python_file[i].trim ();
              i++;
            }
    
            from = parameters.indexOf ('(');
            till = parameters.lastIndexOf (':');
    
            function_node.value += parameters
              .slice (from, till)
              .replace (':', ' of type ');
            function_node.value = function_node.value.replace ('->', ' returns ');

            
            this.file_structure?.insert(function_node.key, function_node.key + "_code", "");
            let is_in_function_key = function_node.key + "_code";

            let code_node = this.file_structure?.find(is_in_function_key);
            let code = "";
            let tab_space = this.find_gap(python_file[i]);
            

            while(this.find_gap(python_file[i]) >= tab_space){
              code += python_file[i];
              code += "\n";
              i++;
            }
            i--;
            code_node.value = code;
          }
        }

        // if(node.key === 'scene.py'){
          
        // console.log(python_file);
        //   for (let node of this.file_structure?.preOrderTraversal ()) {
        //     console.log(node.value);
        //   }
        // }

      });
  };
  
}


export {Tree, TreeNode, ReadFile};
