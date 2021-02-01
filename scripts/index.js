const HTMLParser = require('node-html-parser');
const Epub = require("epub-gen");
const fs = require('fs');
const process = require('process');

main();

function main() {
  const htmlPath = process.argv[2];
  const outputEpubPath = process.argv[3];

  const root = HTMLParser.parse(fs.readFileSync(htmlPath));

  const option = {
    title: "Blueprint for Revolution (ru)", // *Required, title of the book.
    author: "Srdja Popovic, Matthew Miller", // *Required, name of the author.
    publisher: "Peramen",
    lang: 'ru',
    // cover: "https://upload.wikimedia.org/wikipedia/commons/1/1e/51Y9NnNLAOL.jpg", // Url or File path, both ok.
    // https://is3-ssl.mzstatic.com/image/thumb/Publication1/v4/a1/61/fe/a161fe46-2ba6-4fa0-8827-89bea1027b74/9780812995312.jpg/313x0w.webp
    cover: "../book/OEBPS/cover.jpeg", // Url or File path, both ok.
    tocTitle: "Содержание",
    content: createChapters(root)
  };

  new Epub(option, outputEpubPath);
}

function createChapters(root) {
  const chapters = [];
  let lastChapter = {};
  for (const partNode of root.querySelectorAll('.body .text')) {
    if (partNode.text.match(/^\s*Оглавление/)) {
      continue;
    }
    const chapterNumber = partNode.text.match(/^\s*Глава\s+\d+/);
    partNode.previousSibling
    if (chapterNumber) {
      lastChapter = {};
      chapters.push(lastChapter);
      lastChapter.title = `${chapterNumber[0]}: ${extractChapterName(partNode)}`;
    }
    removePartNumber(partNode);
    // removeExcessNewLines(partNode);
    lastChapter.data = lastChapter.data || '';
    lastChapter.data += partNode.innerHTML;
  }
  return chapters;
}

function extractChapterName(partNode) {
  let chapterName;
  const removeNextBr = function(node) {
    if (node.nextSibling.tagName === 'BR') {
      node.nextSibling.remove();
    }
  }
  const strongNodes = partNode.querySelectorAll('strong');
  if (strongNodes[0].childNodes[2]) {
    chapterName = strongNodes[0].childNodes[2].text;
  } else {
    chapterName = strongNodes[1].text;
    removeNextBr(strongNodes[1]);
    strongNodes[1].remove();
  }
  removeNextBr(strongNodes[0]);
  strongNodes[0].remove();
  return chapterName;
}

function removeTextNode(parentNode, node) {
  if (parentNode) {
    const children = parentNode.childNodes;
    parentNode.childNodes = children.filter((child) => {
      return node !== child;
    });
  }
}

function removePartNumber(partNode) {
  for (const em of partNode.querySelectorAll('em')) {
    if (em.text.match(/^\d+\/\d+$/)) {
      em.remove();
      continue;
    }
    if (em.text.match(/^\d+\/$/) && em.nextSibling && em.nextSibling.text.match(/^\d+\s*$/)) {
      removeTextNode(em.parentNode, em.nextSibling);
      em.remove();
      continue;
    }
  }
}

function removeExcessNewLines(partNode) {
  const nodes = partNode.childNodes;
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].tagName === 'BR') {
      if (nodes[i].nextSibling && (nodes[i].nextSibling.tagName === 'BR' || nodes[i].nextSibling.tagName === 'STRONG')) {
        continue;
      } else if (nodes[i - 1] && (nodes[i - 1].tagName === 'BR' || nodes[i - 1].tagName === 'STRONG')) {
        continue;
      } else if (nodes[i].nextSibling.text.startsWith('▪️')) {
        continue;
      } else {
        nodes[i].remove();
      }
    }
  }
}

