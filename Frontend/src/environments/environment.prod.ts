   


const API_URL = "http://3.91.227.132:3000"

export const environment = {
  production: true,

  API_URL: API_URL,
  assetPath: 'assets',
  recoverUrl: '/#/recoverpassword',
  recaptchasiteKey: "6LeZaHImAAAAAOJaHVFOfRbOY9G8FvDtwGmyQjx2",
//sign up component 
createUser: API_URL + '/api/v1/users/createUser',

// recover-password component
recoverPassword: API_URL + '/api/v1/users/recoverPassword',

// login component
login: API_URL + '/api/v1/users/login/',

//header component
logOut: API_URL + '/api/v1/users/logout/',

// change password
change_passsword: API_URL + '/api/v1/users/change-password/',

forgot: API_URL + '/api/v1/users/forgot',

saveUserData :API_URL + '/api/v1/users/saveUserData',



 // rest services
 filePath: API_URL + '/getFile',
 url: API_URL + '/url',
 findeone: API_URL + '/findeone',
 
};


