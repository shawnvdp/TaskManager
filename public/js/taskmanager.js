(function () {

    let newButtons = document.querySelectorAll("div.new");

    newButtons.forEach(newButton => {
        newButton.addEventListener("click", event => {
            newTask(newButton);
        });
    });

    let deleteButtons = document.querySelectorAll("button");

    deleteButtons.forEach(deleteButton => {
        deleteButton.addEventListener("click", event => {
            deleteTask(deleteButton);
        });
    });



    let projectNameArea = document.querySelector("div.project_name");
    let projectList = document.querySelector("div.project_list");

    projectNameArea.addEventListener("click", event => {
        projectList.classList.toggle("hidden");
    });

    let body = document.querySelector("body");

    body.addEventListener("click", event => {
        if (event.srcElement.parentElement == projectNameArea)
            return;

        //hide the projects dropdown if the element is visible and the body is clicked
        if (!projectList.classList.contains("hidden")) {
            projectList.classList.add("hidden");
        }

    });


})();

function deleteTask(el) {
    let parent = el.parentNode;
    let dbEntry = parent.dataset.entry;

    (async () => {
        try {
            let response = await sendData("DELETE", "http://localhost:3000/tasks", { dbEntry: dbEntry });
            if (response == "error") {
                console.log("error sending data to the server");
                return;
            }
            $(parent).remove();
        } catch (err) {
            console.log(err);
        }
    })();

}

function newTask(el) {
    let parent = el.parentNode;
    let columns = document.querySelectorAll("div.col");

    //check in which task column the user clicked the '+'
    let colIndex;
    columns.forEach((col, index) => {
        if (col == parent) {
            colIndex = index;
        }
    });

    let currentProjectName = document.querySelector("div.project_name span").textContent;

    //letting server know to insert a new task entry in db for current element's colIndex(add it to right col)
    (async () => {
        let response = await sendData("POST", "http://localhost:3000/tasks", { colIndex: colIndex, currentProjectName: currentProjectName });
        if (response == "error") {
            console.log("error sending data to the server");
            return;
        }
        //the id of the new task in the db
        let insertId = parseInt(response);

        //insert new task element after whichever '+' button the user clicked to display it at the top of the task list
        let createdEl = $("<div class='task' data-entry='" + insertId + "'><p></p><button type='submit'>delete</button></div>").insertAfter($(el));
        let parentTask = createdEl[0];
        let children = parentTask.childNodes;

        //give the new element's button an eventlistener for deletion
        children.forEach(child => {
            let childTag = child.tagName.toLowerCase();
            //look for the child's button element
            if (childTag == "button") {
                child.addEventListener("click", event => {
                    deleteTask(child);
                });
            }
        });
    })();
}

async function sendData(method, url, data) {
    return new Promise((resolve, reject) => {
        $.ajax({
            method: method,
            url: url,
            data: data,
            timeout: 300,

        })
            .done(res => {
                resolve(res);
            })
            .fail(err => {
                reject(err);
            });
    });

}