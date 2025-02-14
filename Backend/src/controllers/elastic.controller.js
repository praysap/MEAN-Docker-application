const ElasticUserModel = require("../models/elastic.model");
// Get line chart data
exports.eventsData = (req, res) => {
    ElasticUserModel.eventsData(req, (err, user) => {
      if (err) {
        return res.send(err);
      } else {
        return res.send(user);
      }
    });
  };
  