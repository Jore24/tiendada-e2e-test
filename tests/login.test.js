const puppeteer = require("puppeteer");
require("dotenv").config();

const TEST_URL = "https://sukidesu.dev.tiendada.com/admin/";
describe("Login Test", () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: "new" });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  test("Acceso exitoso al login", async () => {
    await page.goto(`${TEST_URL}login`);
    await page.type("#email", process.env.TIENDADA_EMAIL);
    await page.type("#password", process.env.TIENDADA_PASSWORD);

    await Promise.all([
      page.click(".MuiButton-containedPrimary"),
      page.waitForNavigation({ timeout: 10000 }),
    ]);

    const urlDespuesDeLogin = page.url();
    expect(urlDespuesDeLogin).toEqual(`${TEST_URL}home`);
  });
});
