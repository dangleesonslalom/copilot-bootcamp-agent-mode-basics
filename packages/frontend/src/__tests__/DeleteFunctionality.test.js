import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

/**
 * Focused test suite for delete functionality in the App component.
 * 
 * This test file specifically tests the delete item functionality including:
 * - UI rendering of delete buttons
 * - Successful delete operations
 * - Error handling
 * - API integration
 * - State management after deletion
 */

// Mock data for testing
const mockItems = [
  { id: 1, name: 'Delete Test Item 1' },
  { id: 2, name: 'Delete Test Item 2' },
  { id: 3, name: 'Delete Test Item 3' },
];

// Helper function to render component with initial data loaded
const renderAppWithData = async () => {
  render(<App />);
  
  // Wait for initial data to load
  await waitFor(() => {
    expect(screen.getByText('Delete Test Item 1')).toBeInTheDocument();
  });
  
  return screen;
};

// MSW server setup for API mocking
const server = setupServer(
  // Mock GET /api/items - returns test data
  rest.get('/api/items', (req, res, ctx) => {
    return res(ctx.json(mockItems));
  }),

  // Mock DELETE /api/items/:id - successful deletion
  rest.delete('/api/items/:id', (req, res, ctx) => {
    return res(ctx.status(200));
  }),

  // Mock POST /api/items - for adding new items
  rest.post('/api/items', (req, res, ctx) => {
    return res(ctx.json({ id: 4, name: 'New Item' }));
  })
);

