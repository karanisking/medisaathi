/**
 * Standard success response.
 * Shape: { success: true, message, data? }
 */
export const sendSuccess = (res, {
    statusCode = 200,
    message    = 'Success',
    data       = null,
  } = {}) => {
    const body = { success: true, message };
    if (data !== null) body.data = data;
    return res.status(statusCode).json(body);
  };
  
  /**
   * Standard error response.
   * Shape: { success: false, message, errors? }
   */
  export const sendError = (res, {
    statusCode = 500,
    message    = 'Something went wrong',
    errors     = null,
  } = {}) => {
    const body = { success: false, message };
    if (errors) body.errors = errors;
    return res.status(statusCode).json(body);
  };