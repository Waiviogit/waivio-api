exports.REPLACE_ORIGIN = /(https:\/\/|http:\/\/|www\.)/g;

exports.REPLACE_REFERER = /(https:\/\/|http:\/\/|www\.|\/.+$|\/)/g;

exports.REPLACE_HOST_WITH_PARENT = /.+?(?=\.)./;

exports.GUEST_NAME = /_/;

exports.BUSY_ORG_LINK = /https:\/\/ipfs.busy.org\/ipfs\/[\w]+/;

exports.IMAGE_NAME = /[^/]+$/;

exports.DONT_SWITCH_CLIENT_ERR = /(User not found|Post not found)/i;

exports.NETWORK_TIMEOUT = /network timeout/i;
