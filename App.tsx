import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Wallet, PiggyBank, ArrowRightLeft, CheckCircle2, AlertCircle, TrendingUp, X, ArrowRight } from 'lucide-react';

type Item = { id: string; name: string; balance: number };
type Debt = { id: string; date: string; borrowFrom: string; toFund: string; amount: number; note: string };

function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {}
  };
  return [storedValue, setValue] as const;
}

const GlassCard = ({ children, className = "", delay = 0 }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }} 
    animate={{ opacity: 1, y: 0 }} 
    transition={{ delay, duration: 0.5, type: "spring", stiffness: 100 }}
    className={`bg-black/40 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-5 shadow-2xl shadow-amber-900/10 ${className}`}
  >
    {children}
  </motion.div>
);

function CurrencyInput({ value, onChange }: { value: number, onChange: (v: number) => void }) {
  const [focused, setFocused] = useState(false);
  const displayValue = focused ? (value === 0 ? '' : value) : (value === 0 ? '0.00' : value.toFixed(2));
  
  return (
    <div className="relative">
      <input 
        type={focused ? "number" : "text"}
        step="0.01"
        value={displayValue}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          onChange(parseFloat((value || 0).toFixed(2)));
        }}
        placeholder="0.00"
        className="w-28 bg-black/40 border border-white/10 rounded-xl px-3 py-2 pr-6 text-right font-semibold focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 placeholder-white/30 transition-all text-white"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 font-semibold pointer-events-none">€</span>
    </div>
  );
}

export default function App() {
  const [accounts, setAccounts] = useLocalStorage<Item[]>('hugo_accounts_v3', [
    { id: '1', name: 'BNP', balance: 0 },
    { id: '2', name: 'Revolut', balance: 0 },
  ]);
  const [pockets, setPockets] = useLocalStorage<Item[]>('hugo_pockets_v3', [
    { id: 'p1', name: 'Life', balance: 0 },
    { id: 'p2', name: 'Plaisirs', balance: 0 },
    { id: 'p3', name: 'Remboursement Papa', balance: 0 },
    { id: 'p4', name: 'Cadeaux', balance: 0 },
    { id: 'p5', name: 'Épargne', balance: 0 },
  ]);
  const [debts, setDebts] = useLocalStorage<Debt[]>('hugo_debts_v3', []);
  const [pocketPercentages, setPocketPercentages] = useLocalStorage('hugo_pockets_pct_v3', {
    'Life': 25, 'Plaisirs': 35, 'Remboursement Papa': 25, 'Cadeaux': 5, 'Épargne': 10
  });
  const [showPaycheck, setShowPaycheck] = useState(false);

  const getVirtual = (name: string, bal: number) => {
    let v = bal;
    debts.forEach(d => {
      if (d.borrowFrom === name) v += d.amount;
      if (d.toFund === name) v -= d.amount;
    });
    return parseFloat(v.toFixed(2));
  };

  const revolutBalance = parseFloat(pockets.reduce((acc, curr) => acc + curr.balance, 0).toFixed(2));
  const displayAccounts = accounts.map(a => a.name === 'Revolut' ? { ...a, balance: revolutBalance, isReadonly: true } : a);
  
  const bnpBalance = accounts.find(a => a.name === 'BNP')?.balance || 0;
  const totalNetWorth = parseFloat((bnpBalance + revolutBalance).toFixed(2));

  if (showPaycheck) {
    return <PaycheckFlow 
      accounts={accounts} 
      setAccounts={setAccounts}
      pocketPercentages={pocketPercentages} 
      setPocketPercentages={setPocketPercentages} 
      pockets={pockets}
      setPockets={setPockets}
      getVirtual={getVirtual}
      onClose={() => setShowPaycheck(false)} 
    />;
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6 pb-20 overflow-hidden">
      <header className="text-center py-8">
        <motion.div initial={{ scale: 0.8, opacity: 0, rotate: -5 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: "spring", bounce: 0.5 }}>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 text-transparent bg-clip-text drop-shadow-sm">
            Hugo's Accountant
          </h1>
        </motion.div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-amber-200/60 text-sm mt-2 font-medium tracking-widest uppercase">
          Zero Mental Finance
        </motion.p>
      </header>

      <motion.button 
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setShowPaycheck(true)}
        className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold py-5 rounded-2xl shadow-[0_0_30px_rgba(251,191,36,0.3)] flex items-center justify-center space-x-3"
      >
        <Wallet size={24} />
        <span className="text-xl">Nouvelle Paye</span>
      </motion.button>

      <GlassCard delay={0.1}>
        <DashboardList 
          title="Comptes" 
          items={displayAccounts} 
          setItems={setAccounts} 
          getVirtual={getVirtual} 
          rightElement={<div className="text-xs font-bold text-amber-200/60 uppercase tracking-wider">Total: <span className="text-amber-400">{totalNetWorth.toFixed(2)}€</span></div>}
        />
        <div className="h-6"></div>
        <DashboardList title="Poches (Revolut)" items={pockets} setItems={setPockets} getVirtual={getVirtual} />
      </GlassCard>

      <DebtManager debts={debts} setDebts={setDebts} sources={[...accounts.map(a=>a.name), ...pockets.map(p=>p.name)]} />
    </div>
  );
}

