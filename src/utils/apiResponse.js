/**
 * Standard API Success Response Envelope
 */
export const successResponse = (res, data = null, meta = null, statusCode = 200) => {
  const response = {
    success: true,
    data,
  };
  if (meta) {
    response.meta = meta;
  }
  return res.status(statusCode).json(response);
};

/**
 * Standard API Created Response
 */
export const createdResponse = (res, data = null, meta = null) => {
  return successResponse(res, data, meta, 201);
};