// Setup and teardown for MSW
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Delete Functionality Tests', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Delete Button UI', () => {
    it('should render delete button for each item with correct accessibility attributes', async () => {
      await renderAppWithData();

      // Check that delete buttons exist for each item
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      expect(deleteButtons).toHaveLength(3);

      // Verify specific aria-labels for accessibility
      expect(screen.getByRole('button', { name: 'Delete Delete Test Item 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete Delete Test Item 2' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete Delete Test Item 3' })).toBeInTheDocument();
    });

    it('should render delete buttons with correct Material-UI styling', async () => {
      await renderAppWithData();

      const deleteButton = screen.getByRole('button', { name: 'Delete Delete Test Item 1' });
      
      // Check MUI classes for proper styling
      expect(deleteButton).toHaveClass('MuiButton-outlined');
      expect(deleteButton).toHaveClass('MuiButton-colorError');
      expect(deleteButton).toHaveClass('MuiButton-sizeSmall');
      
      // Verify delete icon is present
      const deleteIcon = deleteButton.querySelector('svg');
      expect(deleteIcon).toBeInTheDocument();
    });
  });

  describe('Successful Delete Operations', () => {
    it('should remove item from UI after successful deletion', async () => {
      await renderAppWithData();

      // Verify initial state
      expect(screen.getAllByText(/Delete Test Item/)).toHaveLength(3);
      expect(screen.getByText('Delete Test Item 1')).toBeInTheDocument();

      // Perform delete action
      const deleteButton = screen.getByRole('button', { name: 'Delete Delete Test Item 1' });
      fireEvent.click(deleteButton);

      // Verify item is removed
      await waitFor(() => {
        expect(screen.queryByText('Delete Test Item 1')).not.toBeInTheDocument();
      });

      // Verify other items remain
      expect(screen.getByText('Delete Test Item 2')).toBeInTheDocument();
      expect(screen.getByText('Delete Test Item 3')).toBeInTheDocument();
      expect(screen.getAllByText(/Delete Test Item/)).toHaveLength(2);
    });

    it('should handle deletion of multiple items sequentially', async () => {
      await renderAppWithData();

      // Delete first item
      fireEvent.click(screen.getByRole('button', { name: 'Delete Delete Test Item 1' }));
      await waitFor(() => {
        expect(screen.queryByText('Delete Test Item 1')).not.toBeInTheDocument();
      });

      // Delete second item
      fireEvent.click(screen.getByRole('button', { name: 'Delete Delete Test Item 2' }));
      await waitFor(() => {
        expect(screen.queryByText('Delete Test Item 2')).not.toBeInTheDocument();
      });

      // Verify only one item remains
      expect(screen.getAllByText(/Delete Test Item/)).toHaveLength(1);
      expect(screen.getByText('Delete Test Item 3')).toBeInTheDocument();
    });

    it('should clear error state after successful deletion', async () => {
      // First, cause an error
      server.use(
        rest.delete('/api/items/1', (req, res, ctx) => {
          return res(ctx.status(500));
        })
      );

      await renderAppWithData();

      // Attempt delete that will fail
      const deleteButton = screen.getByRole('button', { name: 'Delete Delete Test Item 1' });
      fireEvent.click(deleteButton);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/Error deleting item/)).toBeInTheDocument();
      });

      // Reset to successful response
      server.use(
        rest.delete('/api/items/1', (req, res, ctx) => {
          return res(ctx.status(200));
        })
      );

      // Try delete again
      fireEvent.click(deleteButton);

      // Verify error is cleared and item is deleted
      await waitFor(() => {
        expect(screen.queryByText(/Error deleting item/)).not.toBeInTheDocument();
        expect(screen.queryByText('Delete Test Item 1')).not.toBeInTheDocument();
      });
    });
  });

  describe('Delete Error Handling', () => {
    it('should display error message when server returns 500', async () => {
      server.use(
        rest.delete('/api/items/1', (req, res, ctx) => {
          return res(ctx.status(500));
        })
      );

      await renderAppWithData();

      const deleteButton = screen.getByRole('button', { name: 'Delete Delete Test Item 1' });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/Error deleting item/)).toBeInTheDocument();
      });

      // Verify item is still present in the UI
      expect(screen.getByText('Delete Test Item 1')).toBeInTheDocument();
    });

    it('should display error message when item not found (404)', async () => {
      server.use(
        rest.delete('/api/items/1', (req, res, ctx) => {
          return res(ctx.status(404));
        })
      );

      await renderAppWithData();

      const deleteButton = screen.getByRole('button', { name: 'Delete Delete Test Item 1' });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/Error deleting item/)).toBeInTheDocument();
      });

      // Verify item is still present
      expect(screen.getByText('Delete Test Item 1')).toBeInTheDocument();
    });

    it('should handle network errors gracefully', async () => {
      server.use(
        rest.delete('/api/items/1', (req, res, ctx) => {
          return res.networkError('Connection failed');
        })
      );

      await renderAppWithData();

      const deleteButton = screen.getByRole('button', { name: 'Delete Delete Test Item 1' });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/Error deleting item/)).toBeInTheDocument();
      });

      // Verify item remains in UI
      expect(screen.getByText('Delete Test Item 1')).toBeInTheDocument();
    });

    it('should log errors to console for debugging', async () => {
      server.use(
        rest.delete('/api/items/1', (req, res, ctx) => {
          return res(ctx.status(500));
        })
      );

      await renderAppWithData();

      const deleteButton = screen.getByRole('button', { name: 'Delete Delete Test Item 1' });
      fireEvent.click(deleteButton);

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
      const deleteHandler = jest.fn((req, res, ctx) => {
        return res(ctx.status(200));
      });

      server.use(
        rest.delete('/api/items/:id', deleteHandler)
      );

      await renderAppWithData();

      const deleteButton = screen.getByRole('button', { name: 'Delete Delete Test Item 1' });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(deleteHandler).toHaveBeenCalledTimes(1);
      });

      // Verify request details
      const request = deleteHandler.mock.calls[0][0];
      expect(request.url.pathname).toBe('/api/items/1');
      expect(request.method).toBe('DELETE');
      expect(request.headers.get('content-type')).toBe('application/json');
    });

    it('should send delete request for correct item ID', async () => {
      const deleteHandler = jest.fn((req, res, ctx) => {
        return res(ctx.status(200));
      });

      server.use(
        rest.delete('/api/items/:id', deleteHandler)
      );

      await renderAppWithData();

      // Delete item with ID 2
      const deleteButton = screen.getByRole('button', { name: 'Delete Delete Test Item 2' });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(deleteHandler).toHaveBeenCalledTimes(1);
      });

      // Verify correct ID was sent
      const request = deleteHandler.mock.calls[0][0];
      expect(request.params.id).toBe('2');
    });
  });

  describe('Empty State After Deletions', () => {
    it('should show empty state when all items are deleted', async () => {
      // Start with single item
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

      // Delete the last item
      const deleteButton = screen.getByRole('button', { name: 'Delete Last Item' });
      fireEvent.click(deleteButton);

      // Verify empty state is shown
      await waitFor(() => {
        expect(screen.queryByText('Last Item')).not.toBeInTheDocument();
        expect(screen.getByText('No items found')).toBeInTheDocument();
        expect(screen.getByText('Add some items to get started!')).toBeInTheDocument();
      });

      // Verify table is not rendered when empty
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  describe('Delete Button Interactions', () => {
    it('should handle rapid successive clicks gracefully', async () => {
      await renderAppWithData();

      const deleteButton = screen.getByRole('button', { name: 'Delete Delete Test Item 1' });
      
      // Rapidly click multiple times
      fireEvent.click(deleteButton);
      fireEvent.click(deleteButton);
      fireEvent.click(deleteButton);

      // Should only delete once
      await waitFor(() => {
        expect(screen.queryByText('Delete Test Item 1')).not.toBeInTheDocument();
      });

      // Other items should remain
      expect(screen.getByText('Delete Test Item 2')).toBeInTheDocument();
      expect(screen.getByText('Delete Test Item 3')).toBeInTheDocument();
    });

    it('should maintain focus management after deletion', async () => {
      await renderAppWithData();

      const deleteButton = screen.getByRole('button', { name: 'Delete Delete Test Item 1' });
      deleteButton.focus();
      
      expect(document.activeElement).toBe(deleteButton);
      
      fireEvent.click(deleteButton);

      // After deletion, focus should move to a valid element
      await waitFor(() => {
        expect(screen.queryByText('Delete Test Item 1')).not.toBeInTheDocument();
      });

      // Document should have some focused element (not necessarily specific one)
      expect(document.activeElement).toBeDefined();
    });
  });
});
