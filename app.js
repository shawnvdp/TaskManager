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
    let defaultProject = "TaskManager";
    (async () => {
        let project_id = await getIdByProjectName(defaultProject);
        project_id = project_id[0].id;
        let tasks = await constructProjectObjectFromId(project_id);

        res.render("project/index", { tasks: tasks });
    })();
});

app.get("/project/:name", (req, res) => {
    req.body.dbEntry = req.sanitize(req.body.dbEntry);
    let name = req.params.name;

    (async () => {
        let project_id = await getIdByProjectName(name);
        project_id = project_id[0].id;
        let tasks = await constructProjectObjectFromId(project_id);

        res.render("project/refreshProject", { tasks: tasks });
    })();

});

app.post("/project/:name", (req, res) => {
    req.body.colIndex = req.sanitize(req.body.colIndex);
    req.params.name = req.sanitize(req.params.name);

    //0 = backlog | 1 = ready to do | 2 = in progress | 3 = done
    let colIndex = req.body.colIndex;
    let currentProjectName = req.params.name;

    (async () => {
        let project_id = await getIdByProjectName(currentProjectName);
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

app.delete("/project/:name/:taskId", (req, res) => {
    req.params.name = req.sanitize(req.params.name);
    req.params.taskId = req.sanitize(req.params.taskId);

    let name = req.params.name;
    let taskId = parseInt(req.params.taskId);

    (async () => {
        let result = await deleteTaskById(taskId);
        if (result) {
            res.send("success");
            console.log("deleted task id: " + taskId);
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

async function getIdByProjectName(name) {
    return query("SELECT id FROM projects WHERE name = '" + name + "'");
}

async function deleteTaskById(id) {
    return query("DELETE from tasks where id = " + id + " limit 1");
}

async function constructProjectObjectFromId(id) {
    let backlog = await query("select * from tasks where done = 0 and type = '0' and project_id = " + id);
    let ready = await query("select * from tasks where done = 0 and type = '1' and project_id = " + id);
    let progress = await query("select * from tasks where done = 0 and type = '2' and project_id = " + id);
    let done = await query("select * from tasks where done = 1 and project_id = " + id);
    let projectName = await query("select name from projects where id = " + id);
    let projectAbbr = await query("select abbr from projects where id = " + id);
    let projects = await query("select * from projects");

    let tasks = {
        backlog: backlog,
        ready: ready,
        progress: progress,
        done: done,
        projectName: projectName[0].name,
        projectAbbr: projectAbbr[0].abbr,
        projects: projects
    }

    return tasks;
}