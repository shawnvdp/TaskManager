const express = require("express");
const app = express();
const expressSanitizer = require("express-sanitizer");
const connection = require("./database");

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

app.use(expressSanitizer());

connection.connect(err => {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }

    console.log('connected as id ' + connection.threadId);
});

async function query(queryString) {
    return new Promise((resolve, reject) => {
        connection.query(queryString, (err, rows) => {
            if (err)
                return reject(err);
            resolve(rows);

        });
    });
}

app.get("/", (req, res) => {
    res.redirect("tasks");
});

app.get("/tasks", (req, res) => {
    (async () => {
        let backlog = await query("select * from tasks where done = 0 and tasks.type = 'backlog'");
        let ready = await query("select * from tasks where done = 0 and tasks.type = 'ready'");
        let progress = await query("select * from tasks where done = 0 and tasks.type = 'progress'");
        let done = await query("select * from tasks where done = 1");

        let tasks = {
            backlog: backlog,
            ready: ready,
            progress: progress,
            done: done
        }

        res.render("tasks/index", { tasks: tasks });
    })();

});

app.listen(3000, () => {
    console.log("TaskManager served on port 3000.");
});