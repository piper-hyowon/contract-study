export const getConfig = (network: string) => {
  const { default: config } = require(`./${network}`);
  return config;
};
