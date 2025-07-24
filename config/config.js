export const CONFIG = {
  username: "usuario-sonar", // 🔐 reemplaza con tu usuario de Sonar
  password: "token-o-clave", // 🔐 reemplaza con tu token de autenticación
  baseUrl: "https://sonarqube.tuempresa.com", // 🌐 URL de tu instancia SonarQube
  branch: "develop", // 🌿 rama por defecto
  outputFolder: "reportes", // 📁 carpeta donde se genera el Excel

  healthThresholds: {
    coverage: {
      yellow: 50,
      green: 80,
    },
    duplications: {
      yellow: 10,
      green: 5,
    },
    issues: {
      yellow: 20,
      green: 5,
    },
    hotspots: {
      yellow: 10,
      green: 5,
    },
    rating: {
      yellow: 2, // 1=A, 2=B, 3=C...
    },
  },
};
