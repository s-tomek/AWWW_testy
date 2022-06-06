import { promises as fsp } from "fs";
import { equal } from "assert";
import { Builder, Capabilities } from "selenium-webdriver";
import { fun, asyncfun } from "./example.mjs";
import { get_db_memory } from "../database/database.mjs";
import { init_func } from "../database/init_db.mjs";
import { get_wycieczka, get_all_wycieczki } from "../database/queries.mjs";
import { assert, expect }  from 'chai';
import wycieczka from "../database/wycieczka.mjs";
import { isTypedArray } from "util/types";

export async function takeScreenshot(driver, file) {
  const image = await driver.takeScreenshot();
  await fsp.writeFile(file, image, "base64");
}


// describe("Async function", () => {
//   it("should output string equal to 'atest'", async () => {
//     const a = await asyncfun();
//     console.log(a);
//     equal(a, "atest");
//   });
// });

// describe("Selenium test", () => {
//   const TIMEOUT = 30000;
//   const driver = new Builder().withCapabilities(Capabilities.firefox()).build();


//   before(async () => {
//     await driver
//       .manage()
//       .setTimeouts({ implicit: TIMEOUT, pageLoad: TIMEOUT, script: TIMEOUT });
//   });

//   it("should go to google.com and check title", async () => {
//     await driver.get("https://www.google.com");
//     // await takeScreenshot(driver, "test.png");
//     // const title = await driver.getTitle();
//     // console.log("title", title);
//     // equal(title, "Google");
//   });

  
//   // it("should go to Biuro podróży and check title", async () => {
//   //   await driver.get("http://localhost:3000/");
//   //   await takeScreenshot(driver, "test.png");
//   //   const title = await driver.getTitle();
//   //   console.log(title);
//   // });
//   after(() => driver.quit());
// });


// describe("Selenium tests", function() {
//   this.timeout(5000)
//   let driver = {}
//   before(async () => {
//     driver = new Builder().withCapabilities(Capabilities.firefox()).build();
//   })

//   it("check title", async function() {
//     await driver.get("http://localhost:3000");
//     await takeScreenshot(driver, "test.png");
//     const title = await driver.getTitle();
//     expect(title).equal('Biuro podróży');
//   })

//   // it("check smth");

//   after(() => {driver.quit();})
// });

