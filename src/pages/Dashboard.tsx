import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      
      const { data: txs, error } = await supabase
        .from('transactions')
        .select('*, categories(*)')
        .order('date', { ascending: true }); 

      if (error || !txs) {
        setLoading(false);
        return;
      }

      let income = 0;
      let expense = 0;
      
      const monthlyData: Record<string, { name: string, income: number, expense: number, sortKey: string }> = {};
      const categoryData: Record<string, { name: string, value: number, color: string }> = {};

      txs.forEach((tx) => {
        const val = Number(tx.amount);
        
        // Accumulate totals
        if (tx.type === 'income') income += val;
        else expense += val;

        // Group by Month (for Area Chart)
        const dateObj = new Date(tx.date + 'T12:00:00');
        let monthName = dateObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
        monthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);
        
        const monthKey = dateObj.getFullYear() + '-' + String(dateObj.getMonth() + 1).padStart(2, '0');
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { name: monthName, income: 0, expense: 0, sortKey: monthKey };
        }
        
        if (tx.type === 'income') monthlyData[monthKey].income += val;
        else monthlyData[monthKey].expense += val;

        // Group Expenses by Category (for Pie Chart)
        if (tx.type === 'expense') {
          const catName = tx.categories?.name || 'Outros';
          const catColor = tx.categories?.color || '#9ca3af';

          if (!categoryData[catName]) {
            categoryData[catName] = { name: catName, value: 0, color: catColor };
          }
          categoryData[catName].value += val;
        }
      });

      setTotalIncome(income);
      setTotalExpense(expense);
      
      // Sort monthly data chronologically
      const sortedMonthly = Object.values(monthlyData).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
      setChartData(sortedMonthly);
      
      // Sort pie data descending
      setPieData(Object.values(categoryData).sort((a, b) => b.value - a.value));
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Olá, {user?.user_metadata?.display_name?.split(' ')[0] || 'Visitante'}! 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Aqui está o seu resumo financeiro {loading ? 'carregando...' : 'atualizado'}.</p>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/5 rounded-full -translate-y-12 translate-x-10 group-hover:scale-110 transition-transform blur-2xl"></div>
          <div className="flex items-center justify-between mb-4 relative">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Saldo Atual</h3>
            <Wallet className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white relative">
            {formatCurrency(balance)}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-green-500/10 dark:bg-green-500/5 rounded-full -translate-y-12 translate-x-10 group-hover:scale-110 transition-transform blur-2xl"></div>
          <div className="flex items-center justify-between mb-4 relative">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Receitas</h3>
            <ArrowUpCircle className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white relative">
            {formatCurrency(totalIncome)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-red-500/10 dark:bg-red-500/5 rounded-full -translate-y-12 translate-x-10 group-hover:scale-110 transition-transform blur-2xl"></div>
          <div className="flex items-center justify-between mb-4 relative">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Despesas</h3>
            <ArrowDownCircle className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white relative">
            {formatCurrency(totalExpense)}
          </p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Evolução Mensal</h3>
          
          {chartData.length > 0 ? (
            <div className="h-72 w-full mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(Number(value))}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.9)' }} 
                  />
                  <Area type="monotone" name="Receitas" dataKey="income" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" name="Despesas" dataKey="expense" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-400">
              {loading ? 'Carregando gráfico...' : 'Não há transações suficientes.'}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Despesas por Categoria</h3>
          
          {pieData.length > 0 ? (
            <div className="h-72 flex items-center justify-center mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={"cell-" + index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(Number(value))}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.9)' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center text-center text-gray-400">
              <div className="w-24 h-24 mb-4 rounded-full border-4 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center">
                <Wallet size={32} className="text-gray-300 dark:text-gray-600" />
              </div>
              <p>{loading ? 'Calculando resumos...' : 'Nenhuma despesa registrada ainda.'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
