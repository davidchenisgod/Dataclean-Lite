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

Handles values such as:

"Smith, John"

without treating the comma inside
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
    Add the final row if the file doesn't
    end with a newline.
    */

    if (currentCell !== "" || currentRow.length > 0) {

        currentRow.push(currentCell.trim());

        rows.push(currentRow);
    }

    return rows;
}


/*
Display summary and data-quality report.
*/

function displaySummary(headers, dataRows) {

    summary.style.display = "block";

    const report = analyzeData(headers, dataRows);

    let html = `
        <strong>Columns:</strong> ${headers.length}
        &nbsp;&nbsp;|&nbsp;&nbsp;
        <strong>Records:</strong> ${dataRows.length}

        <hr>

        <h3>Data Quality Report</h3>
    `;

    /*
    Duplicates
    */

    if (report.duplicates.length === 0) {

        html += `
            <p>✅ No duplicate records found.</p>
        `;

    } else {

        html += `
    <p>
        ⚠️ <strong>Inconsistent phone formatting</strong>
    </p>
    <p>
        Some phone numbers appear to use different formats.
        This does not necessarily mean the numbers are incorrect.
    </p>
`;

        html += `<ul>`;

        report.duplicates.forEach(function (item) {

            html += `
                <li>
                    Duplicate rows: ${item.rows.join(", ")}
                </li>
            `;
        });

        html += `</ul>`;
    }


    /*
    Missing values
    */

    if (report.missing.length === 0) {

        html += `
            <p>✅ No missing values found.</p>
        `;

    } else {

        html += `
            <p>
                ⚠️ <strong>${report.missing.length}</strong>
                missing value(s) found.
            </p>
        `;

        html += `<ul>`;

        report.missing.forEach(function (item) {

            html += `
                <li>
                    ${item.column}: row ${item.row}
                </li>
            `;
        });

        html += `</ul>`;
    }


    /*
    Invalid emails
    */

    if (report.invalidEmails.length === 0) {

        html += `
            <p>✅ No invalid email addresses found.</p>
        `;

    } else {

        html += `
            <p>
                ⚠️ <strong>${report.invalidEmails.length}</strong>
                invalid email address(es) found.
            </p>
        `;

        html += `<ul>`;

        report.invalidEmails.forEach(function (item) {

            html += `
                <li>
                    ${item.column}: row ${item.row}
                </li>
            `;
        });

        html += `</ul>`;
    }


    /*
    Phone number formatting
    */

    if (report.phoneIssues.length === 0) {

        html += `
            <p>✅ No inconsistent phone numbers detected.</p>
        `;

    } else {

        html += `
            <p>
                ⚠️ <strong>${report.phoneIssues.length}</strong>
                phone-number formatting issue(s) found.
            </p>
        `;

        html += `<ul>`;

        report.phoneIssues.forEach(function (item) {

            html += `
                <li>
                    ${item.column}: rows ${item.rows.join(", ")}
                </li>
            `;
        });

        html += `</ul>`;
    }


    summary.innerHTML = html;
}


/*
Analyze the uploaded data.
*/

function analyzeData(headers, dataRows) {

    const report = {

        duplicates: [],
        missing: [],
        invalidEmails: [],
        phoneIssues: []
    };


    /*
    Find duplicate rows.

    The complete row is compared.
    */

    const rowMap = new Map();

    dataRows.forEach(function (row, index) {

        const rowNumber = index + 2;

        const key = JSON.stringify(row);

        if (!rowMap.has(key)) {

            rowMap.set(key, [rowNumber]);

        } else {

            rowMap.get(key).push(rowNumber);
        }
    });


    rowMap.forEach(function (rows) {

        if (rows.length > 1) {

            report.duplicates.push({
                rows: rows
            });
        }
    });


    /*
    Find missing values.
    */

    dataRows.forEach(function (row, rowIndex) {

        const rowNumber = rowIndex + 2;

        headers.forEach(function (header, columnIndex) {

            const value = row[columnIndex] || "";

            if (value.trim() === "") {

                report.missing.push({
                    column: header,
                    row: rowNumber
                });
            }
        });
    });


    /*
    Find email columns and validate emails.
    */

    headers.forEach(function (header, columnIndex) {

        if (header.toLowerCase().includes("email")) {

            dataRows.forEach(function (row, rowIndex) {

                const value = (row[columnIndex] || "").trim();

                /*
                Empty emails are already reported as
                missing values, so don't report them
                again as invalid.
                */

                if (
                    value !== "" &&
                    !isValidEmail(value)
                ) {

                    report.invalidEmails.push({
                        column: header,
                        row: rowIndex + 2
                    });
                }
            });
        }
    });


    /*
    Find phone columns.

    We look for the same phone number appearing
    in different formats.

    Example:

    868-555-1234
    8685551234

    These contain the same digits but use
    different formatting.
    */

    headers.forEach(function (header, columnIndex) {

        if (header.toLowerCase().includes("phone")) {

            const phoneMap = new Map();

            dataRows.forEach(function (row, rowIndex) {

                const value = (row[columnIndex] || "").trim();

                if (value === "") {
                    return;
                }

                const digits = value.replace(/\D/g, "");

                /*
                Ignore values that contain too few
                digits to reasonably be a phone number.
                */

                if (digits.length < 7) {
                    return;
                }

                if (!phoneMap.has(digits)) {

                    phoneMap.set(digits, []);

                }

                phoneMap.get(digits).push({
                    value: value,
                    row: rowIndex + 2
                });
            });


            phoneMap.forEach(function (entries) {

                const formats = new Set(
                    entries.map(function (entry) {
                        return entry.value;
                    })
                );

                if (formats.size > 1) {

                    report.phoneIssues.push({
                        column: header,
                        rows: entries.map(function (entry) {
                            return entry.row;
                        })
                    });
                }
            });
        }
    });


    return report;
}


/*
Simple email validation.
*/

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
