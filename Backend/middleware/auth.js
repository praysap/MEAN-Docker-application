const jwt = require("jsonwebtoken");
//const dbConn = require("../config/db.config");

const config = process.env;

const verifyToken = async (req, res, next) => {
  const token =
    req.headers.authorization || req.headers.token || req.query.authorization || req.headers["x-access-token"];

  if (!await token) return res.status(401).send({message:'Your session expired due to Inactivity. Please login again.'})
  try {
    const decoded = await jwt.verify(token, config.JWT_PASSWORD_KEY);
    req.user = await decoded

    const username = decoded.data;
     console.log("------77777------",decoded)

    dbToken = dbConn.query(`select * from new_users where username = '${username}'`, async (err, getresp) => {
    
      if (err) {
     console.log("err",err)
         return res.status(401).send({message:'Your session expired due to Inactivity. Please login again.'})
      } else {
        let resToken = await getresp[0].token;

      
        if (token == await resToken) {
          let date_ob = new Date();
          let date = ("0" + date_ob.getDate()).slice(-2);
          let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
          let year = date_ob.getFullYear();
        
          dbConn.query(`select * from new_users WHERE updated_at < DATE_SUB( NOW(), INTERVAL 120 MINUTE ) and user_id = '${getresp[0].user_id}' and token != "I am not having token"`,   async (err, newres) => {
       
            if(newres){
              if (newres.length>0){
                dbConn.query(`update new_users set token='I am not having token' where token = '${token}'`,   async (err, getres) => {
                  // return res.send(401,{message:'Token Expired. Please try again with new Token.'});
                  return res.status(401).send({message:'Token Expired. Please try again with new Token.'})
                });
              }
            
              else {
                let generate_date = year + "-" + month + "-" + date + " " + date_ob.getHours() + ":" + date_ob.getMinutes() + ":" + date_ob.getSeconds();
                dbConn.query(`Update new_users set updated_at = '${generate_date}' where username = '${username}'`, async (err, updateRes) => {
                  if (updateRes) {
                    dbConn.query(`SELECT *
                                  FROM UserLogs
                                  WHERE user_id = '${getresp[0].user_id}'
                                  AND status = 1
                                  AND json = 0`, async (err, getres) => {

                                    // firebase code
                      
                    });
                  }
              
                  return next();
                });
              }
            }
            });

        } else{
          return res.status(401).send({details:'Your session expired due to Inactivity. Please login again.'})
        }
      }
    })

  } catch (e) {
    // res.status(400).send('Token not valid')
    let sql = `update new_users set token='I am not having token' where token = '${token}'`

    dbConn.query(sql, (err, result)=>{
     
        console.log(err)
        console.log("I am unable to change token")
        return res.send(401,{details:'Your session expired due to Inactivity. Please login again.'});
        // this.errorHandler(err,req,res,next);
        
    
    })
  }
  //  return next();
};



module.exports = {
  verifyToken
};

