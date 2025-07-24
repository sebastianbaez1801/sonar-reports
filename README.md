# 🧾 Generador de Reportes SonarQube

Genera reportes automatizados en Excel con métricas clave de calidad de código (coverage, duplicaciones, issues, hotspots, ratings) para uno o varios proyectos de SonarQube, organizados por tipo (frontend, backend, app, etc.).

---

## 📦 Requisitos

- Node.js v16 o superior
- Acceso a una instancia de SonarQube con token o credenciales
- Proyectos organizados por tipo en SonarQube

---

## 📁 Estructura del proyecto

sonar-reports/
├── config/
│ ├── config.js # Configuración de SonarQube y métricas
│ └── projects.js # Listado de proyectos por tipo
├── scripts/
│ └── generateSonarReport.js # Script principal para generar el Excel
├── reportes/ # Carpeta donde se genera el archivo Excel
├── package.json # Dependencias del proyecto
└── README.md # Este archivo

---

## ⚙️ Instalación

1. Clona el repositorio o descarga los archivos.
2. Ejecuta la instalación de dependencias:

npm install

## 🔧 Configuración

Edita este archivo con tu información real de acceso a SonarQube:

config.js

export const CONFIG = {
username: "usuario-sonar", // Usuario o token de SonarQube
password: "token-o-clave", // Token de acceso si estás usando autenticación básica
baseUrl: "https://sonarqube.tuempresa.com", // URL de tu instancia SonarQube
branch: "develop", // Rama a analizar
outputFolder: "reportes", // Carpeta donde se guardará el Excel generado

healthThresholds: {
coverage: { yellow: 50, green: 80 },
duplications: { yellow: 10, green: 5 },
issues: { yellow: 20, green: 5 },
hotspots: { yellow: 10, green: 5 },
rating: { yellow: 2 } // 1 = A, 2 = B, 3 = C...
}
};

Organiza tus proyectos por tipo. Los nombres deben coincidir con los projectKey en SonarQube:

config/projects.js

// 🌐 Proyectos del frontend
export const FRONTEND = [
"frontend-web-app",
"frontend-admin-dashboard"
];

// 🔧 Proyectos del backend
export const BACKEND = [
"api-user-service",
"api-billing-service"
];

// 📱 Aplicaciones móviles
export const APP = [
"mobile-app-android",
"mobile-app-ios"
];

## 🚀 Uso

Ejecuta el script desde la raíz del proyecto pasando uno o más tipos definidos en projects.js:

node scripts/generateSonarReport.js frontend backend
Esto generará uno o más archivos .xlsx en la carpeta reportes, con nombre como:

sonarqube_reporte-frontend_2025-07-18.xlsx
sonarqube_reporte-backend_2025-07-18.xlsx

Cada archivo incluye métricas tanto de New Code como de Overall Code para cada proyecto listado.

🎨 Código de colores en el Excel
El archivo Excel generado pinta la fila del proyecto según su estado de salud:

🟩 Verde → Saludable (OK)

🟨 Amarillo → Advertencia (moderado)

🟥 Rojo → Crítico (problemas graves)

Estos colores se definen en base a las métricas en config.js.

## 👤 Autor

Juan Sebastián Báez Bolaños
Desarrollador frontend Advanced – PRAGMA
📧 sebastian.baez@pragma.com.co

## 📝 Licencia

Este proyecto está abierto a personalización y uso interno dentro del equipo de PRAGMA.
