interface WalkEventObserver {
  enterFolder(gfolder: GoogleAppsScript.Drive.Folder, depth : number): void
  exitFolder(gfolder: GoogleAppsScript.Drive.Folder, depth : number): void
  visitFile(gfile: GoogleAppsScript.Drive.File, depth : number): void
}

function applyParagraphHeading(depth: number, par: GoogleAppsScript.Document.Paragraph) : void {
  if (depth == 0)
    par.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  else if (depth == 1)
    par.setHeading(DocumentApp.ParagraphHeading.HEADING2);
  else if (depth == 2)
    par.setHeading(DocumentApp.ParagraphHeading.HEADING3);
  else if (depth == 3)
    par.setHeading(DocumentApp.ParagraphHeading.HEADING4);
  else if (depth == 4)
    par.setHeading(DocumentApp.ParagraphHeading.HEADING5);
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
  }
}


function walkGoogleFolder(folder : GoogleAppsScript.Drive.Folder, observer : WalkEventObserver) {
   walkGoogleFolderRecursive(folder, 0, observer)
}

function walkGoogleFolderRecursive(folder : GoogleAppsScript.Drive.Folder, depth : number, observer : WalkEventObserver) {
  let folderName = folder.getName()
  Logger.log(`Visiting ${folderName}`)
  let subFolders = folder.getFolders()
  let files = folder.getFiles()
  while (files.hasNext()) {
    let gfile = files.next()
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

