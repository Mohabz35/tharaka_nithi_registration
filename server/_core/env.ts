export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  adminEmail: process.env.ADMIN_EMAIL || "mohammedabbasofficial100@gmail.com",
  isProduction: process.env.NODE_ENV === "production",
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  awsRegion: process.env.AWS_REGION ?? "",
  awsS3Bucket: process.env.AWS_S3_BUCKET ?? "",
  openaiApiUrl: process.env.OPENAI_API_URL ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
};
