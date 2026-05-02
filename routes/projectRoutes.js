const express = require('express')

const router = express.Router()

const sqlite3 = require('sqlite3').verbose()

const db = new sqlite3.Database('./database/app.db')

router.get('/projects', (req, res) => {

  db.all(
    "SELECT * FROM projects",
    [],
    (err, projects) => {

      res.render('projects', {
        projects: projects || [],
        user: req.session.user
      })
    }
  )
})

router.post('/projects/create', (req, res) => {

  const { title, description } = req.body

  db.run(
    "INSERT INTO projects (title, description, createdBy) VALUES (?, ?, ?)",
    [title, description, req.session.user.id],
    () => {

      res.redirect('/projects')
    }
  )
})

module.exports = router