import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@mysten/dapp-kit/dist/index.css';

// @ts-ignore
const { networkConfig } = createNetworkConfig({
    // @ts-ignore
	testnet: { url: 'https://fullnode.testnet.sui.io:443', network: 'testnet' },
    // @ts-ignore
	mainnet: { url: 'https://fullnode.mainnet.sui.io:443', network: 'mainnet' },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>
			<SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
				<WalletProvider autoConnect>
					{children}
				</WalletProvider>
			</SuiClientProvider>
		</QueryClientProvider>
	);
}
