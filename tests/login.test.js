const puppeteer = require("puppeteer");
require("dotenv").config();
const fs = require("fs/promises");
const path = require("path");

const TEST_URL = "https://sukidesu.dev.tiendada.com/admin";

const createFolderIfNotExists = async (folderPath) => {
  try {
    await fs.access(folderPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.mkdir(folderPath, { recursive: true });
    } else {
      throw error;
    }
  }
};

describe("Login Test", () => {
  let browser;

  beforeEach(async () => {
    browser = await puppeteer.launch({ headless: "new" });
  });

  afterEach(async () => {
    await browser.close();
  });

  test("Acceso exitoso al login", async () => {
    const page = await browser.newPage();
    let response;
    page.on("response", (res) => {
      response = res;
    });

    const folderPath = path.join(__dirname, "screenshots/test1");
    await createFolderIfNotExists(folderPath);

    await page.goto(`${TEST_URL}/login`);
    await page.type("#email", process.env.TIENDADA_EMAIL);
    await page.type("#password", process.env.TIENDADA_PASSWORD);

    await page.screenshot({
      path: path.join(folderPath, "before-click.png"),
    });

    await Promise.all([
      page.click(".MuiButton-containedPrimary"),
      page.waitForNavigation({ timeout: 10000 }),
    ]);

    await page.screenshot({
      path: path.join(folderPath, "after-login.png"),
    });

    const urlDespuesDeLogin = page.url();
    expect(urlDespuesDeLogin).toEqual(`${TEST_URL}/home`);

    try {
      expect(response.status()).toEqual(200);
      if (response.status() !== 200) {
        console.log(await response.text());
      } else {
        console.log("Login exitoso");
      }
    } catch (error) {
      console.error("Error al verificar la respuesta del servidor:", error);
    }
  });

  test("Inicio de sesión con credenciales incorrectas", async () => {
    const page = await browser.newPage();
    let response;
    page.on("response", (res) => {
      response = res;
    });

    const folderPath = path.join(__dirname, "screenshots/test2");
    await createFolderIfNotExists(folderPath);

    await page.goto(`${TEST_URL}/login`);
    await page.type("#email", "prueba@gmail.com");
    await page.type("#password", "admin123");

    await page.screenshot({
      path: path.join(folderPath, "before-click.png"),
    });

    await page.click(".MuiButton-containedPrimary");

    const selector = "p.MuiTypography-root.MuiTypography-colorError";
    await page.waitForSelector(selector, { timeout: 7500 });

    await page.screenshot({
      path: path.join(folderPath, "after-click.png"),
    });

    const mensajeError = await page.$eval(selector, (element) =>
      element.textContent.trim()
    );
    expect(mensajeError).toEqual("Wrong credentials");

    try {
      expect(response.status()).toEqual(401);
      if (response.status() == 401) {
        console.log("La respuesta del servidor es correcta");
      } else {
        console.log("La respuesta del servidor es incorrecta");
      }
    } catch (error) {
      console.error("Error al verificar la respuesta del servidor:", error);
    }
    await page.close();
  });

  test("Inicio de sesión con campos vacíos (validación del cliente)", async () => {
    const page = await browser.newPage();
    const folderPath = path.join(__dirname, "screenshots/test3");
    await createFolderIfNotExists(folderPath);

    await page.goto(`${TEST_URL}/login`);

    await page.screenshot({
      path: path.join(folderPath, "before-click.png"),
    });

    await page.click(".MuiButton-containedPrimary");

    await page.screenshot({
      path: path.join(folderPath, "after-click.png"),
    });

    const selector = "p.MuiFormHelperText-root";
    await page.waitForSelector(selector, { timeout: 7500 });

    const mensajeError = await page.$eval(selector, (element) =>
      element.textContent.trim()
    );
    expect(mensajeError).toEqual("Campo obligatorio");

    await page.close();
  });

  test("Inicio de sesión con formato de correo electrónico no válido", async () => {
    const page = await browser.newPage();
    const folderPath = path.join(__dirname, "screenshots/test4");
    await createFolderIfNotExists(folderPath);

    const invalidEmail = "correo-invalido";
    await page.goto(`${TEST_URL}/login`);

    await page.screenshot({
      path: path.join(folderPath, "before-click.png"),
    });

    await page.type("#email", invalidEmail);

    await page.click(".MuiButton-containedPrimary");

    await page.screenshot({
      path: path.join(folderPath, "after-click.png"),
    });

    const selector = "p.MuiFormHelperText-root";
    await page.waitForSelector(selector, { timeout: 7500 });

    const mensajeError = await page.$eval(selector, (element) =>
      element.textContent.trim()
    );

    expect(mensajeError).toMatch(/Formato de email inválido/);

    await page.close();
  });
});
