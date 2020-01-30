const express = require("express");
const app = express();
const expressSanitizer = require("express-sanitizer");

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

app.use(expressSanitizer());


app.get("/", (req, res) => {
    res.redirect("tasks");
});

app.get("/tasks", (req, res) => {
    res.render("tasks/index");
});

app.listen(3000, () => {
    console.log("TaskManager served on port 3000.");
});