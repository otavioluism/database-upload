import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    // pegando todas transactions do banco de dados como estamos dentro do repositorio utilizamos o this
    const transactions = await this.find();

    const { income, outcome } = transactions.reduce(
      (accumulator, transaction) => {
        switch (transaction.type) {
          // caso entrada de transacao
          case 'income':
            accumulator.income += Number(transaction.value);
            break;

          // caso retirada de transacao
          case 'outcome':
            accumulator.outcome += Number(transaction.value);
            break;

          default:
            break;
        }

        return accumulator;
      },
      {
        income: 0, // valores iniciais do accumulator
        outcome: 0,
        total: 0,
      },
    );

    const total = income - outcome;

    return { income, outcome, total };
  }
}

export default TransactionsRepository;
