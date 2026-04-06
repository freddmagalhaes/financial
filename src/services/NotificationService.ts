import { supabase } from '../lib/supabase';
import { differenceInDays, parseISO, startOfDay } from 'date-fns';

export interface DueTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  days_until_due: number;
}

export const NotificationService = {
  /**
   * Checa transações vencendo em 2 dias.
   */
  async checkDueTransactions(userId: string): Promise<DueTransaction[]> {
    // Busca a configuração do usuário
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return [];

    const notifyEnabled = userData.user.user_metadata?.notify_due_dates ?? true; // Ativado por padrão

    if (!notifyEnabled) {
      return [];
    }

    const today = startOfDay(new Date());

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .eq('is_paid', false);

    if (error || !transactions) {
      console.error('Erro ao buscar transações para notificação:', error);
      return [];
    }

    const dueTransactions: DueTransaction[] = [];

    transactions.forEach((t) => {
      const dueDate = startOfDay(parseISO(t.date));
      const diff = differenceInDays(dueDate, today);

      // Aviso para 2 dias exatos
      if (diff === 2) {
        dueTransactions.push({
          id: t.id,
          description: t.description,
          amount: t.amount,
          date: t.date,
          days_until_due: diff,
        });
      }
    });

    return dueTransactions;
  },

  /**
   * Função preparada para envio de e-mails, 
   * pode ser conectada a funções de backend/Edge Functions.
   */
  async notifyViaEmail(transaction: DueTransaction, userEmail: string) {
    console.log(`[STUB] Enviando e-mail para ${userEmail} sobre a transação ${transaction.description}`);
    // Exemplo de integração futura:
    // await supabase.functions.invoke('send-due-date-email', { body: { transaction, userEmail }})
  }
};
