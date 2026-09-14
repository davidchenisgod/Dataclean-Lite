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
                row: change.row

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

            <ul>
        `;


        report.details.forEach(function (change) {

            if (change.type === "duplicate") {

                detailsHTML += `

                    <li>
                        🗑️ Duplicate removed —
                        data row ${change.row}
                    </li>

                `;

            }


            if (change.type === "format") {

                detailsHTML += `

                    <li>
                        ✏️ Formatting cleaned —
                        data row ${change.row}
                    </li>

                `;

            }

        });


        detailsHTML += `

            </ul>

        `;

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
