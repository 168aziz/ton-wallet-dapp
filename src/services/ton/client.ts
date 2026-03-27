import { TonClient } from '@ton/ton';
import { getHttpEndpoint } from '@orbs-network/ton-access';
import { TON_NETWORK } from '../../constants/config';

let clientInstance: TonClient | null = null;

/**
 * Get or create a singleton TonClient connected to testnet.
 */
export async function getTonClient(): Promise<TonClient> {
  if (clientInstance) return clientInstance;

  const endpoint = await getHttpEndpoint({ network: TON_NETWORK });
  clientInstance = new TonClient({ endpoint });
  return clientInstance;
}
