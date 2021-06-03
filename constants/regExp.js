exports.REPLACE_ORIGIN = new RegExp(/(https:\/\/|http:\/\/|www\.)/g);

exports.REPLACE_REFERER = new RegExp(/(https:\/\/|http:\/\/|www\.|\/.+$|\/)/g);

exports.REPLACE_HOST_WITH_PARENT = new RegExp(/.+?(?=\.)./);

exports.GUEST_NAME = new RegExp('_');
