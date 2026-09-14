// ==========================================
// DataClean Lite - Cleaning Tools
// ==========================================

function cleanData(headers, dataRows) {
    const cleanedRows = [];
    const changes = [];

    const seenRows = new Set();

    dataRows.forEach((row, index) => {
        const originalRow = [...row];

        // ------------------------------------------
        // 1. Normalize values
        // ------------------------------------------

        const cleanedRow = row.map((value, columnIndex) => {
            let cleanedValue = value.trim();

            const header = headers[columnIndex].toLowerCase();

            // Clean email formatting
            if (header.includes("email")) {
                cleanedValue = cleanedValue.toLowerCase();
            }

            // Clean phone formatting
            if (header.includes("phone")) {
                const digits = cleanedValue.replace(/\D/g, "");

                if (digits.length > 0) {
                    cleanedValue = digits;
                }
            }

            return cleanedValue;
        });

        // ------------------------------------------
        // 2. Check for duplicate rows
        // ------------------------------------------

        const duplicateKey = JSON.stringify(
            cleanedRow.map((value, columnIndex) => {
                const header = headers[columnIndex].toLowerCase();

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

        // ------------------------------------------
        // 3. Record formatting changes
        // ------------------------------------------

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
// Convert cleaned data back into CSV
// ==========================================

function convertToCSV(headers, rows) {
    const allRows = [headers, ...rows];

    return allRows
        .map(row => {
            return row
                .map(value => {
                    const stringValue = String(value ?? "");

                    // Escape quotes
                    const escapedValue = stringValue.replace(/"/g, '""');

                    // Always quote values safely
                    return `"${escapedValue}"`;
                })
                .join(",");
        })
        .join("\n");
}


// ==========================================
// Download cleaned CSV
// ==========================================

function downloadCSV(headers, rows, filename = "cleaned-data.csv") {
    const csv = convertToCSV(headers, rows);

    const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

// ==========================================
// Run the cleaning process
// ==========================================

function runDataCleaning() {

    if (typeof headers === "undefined" || typeof dataRows === "undefined") {
        alert("Please upload a CSV file first.");
        return;
    }

    const result = cleanData(headers, dataRows);

    const removedDuplicates =
        result.changes.filter(change => change.type === "duplicate").length;

    const formattingChanges =
        result.changes.filter(change => change.type === "format").length;

    const message =
        "Cleaning complete!\n\n" +
        "Original records: " + dataRows.length + "\n" +
        "Cleaned records: " + result.rows.length + "\n" +
        "Duplicates removed: " + removedDuplicates + "\n" +
        "Formatting changes: " + formattingChanges;

    alert(message);

    downloadCSV(
        headers,
        result.rows,
        "dataclean-cleaned.csv"
    );
}
