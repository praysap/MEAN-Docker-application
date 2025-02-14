var elasticsearch = require("elasticsearch");


var client = new elasticsearch.Client({
  // host: 'http://192.168.8.163:9200'
  host: 'http://192.168.8.163:9200/',
  requestTimeout: 120000,
});


let ElasticModel = (user) => {
  create_at = new Date() | any;
  updated_at = new Date() | any;
}
// Get line chart Data
ElasticModel.eventsData = async (req, result) => {

  try {
    // console.log(req.body.id);
    var port = req.body.id;
    var startdate = req.body.start;
    var enddate = req.body.end;

    const startDateEpochMillis = new Date(startdate).getTime();
const endDateEpochMillis = new Date(enddate).getTime();


//     // Check if the index exists
// client.indices.exists({ index: 'hp_log_data' }, (error, exists) => {
//   if (error) {
//     console.error('Error checking index existence:', error);
//   } else {
//     console.log('Index exists:', exists);
//   }
// });

    client
      .search({
        index: 'hp_log_data',
        body: {
        query: {
          bool: {
            must: [
              {
                match: {
                  "local_port.keyword": port
                } 
              }
            ],
            filter: {
              range: {
                attack_time: {
                  gte: startDateEpochMillis,
                  lte: endDateEpochMillis
                }
              }
            }
          }
        },
        aggs: {
          "attack": {
            date_histogram: {
              field: "attack_time",
              interval: "1d",
              time_zone: "Asia/Kolkata"
            },
            aggs: {
              "attack2": {
                cardinality: {
                  field: "remote_ip.keyword"
                }
              }
            }
          }
        }
      }
      })
      .then((resp) => {
        if (!resp) {
          return result(null, {
            data: resp.aggregations.attack.buckets,
            message: "reponse not found!!!",
          });
        } else {
          // console.log("resp1", resp.aggregations.attack.buckets);
          return result(null, {
            data: resp.aggregations.attack.buckets,
            message: "Here is your finding result!!",
          });
        }
      });
  } catch (error) {
    console.log("errrrrrr", error);
    return result(error, null);
  }
};


module.exports = ElasticModel;