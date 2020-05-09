import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export default class AddCategoryIdToTransactions1589031633448
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'transactions',
      new TableColumn({
        name: 'category_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'transactions',
      new TableForeignKey({
        columnNames: ['category_id'], // coluna da tabela transactions
        referencedTableName: 'categories', // refereciando a tabela categorias
        referencedColumnNames: ['id'], // utilizando a coluna id da tabela categorias para ser a chave estrangeira
        name: 'TransactionCategory', // nome da chave estrangeira
        onUpdate: 'CASCADE', // metodo que quando atualiza em uma tabela atualiza na outra
        onDelete: 'SET NULL', // metodo que quando excluir algo ele seta como nulo aonde a tabela utiliza daquele elemento excluido
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('transactions', 'TransactionCategory');
    await queryRunner.dropColumn('transactions', 'category_id');
  }
}
