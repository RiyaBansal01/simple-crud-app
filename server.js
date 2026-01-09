const express = require("express");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();

// ================= DATABASE SETUP =================
const db = new sqlite3.Database("./database/app.db");

db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )
  `);

  // Items table
  db.run(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT
    )
  `);
});

// ================= APP CONFIG =================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: "virtu-box-secret",
    resave: false,
    saveUninitialized: false,
  })
);

// ================= MIDDLEWARE =================
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

// ================= ROUTES =================

// Home route
app.get("/", (req, res) => {
  req.session.user ? res.redirect("/dashboard") : res.redirect("/login");
});

// ---------------- LOGIN ----------------
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get(
    "SELECT id FROM users WHERE username = ? AND password = ?",
    [username, password],
    (err, row) => {
      if (err || !row) {
        return res.render("login", {
          error: "Invalid username or password",
        });
      }

      req.session.user = row.id;
      res.redirect("/dashboard");
    }
  );
});

// ---------------- SIGNUP ----------------
app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", (req, res) => {
  const { username, password } = req.body;

  db.run(
    "INSERT INTO users (username, password) VALUES (?, ?)",
    [username, password],
    function (err) {
      if (err) {
        return res.render("signup", {
          error: "Account already exists. Please log in.",
        });
      }
      res.redirect("/login");
    }
  );
});

// ---------------- LOGOUT ----------------
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// ---------------- DASHBOARD ----------------
app.get("/dashboard", requireLogin, (req, res) => {
  db.all(
    "SELECT * FROM items WHERE user_id = ?",
    [req.session.user],
    (err, items) => {
      res.render("dashboard", { items: items || [] });
    }
  );
});

// ---------------- CRUD ----------------

// Add item
app.post("/add", requireLogin, (req, res) => {
  db.run(
    "INSERT INTO items (user_id, name) VALUES (?, ?)",
    [req.session.user, req.body.name],
    (err) => {
      if (err) console.error(err);
      res.redirect("/dashboard");
    }
  );
});

// Edit item
app.post("/edit/:id", requireLogin, (req, res) => {
  db.run(
    "UPDATE items SET name = ? WHERE id = ? AND user_id = ?",
    [req.body.name, req.params.id, req.session.user],
    (err) => {
      if (err) console.error(err);
      res.redirect("/dashboard");
    }
  );
});

// Delete item
app.post("/delete/:id", requireLogin, (req, res) => {
  db.run(
    "DELETE FROM items WHERE id = ? AND user_id = ?",
    [req.params.id, req.session.user],
    (err) => {
      if (err) console.error(err);
      res.redirect("/dashboard");
    }
  );
});

// ================= SERVER START =================
app.listen(3000, () => {
  console.log("App running at http://localhost:3000");
});
