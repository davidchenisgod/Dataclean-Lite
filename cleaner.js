// ==========================================
// DataClean Lite - Cleaning Tools
// ==========================================


function cleanData(headers, dataRows) {

    const cleanedRows = [];
    const changes = [];

    const seenRows = new Set();


    dataRows.forEach(function (row, index) {

        const originalRow = [...row];


        // Clean each value

        const cleanedRow = row.map(function (value, columnIndex) {

            let cleanedValue = value.trim();

            const header =
                (headers[columnIndex] || "").toLowerCase();


            // Clean email formatting

            if (header.includes("email")) {

                cleanedValue =
                    cleanedValue.toLowerCase();
            }


            // Clean phone formatting

            if (header.includes("phone")) {

                const digits =
                    cleanedValue.replace(/\D/g, "");

                if (digits.length > 0) {

                    cleanedValue = digits;
                }
            }


            return cleanedValue;

        });


        // Check for duplicates

        const duplicateKey = JSON.stringify(

            cleanedRow.map(function (value, columnIndex) {

                const header =
                    (headers[columnIndex] || "").toLowerCase();

                if (header.includes("phone")) {

                    return value.replace(/\D/g, "");
                }

                return value.toLowerCase().trim();

            })

        );


        if (seenRows.has(duplicateKey)) {

            changes.push({

                type: "duplicate",
                row: index + 1

            });

            return;
        }


        seenRows.add(duplicateKey);


        // Check whether formatting changed

        let rowChanged = false;


        for (let i = 0; i < originalRow.length; i++) {

            if (originalRow[i] !== cleanedRow[i]) {

                rowChanged = true;

                break;
            }
        }


        if (rowChanged) {

            changes.push({

                type: "format",
                row: index + 1

            });
        }


        cleanedRows.push(cleanedRow);

    });


    return {

        rows: cleanedRows,
        changes: changes

    };
}


// ==========================================
// Convert data into CSV
// ==========================================

function convertToCSV(headers, rows) {

    const allRows = [headers, ...rows];


    return allRows.map(function (row) {

        return row.map(function (value) {

            const stringValue =
                String(value ?? "");

            const escapedValue =
                stringValue.replace(/"/g, '""');


            return `"${escapedValue}"`;

        }).join(",");

    }).join("\n");
}


// ==========================================
// Download CSV
// ==========================================

function downloadCSV(
    headers,
    rows,
    filename = "dataclean-cleaned.csv"
) {

    const csv =
        convertToCSV(headers, rows);


    const blob = new Blob(
        [csv],
        {
            type: "text/csv;charset=utf-8;"
        }
    );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;

    link.download = filename;


    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);


    URL.revokeObjectURL(url);
}


// ==========================================
// Run cleaning
// ==========================================

function runDataCleaning() {

    if (
        currentHeaders.length === 0 ||
        currentDataRows.length === 0
    ) {

        alert("Please upload a CSV file first.");

        return;
    }


    const result =
        cleanData(
            currentHeaders,
            currentDataRows
        );


    const removedDuplicates =
        result.changes.filter(function (change) {

            return change.type === "duplicate";

        }).length;


    const formattingChanges =
        result.changes.filter(function (change) {

            return change.type === "format";

        }).length;


    const message =

        "Cleaning complete!\n\n" +

        "Original records: " +
        currentDataRows.length +

        "\nCleaned records: " +
        result.rows.length +

        "\nDuplicates removed: " +
        removedDuplicates +

        "\nFormatting changes: " +
        formattingChanges;


    alert(message);


    downloadCSV(

        currentHeaders,

        result.rows,

        "dataclean-cleaned.csv"

    );

}
