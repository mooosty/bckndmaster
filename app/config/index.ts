const config = {
  mongodb: {
    uri: process.env.MONGODB_URI,
  },
  dynamic: {
    environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID,
  },
};

// Validate required environment variables
const requiredEnvVars = [
  ['MONGODB_URI', config.mongodb.uri],
  ['NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID', config.dynamic.environmentId],
] as const;

for (const [name, value] of requiredEnvVars) {
  if (!value) {
    throw new Error(`Environment variable ${name} is required but not set.`);
  }
}

export default config; 