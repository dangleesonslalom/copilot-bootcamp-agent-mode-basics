const request = require('supertest');
const { app, db } = require('../src/app');

describe('DELETE /api/items/:id', () => {
  // Clean up database before each test
  beforeEach(() => {
    // Clear all items and reset with initial data
    db.exec('DELETE FROM items');
    
    const initialItems = ['Test Item 1', 'Test Item 2', 'Test Item 3'];
    const insertStmt = db.prepare('INSERT INTO items (name) VALUES (?)');
    
    initialItems.forEach((item) => {
      insertStmt.run(item);
    });
  });

  // Clean up database after all tests
  afterAll(() => {
    db.close();
  });

  describe('successful deletion', () => {
    it('should delete an existing item and return success message', async () => {
      // Arrange: Get an existing item ID
      const items = db.prepare('SELECT * FROM items').all();
      const existingItemId = items[0].id;

      // Act: Send DELETE request
      const response = await request(app)
        .delete(`/api/items/${existingItemId}`)
        .expect(200);

      // Assert: Check response and database state
      expect(response.body).toEqual({
        message: 'Item deleted successfully',
      });

      // Verify item was actually deleted from database
      const deletedItem = db.prepare('SELECT * FROM items WHERE id = ?').get(existingItemId);
      expect(deletedItem).toBeUndefined();

      // Verify other items still exist
      const remainingItems = db.prepare('SELECT * FROM items').all();
      expect(remainingItems).toHaveLength(2);
    });

    it('should delete the correct item when multiple items exist', async () => {
      // Arrange: Get all existing items
      const items = db.prepare('SELECT * FROM items').all();
      expect(items).toHaveLength(3);
      
      const itemToDelete = items[1]; // Delete middle item
      const otherItems = items.filter(item => item.id !== itemToDelete.id);

      // Act: Delete the specific item
      const response = await request(app)
        .delete(`/api/items/${itemToDelete.id}`)
        .expect(200);

      // Assert: Check response
      expect(response.body).toEqual({
        message: 'Item deleted successfully',
      });

      // Verify correct item was deleted
      const deletedItem = db.prepare('SELECT * FROM items WHERE id = ?').get(itemToDelete.id);
      expect(deletedItem).toBeUndefined();

      // Verify other items still exist with correct data
      const remainingItems = db.prepare('SELECT * FROM items ORDER BY id').all();
      expect(remainingItems).toHaveLength(2);
      
      remainingItems.forEach(item => {
        const originalItem = otherItems.find(orig => orig.id === item.id);
        expect(originalItem).toBeDefined();
        expect(item.name).toBe(originalItem.name);
      });
    });
  });

  describe('error handling', () => {
    it('should return 404 when item does not exist', async () => {
      // Arrange: Use a non-existent ID
      const nonExistentId = 999999;

      // Act & Assert
      const response = await request(app)
        .delete(`/api/items/${nonExistentId}`)
        .expect(404);

      expect(response.body).toEqual({
        error: 'Item not found',
      });

      // Verify no items were deleted
      const items = db.prepare('SELECT * FROM items').all();
      expect(items).toHaveLength(3);
    });

    it('should return 400 when ID is not a valid number', async () => {
      // Test cases for invalid IDs
      const invalidIds = ['abc', 'not-a-number', '12.34', ''];

      for (const invalidId of invalidIds) {
        const response = await request(app)
          .delete(`/api/items/${invalidId}`)
          .expect(400);

        expect(response.body).toEqual({
          error: 'Valid item ID is required',
        });
      }

      // Verify no items were deleted
      const items = db.prepare('SELECT * FROM items').all();
      expect(items).toHaveLength(3);
    });

    it('should return 400 when ID is negative', async () => {
      // Arrange: Use negative ID
      const negativeId = -1;

      // Act & Assert
      const response = await request(app)
        .delete(`/api/items/${negativeId}`)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Valid item ID is required',
      });

      // Verify no items were deleted
      const items = db.prepare('SELECT * FROM items').all();
      expect(items).toHaveLength(3);
    });

    it('should return 400 when ID is zero', async () => {
      // Arrange: Use zero as ID
      const zeroId = 0;

      // Act & Assert
      const response = await request(app)
        .delete(`/api/items/${zeroId}`)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Valid item ID is required',
      });

      // Verify no items were deleted
      const items = db.prepare('SELECT * FROM items').all();
      expect(items).toHaveLength(3);
    });

    it('should handle database errors gracefully', async () => {
      // Arrange: Close the database to simulate an error
      const originalPrepare = db.prepare;
      db.prepare = jest.fn().mockImplementation(() => {
        throw new Error('Database connection lost');
      });

      // Get an existing item ID before mocking
      db.prepare = originalPrepare;
      const items = db.prepare('SELECT * FROM items').all();
      const existingItemId = items[0].id;
      
      // Restore the mock
      db.prepare = jest.fn().mockImplementation(() => {
        throw new Error('Database connection lost');
      });

      // Act & Assert
      const response = await request(app)
        .delete(`/api/items/${existingItemId}`)
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to delete item',
      });

      // Restore original function
      db.prepare = originalPrepare;
    });
  });

  describe('edge cases', () => {
    it('should handle deletion when database is empty', async () => {
      // Arrange: Clear all items
      db.exec('DELETE FROM items');

      // Act & Assert
      const response = await request(app)
        .delete('/api/items/1')
        .expect(404);

      expect(response.body).toEqual({
        error: 'Item not found',
      });
    });

    it('should handle very large valid ID numbers', async () => {
      // Arrange: Use a very large but valid number
      const largeId = Number.MAX_SAFE_INTEGER;

      // Act & Assert
      const response = await request(app)
        .delete(`/api/items/${largeId}`)
        .expect(404);

      expect(response.body).toEqual({
        error: 'Item not found',
      });

      // Verify original items still exist
      const items = db.prepare('SELECT * FROM items').all();
      expect(items).toHaveLength(3);
    });

    it('should handle concurrent deletion attempts', async () => {
      // Arrange: Get an existing item ID
      const items = db.prepare('SELECT * FROM items').all();
      const existingItemId = items[0].id;

      // Act: Make two concurrent delete requests for the same item
      const [response1, response2] = await Promise.all([
        request(app).delete(`/api/items/${existingItemId}`),
        request(app).delete(`/api/items/${existingItemId}`),
      ]);

      // Assert: One should succeed, one should fail
      const responses = [response1, response2];
      const successResponse = responses.find(r => r.status === 200);
      const failureResponse = responses.find(r => r.status === 404);

      expect(successResponse).toBeDefined();
      expect(successResponse.body).toEqual({
        message: 'Item deleted successfully',
      });

      expect(failureResponse).toBeDefined();
      expect(failureResponse.body).toEqual({
        error: 'Item not found',
      });

      // Verify item was deleted only once
      const deletedItem = db.prepare('SELECT * FROM items WHERE id = ?').get(existingItemId);
      expect(deletedItem).toBeUndefined();

      // Verify other items still exist
      const remainingItems = db.prepare('SELECT * FROM items').all();
      expect(remainingItems).toHaveLength(2);
    });
  });

  describe('response format validation', () => {
    it('should return JSON content type for successful deletion', async () => {
      // Arrange
      const items = db.prepare('SELECT * FROM items').all();
      const existingItemId = items[0].id;

      // Act
      const response = await request(app)
        .delete(`/api/items/${existingItemId}`)
        .expect(200);

      // Assert
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toBeInstanceOf(Object);
    });

    it('should return JSON content type for error responses', async () => {
      // Act
      const response = await request(app)
        .delete('/api/items/invalid')
        .expect(400);

      // Assert
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toBeInstanceOf(Object);
      expect(response.body).toHaveProperty('error');
    });
  });
});
