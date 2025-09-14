// Resolve the Descope project ID from available environment variables.
// Frontend code uses `VITE_DESCOPE_PROJECT_ID`, while the Convex backend
// historically referenced `DESCOPE_PROJECT_ID`.  Without this fallback the
// resulting domain could become `undefined.descope.com`, breaking auth.
const projectId =
  process.env.DESCOPE_PROJECT_ID ?? process.env.VITE_DESCOPE_PROJECT_ID;

if (!projectId) {
  throw new Error("Missing Descope project ID in environment variables");
}

export default {
  providers: [
    {
      domain: `${projectId}.descope.com`,
      applicationID: "default",
    },
  ],
};
