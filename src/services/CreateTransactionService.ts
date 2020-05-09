import { getCustomRepository, getRepository } from 'typeorm';

import TransactionRepository from '../repositories/TransactionsRepository';

import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}
class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    // utilizando todos os metodos que o banco de dados da transacao nos proporciona
    const transactionsRepository = getCustomRepository(TransactionRepository);
    // utilizando todos os metodos que o banco de dados da categoria nos proporciona
    const categoriesRepository = getRepository(Category);

    const { total } = await transactionsRepository.getBalance();

    // verifica se o tipo é de retirada e se há dinheiro na conta
    if (type === 'outcome' && total < value) {
      throw new AppError('You do not have enough money');
    }

    // retorna se a categoria passada ja esta criada no banco de dados
    let transactionCategory = await categoriesRepository.findOne({
      where: {
        title: category,
      },
    });

    // if don't exists then create
    if (!transactionCategory) {
      transactionCategory = categoriesRepository.create({
        title: category,
      });

      await categoriesRepository.save(transactionCategory);
    }

    // instancia da criancao da transacao
    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: transactionCategory,
    });

    // salvando a transacao criada
    await transactionsRepository.save(transaction);

    // retornando a transacao depois de salvao no BD
    return transaction;
  }
}

export default CreateTransactionService;
