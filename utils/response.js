const success = (res, code, message, data) => {
  return res.status(code).json({
    success: true,
    statusCode: code,
    message,
    payload: data ? data : undefined,
  });
};

const failure = (res, code, message, data) => {
  return res.status(code).json({
    success: false,
    statusCode: code,
    message,
    payload: data ? data : undefined,
  });
};
module.exports = { success, failure };
