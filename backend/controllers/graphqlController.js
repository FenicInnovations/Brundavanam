const { graphql } = require("graphql");
const schema = require("../graphql/schema");
const { resolvers } = require("../graphql/resolvers");

/**
 * High-performance Express GraphQL handler.
 * Executes queries and mutations directly with schema and resolvers,
 * injecting authenticated user and request context.
 */
async function handleGraphQL(req, res, next) {
  // Support both POST (JSON body) and GET (query params)
  const query = req.body?.query || req.query?.query;
  const rawVariables = req.body?.variables || req.query?.variables;
  const operationName = req.body?.operationName || req.query?.operationName;

  // Browser developer preview
  if (req.method === "GET" && !query && req.headers.accept?.includes("text/html")) {
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Brundavanam Goshala - GraphQL API Console</title>
          <style>
            body { font-family: -apple-system, sans-serif; background: #16120d; color: #fbf7ee; padding: 40px; }
            .card { background: #231c15; border: 1px solid rgba(245, 176, 65, 0.3); border-radius: 16px; padding: 30px; max-width: 700px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            h1 { color: #f5b041; margin-top: 0; font-size: 24px; }
            code { background: #120e0a; color: #a3e635; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
            pre { background: #120e0a; color: #ded4be; padding: 16px; border-radius: 12px; overflow-x: auto; font-size: 13px; line-height: 1.5; border: 1px solid #33281c; }
            .badge { display: inline-block; background: rgba(34, 197, 94, 0.2); color: #4ade80; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: bold; margin-bottom: 12px; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">&#10003; GraphQL Active & Redis-Optimized</span>
            <h1>Brundavanam Goshala GraphQL API</h1>
            <p>Send a <code>POST</code> request with JSON body to this endpoint to query data with field-level precision:</p>
            <pre>
curl -X POST http://localhost:5000/api/graphql \\
  -H "Content-Type: application/json" \\
  -d '{"query": "query { storefrontInitial { categories { name slug } featuredProducts { name price inStock } } }"}'
            </pre>
            <p style="color: #d0c8b6; font-size: 13px;">Endpoint: <code>POST /api/graphql</code></p>
          </div>
        </body>
      </html>
    `);
  }

  if (!query || typeof query !== "string") {
    return res.status(400).json({
      errors: [
        {
          message:
            "Must provide GraphQL query string in request body (e.g. { query: '...' }).",
        },
      ],
    });
  }

  let variableValues = {};
  if (rawVariables) {
    if (typeof rawVariables === "string") {
      try {
        variableValues = JSON.parse(rawVariables);
      } catch {
        return res.status(400).json({
          errors: [{ message: "Variables must be valid JSON." }],
        });
      }
    } else if (typeof rawVariables === "object") {
      variableValues = rawVariables;
    }
  }

  const contextValue = {
    user: req.user || null,
    req,
    res,
  };

  try {
    const result = await graphql({
      schema,
      source: query,
      rootValue: resolvers,
      contextValue,
      variableValues,
      operationName,
    });

    // If query has no errors and user is guest, enable CDN edge caching
    if (req.method === "GET" && !result.errors && !req.user) {
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
    }

    const statusCode = result.errors && !result.data ? 400 : 200;
    return res.status(statusCode).json(result);
  } catch (err) {
    return res.status(500).json({
      errors: [{ message: err.message || "Internal GraphQL execution error" }],
    });
  }
}

module.exports = { handleGraphQL };
