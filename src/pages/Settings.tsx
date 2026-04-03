import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Palette, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const ProfileTab: React.FC<{ user: SupabaseUser | null }> = ({ user }) => {
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || '');
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName }
    });

    if (error) {
      alert('Erro ao atualizar perfil: ' + error.message);
    } else {
      alert('Perfil atualizado com sucesso!');
    }
    setLoading(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8 animate-in fade-in duration-300">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Informações Pessoais</h2>
      
      <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">E-mail de Cadastro</label>
          <input 
            type="email" 
            disabled 
            value={user?.email || 'usuario@exemplo.com'} 
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
          />
          <p className="mt-2 text-sm text-gray-500">O e-mail não pode ser alterado por enquanto.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome de Exibição</label>
          <input 
            type="text" 
            placeholder="Seu Nome"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
          />
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
          <button disabled={loading} type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50">
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
};

const PRESET_CATEGORIES = [
  { group: 'Moradia', icon: '🏠', color: '#3b82f6', type: 'expense', items: ['Aluguel', 'Financiamento', 'Condomínio', 'Energia elétrica', 'Água', 'Internet', 'Gás'] },
  { group: 'Alimentação', icon: '🍔', color: '#f59e0b', type: 'expense', items: ['Supermercado', 'Restaurantes', 'Delivery', 'Cafés/Lanches'] },
  { group: 'Transporte', icon: '🚗', color: '#10b981', type: 'expense', items: ['Combustível', 'Transporte público', 'Uber/Taxi', 'Manutenção de veículo', 'Estacionamento'] },
  { group: 'Saúde', icon: '🏥', color: '#ef4444', type: 'expense', items: ['Plano de saúde', 'Consultas médicas', 'Exames', 'Farmácia'] },
  { group: 'Educação', icon: '🎓', color: '#8b5cf6', type: 'expense', items: ['Faculdade', 'Cursos online', 'Livros', 'Assinaturas educacionais'] },
  { group: 'Compras', icon: '🛍️', color: '#ec4899', type: 'expense', items: ['Roupas', 'Eletrônicos', 'Casa e decoração', 'Compras diversas'] },
  { group: 'Lazer & Entret.', icon: '🎮', color: '#f43f5e', type: 'expense', items: ['Cinema', 'Viagens', 'Jogos', 'Streaming', 'Eventos'] },
  { group: 'Assinaturas', icon: '📱', color: '#06b6d4', type: 'expense', items: ['Streaming', 'Apps pagos', 'Softwares', 'Clubes'] },
  { group: 'Finanças', icon: '💳', color: '#64748b', type: 'expense', items: ['Cartão de crédito', 'Empréstimos', 'Juros', 'Tarifas bancárias'] },
  { group: 'Outros', icon: '🎁', color: '#9ca3af', type: 'expense', items: ['Presentes', 'Doações', 'Imprevistos'] },
  
  { group: 'Renda Principal', icon: '💼', color: '#10b981', type: 'income', items: ['Salário', 'Pró-labore'] },
  { group: 'Renda Extra', icon: '🧑‍💻', color: '#3b82f6', type: 'income', items: ['Freelance', 'Bicos', 'Consultorias'] },
  { group: 'Investimentos', icon: '📊', color: '#8b5cf6', type: 'income', items: ['Dividendos', 'Juros', 'Venda de ativos'] },
  { group: 'Outras Receitas', icon: '💸', color: '#f59e0b', type: 'income', items: ['Reembolsos', 'Prêmios', 'Vendas diversas'] },
];

