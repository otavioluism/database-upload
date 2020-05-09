import { getCustomRepository, getRepository, In } from 'typeorm';
import csvParse from 'csv-parse';
import fs from 'fs';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import TransactionRepository from '../repositories/TransactionsRepository';

interface CSVtransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const transactionsRepository = getCustomRepository(TransactionRepository);
    const categoriesRepository = getRepository(Category);

    const contactsReadStream = fs.createReadStream(filePath);

    // configurando para pegar da linha 2 o arquivo csv Parse
    const parsers = csvParse({
      from_line: 2,
    });

    // leitura do arquivo CSV
    const ParseCSV = contactsReadStream.pipe(parsers);

    const transactions: CSVtransaction[] = [];
    const categories: string[] = [];

    ParseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      // senao existir nenhum dos tipos retorna
      if (!title || !type || !value) return;

      categories.push(category);
      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => ParseCSV.on('end', resolve));

    // verifica se tem há alguma categoria que já existe
    const existentCategories = await categoriesRepository.find({
      where: In(categories),
    });

    // retirando só o nome das categorias que foram encontradas dentro do banco de dados, ou seja, já cadastrada
    const existentCategoriesTitle = existentCategories.map(
      (category: Category) => category.title,
    );

    // tudo que for diferente da categoria que já existe no banco de dados e que apresenta só uma vez o nome repetido
    const addCategoryTitles = categories
      .filter(category => !existentCategoriesTitle.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    // salvando no banco de dados as novas categorias
    const newsCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    // salvando as novas categorias
    await categoriesRepository.save(newsCategories);

    // juntando todas as categorias as de dentro do banco de dados e as novas
    const finalCategories = [...newsCategories, ...existentCategories];

    // criando a transacao
    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionsRepository.save(createdTransactions);

    // exclui nissi arquivo depois de rodas
    await fs.promises.unlink(filePath);

    // retornando as transacoes criadas
    return createdTransactions;
  }
}

export default ImportTransactionsService;
