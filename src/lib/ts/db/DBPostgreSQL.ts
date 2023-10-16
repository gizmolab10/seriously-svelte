import { Client } from 'pg';

class DBPostgres {
  private client: Client;

  connect(connectionString: string) {
    this.client = new Client({ connectionString });
    this.client.connect();
  }

  async create(table: string, data: any): Promise<any> {
    const query = `INSERT INTO ${table} (data) VALUES ($1) RETURNING *`;
    const values = [data];

    const result = await this.client.query(query, values);
    return result.rows[0];
  }

  async read(table: string, id: number): Promise<any> {
    const query = `SELECT * FROM ${table} WHERE id = $1`;
    const values = [id];

    const result = await this.client.query(query, values);
    return result.rows[0];
  }

  async update(table: string, id: number, newData: any): Promise<any> {
    const query = `UPDATE ${table} SET data = $1 WHERE id = $2 RETURNING *`;
    const values = [newData, id];

    const result = await this.client.query(query, values);
    return result.rows[0];
  }

  async delete(table: string, id: number): Promise<void> {
    const query = `DELETE FROM ${table} WHERE id = $1`;
    const values = [id];

    await this.client.query(query, values);
  }

  async close(): Promise<void> {
    await this.client.end();
  }
}

// Example usage:
const postgres = new DBPostgres();

(async () => {
  try {
    postgres.connect('postgres://username:password@foo:5432/database')
    const newItem = await postgres.create('items', { name: 'New Item' });
    console.log('Created Item:', newItem);

    const readItem = await postgres.read('items', newItem.id);
    console.log('Read Item:', readItem);

    const updatedItem = await postgres.update('items', newItem.id, { name: 'Updated Item' });
    console.log('Updated Item:', updatedItem);

    await postgres.delete('items', newItem.id);
    console.log('Item Deleted');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await postgres.close();
  }
})();
