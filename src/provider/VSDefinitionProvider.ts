import * as vscode from 'vscode';
import * as path from 'path';
import { ESFileProvider } from '../provider/ESFileProvider';
import { HtmlESMappingCache } from '../utils/CacheUtils';

/**
 * 跳段到定义
 */
export class MXDefinitionProvider implements vscode.DefinitionProvider {
  provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {

    const fileName = document.fileName;
    const workDir = path.dirname(fileName);
    let word = document.getText(document.getWordRangeAtPosition(position, new RegExp('\'(.*?)\'|\"(.*?)\"')));
    const line = document.lineAt(position);
    if (word === '') {
      word = document.getText(document.getWordRangeAtPosition(position, new RegExp('\.(.*?)\(')));
    }
    
    let text = line.text.replace(/\s+/g, '');
    if (text.indexOf('tmpl:') > -1) {
      let path = workDir + '/' + word.replace(/(^\'*)|(\'*$)/g, '').replace(/(^\"*)|(\"*$)/g, '').replace('@', '');
      return new vscode.Location(vscode.Uri.file(path), new vscode.Position(0, 0));
    }

  }
}
/**
 * magix 内部函数跳转
 */
export class MXInnerDefinitionProvider implements vscode.DefinitionProvider {
  provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {

    const fileName = document.fileName;
    //const workDir = path.dirname(fileName);
    // const  word = document.getText(document.getWordRangeAtPosition(position, new RegExp('\.(\w*?)\(')));
    const line = document.lineAt(position);

    let arr: any = line.text.match(/.(\w+)\(/);
    if (arr.length === 2) {
      let position: vscode.Position = ESFileProvider.provideFnPosition(arr[1], fileName, document.getText());
      return new vscode.Location(document.uri, position);
    }


  }
}
export class HtmlDefinitionProvider implements vscode.DefinitionProvider {

  provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {

    const fileName = document.fileName;

    let word = document.getText(document.getWordRangeAtPosition(position, new RegExp('mx-[a-z]+\s*=\s*\'(.*?)\'|mx-[a-z]+\s*=\s*\"(.*?)\"')));

    let p: Promise<vscode.Location> = new Promise((resolve, reject) => {
      if (word.indexOf('mx-') > -1) {
        let mx = word.match(/mx-[a-z]+/);
        if (mx && mx.length > 0) {
          let mxMethod = mx[0].replace('mx-', '');
          let userMethod = word.replace(/mx-[a-z]+\s*=\s*\'|mx-[a-z]+\s*=\s*\"/, '');
          userMethod = userMethod.replace(/(\(.*?\)|\s*)(\'|\")/, '');
          let fnName: Array<string> = [userMethod, userMethod + '<' + mxMethod + '>'];
          let esFilePath: any = HtmlESMappingCache.getEsFilePath(fileName);
          if (esFilePath) {
            let position: vscode.Position = ESFileProvider.provideFnPosition(fnName, esFilePath, '');
            resolve(new vscode.Location(vscode.Uri.file(esFilePath), position));
          }
        }
      }
    });
    return p;

  }
}