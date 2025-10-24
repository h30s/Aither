import { ChainGrpcWasmApi, toBase64 } from "@injectivelabs/sdk-ts";
import { getNetworkEndpoints, Network } from "@injectivelabs/networks";
import { isdiotsrhMode } from "./utils/diotsrhData";

interface RefDetails {
  ref_code: string;
  count: number;
  refferer: string;
}

const endpoints = getNetworkEndpoints(Network.Mainnet);
const chainGrpcWasmApi = new ChainGrpcWasmApi(endpoints.grpc);

const earlyAccessContract = "inj1kdvdz8et52xwsvz392799r6em3qzq5ggn2nkve";

export const getRefCodeDetails = async (injectiveAddress: string | null) => {
  // diotsrh Mode: Return mock referral details
  if (isdiotsrhMode()) {
    return {
      ref_code: injectiveAddress ? injectiveAddress.replace(/^inj/, "aither") : "diotsrh_ref_code",
      count: 0,
      refferer: injectiveAddress || "diotsrh_address"
    };
  }
  
  try {
    if (injectiveAddress) {
      const ref_code = injectiveAddress.replace(/^inj/, "aither");
      const queryFromObject = toBase64({ get_referral: { ref_code: ref_code } });
      const contractState = await chainGrpcWasmApi.fetchSmartContractState(
        earlyAccessContract,
        queryFromObject
      );

      const decodedResponse = new TextDecoder().decode(
        Uint8Array.from(Object.values(contractState.data))
      );

      const parsedResponse: RefDetails = JSON.parse(decodedResponse);

      if (parsedResponse !== null || parsedResponse !== undefined) {
        return parsedResponse;
      }
    }
  } catch (error) {
    console.error("Error querying contract:", error);
    return null;
  }
};
