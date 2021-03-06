/* googleLoader.js
 * desc: Runs queries against the google BigQuery public data sets
 *
 */

// Got this using npm install --save @google-cloud/bigquery
const {BigQuery} = require('@google-cloud/bigquery');

/* getBigQueryData(query)
 * desc: Run the BigQuery using async and await execution model.
 * param: String with the query to run.
 */
async function runBigQuery(queryToRun)
{
  const bigquery2 = new BigQuery({
    projectId: 'eth-testing-221913',
    keyFilename: '/Users/yglm/eth-testing-221913-87aaade4d104.json'
  });

  console.log("Running google BigQuery:", queryToRun);
  var resultSet = {
    header: {
      query: queryToRun,
      rowCount: 0,
      errorCode: 0,
      errorMsg: ""
    },
    data: []
  };
  var rowCount = 0;

  let promise = new Promise((resolve, reject) => {
    bigquery2.createQueryStream(queryToRun)
      .on('error', console.error)
      .on('data', function(row) {
        resultSet.data.push(row);
        rowCount++;
      })
      .on('end', function() {
        resultSet.header.rowCount = rowCount;
        console.log("Resolving promise with result set.");
        resolve(resultSet);
      });
    });
    let r = await promise; // wait till the promise resolves (*)
    return(resultSet);
};

/* getBigQueryData()
 * desc: async Wrapper function to call into getBigQueryData() and wait for the result.
 *
 */
async function getBigQueryData() {

  // SQL to run on BigQuery.  Will return the daily Ethereum transaction counts.
  // It runs using the time interval from current time back 200 Hours = 8.33 days
  var query = "select CAST(CEILING(UNIX_MILLIS(blocks.timestamp)/(1000*60*60*24)) as INT64) as IntDaysFrom19700101,"
  query += "sum(blocks.transaction_count) as Transactions,";
  query += "min(blocks.timestamp) as MinTimestamp,";
  query += "max(blocks.timestamp) as MaxTimestamp,";
  query += "min(UNIX_MILLIS(blocks.timestamp)) as MinUnixTimestamp,";
  query += "max(UNIX_MILLIS(blocks.timestamp)) as MaxUnixTimestamp,";
  query += "min(blocks.number) as MinBlockNumber,";
  query += "max(blocks.number) as MaxBlockNumber,";
  query += "sum(blocks.difficulty) as Difficulty ";
  query += "from `bigquery-public-data.ethereum_blockchain.blocks` as blocks ";
  query += "where blocks.number != 0 ";
//  query += "and blocks.timestamp > TIMESTAMP_SUB(current_timestamp, INTERVAL 200 HOUR) ";
  query += "group by IntDaysFrom19700101 ";
  query += "order by IntDaysFrom19700101 DESC";

  var result;
  try {
    result = await runBigQuery(query);
  } catch(e) {
    console.log("Error:", e);
  }
  return(result);
}

export {getBigQueryData}
