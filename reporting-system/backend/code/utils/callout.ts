import axios from "axios";

// ========================================================================= //
/**
 * Generall function for sending HTTP query for callout functions
 * @param {string} method
 * @param {string} server_url
 * @param {string | null} path
 * @param {object} payload
 * @param {string | null} token
 * @returns { Promise<Object> } Http_response
 */
async function requestHelper(
  method: string,
  server_url: string,
  path?: string,
  payload?: object,
  token?: string
): Promise<any> {

  // Path is optional for multi functional path on a server
  const url = server_url + (path ?? "");

  const options = {
    method,
    url: url,
    headers: token ? { token } : {},
    params: ["GET", "DELETE"].includes(method) ? payload : {}, // Query params
    data: ["POST", "PUT"].includes(method) ? payload : {}, // Body data
  };
  try {
    const res = await axios(options);
    return res.data; // Return response data
  } catch (error) {
    // Return status code and its message on failure
    const errorObj = {
      statusCode: error.response?.status || 500,
      message: error.response?.data.error || "Internal Error"
    };
    console.log(errorObj); // Debug line
    return errorObj;
  }
}

// Example Server URL, replace with actual config if needed
const host = "http://localhost";
const port = 3001;
const SERVER_URL = `${host}:${port}`;

// Example function for calling another service
export async function genReportReq() {
  return await requestHelper("GET", SERVER_URL, "/SAGE/echo", {});
}
