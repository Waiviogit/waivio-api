const axios = require('axios');
const {
  HOST, BASE_URL, SET_NOTIFICATION,
} = require('constants/requestData').NOTIFICATIONS_API;

exports.sendNotification = async (reqData) => {
  const URL = HOST + BASE_URL + SET_NOTIFICATION;
  const { API_KEY } = process.env;

  try {
    await axios.post(URL, reqData, { headers: { API_KEY } });
  } catch (error) {
    console.log(error.message);
  }
};
