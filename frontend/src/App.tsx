import { useState } from 'react';
import { ConnectButton, useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
import { Box, Wallet, LayoutGrid, Settings, LogOut, ChevronRight, Shield, Zap, Sparkles, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLootBoxPrice, useUserNFTs, usePurchaseLootBox, useOpenLootBox } from './hooks';
import { PACKAGE_ID, MODULE_NAME, GAME_CONFIG_ID } from './constants';

type View = 'store' | 'inventory' | 'admin';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('store');
  const [reveal, setReveal] = useState<{ name: string; rarity: number; power: number } | null>(null);
  
  const account = useCurrentAccount();
  useLootBoxPrice(); // Pre-fetch
  useUserNFTs(account?.address || ''); // Pre-fetch

  // Check for AdminCap
  const { data: adminObjects } = useSuiClientQuery('getOwnedObjects', {
    owner: account?.address || '',
    filter: { StructType: `${PACKAGE_ID}::${MODULE_NAME}::AdminCap` }
  });
  const isAdmin = adminObjects?.data && adminObjects.data.length > 0;

  const menuItems = [
    { id: 'store', label: 'Store', icon: Package },
    { id: 'inventory', label: 'My Items', icon: LayoutGrid },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: Settings }] : []),
  ];

  return (
    <div className="min-h-screen bg-background text-white flex flex-col font-sans selection:bg-primary/30">
      {/* Navigation Header */}
      <header className="h-20 border-b border-white/10 flex items-center justify-between px-8 glass-panel rounded-none border-t-0 border-x-0 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <Box className="text-primary w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent tracking-tighter uppercase italic">
            ALCHEMI LOOT
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-10 mr-8">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as View)}
                className={`flex items-center gap-2.5 transition-all relative py-1 group ${
                  currentView === item.id ? 'text-primary' : 'text-gray-400 hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 transition-transform duration-300 ${currentView === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="font-bold uppercase tracking-widest text-[11px]">{item.label}</span>
                {currentView === item.id && (
                  <motion.div layoutId="nav-underline" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                )}
              </button>
            ))}
          </div>
          <ConnectButton className="!bg-primary hover:!bg-primary/80 !rounded-xl !h-11 !px-6 !font-bold !transition-all !shadow-lg shadow-primary/20" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto p-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

        {!account ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 blur-[60px] rounded-full animate-pulse" />
              <div className="w-40 h-40 bg-white/5 rounded-[40px] flex items-center justify-center border border-white/10 relative z-10 backdrop-blur-3xl rotate-12">
                 <Wallet className="w-20 h-20 text-primary -rotate-12 drop-shadow-2xl" />
              </div>
            </div>
            <div className="max-w-xl space-y-6">
              <h2 className="text-6xl font-black italic tracking-tighter uppercase leading-[0.9]">Connect Your <br/><span className="text-primary italic">Battle ID</span></h2>
              <p className="text-gray-400 text-lg leading-relaxed">Forge your destiny on the Sui blockchain. Collect, trade, and dominate with verifiable item drops and the ultimate bad-luck protection system.</p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="h-full relative z-10"
            >
              {currentView === 'store' && <StoreView onOpen={() => setCurrentView('inventory')} />}
              {currentView === 'inventory' && <InventoryView />}
              {currentView === 'admin' && <AdminView />}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Opening & Reveal Modals */}
      <AnimatePresence>
        {reveal && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-[110] bg-background/95 backdrop-blur-2xl flex items-center justify-center p-8"
          >
             <div className="max-w-md w-full glass-panel p-12 text-center space-y-8 border-2 border-white/20 shadow-2xl relative overflow-hidden">
                <div className={`absolute -inset-2 opacity-20 blur-3xl ${reveal.rarity === 3 ? 'bg-legendary' : reveal.rarity === 2 ? 'bg-epic' : 'bg-primary'}`} />
                
                <div className="space-y-2 relative z-10">
                  <span className={`text-xs font-black uppercase tracking-[0.4em] ${getRarityColor(reveal.rarity)}`}>
                    Item Revealed
                  </span>
                  <h3 className="text-4xl font-black uppercase italic tracking-tighter">{reveal.name}</h3>
                </div>

                <div className={`aspect-square rounded-3xl flex items-center justify-center border relative z-10 ${getRarityBorder(reveal.rarity)} ${reveal.rarity >= 2 ? 'bg-white/5' : 'bg-transparent'}`}>
                   <Shield className={`w-32 h-32 ${getRarityColor(reveal.rarity)}`} />
                </div>

                <div className="grid grid-cols-2 gap-4 relative z-10">
                   <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <span className="text-[10px] text-gray-500 uppercase font-black block mb-1">Power</span>
                      <span className="text-2xl font-black flex items-center justify-center gap-2">
                         <Zap className="w-5 h-5 text-yellow-500" /> {reveal.power}
                      </span>
                   </div>
                   <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <span className="text-[10px] text-gray-500 uppercase font-black block mb-1">Rarity</span>
                      <span className={`text-sm font-black uppercase ${getRarityColor(reveal.rarity)}`}>
                         {['Common', 'Rare', 'Epic', 'Legendary'][reveal.rarity]}
                      </span>
                   </div>
                </div>

                <button 
                  onClick={() => setReveal(null)}
                  className="w-full h-14 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all relative z-10"
                >
                  Continue
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer / Status Bar */}
      <footer className="h-12 border-t border-white/5 bg-panel/50 backdrop-blur-sm px-8 flex items-center justify-between text-[11px] text-gray-400 uppercase tracking-[0.3em] font-medium">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2 text-primary font-bold"><Sparkles className="w-3 h-3" /> Sui Testnet</span>
          <span className="opacity-40">Chain ID: 101</span>
        </div>
        <div className="opacity-40">Verifiable On-Chain Randomness Active</div>
      </footer>
    </div>
  );
}

// Sub-views
function StoreView({ onOpen }: { onOpen: () => void }) {
  const { price } = useLootBoxPrice();
  const { purchase } = usePurchaseLootBox();
  const [buying, setBuying] = useState(false);

  const handlePurchase = async () => {
    setBuying(true);
    try {
      await purchase(Number(price || 100000000));
      onOpen(); // Move to inventory to open
    } catch {
      // toast error
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 h-full flex flex-col justify-center">
       <div className="space-y-4">
          <h2 className="text-5xl font-black uppercase italic tracking-tighter leading-none">Box <span className="text-primary italic">Forge</span></h2>
          <p className="text-gray-400 text-lg max-w-xl">Purchase ancient loot boxes and uncover high-power gear for your digital collection.</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {[
            { name: 'Ancient Chest', desc: 'Standard item drops with low legendary chance.', color: 'primary' },
            { name: 'Nexus Crate', desc: 'Higher epic drop rate and boosted power ranges.', color: 'secondary' },
          ].map((box) => (
            <motion.div 
              key={box.name}
              whileHover={{ y: -10 }}
              className="glass-panel p-10 space-y-8 group transition-all relative overflow-hidden"
            >
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="aspect-square bg-white/5 rounded-[40px] flex items-center justify-center group-hover:bg-primary/5 transition-colors relative border border-white/5 group-hover:border-primary/20">
                  <Package className="w-32 h-32 text-gray-400 group-hover:text-primary transition-all duration-500 group-hover:scale-110 drop-shadow-xl" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-40" />
              </div>
              
              <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black tracking-tight uppercase italic">{box.name}</h3>
                    <p className="text-gray-500 text-sm leading-snug">{box.desc}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] text-primary font-black uppercase tracking-widest mb-1">Cost</span>
                    <span className="text-3xl font-black">{(Number(price || 100000000) / 10**9).toFixed(1)} <span className="text-sm font-bold opacity-30">SUI</span></span>
                  </div>
              </div>

              <button 
                onClick={handlePurchase}
                disabled={buying}
                className="w-full h-16 bg-white text-black font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-primary hover:text-white transition-all transform group-hover:shadow-[0_20px_40px_rgba(59,130,246,0.2)] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {buying ? 'Processing...' : 'Forge Now'} <ChevronRight className="w-6 h-6" />
              </button>
            </motion.div>
          ))}
       </div>
    </div>
  );
}

function InventoryView() {
  const account = useCurrentAccount();
  const { nfts, refetch } = useUserNFTs(account?.address || '');
  // Also get LootBox objects
  const { data: rawBoxes, refetch: refetchBoxes } = useSuiClientQuery('getOwnedObjects', {
    owner: account?.address || '',
    filter: { StructType: `${PACKAGE_ID}::${MODULE_NAME}::LootBox` },
    options: { showContent: true }
  });
  const { open } = useOpenLootBox();

  const boxes = rawBoxes?.data?.map((o: any) => ({ id: o.data?.objectId })) || [];

  const handleOpen = async (id: string) => {
    try {
      await open(id);
      setTimeout(() => {
        refetch();
        refetchBoxes();
      }, 2000);
    } catch {
      // error handling
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-end">
        <div className="space-y-3">
           <h2 className="text-5xl font-black uppercase italic tracking-tighter">My <span className="text-secondary italic">Vault</span></h2>
           <p className="text-gray-400 text-lg">Manage your unopened boxes and legendary collection.</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-white/5 rounded-2xl px-6 py-4 border border-white/5 flex items-center gap-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Unopened</span>
              <span className="text-2xl font-black text-primary">{boxes.length}</span>
           </div>
           <div className="bg-white/5 rounded-2xl px-6 py-4 border border-white/5 flex items-center gap-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Items</span>
              <span className="text-2xl font-black text-secondary">{nfts.length}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Unopened Boxes */}
        {boxes.map((box: any) => (
          <motion.div key={box.id} className="glass-panel p-6 space-y-6 relative group overflow-hidden border-dashed border-primary/20">
             <div className="aspect-square bg-primary/5 rounded-2xl flex items-center justify-center">
                <Package className="w-16 h-16 text-primary animate-pulse" />
             </div>
             <div className="space-y-4">
               <h4 className="text-lg font-bold uppercase italic text-center">Ancient Loot Box</h4>
               <button 
                onClick={() => handleOpen(box.id)}
                className="w-full py-3 bg-primary text-white font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all text-xs"
               >
                 Unlock Now
               </button>
             </div>
          </motion.div>
        ))}

        {/* Owned NFTs */}
        {nfts.map(nft => (
          <motion.div 
            key={nft.id} 
            layoutId={nft.id}
            className={`glass-panel p-6 space-y-6 relative group hover:border-white/20 transition-all ${nft.rarity === 3 ? 'glow-legendary' : nft.rarity === 2 ? 'glow-epic' : ''}`}
          >
             <div className="aspect-square bg-white/5 rounded-2xl flex items-center justify-center relative overflow-hidden">
                <div className={`absolute inset-0 opacity-10 blur-xl ${getRarityBg(nft.rarity)}`} />
                <Shield className={`w-16 h-16 relative z-10 ${getRarityColor(nft.rarity)}`} />
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
                   <Zap className="w-3 h-3 text-yellow-500" />
                   <span className="text-xs font-black tracking-tighter">{nft.power}</span>
                </div>
             </div>
             <div className="space-y-1 text-center">
               <span className={`text-[9px] font-black uppercase tracking-[0.2em] opacity-60 ${getRarityColor(nft.rarity)}`}>
                 {['Common', 'Rare', 'Epic', 'Legendary'][nft.rarity]}
               </span>
               <h4 className="font-black uppercase italic tracking-tight">{nft.name}</h4>
             </div>
          </motion.div>
        ))}
      </div>

      {boxes.length === 0 && nfts.length === 0 && (
        <div className="h-[400px] glass-panel border-dashed flex flex-col items-center justify-center text-gray-600 gap-4">
           <LayoutGrid className="w-20 h-20 opacity-10" />
           <p className="text-xl font-bold uppercase tracking-widest opacity-20 italic">No loot detected in vault</p>
        </div>
      )}
    </div>
  );
}

function AdminView() {
  const { data: configData } = useSuiClientQuery('getObject', {
    id: GAME_CONFIG_ID,
    options: { showContent: true }
  });
  // @ts-ignore
  const fields = configData?.data?.content?.fields;

  const stats = [
    { label: 'Common', weight: fields?.common_weight || 60, color: 'bg-gray-400' },
    { label: 'Rare', weight: fields?.rare_weight || 25, color: 'bg-blue-400' },
    { label: 'Epic', weight: fields?.epic_weight || 12, color: 'bg-purple-500' },
    { label: 'Legendary', weight: fields?.legendary_weight || 3, color: 'bg-yellow-400' },
  ];

  return (
     <div className="glass-panel p-16 max-w-5xl mx-auto space-y-16 border-2 border-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full" />
        
        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-3">
             <Shield className="text-primary w-10 h-10" />
             <h2 className="text-5xl font-black uppercase italic tracking-tighter">Command <span className="text-primary italic">Center</span></h2>
          </div>
          <p className="text-gray-400 text-lg">Strategic override for loot distribution and capital management.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 relative z-10">
           <div className="space-y-10">
              <h3 className="text-xl font-black uppercase italic flex items-center gap-3 text-white">
                <Settings className="w-6 h-6 text-primary" /> Rarity Calibration
              </h3>
              <div className="space-y-8">
                {stats.map(stat => (
                  <div key={stat.label} className="space-y-3">
                     <div className="flex justify-between items-end">
                       <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-500">{stat.label} Priority</span>
                       <span className="text-xl font-black">{stat.weight}%</span>
                     </div>
                     <div className="h-2 bg-white/5 rounded-full overflow-hidden p-[2px]">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${stat.weight}%` }}
                          className={`h-full rounded-full ${stat.color} shadow-[0_0_15px_rgba(255,255,255,0.2)]`} 
                        />
                     </div>
                  </div>
                ))}
              </div>
           </div>

           <div className="space-y-10">
              <h3 className="text-xl font-black uppercase italic flex items-center gap-3 text-white">
                <LogOut className="w-6 h-6 text-secondary" /> Treasury Reserve
              </h3>
              <div className="space-y-8">
                <div className="p-10 bg-white/5 border border-white/10 rounded-[32px] space-y-4 relative overflow-hidden group">
                   <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                   <span className="text-xs font-black text-gray-500 uppercase tracking-widest relative z-10">Liquid Capital</span>
                   <div className="text-5xl font-black relative z-10">{(Number(fields?.treasury?.fields?.balance || 0) / 10**9).toFixed(2)} <span className="text-lg opacity-30 font-bold">SUI</span></div>
                </div>
                <div className="space-y-4">
                  <button className="w-full h-16 bg-secondary text-black font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-secondary/20">
                    Withdraw Treasury
                  </button>
                  <button className="w-full h-16 bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all">
                    Update Drop Weights
                  </button>
                </div>
              </div>
           </div>
        </div>
     </div>
  );
}

// Helper utilities for rarity styling
function getRarityColor(rarity: number) {
  switch (rarity) {
    case 3: return 'text-legendary';
    case 2: return 'text-epic';
    case 1: return 'text-rare';
    default: return 'text-common';
  }
}

function getRarityBorder(rarity: number) {
  switch (rarity) {
    case 3: return 'border-legendary/40';
    case 2: return 'border-epic/40';
    case 1: return 'border-rare/40';
    default: return 'border-white/10';
  }
}

function getRarityBg(rarity: number) {
  switch (rarity) {
    case 3: return 'bg-legendary';
    case 2: return 'bg-epic';
    case 1: return 'bg-rare';
    default: return 'bg-white';
  }
}
