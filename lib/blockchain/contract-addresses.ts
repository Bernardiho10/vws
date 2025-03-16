import { ContractAddresses } from "@/types/blockchain";

/**
 * Contract addresses for development environment
 */
export const developmentAddresses: Readonly<ContractAddresses> = {
  voteToken: "0x0000000000000000000000000000000000000000", // Will be deployed
  voteVerification: "0x0000000000000000000000000000000000000000", // Will be deployed
};

/**
 * Contract addresses for test environment (Polygon Mumbai)
 */
export const testAddresses: Readonly<ContractAddresses> = {
  voteToken: "0x0000000000000000000000000000000000000000", // Will be deployed to Mumbai
  voteVerification: "0x0000000000000000000000000000000000000000", // Will be deployed to Mumbai
};

/**
 * Contract addresses for production environment (Polygon Mainnet)
 */
export const productionAddresses: Readonly<ContractAddresses> = {
  voteToken: "0x0000000000000000000000000000000000000000", // Will be deployed to Polygon
  voteVerification: "0x0000000000000000000000000000000000000000", // Will be deployed to Polygon
};

/**
 * Get contract addresses based on environment
 * @param environment - The deployment environment
 * @returns Contract addresses for specified environment
 */
export function getContractAddresses(environment: "development" | "test" | "production"): Readonly<ContractAddresses> {
  switch (environment) {
    case "development":
      return developmentAddresses;
    case "test":
      return testAddresses;
    case "production":
      return productionAddresses;
    default:
      return developmentAddresses;
  }
}
