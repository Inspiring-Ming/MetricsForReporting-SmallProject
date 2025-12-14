import HTTPError from "http-errors";

function wrapError(error: any) {
  // If the error is already an HTTPError, rethrow it
  if (error.statusCode) throw error;
  // Otherwise, it's an internal error
  throw HTTPError(500, "Internal server error: ", error);
}

export{ wrapError };
