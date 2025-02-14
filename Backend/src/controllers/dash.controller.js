const dashmodel = require('../models/dash.model')


exports.getAlertLog =(req,res)=>{
    dashmodel.getAlertLog(req, (err, data) => {
        if (err) {
            res.send(err)
        } else {
            res.send(data)
        }
    })
}

exports.getPortLog =(req,res)=>{
    dashmodel.getPortLog(req, (err, data) => {
        if (err) {
            res.send(err)
        } else {
            res.send(data)
        }
    })
}