const fs = require ('fs');
const { mainModule } = require('process');

let treeData;

class TreeNode {
  constructor (key, value = key, parent = null) {
    this.key = key;
    this.value = value;
    this.parent = parent;
    this.children = [];
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
    this.root = new TreeNode (key, value);
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
        node.children.push (new TreeNode (key, value, node));
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
  main();

});

function main(){
  let free = true;
  let wordList=[];
  let word = "";
  let odd=true;
  let level_list = [];

  for(let char in treeData){
    if(treeData[char] ==='m' && free){
      free=false;
    }else if(treeData[char] === ''){
      if(!odd){
        wordList.push(word);
      }else{
        level_list.push(word.length);
      }
      odd = !odd;
      word = "";
      free = true;
    }
    else if(free===false){
      word+= treeData[char];
    }
  }


  let parent_list_stack = [];

  let file_structure = new Tree(wordList[0],wordList[0]);

  for(let i=1;i<wordList.length;i++){
    if(level_list[i] > level_list[i-1]){
      parent_list_stack.push(i-1);
      file_structure.insert(wordList[i-1], wordList[i],wordList[i]);
    }else if(level_list[i] === level_list[i-1]){

      let top = parent_list_stack[parent_list_stack.length-1];
      file_structure.insert(wordList[top],wordList[i], wordList[i]);
    }else{

      let depth = level_list[i];
      while(depth < level_list[parent_list_stack.pop()]){}

      let top = parent_list_stack[parent_list_stack.length - 1];
      file_structure.insert (wordList[top], wordList[i], wordList[i]);
    }
  }
  console.log("Pre-Order travel");
  for (let node of file_structure.preOrderTraversal ()) {
      console.log(node.key);
  }
  
  // console.log ('Post-Order travel');
  // for (let node of file_structure.postOrderTraversal ()) {
  //   console.log (node.key);
  // }

  console.log("-------------------------------");
  node = file_structure.find("src");
    
  for(let child in node.children){
    console.log(node.children[child].key);
  }




}

