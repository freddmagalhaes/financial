import React, { useState, useEffect } from 'react';
import { Plus, Filter, Search, X, Edit2, Trash2, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet, CheckCircle2, Circle, Copy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const ptBRMonths = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
const availableYears = Array.from({ length: 15 }, (_, i) => 2024 + i);

const Transactions: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  
  // Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [date, setDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isPaid, setIsPaid] = useState(true);

  const fetchTransactions = async () => {
    if (!user) return;

    // Filtro por mês
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    // Ajuste seguro de string YYYY-MM-DD
    const startStr = firstDay.getFullYear() + '-' + String(firstDay.getMonth() + 1).padStart(2, '0') + '-01';
    const endStr = lastDay.getFullYear() + '-' + String(lastDay.getMonth() + 1).padStart(2, '0') + '-' + String(lastDay.getDate()).padStart(2, '0');

    const { data, error } = await supabase
      .from('transactions')
      .select('*, categories(*)')
      .gte('date', startStr)
      .lte('date', endStr)
      .order('date', { ascending: false });
      
    if (!error && data) {
      setTransactions(data);
    }
  };

  const fetchCategories = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    if (!error && data) setCategories(data);
  };

  useEffect(() => {
    fetchTransactions();
  }, [user, currentDate]);

  useEffect(() => {
    fetchCategories();
  }, [user]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  const paidIncome = transactions.filter(t => t.type === 'income' && t.is_paid !== false).reduce((acc, t) => acc + Number(t.amount), 0);
  const paidExpense = transactions.filter(t => t.type === 'expense' && t.is_paid !== false).reduce((acc, t) => acc + Number(t.amount), 0);
  const paidBalance = paidIncome - paidExpense;
  
  // Saldo que resta após pagamento: Saldo Efetivo (que já tem) - Contas a Pagar
  const pendingExpense = totalExpense - paidExpense;
  const nextBalance = paidIncome - totalExpense; // Saldo atual assumindo que vai pagar as despesas pendentes

  const handleDuplicateToNextMonth = async () => {
    if (!transactions.length) {
      alert('Nenhuma transação neste mês para copiar.');
      return;
    }
    
    const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    const nextMonthStr = ptBRMonths[nextMonthDate.getMonth()] + ' de ' + nextMonthDate.getFullYear();
    
    if (!confirm(`Deseja copiar as ${transactions.length} transações para ${nextMonthStr}?\n\nTodas as informações serão duplicadas, mas as faturas ficarão como "Pendentes" (não pagas), para que você possa alterar os valores no próximo mês se necessário.`)) {
      return;
    }

    setLoading(true);

    const payload = transactions.map(tx => {
      const originalDate = new Date(tx.date + 'T12:00:00');
      originalDate.setMonth(originalDate.getMonth() + 1);
      
      return {
        user_id: tx.user_id,
        description: tx.description,
        amount: tx.amount, // Preserva o valor, o usuário pode editar depois
        type: tx.type,
        date: originalDate.toISOString().split('T')[0],
        category_id: tx.category_id,
        is_paid: false // Zera o pagamento para editar e pagar no novo mês
      };
    });

    const { error } = await supabase.from('transactions').insert(payload);
    
    if (error) {
      alert('Erro ao copiar transações: ' + error.message);
    } else {
      setTimeout(() => alert('Transações copiadas com sucesso! Avançando para ' + nextMonthStr + '.'), 100);
      handleNextMonth(); // move the view to the next month!
    }
    setLoading(false);
  };


  const handleOpenAdd = () => {
    setEditingTransaction(null);
    setDescription('');
    setAmount('');
    setType('expense');
    setDate(new Date().toISOString().split('T')[0]); // Hoje
    setCategoryId('');
    setIsPaid(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tx: any) => {
    setEditingTransaction(tx);
    setDescription(tx.description);
    setAmount(tx.amount.toString());
    setType(tx.type);
    setDate(tx.date);
    setCategoryId(tx.category_id || '');
    setIsPaid(tx.is_paid !== false);
    setIsModalOpen(true);
  };

  const handleTogglePaid = async (tx: any) => {
    const newStatus = tx.is_paid === false ? true : false;
    
    // Atualização Otimista
    setTransactions(transactions.map(t => t.id === tx.id ? { ...t, is_paid: newStatus } : t));

    const { error } = await supabase.from('transactions').update({ is_paid: newStatus }).eq('id', tx.id);
    if (error) {
      alert('Erro ao atualizar status: ' + error.message);
      fetchTransactions(); // Revert
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) alert('Erro ao deletar: ' + error.message);
    else {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    
    const payload = {
      user_id: user.id,
      description,
      amount: parseFloat(amount),
      type,
      date,
      category_id: categoryId || null,
      is_paid: isPaid,
    };

    if (editingTransaction) {
      const { error } = await supabase
        .from('transactions')
        .update(payload)
        .eq('id', editingTransaction.id);
      
      if (error) alert('Erro ao atualizar: ' + error.message);
      else fetchTransactions();
    } else {
      const { error } = await supabase
        .from('transactions')
        .insert([payload]);

      if (error) alert('Erro ao criar transação: ' + error.message);
      else fetchTransactions();
    }
    
    setIsModalOpen(false);
    setLoading(false);
  };

  const filteredTransactions = transactions.filter(tx => 
    tx.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Transações</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie suas receitas e despesas.</p>
        </div>
        
        {/* Month Selector */}
        <div className="flex items-center justify-between md:justify-center bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-100 dark:border-gray-700 shadow-sm w-full md:w-auto">
          <button onClick={handlePrevMonth} className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex items-center mx-2 space-x-1">
            <select
              value={currentDate.getMonth()}
              onChange={(e) => setCurrentDate(new Date(currentDate.getFullYear(), Number(e.target.value), 1))}
              className="text-sm font-semibold bg-transparent text-gray-900 dark:text-white outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-1 py-0.5 appearance-none text-center text-center-last"
            >
              {ptBRMonths.map((m, i) => (
                <option key={i} value={i} className="bg-white dark:bg-gray-800">{m}</option>
              ))}
            </select>
            <select
              value={currentDate.getFullYear()}
              onChange={(e) => setCurrentDate(new Date(Number(e.target.value), currentDate.getMonth(), 1))}
              className="text-sm font-semibold bg-transparent text-gray-900 dark:text-white outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-1 py-0.5 appearance-none text-center text-center-last"
            >
              {availableYears.map(y => (
                <option key={y} value={y} className="bg-white dark:bg-gray-800">{y}</option>
              ))}
            </select>
          </div>

          <button onClick={handleNextMonth} className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
          <button 
            onClick={handleDuplicateToNextMonth}
            disabled={loading || transactions.length === 0}
            title="Copiar estas transações para o próximo mês"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-xl transition-colors shadow-sm shrink-0 disabled:opacity-50"
          >
            <Copy size={18} />
            <span className="hidden md:inline">Clonar p/ Novo Mês</span>
          </button>
          <button 
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm shrink-0"
          >
            <Plus size={18} />
            <span className="hidden md:inline">Nova Transação</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card Saldo Atual (Efetivado) */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className={"p-3 rounded-xl " + (paidBalance >= 0 ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400")}>
            <Wallet size={24} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Saldo Atual da Conta</p>
            <p className={"text-2xl font-bold " + (paidBalance >= 0 ? "text-gray-900 dark:text-white" : "text-red-600 dark:text-red-400")}>
              R$ {paidBalance.toFixed(2)}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">Saldo efetivado (já recebido/pago)</p>
          </div>
        </div>

        {/* Card Restante (Para Pagamento) */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className={"p-3 rounded-xl " + (nextBalance >= 0 ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" : "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400")}>
            <Wallet size={24} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Resta Pós-Pagamentos</p>
            <p className={"text-2xl font-bold " + (nextBalance >= 0 ? "text-gray-900 dark:text-white" : "text-orange-600 dark:text-orange-400")}>
              R$ {nextBalance.toFixed(2)}
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
              Faltam pagar: R$ {pendingExpense.toFixed(2)}
            </p>
          </div>
        </div>
        
        {/* Card Receitas */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Receitas Totais</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">R$ {totalIncome.toFixed(2)}</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">Recebido real: R$ {paidIncome.toFixed(2)}</p>
          </div>
        </div>

        {/* Card Despesas */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl">
            <TrendingDown size={24} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Despesas Totais</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">R$ {totalExpense.toFixed(2)}</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">Pago real: R$ {paidExpense.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por descrição..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium">
            <Filter size={18} />
            <span>Filtros</span>
          </button>
        </div>

        {/* Table / Empty State */}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-sm">
                <th className="px-6 py-4 font-medium w-12 text-center">Situação</th>
                <th className="px-6 py-4 font-medium">Descrição</th>
                <th className="px-6 py-4 font-medium">Categoria</th>
                <th className="px-6 py-4 font-medium">Data</th>
                <th className="px-6 py-4 font-medium">Valor</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-900 dark:text-gray-100">
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Nenhuma transação encontrada.
                  </td>
                </tr>
              )}
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => handleTogglePaid(tx)} 
                      title={tx.is_paid !== false ? "Marcar como pendente" : "Marcar como pago"}
                      className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-200"
                    >
                      {tx.is_paid !== false ? (
                        <CheckCircle2 className="text-green-500" size={22} />
                      ) : (
                        <Circle className="text-gray-300 dark:text-gray-600 hover:text-gray-400" size={22} />
                      )}
                    </button>
                  </td>
                  <td className={"px-6 py-4 font-medium " + (tx.is_paid === false ? "text-gray-500 dark:text-gray-400" : "")}>{tx.description}</td>
                  <td className="px-6 py-4">
                    {tx.categories ? (
                      <span 
                        style={{ backgroundColor: tx.categories.color + '20', color: tx.categories.color }}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                      >
                        {tx.categories.name}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        Sem Categoria
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                    {new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td className={"px-6 py-4 font-semibold whitespace-nowrap " + (tx.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                    {tx.type === 'income' ? '+' : '-'} R$ {Number(tx.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenEdit(tx)} className="p-2 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 rounded-lg transition-colors text-gray-400">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(tx.id)} className="p-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded-lg transition-colors text-gray-400">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova/Editar Transação */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setType('expense'); setCategoryId(''); }}
                    className={"py-2 px-4 rounded-lg text-sm font-medium transition-colors border " + (type === 'expense' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700')}
                  >
                    Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => { setType('income'); setCategoryId(''); }}
                    className={"py-2 px-4 rounded-lg text-sm font-medium transition-colors border " + (type === 'income' ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700')}
                  >
                    Receita
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Compra do mês"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-transparent dark:text-white outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-transparent dark:text-white outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-transparent dark:text-white outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoria
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-transparent dark:text-white outline-none transition-colors"
                >
                  <option value="" className="dark:bg-gray-800">Selecione (Opcional)</option>
                  {categories.filter(c => c.type === type).map((cat) => (
                    <option key={cat.id} value={cat.id} className="dark:bg-gray-800">
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={isPaid}
                    onChange={(e) => setIsPaid(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {isPaid ? (type === 'income' ? 'Já recebi' : 'Já paguei') : (type === 'income' ? 'Ainda não recebi' : 'Ainda não paguei')}
                  </p>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? 'Salvando...' : 'Salvar Transação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
