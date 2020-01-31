(function () {

    let columns = document.querySelectorAll("div.col");

    let newButtons = document.querySelectorAll("div.new");

    newButtons.forEach(newButton => {
        newButton.addEventListener("click", event => {
            newTask(newButton, columns);
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

function newTask(el, columns) {
    let parent = el.parentNode;

    //check which task column the user clicked the '+' in
    let colIndex;
    columns.forEach((col, index) => {
        if (col == parent) {
            colIndex = index;
        }
    });

    //letting server know to insert a new task entry in db for current element's colIndex
    (async () => {
        let response = await sendData("POST", "http://localhost:3000/tasks", { colIndex: colIndex });
        if (response == "error") {
            console.log("error sending data to the server");
            return;
        }
        let insertId = parseInt(response);

        //insert new task element after whichever '+' button the user clicked to display it at the top of the task list
        $("<div class='task' data-entry='" + insertId + "'><p></p></div>").insertAfter($(el));
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