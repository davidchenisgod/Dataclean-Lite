const fileInput = document.getElementById("csvFile");
const status = document.getElementById("status");
const summary = document.getElementById("summary");
const tableContainer = document.getElementById("tableContainer");

let currentHeaders = [];
let currentDataRows = [];

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

    const duplicateCount = report.duplicates.length;
    const missingCount = report.missing.length;
    const invalidEmailCount = report.invalidEmails.length;
    const phoneIssueCount = report.phoneIssues.length;
    const suspiciousPhoneCount = report.suspiciousPhones.length;

    const totalIssues =
        duplicateCount +
        missingCount +
        invalidEmailCount +
        phoneIssueCount +
        suspiciousPhoneCount;


    let html = `

        <div class="results-header">

            <div>
                <p class="results-label">ANALYSIS COMPLETE</p>

                <h2>Data Quality Report</h2>

                <p class="results-description">
                    We checked your CSV for common data-quality problems.
                </p>
            </div>

            <div class="records-count">
                <strong>${dataRows.length}</strong>
                <span>records</span>
            </div>

        </div>


        <div class="quality-cards">

            <div class="quality-card">
                <span class="quality-number">${totalIssues}</span>
                <span class="quality-label">Issues found</span>
            </div>

            <div class="quality-card">
                <span class="quality-number">${duplicateCount}</span>
                <span class="quality-label">Duplicate groups</span>
            </div>

            <div class="quality-card">
                <span class="quality-number">${missingCount}</span>
                <span class="quality-label">Missing values</span>
            </div>

            <div class="quality-card">
                <span class="quality-number">${invalidEmailCount}</span>
                <span class="quality-label">Invalid emails</span>
            </div>

        </div>


        <div class="clean-action">

            <h3>Ready to clean your data?</h3>

            <p>
                Create a cleaned copy of your CSV while keeping
                your original file unchanged.
            </p>

            <button
                type="button"
                id="cleanDataButton"
                onclick="runDataCleaning()"
            >
                Clean Data
            </button>

        </div>


        <hr>

    `;


    /*
    Duplicate records
    */

    if (report.duplicates.length === 0) {

        html += `
            <p>✅ No duplicate records found.</p>
        `;

    } else {

        html += `
            <p>
                ⚠️ <strong>Duplicate records found</strong>
            </p>
        `;

        html += `<ul>`;

        report.duplicates.forEach(function (item) {

            html += `
                <li>
                    Data rows ${item.rows.join(" and ")}
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
                ⚠️ <strong>Missing information</strong>
            </p>
        `;

        html += `<ul>`;

        report.missing.forEach(function (item) {

            html += `
                <li>
                    ${item.column}: data row ${item.row}
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
                ⚠️ <strong>Invalid email address found</strong>
            </p>
        `;

        html += `<ul>`;

        report.invalidEmails.forEach(function (item) {

            html += `
                <li>
                    ${item.column}: data row ${item.row}
                </li>
            `;

        });

        html += `</ul>`;
    }


    /*
    Phone formatting
    */

    if (report.phoneIssues.length === 0) {

        html += `
            <p>
                ✅ No phone numbers were found
                with inconsistent formatting.
            </p>
        `;

    } else {

        html += `
            <p>
                ⚠️ <strong>
                    Same phone number written in different formats
                </strong>
            </p>
        `;

        report.phoneIssues.forEach(function (item) {

            html += `
                <p>
                    <strong>
                        ${item.column}: data rows
                        ${item.rows.join(" and ")}
                    </strong>
                </p>
            `;

            html += `<ul>`;

            item.values.forEach(function (value, index) {

                html += `
                    <li>
                        Data row ${item.rows[index]}:
                        ${value}
                    </li>
                `;

            });

            html += `</ul>`;

        });
    }


    /*
    Suspicious phone values
    */

    if (report.suspiciousPhones.length === 0) {

        html += `
            <p>
                ✅ No obviously suspicious phone values found.
            </p>
        `;

    } else {

        html += `
            <p>
                ⚠️ <strong>
                    Suspicious phone value found
                </strong>
            </p>
        `;

        html += `<ul>`;

        report.suspiciousPhones.forEach(function (item) {

            html += `
                <li>
                    ${item.column}: data row ${item.row}
                    — "${item.value}"
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
        phoneIssues: [],
        suspiciousPhones: []

    };


    /*
    Find duplicate records.

    We normalize the data first so that small formatting
    differences don't hide duplicate records.

    Example:

    John@Gmail.com
    john@gmail.com

    are treated as the same email.

    And:

    868-555-1234
    8685551234

    are treated as the same phone number.
    */

    const rowMap = new Map();

    dataRows.forEach(function (row, index) {

        const rowNumber = index + 1;

        const normalizedRow = row.map(function (value, columnIndex) {

            const header =
                (headers[columnIndex] || "").toLowerCase();

            let cleanedValue =
                (value || "").trim().toLowerCase();


            /*
            Normalize phone numbers by removing
            spaces, dashes, brackets, etc.
            */

            if (header.includes("phone")) {

                cleanedValue =
                    cleanedValue.replace(/\D/g, "");
            }


            return cleanedValue;

        });


        const key = JSON.stringify(normalizedRow);


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

        const rowNumber = rowIndex + 1;

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

                const value =
                    (row[columnIndex] || "").trim();

                if (
                    value !== "" &&
                    !isValidEmail(value)
                ) {

                    report.invalidEmails.push({

                        column: header,
                        row: rowIndex + 1

                    });

                }

            });

        }

    });


    /*
    Find phone columns.
    */

    headers.forEach(function (header, columnIndex) {

        if (header.toLowerCase().includes("phone")) {

            const phoneMap = new Map();


            dataRows.forEach(function (row, rowIndex) {

                const value =
                    (row[columnIndex] || "").trim();

                if (value === "") {
                    return;
                }


                const digits =
                    value.replace(/\D/g, "");


                /*
                Very short phone values are suspicious.
                */

                if (digits.length < 7) {

                    report.suspiciousPhones.push({

                        column: header,
                        row: rowIndex + 1,
                        value: value

                    });

                    return;
                }


                /*
                Store phone numbers by their digits.

                This means:

                868-555-1234

                and

                8685551234

                are recognized as the same number.
                */

                if (!phoneMap.has(digits)) {

                    phoneMap.set(digits, []);

                }


                phoneMap.get(digits).push({

                    value: value,
                    row: rowIndex + 1

                });

            });


            /*
            Find the same phone number written
            in different formats.
            */

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

                        }),

                        values: entries.map(function (entry) {

                            return entry.value;

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
