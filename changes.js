// ==========================================
// DataClean Lite - Change Report
// ==========================================


function buildChangeReport(changes) {

    const report = {

        duplicatesRemoved: 0,
        formattingChanges: 0,
        details: []

    };


    changes.forEach(function (change) {

        if (change.type === "duplicate") {

            report.duplicatesRemoved++;

            report.details.push({

                type: "duplicate",
                row: change.row

            });

        }


        if (change.type === "format") {

            report.formattingChanges++;

            report.details.push({

                type: "format",
                row: change.row,
                changes: change.changes || []

            });

        }

    });


    return report;
}


// ==========================================
// Display cleaning results
// ==========================================

function displayChangeReport(
    originalCount,
    cleanedCount,
    changes
) {


    
    const report =
        buildChangeReport(changes);


    const existingReport =
        document.getElementById("changeReport");


    if (existingReport) {

        existingReport.remove();

    }


    const changeReport =
        document.createElement("div");


    changeReport.id =
        "changeReport";


    changeReport.className =
        "change-report";


    let detailsHTML = "";


    if (report.details.length === 0) {

        detailsHTML = `

            <p>
                ✅ No changes were needed.
            </p>

        `;

    } else {

        detailsHTML = `

            <h4>Changes made</h4>

        `;


        report.details.forEach(function (change) {

            if (change.type === "duplicate") {

                detailsHTML += `

                    <div class="change-item">

                        <strong>
                            🗑️ Duplicate removed
                        </strong>

                        <span>
                            Data row ${change.row}
                        </span>

                    </div>

                `;

            }


            if (change.type === "format") {

                detailsHTML += `

                    <div class="change-item">

                        <strong>
                            ✏️ Data row ${change.row}
                        </strong>

                `;


                change.changes.forEach(function (item) {

                    detailsHTML += `

                        <div class="value-change">

                            <strong>
                                ${item.column}
                            </strong>

                            <div>
                                <span>
                                    Before:
                                </span>

                                <code>
                                    ${escapeChangeText(item.before)}
                                </code>
                            </div>

                            <div>
                                <span>
                                    After:
                                </span>

                                <code>
                                    ${escapeChangeText(item.after)}
                                </code>
                            </div>

                        </div>

                    `;

                });


                detailsHTML += `

                    </div>

                `;

            }

        });

    }


    changeReport.innerHTML = `

        <h3>Cleaning complete</h3>

        <p>
            Your original CSV was left unchanged.
        </p>


        <div class="change-summary">

            <div>
                <strong>${originalCount}</strong>
                <span>Original records</span>
            </div>


            <div>
                <strong>${cleanedCount}</strong>
                <span>Cleaned records</span>
            </div>


            <div>
                <strong>${report.duplicatesRemoved}</strong>
                <span>Duplicates removed</span>
            </div>


            <div>
                <strong>${report.formattingChanges}</strong>
                <span>Formatting changes</span>
            </div>

        </div>


        <div class="change-details">

            ${detailsHTML}

        </div>

    `;


    summary.prepend(changeReport);

}


// ==========================================
// Safely display changed CSV values
// ==========================================

function escapeChangeText(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}
