const express = require("express");
const app = express();
const expressSanitizer = require("express-sanitizer");
const connection = require("./database");
const bodyParser = require("body-parser");

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(expressSanitizer());

connection.connect(err => {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }

    console.log('connected as id ' + connection.threadId);
});

app.get("/", (req, res) => {
    res.redirect("tasks");
});

app.get("/tasks", (req, res) => {
    let project_id = 2;

    (async () => {
        let backlog = await query("select * from tasks where done = 0 and type = '0' and project_id = " + project_id);
        let ready = await query("select * from tasks where done = 0 and type = '1' and project_id = " + project_id);
        let progress = await query("select * from tasks where done = 0 and type = '2' and project_id = " + project_id);
        let done = await query("select * from tasks where done = 1 and project_id = " + project_id);
        let projectName = await query("select name from projects where id = " + project_id);
        let projectAbbr = await query("select abbr from projects where id = " + project_id);

        let tasks = {
            backlog: backlog,
            ready: ready,
            progress: progress,
            done: done,
            projectName: projectName[0].name,
            projectAbbr: projectAbbr[0].abbr
        }

        res.render("tasks/index", { tasks: tasks });
    })();

});

app.post("/tasks", (req, res) => {
    req.body.colIndex = req.sanitize(req.body.colIndex);
    req.body.currentProjectName = req.sanitize(req.body.currentProjectName);

    //0 = backlog | 1 = ready to do | 2 = in progress | 3 = done
    let colIndex = req.body.colIndex;
    let currentProjectName = req.body.currentProjectName;

    (async () => {
        let project_id = await query("SELECT id FROM projects WHERE name = '" + currentProjectName + "'");
        //grab the id from the RowDataPacket result
        project_id = project_id[0].id;

        if (project_id == undefined || project_id == null) {
            console.log("could not get project_id from project name: " + currentProjectName);
            return;
        }

        let result = await query("INSERT INTO tasks (task, type, project_id) VALUES (''," + colIndex + "," + project_id + ")");
        if (result) {
            res.send("" + result.insertId);
            console.log("new task id: " + result.insertId + " for project_id: " + project_id + ": " + currentProjectName);
        } else {
            res.send("error");
        }

    })();
});

app.delete("/tasks", (req, res) => {
    req.body.dbEntry = req.sanitize(req.body.dbEntry);
    let dbEntry = parseInt(req.body.dbEntry);

    (async () => {
        let result = await query("DELETE from tasks where id = " + dbEntry + " limit 1");
        if (result) {
            res.send("success");
            console.log("deleted task id: " + dbEntry);
        } else {
            res.send("error");
        }
    })();

});

app.listen(3000, () => {
    console.log("TaskManager served on port 3000.");
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