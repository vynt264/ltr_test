import * as ExcelJS from "exceljs";
import { Response } from "express";

export enum ExportMaxLength {
  MAX_LENGTH = 10000,
}

export async function writeWorkbook(
  workbook: ExcelJS.Workbook,
  res: Response<any, Record<string, any>>,
  fileName: string
) {
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=" + fileName + ".xlsx"
  );
  await workbook.xlsx.write(res);
  res.end();
}