function DashboardList({ title, items, setItems, getVirtual, rightElement }: any) {
  const updateBalance = (id: string, balance: number) => {
    setItems((prev: any) => prev.map((i: any) => i.id === id ? { ...i, balance } : i));
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
        <h3 className="text-xs font-bold text-amber-500/80 uppercase tracking-wider">{title}</h3>
        {rightElement}
      </div>
      <AnimatePresence>
        {items.map((item: any, index: number) => {
          const virtual = getVirtual(item.name, item.balance);
          const hasDebt = virtual !== item.balance;
          return (
            <motion.div 
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              key={item.id} 
              className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-colors group"
            >
              <div>
                <div className="font-semibold text-white/90 group-hover:text-amber-400 transition-colors">{item.name}</div>
                {hasDebt && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-xs font-bold mt-1 ${virtual < item.balance ? 'text-red-400' : 'text-amber-400'}`}>
                    Vrai dispo: {virtual.toFixed(2)}€
                  </motion.div>
                )}
              </div>
              {item.isReadonly ? (
                <div className="w-28 px-3 py-2 text-right font-bold text-amber-400 text-lg">{item.balance.toFixed(2)}€</div>
              ) : (
                <CurrencyInput value={item.balance} onChange={(v) => updateBalance(item.id, v)} />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function PaycheckFlow({ accounts, setAccounts, pocketPercentages, setPocketPercentages, pockets, setPockets, getVirtual, onClose }: any) {
  const [income, setIncome] = useState<number | ''>('');
  const rawBnpBalance = accounts.find((a: any) => a.name === 'BNP')?.balance || 0;
  const bnpBalance = getVirtual('BNP', rawBnpBalance);
  
  const handleApply = () => {
    const inc = Number(income) || 0;
    const totalAvailable = bnpBalance + inc;
    const totalCharges = 236;
    const excessForRevolut = Math.max(0, totalAvailable - totalCharges);
    const newBnpBalance = parseFloat((rawBnpBalance + inc - excessForRevolut).toFixed(2));
    
    setAccounts((prev: any) => prev.map((a: any) => a.name === 'BNP' ? { ...a, balance: newBnpBalance } : a));
    
    setPockets((prev: any) => prev.map((p: any) => {
      const pct = pocketPercentages[p.name] || 0;
      const amountToAdd = parseFloat(((excessForRevolut * pct) / 100).toFixed(2));
      return { ...p, balance: parseFloat((p.balance + amountToAdd).toFixed(2)) };
    }));
    
    onClose();
  };
  
  const FIXED_EXPENSES = [
    { name: 'Voiture', amount: 175 },
    { name: 'Basic-Fit', amount: 35 },
    { name: 'Coiffeur', amount: 10 },
    { name: 'Base', amount: 16 },
  ];
  const totalCharges = 236;
  const inc = Number(income) || 0;
  const totalAvailable = bnpBalance + inc;
  const deficit = totalCharges - bnpBalance;
  const excessForRevolut = Math.max(0, totalAvailable - totalCharges);

  const totalPercentage = Object.values(pocketPercentages).reduce((a: any, b: any) => a + b, 0) as number;
  const isError = totalPercentage !== 100;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="max-w-md mx-auto p-4 space-y-6 pb-20 min-h-screen">
      <div className="flex items-center justify-between pt-4 mb-2">
        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-amber-200 to-amber-500 text-transparent bg-clip-text">Nouvelle Paye</h2>
        <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white"><X size={20} /></motion.button>
      </div>

      <GlassCard>
        <label className="block text-sm text-amber-200/80 mb-3 font-semibold uppercase tracking-wider">Combien as-tu reçu ? (€)</label>
        <motion.input 
          whileFocus={{ scale: 1.02 }}
          type="number" 
          value={income} 
          onChange={(e) => setIncome(parseFloat(e.target.value) || '')}
          placeholder="Ex: 1500"
          className="w-full bg-black/50 border border-amber-500/30 rounded-2xl px-5 py-5 text-3xl font-bold focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 placeholder-white/20 mb-6 transition-all text-amber-400"
          autoFocus
        />
        
        <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-4">
          <div className="flex justify-between text-sm items-center">
            <span className="text-white/70 font-medium">Vrai dispo BNP Actuel</span>
            <span className="font-bold text-lg">{bnpBalance.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-white/70 font-medium">Charges Fixes</span>
            <span className="font-bold text-red-400 text-lg">-{totalCharges}€</span>
          </div>
          <div className="border-t border-white/10 pt-4 flex justify-between items-center">
            <span className="font-semibold text-sm text-white/90">Statut Bunker</span>
            {deficit > 0 ? (
              <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-red-400 font-bold flex items-center text-sm bg-red-400/10 px-3 py-1 rounded-full"><AlertCircle size={16} className="mr-1.5"/> Manque {deficit.toFixed(2)}€</motion.span>
            ) : (
              <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-amber-400 font-bold flex items-center text-sm bg-amber-400/10 px-3 py-1 rounded-full"><CheckCircle2 size={16} className="mr-1.5"/> Couvert</motion.span>
            )}
          </div>
        </div>
      </GlassCard>

      <AnimatePresence>
        {inc > 0 && (
          <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 120 }}>
            <GlassCard>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl"><PiggyBank size={24} /></div>
                  <h2 className="text-2xl font-bold">Le Splitter</h2>
                </div>
                <motion.div animate={{ scale: isError ? [1, 1.1, 1] : 1 }} className={`px-3 py-1.5 rounded-xl font-bold text-sm ${isError ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-400 text-black'}`}>
                  {totalPercentage}%
                </motion.div>
              </div>

              <div className="text-center mb-8 bg-black/40 py-6 rounded-3xl border border-amber-500/20 shadow-inner">
                <div className="text-xs text-amber-200/70 font-bold uppercase tracking-widest mb-2">Excédent à distribuer</div>
                <div className="text-5xl font-black text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]">{excessForRevolut.toFixed(2)}€</div>
              </div>

              <div className="space-y-6">
                {Object.entries(pocketPercentages).map(([pocket, pct]) => {
                  const amount = (excessForRevolut * (pct as number)) / 100;
                  return (
                    <motion.div layout key={pocket} className="space-y-3 group">
                      <div className="flex justify-between items-end">
                        <span className="font-semibold text-white/90 group-hover:text-amber-300 transition-colors">{pocket}</span>
                        <div className="text-right">
                          <div className="font-bold text-xl leading-none text-amber-100">{amount.toFixed(2)}€</div>
                          <div className="text-amber-400/80 text-xs font-bold mt-1.5">{pct}%</div>
                        </div>
                      </div>
                      <input 
                        type="range" min="0" max="100" value={pct as number} 
                        onChange={(e) => setPocketPercentages({ ...pocketPercentages, [pocket]: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </motion.div>
                  );
                })}
              </div>
              
              <motion.button 
                whileHover={!isError ? { scale: 1.02 } : {}}
                whileTap={!isError ? { scale: 0.98 } : {}}
                onClick={handleApply}
                disabled={isError}
                className={`w-full mt-10 font-extrabold py-5 rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-3 ${isError ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10' : 'bg-gradient-to-r from-amber-400 to-amber-600 text-black shadow-[0_0_20px_rgba(251,191,36,0.3)]'}`}
              >
                <CheckCircle2 size={24} />
                <span className="text-lg">Valider la distribution</span>
              </motion.button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DebtManager({ debts, setDebts, sources }: any) {
  const [borrowFrom, setBorrowFrom] = useState(sources[0] || 'BNP');
  const [toFund, setToFund] = useState(sources[1] || 'Cadeaux');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const addDebt = () => {
    if (!amount || isNaN(Number(amount))) return;
    const roundedAmount = parseFloat(parseFloat(amount).toFixed(2));
    setDebts([{ id: Date.now().toString(), date: new Date().toLocaleDateString(), borrowFrom, toFund, amount: roundedAmount, note }, ...debts]);
    setAmount(''); setNote('');
  };

  return (
    <GlassCard delay={0.2}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl"><ArrowRightLeft size={20} /></div>
        <h2 className="text-xl font-bold">Dettes & Transferts</h2>
      </div>

      <div className="bg-white/5 p-5 rounded-3xl space-y-5 mb-8 border border-white/5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-amber-200/70 mb-1.5 font-semibold uppercase tracking-wider">Emprunté à</label>
            <select value={borrowFrom} onChange={(e) => setBorrowFrom(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 focus:outline-none focus:border-amber-500/50 text-sm text-white font-medium appearance-none">
              {sources.map((s: string) => <option key={s} value={s} className="bg-zinc-900">{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-amber-200/70 mb-1.5 font-semibold uppercase tracking-wider">Pour financer</label>
            <select value={toFund} onChange={(e) => setToFund(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 focus:outline-none focus:border-amber-500/50 text-sm text-white font-medium appearance-none">
              {sources.map((s: string) => <option key={s} value={s} className="bg-zinc-900">{s}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-amber-200/70 mb-1.5 font-semibold uppercase tracking-wider">Montant (€)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 focus:outline-none focus:border-amber-500/50 placeholder-white/30 text-sm font-medium" />
          </div>
          <div>
            <label className="block text-xs text-amber-200/70 mb-1.5 font-semibold uppercase tracking-wider">Note (opt)</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex: Cadeau" className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 focus:outline-none focus:border-amber-500/50 placeholder-white/30 text-sm font-medium" />
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={addDebt} className="w-full bg-white/10 hover:bg-amber-500/20 hover:text-amber-400 border border-white/10 hover:border-amber-500/30 text-white font-bold py-3.5 rounded-xl transition-all mt-2">
          Ajouter la dette
        </motion.button>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold text-amber-500/80 uppercase tracking-wider border-b border-amber-500/20 pb-2">Historique</h3>
        {debts.length === 0 ? (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-white/40 text-center py-8 bg-black/20 rounded-2xl border border-white/5 font-medium">Aucune dette en cours 🎉</motion.p>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {debts.map((debt: Debt) => (
                <motion.div layout key={debt.id} initial={{ opacity: 0, x: -20, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }} className="bg-black/40 p-4 rounded-2xl flex justify-between items-center border border-white/5 hover:border-amber-500/20 transition-colors group">
                  <div>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="font-bold text-amber-400">{debt.toFund}</span>
                      <ArrowRightLeft size={14} className="text-white/40" />
                      <span className="text-white/80 font-medium">{debt.borrowFrom}</span>
                    </div>
                    <div className="text-xs text-white/40 mt-1.5 font-medium">{debt.date} {debt.note && <span className="text-white/60">• {debt.note}</span>}</div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-black text-lg">{debt.amount.toFixed(2)}€</span>
                    <motion.button whileHover={{ scale: 1.2, rotate: 15 }} whileTap={{ scale: 0.9 }} onClick={() => setDebts(debts.filter((d: Debt) => d.id !== debt.id))} className="text-white/30 hover:text-amber-400 p-1 transition-colors"><CheckCircle2 size={22} /></motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
