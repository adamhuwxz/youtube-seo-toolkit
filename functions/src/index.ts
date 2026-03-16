import { onRequest } from "firebase-functions/v2/https";

export const healthcheck = onRequest((request, response) => {
  response.send("OK");
});