import { logMessage } from "../../../shared/audit";
import { saveFile } from "../../../services/files";

export function uploadFile(obj) {
  const blob = Utilities.newBlob(
    Utilities.base64Decode(obj.data),
    obj.mimeType,
    `${Date.now()}_${obj.fileName}`,
  );

  const { fileUrl } = saveFile("Uploads", blob);

  const activeCell = SpreadsheetApp.getActiveSpreadsheet()
    .getActiveCell()
    .setValue(fileUrl);

  logMessage(
    `Assigned ${activeCell.getA1Notation()} to uploaded file ${fileUrl}`,
  );
}
