exports.REPLACE_ORIGIN = new RegExp(/(https:\/\/|http:\/\/|www\.)/g);

exports.REPLACE_REFERER = new RegExp(/(https:\/\/|http:\/\/|www\.|\/.+$|\/)/g);

exports.REPLACE_HOST_WITH_PARENT = new RegExp(/.+?(?=\.)./);

exports.GUEST_NAME = new RegExp('_');

exports.DONT_SWITCH_CLIENT_ERR = new RegExp(/(User not found|Post not found|Invalid parameters)/i);
