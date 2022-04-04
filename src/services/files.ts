import config from "../shared/config";

interface SaveFileRequest {
  contents: string;
  mimeType?: string | null;
  filename: string;
  folder: string;
}

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
  if (rootFolder) console.log("Got root folder");

  const existingFolders = rootFolder.getFoldersByName(folderName);

  const folder = existingFolders.hasNext()
    ? existingFolders.next()
    : rootFolder.createFolder(folderName);

  if (folder) console.log("Got file folder");

  const file = folder.createFile(blob);
  if (file) console.log("Created file", file.getUrl());

  return { fileUrl: file.getDownloadUrl(), folderUrl: folder.getUrl() };
};
