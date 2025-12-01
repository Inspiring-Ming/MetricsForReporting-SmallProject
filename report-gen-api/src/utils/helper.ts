function handleHttpError(res: any, error: any) {
  const status = error.status || error.statusCode || 500;
  const message = error.message || "Internal Server Error";

  console.error("❌", message);
  res.status(status).json({ error: message });
};

export { handleHttpError };
