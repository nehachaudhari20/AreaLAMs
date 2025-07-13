import "./envConfig.ts";

const config = {
  schema: "./app/api/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: "mysql+mysqlconnector://admin:yaswanth@llm.c0n8k0a0swtz.us-east-1.rds.amazonaws.com:3306/lamx_data",
  },
};

export default config;
