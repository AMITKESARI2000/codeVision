const fs = require ('fs');
const {mainModule} = require ('process');

let treeData;
let file_structure;

class TreeNode {
  constructor (key, value = key, parent = null, path) {
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
  constructor (key, value = key) {
    this.root = new TreeNode (key, value, null, key);
  }

  *preOrderTraversal (node = this.root) {
    yield node;
    if (node.children.length) {
      for (let child of node.children) {
        yield* this.preOrderTraversal (child);
      }
    }
  }

  *postOrderTraversal (node = this.root) {
    if (node.children.length) {
      for (let child of node.children) {
        yield* this.postOrderTraversal (child);
      }
    }
    yield node;
  }

  insert (parentNodeKey, key, value = key) {
    for (let node of this.preOrderTraversal ()) {
      if (node.key === parentNodeKey) {
        let path = node.path + '/' + key;
        node.children.push (new TreeNode (key, value, node, path));
        return true;
      }
    }
    return false;
  }

  remove (key) {
    for (let node of this.preOrderTraversal ()) {
      const filtered = node.children.filter (c => c.key !== key);
      if (filtered.length !== node.children.length) {
        node.children = filtered;
        return true;
      }
    }
    return false;
  }

  find (key) {
    for (let node of this.preOrderTraversal ()) {
      if (node.key === key) return node;
    }
    return undefined;
  }
}

fs.readFile ('./src/Parsing/treeviewcontent.txt', (err, data) => {
  if (err) throw err;
  treeData = data.toString ();
  main ();
});

function main () {
  let free = true;
  let wordList = [];
  let word = '';
  let odd = true;
  let level_list = [];

  for (let char in treeData) {
    if (treeData[char] === 'm' && free) {
      free = false;
    } else if (treeData[char] === '') {
      if (!odd) {
        wordList.push (word);
      } else {
        level_list.push (word.length);
      }
      odd = !odd;
      word = '';
      free = true;
    } else if (free === false) {
      word += treeData[char];
    }
  }

  let parent_list_stack = [];

  file_structure = new Tree (wordList[0], wordList[0]);

  for (let i = 1; i < wordList.length; i++) {
    if (level_list[i] > level_list[i - 1]) {
      parent_list_stack.push (i - 1);
      file_structure.insert (wordList[i - 1], wordList[i], wordList[i]);
    } else if (level_list[i] === level_list[i - 1]) {
      let top = parent_list_stack[parent_list_stack.length - 1];
      file_structure.insert (wordList[top], wordList[i], wordList[i]);
    } else {
      let depth = level_list[i];
      while (depth < level_list[parent_list_stack.pop ()]) {
      }

      let top = parent_list_stack[parent_list_stack.length - 1];
      file_structure.insert (wordList[top], wordList[i], wordList[i]);
    }
  }

  pythonFileReader();

  setTimeout(() => {
    for (let node of file_structure.preOrderTraversal ()) {
      console.log (node.value);
    }
  }, 1000);

  

  // console.log ('-------------------------------');
  // node = file_structure.find ('maze_gitb');

  // for (let child in node.children) {
  //   console.log (node.children[child].key);
  // }
  

}
async function pythonFileReader(){
// const pythonFileReader = async () => {
  
  for (let node of file_structure.preOrderTraversal ()) {
    if (node.key.endsWith ('.py')) {
      await readPythonFile (node);
    }
  }
  
}

async function readPythonFile(node ){
// const readPythonFile = async node => {
  let python_file = [];
  await fs.readFile (node.path, (err, data) => {
    if (err) throw err;
    let python_file_string = data.toString ();
    let temp = python_file_string.split ('\r\n');
    for (let k in temp) {
      if (temp[k] != '') {
        python_file.push (temp[k]);
      }
    }
    if (node.key === 'game.py') {
      // console.log (python_file);
    }

    file_structure.insert (
      node.key,
      node.key + '_imports',
      'This file imports '
    );

    for (let i in python_file) {
      if (python_file[i].includes ('import')) {
        let node_import = file_structure.find (node.key + '_imports');
        if (python_file[i].startsWith ('import')) {
          node_import.value =
            node_import.value + ' ' + python_file[i].slice (7) + ' , ';
        } else {
          node_import.value = node_import.value + ' ' + python_file[i];
        }
      } else if (python_file[i].startsWith ('class')) {
        file_structure.insert (
          node.key,
          node.key + python_file[i].slice (6),
          'Class named ' + python_file[i].slice (6) + ' contains'
        );
        let node_class = file_structure.find (
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

            file_structure.insert (
              node_class.key,
              node_class.key + function_name + i,
              'Function named ' + function_name + ' contains parameters '
            );

            let function_node = file_structure.find (
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

          }

          i++;
        }

        // console.log (node_class.value);
      } else if (python_file[i].startsWith ('def')) {
        let from = python_file[i].indexOf ('def');
        from += 3;
        let till = python_file[i].indexOf ('(');

        let function_name = python_file[i]?.slice (from, till);

        file_structure.insert (
          node.key,
          node.key + function_name + i,
          'Function named ' + function_name + ' contains parameters '
        );

        let function_node = file_structure.find (node.key + function_name + i);

        let parameters = '';

        while (python_file[i].endsWith ('):')) {
          parameters += python_file[i].trim ();
          i++;
        }

        from = parameters.indexOf ('(');
        till = parameters.lastIndexOf (':');

        function_node.value += parameters
          .slice (from, till)
          .replace (':', ' of type ');



        function_node.value = function_node.value.replace ('->', ' returns ');
      }
    }

    // let ll = file_structure.find (node.key + '_imports');

    // if (node.key === 'game.py') console.log (ll.value);


    
// for (let node of file_structure.preOrderTraversal ()) {
//   console.log (node.value);
// }

  });
};

export {file_structure};
