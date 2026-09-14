const fileInput = document.getElementById("csvFile");
const status = document.getElementById("status");
const summary = document.getElementById("summary");
const tableContainer = document.getElementById("tableContainer");

/*
Listen for a CSV file being selected.
*/

fileInput.addEventListener("change", function () {

const file = fileInput.files[0];

if (!file) {
    return;
}

resetDisplay();

status.textContent = "Reading file...";
status.className = "status";


const reader = new FileReader();


reader.onload = function (event) {

    const text = event.target.result;


    if (!text.trim()) {

        status.textContent = "The CSV file is empty.";
        status.className = "status error";

        return;
    }


    try {

        const rows = parseCSV(text);


        if (rows.length === 0) {

            status.textContent = "No data was found.";
            status.className = "status error";

            return;
        }


        const headers = rows[0];


        if (headers.length === 0) {

            status.textContent = "No column headers were found.";
            status.className = "status error";

            return;
        }


        const dataRows = rows.slice(1);


        displaySummary(headers, dataRows);

        displayTable(headers, dataRows);


        status.textContent =
            `${dataRows.length} records loaded successfully.`;

        status.className = "status success";

    } catch (error) {

        status.textContent =
            "Could not read the CSV file.";

        status.className = "status error";

        console.error(error);
    }
};


reader.onerror = function () {

    status.textContent =
        "Could not read the file.";

    status.className = "status error";
};


reader.readAsText(file);

});

/*
Basic CSV parser.

Unlike .split(","), this handles values such as:

"Smith, John"

without incorrectly treating the comma inside
the quotation marks as a new column.

*/

function parseCSV(text) {

const rows = [];

let currentRow = [];
let currentCell = "";

let insideQuotes = false;


for (let i = 0; i < text.length; i++) {

    const character = text[i];
    const nextCharacter = text[i + 1];


    if (character === '"') {

        if (insideQuotes && nextCharacter === '"') {

            currentCell += '"';

            i++;

        } else {

            insideQuotes = !insideQuotes;
        }

    }

    else if (character === "," && !insideQuotes) {

        currentRow.push(currentCell.trim());

        currentCell = "";
    }

    else if (
        (character === "\n" || character === "\r") &&
        !insideQuotes
    ) {

        if (character === "\r" && nextCharacter === "\n") {
            i++;
        }


        currentRow.push(currentCell.trim());

        currentCell = "";


        if (
            currentRow.length > 1 ||
            currentRow[0] !== ""
        ) {

            rows.push(currentRow);
        }


        currentRow = [];
    }

    else {

        currentCell += character;
    }
}


/*
    Add the final cell/row if the file doesn't
    end with a newline.
*/

if (currentCell !== "" || currentRow.length > 0) {

    currentRow.push(currentCell.trim());

    rows.push(currentRow);
}


return rows;

}

/*
Display basic information about the uploaded data.
*/

function displaySummary(headers, dataRows) {

summary.style.display = "block";

summary.innerHTML = `
    <strong>Columns:</strong> ${headers.length}
    &nbsp;&nbsp;|&nbsp;&nbsp;
    <strong>Records:</strong> ${dataRows.length}
`;

}

/*
Display the CSV data in a table.
*/

function displayTable(headers, dataRows) {

tableContainer.innerHTML = "";


const table = document.createElement("table");

const thead = document.createElement("thead");
const headerRow = document.createElement("tr");


headers.forEach(function (header) {

    const th = document.createElement("th");

    th.textContent = header;

    headerRow.appendChild(th);
});


thead.appendChild(headerRow);
table.appendChild(thead);


const tbody = document.createElement("tbody");


dataRows.forEach(function (row) {

    const tr = document.createElement("tr");


    for (let i = 0; i < headers.length; i++) {

        const td = document.createElement("td");

        /*
            If a row has fewer columns than the header,
            show an empty cell.
        */

        td.textContent = row[i] || "";

        tr.appendChild(td);
    }


    tbody.appendChild(tr);
});


table.appendChild(tbody);

tableContainer.appendChild(table);

}

/*
Clear the previous result when another CSV
is selected.
*/

function resetDisplay() {

status.textContent = "";

status.className = "status";

summary.innerHTML = "";

summary.style.display = "none";

tableContainer.innerHTML = "";

}
