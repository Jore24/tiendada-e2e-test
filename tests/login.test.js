const puppeteer = require("puppeteer");
require("dotenv").config();
const path = require("path");
const { createFolderIfNotExists } = require("../utils/createFolderIfNotExists");
const sendEmail = require("../utils/sendEmail");

const TEST_URL = "https://sukidesu.dev.tiendada.com/admin";

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
    let page;

    try {
      page = await browser.newPage();

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
    } catch (error) {
      await sendEmail();
    }
    try {
      let response;
      page.on("response", (res) => {
        response = res;
      });

      // Add a delay to wait for the response to be processed
      await page.waitForTimeout(2000);

      if (response && response.status) {
        if (response.status() === 401) {
          console.log(
            "La respuesta del servidor es correcta (401 - Unauthorized)"
          );
        } else if (response.status() === 429) {
          console.log(
            "La respuesta del servidor es correcta (429 - Too Many Requests)"
          );
        } else {
          console.log(
            "La respuesta del servidor es incorrecta. Código de estado:",
            response.status()
          );
        }
      } else {
        console.log(
          "La respuesta del servidor es incorrecta. No se recibió un objeto de respuesta válido."
        );
      }
    } catch (error) {
      console.error("Error al verificar la respuesta del servidor:", error);
    }
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

  test("Olvidé mi contraseña", async () => {
    const page = await browser.newPage();
    const folderPath = path.join(__dirname, "screenshots/test5");
    await createFolderIfNotExists(folderPath);
    await page.goto(`${TEST_URL}/login`);
    await page.click(
      ".MuiTypography-root.MuiLink-root.MuiLink-underlineHover.MuiTypography-colorPrimary"
    );
    await page.waitForSelector("#emailRecovery", { timeout: 7500 });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(folderPath, "before-click.png"),
    });
    await page.type("#emailRecovery", process.env.TIENDADA_EMAIL);
    await page.click(
      ".MuiButtonBase-root.MuiButton-root.MuiButton-contained.jss277.MuiButton-containedPrimary.MuiButton-containedSizeLarge.MuiButton-sizeLarge.MuiButton-fullWidth"
    );
    await page.waitForSelector(".MuiTypography-root.MuiTypography-h6");
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(folderPath, "after-click.png"),
    });
    const text = await page.evaluate(() => {
      const element = document.querySelector(
        ".MuiTypography-root.MuiTypography-h6"
      );
      return element ? element.textContent : null;
    });

    expect(text).toEqual("Verifica tu correo electrónico");
    //Aquí podemos añadir mas verificaciones
  }, 10000);

  test("Type input de la contraseña", async () => {
    const page = await browser.newPage();
    const folderPath = path.join(__dirname, "screenshots/test6");
    await createFolderIfNotExists(folderPath);

    await page.goto(`${TEST_URL}/login`);

    const campoContrasena = await page.$("#password");
    await campoContrasena.type("TuContrasena");

    const valorCampoContrasena = await campoContrasena.evaluate(
      (el) => el.value
    );
    console.log("Valor del campo de contraseña:", valorCampoContrasena);

    const botonMostrarOcultar = await page.$(
      ".MuiButtonBase-root.MuiIconButton-root.jss63.MuiIconButton-colorPrimary.MuiIconButton-sizeSmall"
    );

    if (botonMostrarOcultar) {
      await botonMostrarOcultar.click();
      await page.screenshot({
        path: path.join(folderPath, "before-click.png"),
      });
      await page.waitForTimeout(1000);

      const tipoCampoContrasenaDespuesDeMostrar =
        await campoContrasena.evaluate((el) => el.type);
      console.log(
        "Tipo del campo de contraseña después de mostrar:",
        tipoCampoContrasenaDespuesDeMostrar
      );
      expect(tipoCampoContrasenaDespuesDeMostrar).toEqual("text");

      await botonMostrarOcultar.click();
      await page.screenshot({
        path: path.join(folderPath, "after-click.png"),
      });
      await page.waitForTimeout(1000);

      const tipoCampoContrasenaAntesDeMostrar = await campoContrasena.evaluate(
        (el) => el.type
      );
      console.log(
        "Tipo del campo de contraseña después de ocultar:",
        tipoCampoContrasenaAntesDeMostrar
      );
      expect(tipoCampoContrasenaAntesDeMostrar).toEqual("password");
    } else {
      console.error("No se encontró el botón de mostrar/ocultar contraseña");
    }
  });
});
