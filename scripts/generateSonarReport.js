import fetch from "node-fetch";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { CONFIG } from "../constants/config.js";
import * as PROJECTS from "../constants/projects.js";

const authToken = Buffer.from(`${CONFIG.username}:${CONFIG.password}`).toString(
  "base64"
);

const metrics = [
  "coverage",
  "duplicated_lines_density",
  "reliability_rating",
  "security_rating",
  "sqale_rating",
];

const getTodayString = () => new Date().toISOString().split("T")[0];

async function fetchMetrics(projectKey, strategy) {
  const url = `${
    CONFIG.baseUrl
  }/api/measures/component?component=${projectKey}&metricKeys=${metrics.join(
    ","
  )}&branch=${CONFIG.branch}&strategy=${strategy}`;
  const response = await fetch(url, {
    headers: { Authorization: `Basic ${authToken}` },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function fetchIssuesCount(projectKey) {
  const url = `${CONFIG.baseUrl}/api/issues/search?componentKeys=${projectKey}&resolved=false&branch=${CONFIG.branch}`;
  const response = await fetch(url, {
    headers: { Authorization: `Basic ${authToken}` },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return data.total || 0;
}

async function fetchHotspotsCount(projectKey) {
  const url = `${CONFIG.baseUrl}/api/hotspots/search?projectKey=${projectKey}&branch=${CONFIG.branch}`;
  const response = await fetch(url, {
    headers: { Authorization: `Basic ${authToken}` },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return data.paging.total || 0;
}

function getMetricValue(metrics, key) {
  const found = metrics.find((m) => m.metric === key);
  return found
    ? parseFloat(found.value).toFixed(2).replace(".", ",") + "%"
    : "-";
}

function getRawValue(metrics, key) {
  const found = metrics.find((m) => m.metric === key);
  return found ? parseFloat(found.value) : NaN;
}

function getHealthColor(metrics, issues, hotspots) {
  const thresholds = CONFIG.healthThresholds;

  const coverage = getRawValue(metrics, "coverage");
  const duplications = getRawValue(metrics, "duplicated_lines_density");
  const reliability = getRawValue(metrics, "reliability_rating");
  const security = getRawValue(metrics, "security_rating");
  const sqale = getRawValue(metrics, "sqale_rating");

  const isRed =
    isNaN(coverage) ||
    coverage < thresholds.coverage.yellow ||
    duplications > thresholds.duplications.yellow ||
    issues > thresholds.issues.yellow ||
    hotspots > thresholds.hotspots.yellow ||
    reliability >= thresholds.rating.yellow + 1 ||
    security >= thresholds.rating.yellow + 1 ||
    sqale >= thresholds.rating.yellow + 1;

  if (isRed) return "F4CCCC"; // rojo

  const isYellow =
    coverage < thresholds.coverage.green ||
    duplications > thresholds.duplications.green ||
    issues > thresholds.issues.green ||
    hotspots > thresholds.hotspots.green ||
    reliability === thresholds.rating.yellow ||
    security === thresholds.rating.yellow ||
    sqale === thresholds.rating.yellow;

  return isYellow ? "FFE699" : "D9EAD3"; // naranja o verde
}

async function generateExcelReport(projects, outputName) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Reporte");

  const headerStyle = {
    alignment: { horizontal: "center", vertical: "middle" },
    font: { bold: true },
    border: {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    },
  };

  const applyHeaderStyle = (cell, fill) => {
    cell.fill = fill;
    cell.font = headerStyle.font;
    cell.alignment = headerStyle.alignment;
    cell.border = headerStyle.border;
  };

  const repoHeaderFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "D9D2E9" },
  };
  const groupHeaderFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "DBE5F1" },
  };
  const groupHeaderFill2 = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "B6D7A8" },
  };
  const subHeaderFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "E6EEF7" },
  };

  worksheet.mergeCells("A1:A2");
  worksheet.getCell("A1").value = "Repositorio";
  applyHeaderStyle(worksheet.getCell("A1"), repoHeaderFill);

  worksheet.mergeCells("B1:E1");
  worksheet.getCell("B1").value = "New Code";
  applyHeaderStyle(worksheet.getCell("B1"), groupHeaderFill);

  worksheet.mergeCells("F1:I1");
  worksheet.getCell("F1").value = "Overall Code";
  applyHeaderStyle(worksheet.getCell("F1"), groupHeaderFill2);

  const subHeaders = [
    "Coverage",
    "Issues",
    "Duplications",
    "Security Hotspots",
  ];
  for (let i = 0; i < subHeaders.length; i++) {
    const cellNC = worksheet.getCell(2, i + 2);
    const cellOC = worksheet.getCell(2, i + 6);
    cellNC.value = subHeaders[i];
    cellOC.value = subHeaders[i];
    applyHeaderStyle(cellNC, subHeaderFill);
    applyHeaderStyle(cellOC, subHeaderFill);
  }

  let rowNum = 3;
  for (const projectKey of projects) {
    try {
      const [overall, newCode, issues, hotspots] = await Promise.all([
        fetchMetrics(projectKey, "all"),
        fetchMetrics(projectKey, "leak"),
        fetchIssuesCount(projectKey),
        fetchHotspotsCount(projectKey),
      ]);

      const name = overall?.component?.name || projectKey;
      const overallMetrics = overall?.component?.measures || [];
      const newCodeMetrics = newCode?.component?.measures || [];

      const healthColor = getHealthColor(
        [...newCodeMetrics, ...overallMetrics],
        issues,
        hotspots
      );

      const row = worksheet.getRow(rowNum);
      row.getCell(1).value = name;
      row.getCell(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: healthColor },
      };

      row.getCell(2).value = getMetricValue(newCodeMetrics, "coverage");
      row.getCell(3).value = issues;
      row.getCell(4).value = getMetricValue(
        newCodeMetrics,
        "duplicated_lines_density"
      );
      row.getCell(5).value = hotspots;

      row.getCell(6).value = getMetricValue(overallMetrics, "coverage");
      row.getCell(7).value = issues;
      row.getCell(8).value = getMetricValue(
        overallMetrics,
        "duplicated_lines_density"
      );
      row.getCell(9).value = hotspots;

      for (let i = 1; i <= 9; i++) {
        row.getCell(i).border = headerStyle.border;
        row.getCell(i).alignment = { horizontal: "center" };
      }

      rowNum++;
    } catch (err) {
      console.error(`❌ Error en proyecto ${projectKey}:`, err.message);
    }
  }

  worksheet.columns = [
    { width: 35 },
    { width: 15 },
    { width: 10 },
    { width: 15 },
    { width: 20 },
    { width: 15 },
    { width: 10 },
    { width: 15 },
    { width: 20 },
  ];

  const today = getTodayString();
  const fileName = `sonarqube_reporte-${outputName}_${today}.xlsx`;
  const dirPath = path.resolve(CONFIG.outputFolder);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const filePath = path.join(dirPath, fileName);
  await workbook.xlsx.writeFile(filePath);
  console.log(`✅ Excel generado: ${filePath}`);
}

function cleanOutputFolder(folderPath) {
  if (fs.existsSync(folderPath)) {
    const files = fs.readdirSync(folderPath);
    for (const file of files) {
      fs.unlinkSync(path.join(folderPath, file));
    }
    console.log(`🧹 Carpeta limpiada: ${folderPath}`);
  }
}

const types = process.argv.slice(2); // Se debe pasar por consola el tipo o los tipos, ej: frontend, backend, app

if (!types.length) {
  console.error(
    "❌ Debes pasar al menos un tipo de proyectos: frontend | backend | app | etc."
  );
  process.exit(1);
}

async function main() {
  const dirPath = path.resolve(CONFIG.outputFolder);
  cleanOutputFolder(dirPath); // ✅ Limpiar solo una vez antes de generar cualquier reporte

  for (const type of types) {
    const projectList = PROJECTS[type.toUpperCase()];
    if (!projectList) {
      console.error(`❌ Tipo "${type}" no encontrado en projects.js`);
      continue;
    }
    console.log(`🚀 Generando reporte para tipo: ${type}`);
    await generateExcelReport(projectList, type);
  }
}

main();
