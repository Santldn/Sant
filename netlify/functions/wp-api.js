// Netlify function: proxy requests to the live WordPress API
// Usage: /.netlify/functions/wp-api?endpoint=wp/v2/posts
const https = require('https');

exports.handler = async function(event, context) {
  // Handle OPTIONS preflight quickly
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
  };
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  try {
    // endpoint should be URL-encoded if it contains query parts
    const endpointRaw = (event.queryStringParameters && event.queryStringParameters.endpoint) || "";
    const endpoint = decodeURIComponent(endpointRaw);
    const wpUrl = `https://www.161london.com/wp-json/${endpoint}`;

    // Forward method and body for POST/GET etc.
    const fetchOptions = {
      method: event.httpMethod || "GET",
      headers: event.headers || {},
      // Netlify runtime provides global fetch
    };

    // If there is a body (POST), pass it through
    if (event.body && (fetchOptions.method === "POST" || fetchOptions.method === "PUT" || fetchOptions.method === "PATCH")) {
      fetchOptions.body = event.isBase64Encoded ? Buffer.from(event.body, "base64") : event.body;
    }

    const res = await fetch(wpUrl, fetchOptions);
    const contentType = res.headers.get("content-type") || "application/json";
    const text = await res.text();

    return {
      statusCode: res.status,
      headers: Object.assign({}, corsHeaders, { "Content-Type": contentType }),
      body: text
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message })
    };
  }
};
