const express = require('express')

const router = express.Router()

const sqlite3 = require('sqlite3').verbose()

const db = new sqlite3.Database('./database/app.db')

router.get('/tasks', (req, res) => {

  db.all(
    `
    SELECT
      tasks.*,
      users.username,
      projects.title as projectTitle

    FROM tasks

    LEFT JOIN users
    ON tasks.assignedTo = users.id

    LEFT JOIN projects
    ON tasks.projectId = projects.id
    `,
    [],
    (err, tasks) => {

      db.all(
        "SELECT * FROM users",
        [],
        (err, users) => {

          db.all(
            "SELECT * FROM projects",
            [],
            (err, projects) => {

              res.render('tasks', {
                tasks: tasks || [],
                users: users || [],
                projects: projects || [],
                user: req.session.user
              })
            }
          )
        }
      )
    }
  )
})

router.post('/tasks/create', (req, res) => {

  const {
    title,
    description,
    status,
    priority,
    dueDate,
    projectId,
    assignedTo
  } = req.body

  db.run(
    `
    INSERT INTO tasks
    (
      title,
      description,
      status,
      priority,
      dueDate,
      projectId,
      assignedTo
    )

    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      title,
      description,
      status,
      priority,
      dueDate,
      projectId,
      assignedTo
    ],
    () => {

      res.redirect('/tasks')
    }
  )
})

module.exports = router