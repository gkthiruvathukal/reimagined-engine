interface WalkEventObserver {
  enterFolder(gfolder: GoogleAppsScript.Drive.Folder, depth : number): void
  exitFolder(gfolder: GoogleAppsScript.Drive.Folder, depth : number): void
  visitFile(gfile: GoogleAppsScript.Drive.File, depth : number): void
}

var par_headings = {
  0: DocumentApp.ParagraphHeading.HEADING1,
  1: DocumentApp.ParagraphHeading.HEADING2,
  2: DocumentApp.ParagraphHeading.HEADING3,
  3: DocumentApp.ParagraphHeading.HEADING4,
  4: DocumentApp.ParagraphHeading.HEADING5,
  5: DocumentApp.ParagraphHeading.HEADING6
}

function applyParagraphHeading(depth: number, par: GoogleAppsScript.Document.Paragraph) : void {
  let headings_size = Object.keys(par_headings).length
  if (depth < headings_size) {
    par.setHeading( par_headings[depth]);
  }
}

class WalkMe {

  private body: GoogleAppsScript.Document.Body

  constructor(body: GoogleAppsScript.Document.Body) {
    this.body = body
  }

  enterFolder(gfolder: GoogleAppsScript.Drive.Folder, depth : number): void {
    let name = gfolder.getName()
    let par = this.body.appendParagraph(`${name} - ${depth}`)

    // todo use map instead of hard-coding cases like this
    applyParagraphHeading(depth, par);
    
  }

  exitFolder(gfolder: GoogleAppsScript.Drive.Folder, depth : number): void {

  }

  visitFile(gfile: GoogleAppsScript.Drive.File, depth : number): void {
    let name = gfile.getName()
    let par1 = this.body.appendParagraph(`${name} - ${depth}`)
    applyParagraphHeading(depth, par1);
    let par2 = this.body.appendParagraph(`The content of ${name} goes here.`)
    var style = {}
    style[DocumentApp.Attribute.FONT_FAMILY] = 'Calibri'
    style[DocumentApp.Attribute.BOLD] = true;
    par2.setAttributes(style)
    let thisFileBody = openDocsFile(gfile.getId())
    mergeContent(thisFileBody, this.body)
    //retrieveComments(gfile.getId())
  }
}

function mergeContent(src: GoogleAppsScript.Document.Body, dst: GoogleAppsScript.Document.Body) {
  let numChildren = src.getNumChildren()
    for( let child = 0; child < numChildren; child++ ) {
      let srcElement = src.getChild(child).copy();
      var type = srcElement.getType();
      if( type == DocumentApp.ElementType.PARAGRAPH ) {
        let par = removeFootnotes(srcElement).asParagraph()
        let par_level = par.getHeading()
        //Logger.log(`par level ${par_level}`)
        dst.appendParagraph(par);
        //if (par_level == DocumentApp.ParagraphHeading.HEADING2) {
        //  applyParagraphHeading(5, par);
        //}
      }
      else if( type == DocumentApp.ElementType.TABLE )
        dst.appendTable(srcElement.asTable());
      else if( type == DocumentApp.ElementType.LIST_ITEM )
        dst.appendListItem(srcElement.asListItem());
      else if (type == DocumentApp.ElementType.HORIZONTAL_RULE)
        dst.appendHorizontalRule();
      else if (type == DocumentApp.ElementType.PAGE_BREAK)
        dst.appendPageBreak();
      else
        Logger.log(`invalid child type detected ${type}`)
    }
  }
}


// Credit to https://stackoverflow.com/questions/62973123/cant-transfer-footnote-into-new-document-entire-function-fails
// Until the bug in API is fixed, we'll bypass footnotes.

function removeFootnotes(element : GoogleAppsScript.Document.Element) {
  var removals: Array<GoogleAppsScript.Document.Element> = []
  if( element.getType() == DocumentApp.ElementType.PARAGRAPH){
    let num = element.asParagraph().getNumChildren();
    Logger.log(`element has ${num} children`)
    for( let i = 0; i < num; i++ ) {
      let child = element.asParagraph().getChild(i);
      let childType = child.getType();        
      Logger.log(`child ${i} has type ${childType}`)
      if (childType == DocumentApp.ElementType.TEXT) {
        let childText = child.asText().getText()
        Logger.log(`child text = ${childText}`)
      }
      if( childType == DocumentApp.ElementType.FOOTNOTE){
        let footnoteText = child.asFootnote().getFootnoteContents();
        Logger.log(`marking child ${i} footnote element for removal ${footnoteText}`);
        removals.push(child)
      }
    }
    for (let i=0; i < removals.length; i++) {
      Logger.log(`removing footnote ${i} of ${removals.length} outside of loop`)
      removals[i].removeFromParent()
    }
    return element;
  }
}

function walkGoogleFolder(folder : GoogleAppsScript.Drive.Folder, observer : WalkEventObserver) {
   walkGoogleFolderRecursive(folder, 0, observer)
}

function walkGoogleFolderRecursive(folder : GoogleAppsScript.Drive.Folder, depth : number, observer : WalkEventObserver) {
  let folderName = folder.getName()
  Logger.log(`Visiting folder ${folderName}`)
  let subFolders = folder.getFolders()
  let files = folder.getFiles()
  while (files.hasNext()) {
    let gfile = files.next()
    let gfilename = gfile.getName()
    Logger.log(`Visiting file ${gfilename}`)
    observer.visitFile(gfile, depth)
  }
  while (subFolders.hasNext()) {
    let gfolder = subFolders.next()
    observer.enterFolder(gfolder, depth)
    walkGoogleFolderRecursive(gfolder, depth+1, observer)
    observer.exitFolder(gfolder, depth)
  }
}

function openTargetDocBody(docName) : GoogleAppsScript.Document.Body {
  let files = DriveApp.getFilesByName(docName)
  if (files.hasNext()) {
    Logger.log(`${docName} was found. Yay!`)
    let file = files.next()
    let fileId = file.getId()
    Logger.log(`opening ${fileId}`)
    let doc = DocumentApp.openById(fileId)
    return doc.getBody()
  }
  else return null
}

function openDocsFile(docId) : GoogleAppsScript.Document.Body {
  let doc = DocumentApp.openById(docId)
  return doc.getBody()
}

function initializeBody(body: GoogleAppsScript.Document.Body ) {
  today = Utilities.formatDate(new Date(), "GMT-5", "dd/MM/yyyy @ hh:mm:ss")
  //var body = DocumentApp.getActiveDocument().getBody();
  body.clear();
  body.appendParagraph(`Generated ${today}`);
}

function openFirstFolder(folderName : string) : GoogleAppsScript.Drive.Folder {
  let folders = DriveApp.getFoldersByName(folderName);
  //Logger.log(`opening`)
  if (folders.hasNext()) {
    Logger.log(`${folderName} was found. Yay!`)
    return folders.next()
  } else
    return null; 
}