const CategoriesTab: React.FC<{ user: SupabaseUser | null }> = ({ user }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [type, setType] = useState('expense');
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    if (!user) return;
    const { data, error } = await supabase.from('categories').select('*');
    if (!error && data) setCategories(data);
  };

  useEffect(() => {
    fetchCategories();
  }, [user]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name) return;
    setLoading(true);
    const { data, error } = await supabase.from('categories').insert([{ user_id: user.id, name, color, type }]).select();

    if (error) alert('Erro: ' + error.message);
    else if (data) {
      setCategories([...categories, data[0]]);
      setName('');
    }
    setLoading(false);
  };

  const handleDeleteCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) alert('Erro: ' + error.message);
    else setCategories(categories.filter(c => c.id !== id));
  };

  const handleLoadPresets = async () => {
    if (!user) return;
    setLoading(true);
    const toInsert = PRESET_CATEGORIES.flatMap(g => 
      g.items.map(item => ({
        user_id: user.id,
        name: g.icon + " " + item,
        color: g.color,
        type: g.type
      }))
    );
    
    const { data, error } = await supabase.from('categories').insert(toInsert).select();
    if (error) alert('Erro ao carregar presets: ' + error.message);
    else if (data) setCategories([...categories, ...data]);
    setLoading(false);
  };

  // Sort categories alphabetically so emojis naturally group them
  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Suas Categorias</h2>
        {categories.length === 0 && (
          <button 
            onClick={handleLoadPresets} disabled={loading}
            className="text-sm px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium shadow-sm transition-all disabled:opacity-50"
          >
            Carregar Categorias Recomendadas ✨
          </button>
        )}
      </div>
      
      <form onSubmit={handleAddCategory} className="flex gap-4 mb-8 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <input 
            type="text" required placeholder="Nova Categoria (Ex: 🐶 Pets)" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="w-16">
          <input 
            type="color" value={color} onChange={(e) => setColor(e.target.value)}
            className="w-full h-10 rounded-lg cursor-pointer border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          />
        </div>
        <div className="w-32">
          <select 
            value={type} onChange={(e) => setType(e.target.value)}
            className="w-full h-10 px-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
          </select>
        </div>
        <button disabled={loading} type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center">
          <Plus size={20} />
        </button>
      </form>

      <div className="space-y-3">
        {sortedCategories.length === 0 && <p className="text-gray-500 dark:text-gray-400">Nenhuma categoria cadastrada. Utilize as categorias recomendadas ou crie a sua principal.</p>}
        {sortedCategories.map(cat => (
          <div key={cat.id} className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }}></div>
              <span className="font-medium text-gray-900 dark:text-white">{cat.name}</span>
              <span className={"text-xs px-2 py-1 rounded-full font-medium " + (cat.type === 'income' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400')}>
                {cat.type === 'income' ? 'Receita' : 'Despesa'}
              </span>
            </div>
            <button onClick={() => handleDeleteCategory(cat.id)} className="text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const NotificationsTab: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8 animate-in fade-in duration-300">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Preferências de Notificação</h2>
      
      <div className="space-y-4">
        {[
          { title: "Resumo Semanal", desc: "Receba relatórios detalhados toda segunda-feira" },
          { title: "Vencimento de Faturas", desc: "Avisos 2 dias antes do vencimento do limite do orçamento" },
          { title: "Alertas de Metas", desc: "Notificação ao atingir 50% e 100% da sua meta" }
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-xl">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked={i !== 1} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

const SecurityTab: React.FC = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) alert('Erro: ' + error.message);
    else {
      alert('Senha atualizada com sucesso!');
      setPassword('');
    }
    setLoading(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8 animate-in fade-in duration-300">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Segurança da Conta</h2>
      
      <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nova Senha</label>
          <input 
            type="password" 
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
          />
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
          <button disabled={loading} type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50">
            Atualizar Senha
          </button>
        </div>
      </form>
    </div>
  );
};

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'categories' | 'notifications' | 'security'>('profile');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Configurações</h1>
        <p className="text-gray-500 dark:text-gray-400">Gerencie sua conta e preferências do sistema.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Menu Lateral */}
        <div className="md:col-span-1 space-y-2">
          <button 
            onClick={() => setActiveTab('profile')}
            className={"w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors " + (activeTab === 'profile' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800')}
          >
            <User size={18} /> Perfil
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={"w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors " + (activeTab === 'categories' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800')}
          >
            <Palette size={18} /> Categorias
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={"w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors " + (activeTab === 'notifications' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800')}
          >
            <Bell size={18} /> Notificações
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={"w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors " + (activeTab === 'security' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800')}
          >
            <Shield size={18} /> Segurança
          </button>
        </div>

        {/* Conteúdo das configurações */}
        <div className="md:col-span-3 min-h-[400px]">
          {activeTab === 'profile' && <ProfileTab user={user} />}
          {activeTab === 'categories' && <CategoriesTab user={user} />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'security' && <SecurityTab />}
        </div>
      </div>
    </div>
  );
};

export default Settings;
