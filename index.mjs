import express, { static as _static } from "express";
import _body_parser from "body-parser";
import { ValidationError } from "sequelize";
import { check, validationResult } from "express-validator";
import { get_db_postgres } from "./database/database.mjs";
import { get_all_wycieczki, get_wycieczka } from "./database/queries.mjs";

// ssh -L 11212:lkdb:5432 students

const { urlencoded, json } = _body_parser;

export const app = express();
const port = 3000;

app.set("view engine", "pug");
app.set("views", "./views");
app.use(_static("public"));

app.use(urlencoded({ extended: false }));
app.use(json());

get_db_postgres().then((db) => {
  app.get("/", async (req, res, next) => {
    const all = await get_all_wycieczki(db);
    res.render("main", { trips: all });
  });

  const with_wycieczka =
    (init_transaction = false) =>
    async (req, res, next) => {
      let t = null;
      if (init_transaction) t = await db.sequelize.transaction();
      const { wycieczka, zgloszenia } = await get_wycieczka(db, req.params.id, t);
      if (!wycieczka) {
        next(new Error(`Nie można odnaleźć wycieczki z id: ${req.params.id}`));
      }
      res.locals.trip = wycieczka;
      res.locals.t = t;
      return next();
    };

  app.get("/trip/:id(\\d+)", with_wycieczka(), async (req, res, next) => {
    res.render("trip", { trip: res.locals.trip });
  });

  app.get("/book/:id(\\d+)", with_wycieczka(), async (req, res, next) => {
    console.log('WIOOWIW');
    res.render("book", { trip: res.locals.trip });
  });

  function parseErrors(mapped) {
    const parsed = {};
    Object.keys(mapped).forEach((key) => {
      parsed[`${key}_error`] = mapped[key].msg;
    });
    return parsed;
  }

  async function withCommit(t, callback) {
    await t.commit();
    return callback();
  }

  async function withRollback(t, callback) {
    await t.rollback();
    return callback();
  }

  app.post(
    "/book/:id(\\d+)",
    with_wycieczka(true),
    check("email").isEmail().withMessage("Proszę wpisać poprawny email!"),
    check("first_name").notEmpty().withMessage("Imię nie może być puste!"),
    check("last_name").notEmpty().withMessage("Nazwisko nie może być puste!"),
    check("n_people")
      .isInt({ min: 0 })
      .withMessage("Liczba zgłoszeń musi być większa od 0!"),
    async (req, res, next) => {
      const { trip } = res.locals;
      const { t } = res.locals;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return withRollback(t, () =>
          res.render("book", { ...{ trip }, ...parseErrors(errors.mapped()) })
        );
      }
      if (req.body.n_people > trip.liczba_dostepnych_miejsc) {
        return withRollback(t, () =>
          res.render("book", {
            trip,
            error_info: "Brak wystarczającej liczby wolnych miejsc!",
          })
        );
      }
      try {
        const zgloszenie = await db.Zgloszenie.create(
          {
            imie: req.body.first_name,
            nazwisko: req.body.last_name,
            email: req.body.email,
            liczba_miejsc: req.body.n_people,
          },
          { transaction: t }
        );
        await trip.addZgloszenie(zgloszenie);
        trip.liczba_dostepnych_miejsc -= req.body.n_people;
        await trip.save({ transaction: t });
        return withCommit(t, () =>
          res.redirect(`/book-success/${req.params.id}`)
        );
      } catch (error) {
        if (error instanceof ValidationError) {
          return withRollback(t, () =>
            res.render("book", {
              trip,
              error_info: "Wprowadzono niepoprawne dane!",
            })
          );
        }
        return withRollback(t, () =>
          res.render("book", { trip, error_info: "Nieznany błąd!" })
        );
      }
    }
  );

  app.get(
    "/book-success/:id(\\d+)",
    with_wycieczka(),
    async (req, res, next) => {
      res.render("book", {
        trip: res.locals.trip,
        info: "Z powodzeniem zarezerwowano wycieczkę!",
      });
    }
  );

  app.use((err, req, res) => {
    res.render("error", { error: err });
  });

  app.use((err, req, res, next) => {
    res.render("error", { error: "Nie znaleziono strony o podanym adresie!" });
  });

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
});
