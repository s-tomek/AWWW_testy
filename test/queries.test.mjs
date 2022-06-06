import { get_db_memory } from "../database/database.mjs";
import { init_func } from "../database/init_db.mjs";
import { get_wycieczka, get_all_wycieczki } from "../database/queries.mjs";
import { assert, expect }  from 'chai';
import * as sinon from 'sinon';



describe("Database test: get_all_wycieczki tests", () => {
    let database = {};
    let result = {};
  
    before(async () => {
        database = await get_db_memory(); 
        await init_func(database);
    });

    it("function should return trips happening in the future", async () => {
        result = await get_all_wycieczki(database);
        expect(result.length).equal(2);
    });
  
    it("function should return the same trips as in database", async () => {
        result = await get_all_wycieczki(database);
        expect(result[0].dataValues.nazwa).equal('Miasto');
        expect(result[1].dataValues.nazwa).equal('Góry');
    })
  
    it("function should work in the future as well", async function() {
        this.clock = sinon.useFakeTimers(new Date(2050, 5, 5).getTime());
        result = await get_all_wycieczki(database);
        expect(result.length).equal(0);
        this.clock.restore();
    });
  

  })
  
// describe("Database test: get_wycieczka tests", () => {
//     let database = {};
//     before(async () => {
//       database = await get_db_memory(); 
//       await init_func(database);
//     });
   
//     it("database should have proper record with pk = 1", async () => {
//       let result = await get_wycieczka(database, 1);
//       expect(result.wycieczka.dataValues.id).equal(1);
//       expect(result.wycieczka.dataValues.nazwa).equal('Miasto');
//     });
//   })