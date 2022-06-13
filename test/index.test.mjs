/* eslint-disable */

import { assert, expect }  from 'chai';
import { By, Builder, Capabilities, withTagName } from "selenium-webdriver";
import { init_func } from '../database/init_db.mjs';
import { get_db_postgres } from "../database/database.mjs"
import { promises as fsp } from "fs";


async function fill_form(driver, first_name_input, last_name_input, phone_input, email_input, n_people_input) {
    let first_name = await driver.findElement(By.name("first_name"));
    await first_name.sendKeys(first_name_input);
    let last_name = await driver.findElement(By.name("last_name"));
    await last_name.sendKeys(last_name_input);
    let phone = await driver.findElement(By.name("phone"));
    await phone.sendKeys(phone_input);
    let email = await driver.findElement(By.name("email"));
    await email.sendKeys(email_input);
    let n_people = await driver.findElement(By.name("n_people"));
    await n_people.sendKeys(n_people_input);
    await driver.findElement(By.name("gdpr_permission")).click();

}

async function takeScreenshot(driver, file) {
    const image = await driver.takeScreenshot();
    await fsp.writeFile(file, image, "base64");
  }


async function rec_check_for_dead_links(driver, address, visited) {
    visited.add(address);
    await driver.get(address);
    let allURLs = await driver.findElements(By.css("a")); 
    let ix = 0;
    for (let link of allURLs) {
        let all_new_URLs = await driver.findElements(By.css("a")); // żeby link dalej istniał po odświeżeniu strony
        await all_new_URLs[ix].click();
        
        let bodyText = await driver.findElement(By.css("body")).getText();
        if (check_for(bodyText, /Wystąpił błąd/)) return true;
        
        if (!visited.has(await driver.getCurrentUrl())) {
            if (await rec_check_for_dead_links(driver, await driver.getCurrentUrl(), visited)) return true;
        }

        await driver.get(address);
        ix += 1;
    }
    return false;
}


function check_for(text, pattern) {
    if (text.match(pattern) == null) return false;
    else return true;
}



describe("form tests", function() {
    this.timeout(9000);
    let driver = {}
    let very_long_string = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    before(async () => {
        driver = new Builder().withCapabilities(Capabilities.firefox()).build();
        await get_db_postgres().then(async (db) => {
        await init_func(db);
      });
    });

    it("correctly redirects after correct input", async () => {
        await driver.get("http://localhost:3000/book/2");
        console.log(await driver.getCurrentUrl());
        await takeScreenshot(driver, "screen1.png");
        await fill_form(driver, "Musztarda", "Sarepska", "123456789", "Musztarda@gmail.com", 1);
        await driver.findElement(By.id("submitid")).click();
        expect(await driver.getCurrentUrl()).to.equal("http://localhost:3000/book-success/2")
    })

    it("reacts to wrong phone number", async () => {
        await driver.get("http://localhost:3000/book/2");
        await fill_form(driver, "Musztarda", "Sarepska", "999", "Musztarda@gmail.com", 1);
        await driver.findElement(By.id("submitid")).click();
        expect(await driver.getCurrentUrl()).to.equal("http://localhost:3000/book/2")
    });

    it("reacts to empty name", async () => {
        await driver.get("http://localhost:3000/book/2");
        await fill_form(driver, "", "Sarepska", "123123123", "Musztarda@gmail.com", 1);
        await driver.findElement(By.id("submitid")).click();
        expect(await driver.getCurrentUrl()).to.equal("http://localhost:3000/book/2")
    });

    it("reacts to very long name", async () => {
        await driver.get("http://localhost:3000/book/2");
        await fill_form(driver, very_long_string, "Sarepska", "123123123", "Musztarda@gmail.com", 1);
        await driver.findElement(By.id("submitid")).click();
        expect(await driver.getCurrentUrl()).to.equal("http://localhost:3000/book/2")
    });

    it("reacts to empty surname", async () => {
        await driver.get("http://localhost:3000/book/2");
        await fill_form(driver, "Musztarda", "", "123123123", "Musztarda@gmail.com", 1);
        await driver.findElement(By.id("submitid")).click();
        expect(await driver.getCurrentUrl()).to.equal("http://localhost:3000/book/2")
    });

    it("reacts to very long surname", async () => {
        await driver.get("http://localhost:3000/book/2");
        await fill_form(driver, "Musztarda", very_long_string, "123123123", "Musztarda@gmail.com", 1);
        await driver.findElement(By.id("submitid")).click();
        expect(await driver.getCurrentUrl()).to.equal("http://localhost:3000/book/2")
    });

    it("reacts to empty email", async () => {
        await driver.get("http://localhost:3000/book/2");
        await fill_form(driver, "Musztarda", "Sarepska", "123123123", "", 1);
        await driver.findElement(By.id("submitid")).click();
        expect(await driver.getCurrentUrl()).to.equal("http://localhost:3000/book/2")
    });

    it("reacts to incorrect email - incorrect domain", async () => {
        await driver.get("http://localhost:3000/book/2");
        await fill_form(driver, "Musztarda", "Sarepska", "123123123", "Musztarda@domanwithoutdotcom", 1);
        await driver.findElement(By.id("submitid")).click();
        expect(await driver.getCurrentUrl()).to.equal("http://localhost:3000/book/2")
    });

    it("reacts to incorrect email - no @ character", async () => {
        await driver.get("http://localhost:3000/book/2");
        await fill_form(driver, "Musztarda", "Sarepska", "123123123", "Musztarda", 1);
        await driver.findElement(By.id("submitid")).click();
        expect(await driver.getCurrentUrl()).to.equal("http://localhost:3000/book/2")
    });

    it("reacts to too many participants", async () => {
        await driver.get("http://localhost:3000/book/2");
        await fill_form(driver, "Musztarda", "Sarepska", "123123123", "Musztarda@gmail.com", 20);
        await driver.findElement(By.id("submitid")).click();
        expect(await driver.getCurrentUrl()).to.equal("http://localhost:3000/book/2")
    });

    it("reacts to non integer number of participants", async () => {
        await driver.get("http://localhost:3000/book/2");
        await fill_form(driver, "Musztarda", "Sarepska", "123123123", "Musztarda@gmail.com", 2.5);
        await driver.findElement(By.id("submitid")).click();
        expect(await driver.getCurrentUrl()).to.equal("http://localhost:3000/book/2")
    });

    it("reacts to negative integer number of participants", async () => {
        await driver.get("http://localhost:3000/book/2");
        await fill_form(driver, "Musztarda", "Sarepska", "123123123", "Musztarda@gmail.com", -1);
        await driver.findElement(By.id("submitid")).click();
        expect(await driver.getCurrentUrl()).to.equal("http://localhost:3000/book/2")
    });

    after(async () => driver.quit());
});

