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
    (async () => {
        let backlog = await query("select * from tasks where done = 0 and type = '0'");
        let ready = await query("select * from tasks where done = 0 and type = '1'");
        let progress = await query("select * from tasks where done = 0 and type = '2'");
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

app.post("/tasks", (req, res) => {
    req.body.colIndex = req.sanitize(req.body.colIndex);
    //0 = backlog | 1 = ready to do | 2 = in progress | 3 = done
    let colIndex = req.body.colIndex;
    (async () => {
        let result = await query("INSERT INTO `task_manager`.`tasks` (`task`, `type`) VALUES ('', '" + colIndex + "');")
        if (result)
            res.send("success");
        else
            res.send("error");
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