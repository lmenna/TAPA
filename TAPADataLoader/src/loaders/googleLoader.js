// Got this using npm install --save @google-cloud/bigquery
const {BigQuery} = require('@google-cloud/bigquery');

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
query += "and blocks.timestamp > TIMESTAMP_SUB(current_timestamp, INTERVAL 200 HOUR) ";
query += "group by IntDaysFrom19700101 ";
query += "order by IntDaysFrom19700101 DESC";

/* getQuery()
 * desc: returns the query string used to retrieve data from BigQuery
 *
 */
function getQuery() {
  return(query);
}

/* getBigQueryData(query)
 * desc: Run the BigQuery using async and await execution model.
 * param: String with the query to run.
 */
async function getBigQueryData(query)
{
  const bigquery2 = new BigQuery({
    projectId: 'eth-testing-221913',
    keyFilename: '/Users/yglm/eth-testing-221913-87aaade4d104.json'
  });

  var resultSet = {
    header: {
      query: query,
      rowCount: 0,
      errorCode: 0,
      errorMsg: ""
    },
    data: []
  };
  var rowCount = 0;

  let promise = new Promise((resolve, reject) => {
    bigquery2.createQueryStream(query)
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

/* TestQuery()
 * desc: async Wrapper function to call into getBigQueryData() and wait for the result.
 *
 */
async function TestQuery() {
  var result;
  try {
    result = await getBigQueryData(query);
  } catch(e) {
    console.log("Error:", e);
  }
  console.log("Query result:", result);
}

export {getBigQueryData, getQuery}
