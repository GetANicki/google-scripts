import config from "../shared/config";

export interface SaveFileResponse {
  fileUrl: string;
  folderUrl: string;
}

let rootFolder: GoogleAppsScript.Drive.Folder | null = null;

const getRootFolder = () =>
  (rootFolder =
    rootFolder || DriveApp.getFolderById(config.FileStorageFolderId));

export const saveFile = (
  folderName: string,
  blob: GoogleAppsScript.Base.Blob,
): SaveFileResponse => {
  const rootFolder = getRootFolder();
  const existingFolders = rootFolder.getFoldersByName(folderName);

  const folder = existingFolders.hasNext()
    ? existingFolders.next()
    : rootFolder.createFolder(folderName);

  const existingFiles = folder.getFilesByName(blob.getName());
  const existingFile = existingFiles.hasNext() ? existingFiles.next() : null;

  const file = existingFile || folder.createFile(blob);

  if (!existingFile) console.log("Created file", file.getUrl());

  return { fileUrl: file.getDownloadUrl(), folderUrl: folder.getUrl() };
};
