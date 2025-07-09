import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

// Mock data for testing
const mockItems = [
  { id: 1, name: 'Test Item 1' },
  { id: 2, name: 'Test Item 2' },
  { id: 3, name: 'Test Item 3' },
];

// MSW server setup for API mocking
const server = setupServer(
  // Mock GET /api/items
  rest.get('/api/items', (req, res, ctx) => {
    return res(ctx.json(mockItems));
  }),

  // Mock DELETE /api/items/:id
  rest.delete('/api/items/:id', (req, res, ctx) => {
    const { id } = req.params;
    const itemExists = mockItems.find(item => item.id === parseInt(id));
    
    if (itemExists) {
      return res(ctx.status(200));
    }
    return res(ctx.status(404));
  }),

  // Mock POST /api/items
  rest.post('/api/items', (req, res, ctx) => {
    return res(ctx.json({ id: 4, name: 'New Item' }));
  })
);

// Setup and teardown for MSW
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('App Component - Delete Functionality', () => {
  let consoleSpy;

  beforeEach(() => {
    // Reset console.error mock to avoid cluttering test output
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Delete Button Rendering', () => {
    it('should render delete buttons for each item', async () => {
      // Arrange & Act
      render(<App />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      });

      // Assert
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      expect(deleteButtons).toHaveLength(3);
      
      // Check that each delete button has proper aria-label
      expect(screen.getByRole('button', { name: 'Delete Test Item 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete Test Item 2' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete Test Item 3' })).toBeInTheDocument();
    });

    it('should render delete buttons with proper styling and icon', async () => {
      // Arrange & Act
      render(<App />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      });

      // Assert
      const deleteButton = screen.getByRole('button', { name: 'Delete Test Item 1' });
      expect(deleteButton).toHaveClass('MuiButton-outlined');
      expect(deleteButton).toHaveClass('MuiButton-colorError');
      
      // Check for delete icon (using test-id or class name)
      const deleteIcon = deleteButton.querySelector('svg');
      expect(deleteIcon).toBeInTheDocument();
    });
  });

  describe('Successful Delete Operations', () => {
    it('should successfully delete an item when delete button is clicked', async () => {
      // Arrange
      render(<App />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      });

      // Verify initial state
      expect(screen.getAllByText(/Test Item/)).toHaveLength(3);

      // Act
      const deleteButton = screen.getByRole('button', { name: 'Delete Test Item 1' });
      fireEvent.click(deleteButton);

      // Assert
      await waitFor(() => {
        expect(screen.queryByText('Test Item 1')).not.toBeInTheDocument();
      });

      // Verify other items are still present
      expect(screen.getByText('Test Item 2')).toBeInTheDocument();
      expect(screen.getByText('Test Item 3')).toBeInTheDocument();
      expect(screen.getAllByText(/Test Item/)).toHaveLength(2);
    });

    it('should remove the correct item from the list when multiple items exist', async () => {
      // Arrange
      render(<App />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Test Item 2')).toBeInTheDocument();
      });

      // Act - Delete the middle item
      const deleteButton = screen.getByRole('button', { name: 'Delete Test Item 2' });
      fireEvent.click(deleteButton);

      // Assert
      await waitFor(() => {
        expect(screen.queryByText('Test Item 2')).not.toBeInTheDocument();
      });

      // Verify other items are still present
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      expect(screen.getByText('Test Item 3')).toBeInTheDocument();
      expect(screen.getAllByText(/Test Item/)).toHaveLength(2);
    });

    it('should clear any existing error messages after successful delete', async () => {
      // Arrange
      render(<App />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      });

      // Simulate an error first by making the delete fail
      server.use(
        rest.delete('/api/items/:id', (req, res, ctx) => {
          return res(ctx.status(500));
        })
      );

      const deleteButton = screen.getByRole('button', { name: 'Delete Test Item 1' });
      fireEvent.click(deleteButton);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/Error deleting item/)).toBeInTheDocument();
      });

      // Reset server to success
      server.use(
        rest.delete('/api/items/:id', (req, res, ctx) => {
          return res(ctx.status(200));
        })
      );

      // Act - Try delete again
      fireEvent.click(deleteButton);

      // Assert - Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/Error deleting item/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Failed Delete Operations', () => {
    it('should display error message when delete request fails', async () => {
      // Arrange
      server.use(
        rest.delete('/api/items/:id', (req, res, ctx) => {
          return res(ctx.status(500));
        })
      );

      render(<App />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getByRole('button', { name: 'Delete Test Item 1' });
      fireEvent.click(deleteButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Error deleting item/)).toBeInTheDocument();
      });

      // Verify item is still in the list
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      expect(screen.getAllByText(/Test Item/)).toHaveLength(3);
    });

    it('should display error message when item is not found (404)', async () => {
      // Arrange
      server.use(
        rest.delete('/api/items/:id', (req, res, ctx) => {
          return res(ctx.status(404));
        })
      );

      render(<App />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getByRole('button', { name: 'Delete Test Item 1' });
      fireEvent.click(deleteButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Error deleting item/)).toBeInTheDocument();
      });

      // Verify item is still in the list
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });

    it('should handle network errors gracefully', async () => {
      // Arrange
      server.use(
        rest.delete('/api/items/:id', (req, res, ctx) => {
          return res.networkError('Network error');
        })
      );

      render(<App />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getByRole('button', { name: 'Delete Test Item 1' });
      fireEvent.click(deleteButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Error deleting item/)).toBeInTheDocument();
      });

      // Verify item is still in the list
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });

    it('should log error to console when delete fails', async () => {
      // Arrange
      server.use(
        rest.delete('/api/items/:id', (req, res, ctx) => {
          return res(ctx.status(500));
        })
      );

      render(<App />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getByRole('button', { name: 'Delete Test Item 1' });
      fireEvent.click(deleteButton);

      // Assert
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error deleting item:',
          expect.any(Error)
        );
      });
    });
  });

  describe('Delete API Integration', () => {
    it('should make DELETE request with correct URL and headers', async () => {
      // Arrange
      const deleteHandler = jest.fn((req, res, ctx) => {
        return res(ctx.status(200));
      });

      server.use(
        rest.delete('/api/items/:id', deleteHandler)
      );

      render(<App />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getByRole('button', { name: 'Delete Test Item 1' });
      fireEvent.click(deleteButton);

      // Assert
      await waitFor(() => {
        expect(deleteHandler).toHaveBeenCalledTimes(1);
      });

      // Verify the request details
      const request = deleteHandler.mock.calls[0][0];
      expect(request.url.pathname).toBe('/api/items/1');
      expect(request.method).toBe('DELETE');
      expect(request.headers.get('content-type')).toBe('application/json');
    });

    it('should handle multiple delete requests correctly', async () => {
      // Arrange
      const deleteHandler = jest.fn((req, res, ctx) => {
        return res(ctx.status(200));
      });

      server.use(
        rest.delete('/api/items/:id', deleteHandler)
      );

      render(<App />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getAllByText(/Test Item/)).toHaveLength(3);
      });

      // Act - Delete multiple items
      const deleteButton1 = screen.getByRole('button', { name: 'Delete Test Item 1' });
      const deleteButton3 = screen.getByRole('button', { name: 'Delete Test Item 3' });
      
      fireEvent.click(deleteButton1);
      
      await waitFor(() => {
        expect(screen.queryByText('Test Item 1')).not.toBeInTheDocument();
      });

      fireEvent.click(deleteButton3);

      // Assert
      await waitFor(() => {
        expect(deleteHandler).toHaveBeenCalledTimes(2);
        expect(screen.getAllByText(/Test Item/)).toHaveLength(1);
        expect(screen.getByText('Test Item 2')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State After Deletes', () => {
    it('should show empty state message when all items are deleted', async () => {
      // Arrange
      const singleItem = [{ id: 1, name: 'Last Item' }];
      
      server.use(
        rest.get('/api/items', (req, res, ctx) => {
          return res(ctx.json(singleItem));
        })
      );

      render(<App />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Last Item')).toBeInTheDocument();
      });

      // Act - Delete the last item
      const deleteButton = screen.getByRole('button', { name: 'Delete Last Item' });
      fireEvent.click(deleteButton);

      // Assert
      await waitFor(() => {
        expect(screen.queryByText('Last Item')).not.toBeInTheDocument();
        expect(screen.getByText('No items found')).toBeInTheDocument();
        expect(screen.getByText('Add some items to get started!')).toBeInTheDocument();
      });

      // Verify table is not rendered
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });
});
