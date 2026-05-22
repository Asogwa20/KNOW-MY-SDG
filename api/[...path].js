"use strict";

const { handleApiRequest } = require("../server");

module.exports = function handler(req, res) {
  return handleApiRequest(req, res);
};