describe("error page tests", async function() {
    this.timeout(7000);
    let driver = {}
    before(async () => {
      driver = new Builder().withCapabilities(Capabilities.firefox()).build();
    });

    it("checks error page for random address", async() => {
        await driver.get("http://localhost:3000/egdbsfbbs");
        let error_msg = await driver.findElement(By.id("error_msg"));
        expect(await error_msg.getText()).equal("Nie znaleziono strony o podanym adresie!");
    })

    it("checks error page for non existing trip", async() => {
        await driver.get("http://localhost:3000/trip/4");
        let error_msg = await driver.findElement(By.id("error_msg"));
        expect(await error_msg.getText()).equal("Nie znaleziono strony o podanym adresie!");
    })

    after(async () => driver.quit());
});

describe("links tests", async function() {
    this.timeout(60000);
    let driver = {}
    before(async () => {
      driver = new Builder().withCapabilities(Capabilities.firefox()).build();
    });

    it("checks if there are dead links on any page", async() => {
        const visited = new Set();
        expect(await rec_check_for_dead_links(driver,"http://localhost:3000/", visited)).equal(false);
    })

    after(async () => driver.quit());
});


describe("main page test", async function() {
    this.timeout(25000);
    let driver = {}
    
    before(async () => {
      driver = new Builder().withCapabilities(Capabilities.firefox()).build();
    });

    it("simple registration following links on page", async () => {
        await driver.get("http://localhost:3000");
        let reservation_link = await driver.findElement(By.xpath("//*[text()='Zarezerwuj']"));
        await reservation_link.click();
        await fill_form(driver, "Musztarda", "Sarepska", "123456789", "Musztarda@gmail.com", 1);
        await driver.findElement(By.id("submitid")).click();
        expect(await driver.getCurrentUrl()).includes("http://localhost:3000/book-success/")
    })

    it("the trips are displayed in correct order", async () => {
        await driver.get("http://localhost:3000");
        let trips = await driver.findElements(By.className("trip"));
        let text1 = await trips[0].getText();
        expect(await text1.includes('Miasto')).equal(true);
        let text2 = await trips[1].getText();
        expect(await text2.includes('Góry')).equal(true);
    })

    after(async () => driver.quit());
});


