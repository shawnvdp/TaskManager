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

    //check which task column the user clicked the '+' in
    let colIndex;
    columns.forEach((col, index) => {
        if (col == parent) {
            colIndex = index;
        }
    });

    //letting server know to insert a new task entry in db for current element's colIndex(add it to right col)
    (async () => {
        let response = await sendData("POST", "http://localhost:3000/tasks", { colIndex: colIndex });
        if (response == "error") {
            console.log("error sending data to the server");
            return;
        }
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
                this.addEventListener("click", event => {
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