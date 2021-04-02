function addContent() {
  //let targetDocId='1g5CGDVGe5cnwDxcu4LPR_K7-Tc3ZfZaHEVKzKKilc1I'
  let targetDocName='Book-Preview-20210402'  // must exist beforehand (for now)
  let sourceFolderName='Chapters-20210402'    // must exist beforehand (always)
  let body = openTargetDocBody(targetDocName);
  if (body != null)
    Logger.log("Body found")
  let folder = openFirstFolder(sourceFolderName)
  if (folder != null)
    Logger.log("Target folder found")
  initializeBody(body)
  let walker = new WalkMe(body)
  walkGoogleFolder(folder, walker)
}

