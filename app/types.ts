export interface Token {
  logo: string;
  symbol: string;
  amount: string;
  balance:number;
  address: string;
}

export interface Validator {
  moniker: string;
  address: string;
  commission: string;
}

export interface SendDetails {
  token: {
    tokenType: string;
    address: string;
    decimals: number;
    denom: string;
  };
  receiver: string;
  amount: number;
}

export interface ContractInput {
  address: string;
  executeMsg: {
    send?: Record<string, unknown>;
    execute_routes?: Record<string, unknown>;
  };
  funds?: { denom: string; amount: string }[];
}

export interface TokenMetadata {
  symbol: string;
  name: string;
  decimals: number;
  totalSupply?: string;
  [key: string]: unknown;
}

export interface PieChartData {
  [key: string]: unknown;
}

export interface LlamaData {
  [key: string]: unknown;
}

export interface StakeInfo {
  [key: string]: unknown;
}

export interface Proposal {
  [key: string]: unknown;
}

export interface ChatMessage {
  balances?: Token[] | null;
  sender: string;
  text?: string;
  type?: string;
  intent?: string | null;
  validators?: Validator[] | null;
  contractInput?: ContractInput | null;
  send?: SendDetails | null;
  token_metadata?: TokenMetadata;
  pie?: PieChartData;
  llama?: LlamaData;
  stake_info?: StakeInfo;
  proposals?: Proposal[];
}
