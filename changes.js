// ==========================================
// DataClean Lite - Change Report
// ==========================================


function buildChangeReport(changes) {

    const report = {

        duplicatesRemoved: 0,
        formattingChanges: 0

    };


    changes.forEach(function (change) {

        if (change.type === "duplicate") {

            report.duplicatesRemoved++;

        }

        if (change.type === "format") {

            report.formattingChanges++;

        }

    });


    return report;
}


// ==========================================
// Display the cleaning results
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

    `;


    summary.prepend(changeReport);

}
