interface Config {
  amplitude?: string;
  api: string;
  clerk: string;
  fullstory?: string;
}

const config: Config =
  process.env.NODE_ENV === "production"
    ? {
        amplitude: "a1373bdad6293ab1edee01f68cc90540",
        api: "https://v2.youka.io/api",
        clerk: "pk_live_Y2xlcmsueW91a2EuaW8k",
        fullstory: "o-1VV1TE-na1",
      }
    : {
        api: "http://localhost:4000/api",
        clerk: "pk_test_YXB0LXNsb3RoLTcwLmNsZXJrLmFjY291bnRzLmRldiQ",
      };

export default config;
