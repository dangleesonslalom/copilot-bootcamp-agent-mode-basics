# Material-UI (MUI) Guidelines

This document outlines the guidelines and best practices for using Material-UI (MUI) components in this project.

## Overview

Material-UI (MUI) is a React component library that implements Google's Material Design principles. It provides a comprehensive set of pre-built components that follow accessibility standards and offer consistent styling.

## Installation

To add MUI to the project, install the core package and dependencies:

```bash
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material  # For icons
```

## Basic Setup

### Theme Provider

Wrap your application with the MUI ThemeProvider to enable consistent theming:

```javascript
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  palette: {
    primary: {
      main: '#61dafb',
    },
    secondary: {
      main: '#282c34',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Your app components */}
    </ThemeProvider>
  );
}
```

### CSS Baseline

Always include `CssBaseline` to normalize CSS across browsers and provide consistent defaults.

## Component Usage Guidelines

### Import Organization

Follow the established import organization pattern:

```javascript
// External dependencies
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

// Project components
import CustomComponent from '../components/CustomComponent';

// Utilities and constants
import { formatDate } from '../utils/helpers';
```

### Common Components

#### Typography

Use MUI Typography for consistent text styling:

```javascript
<Typography variant="h4" component="h1" gutterBottom>
  Main Title
</Typography>
<Typography variant="body1" color="text.secondary">
  Body text content
</Typography>
```

#### Buttons

Use MUI Button components with consistent variants:

```javascript
<Button variant="contained" color="primary" onClick={handleClick}>
  Primary Action
</Button>
<Button variant="outlined" color="secondary" startIcon={<DeleteIcon />}>
  Delete
</Button>
```

#### Tables

Use MUI Table components for data display:

```javascript
<TableContainer component={Paper}>
  <Table sx={{ minWidth: 650 }}>
    <TableHead>
      <TableRow>
        <TableCell>ID</TableCell>
        <TableCell>Name</TableCell>
        <TableCell align="right">Actions</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {data.map((row) => (
        <TableRow key={row.id} hover>
          <TableCell>{row.id}</TableCell>
          <TableCell>{row.name}</TableCell>
          <TableCell align="right">
            <Button size="small" onClick={() => handleDelete(row.id)}>
              Delete
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
```

#### Forms

Use MUI form components for user input:

```javascript
<Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
  <TextField
    fullWidth
    label="Item Name"
    value={value}
    onChange={handleChange}
    margin="normal"
    required
  />
  <Button type="submit" variant="contained" sx={{ mt: 2 }}>
    Submit
  </Button>
</Box>
```

#### Layout

Use MUI layout components for consistent spacing:

```javascript
<Container maxWidth="md">
  <Box sx={{ py: 4 }}>
    <Paper elevation={2} sx={{ p: 3 }}>
      {/* Content */}
    </Paper>
  </Box>
</Container>
```

## Styling Guidelines

### Using the sx Prop

Prefer the `sx` prop for component-specific styling:

```javascript
<Box
  sx={{
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    p: 3,
    bgcolor: 'background.paper',
    borderRadius: 1,
  }}
>
  {/* Content */}
</Box>
```

### Theme Values

Use theme values instead of hardcoded values:

```javascript
// Good
<Button sx={{ mt: theme.spacing(2) }}>Button</Button>
<Typography color="primary.main">Text</Typography>

// Better with sx prop
<Button sx={{ mt: 2 }}>Button</Button>
<Typography color="primary">Text</Typography>
```

### Responsive Design

Use MUI's breakpoint system for responsive design:

```javascript
<Box
  sx={{
    width: { xs: '100%', sm: 600, md: 800 },
    p: { xs: 1, sm: 2, md: 3 },
  }}
>
  {/* Content */}
</Box>
```

## Component Patterns

### Loading States

Use MUI components for loading states:

```javascript
{loading ? (
  <Box display="flex" justifyContent="center" p={3}>
    <CircularProgress />
  </Box>
) : (
  <TableContainer component={Paper}>
    {/* Table content */}
  </TableContainer>
)}
```

### Error Handling

Use MUI Alert for error messages:

```javascript
{error && (
  <Alert severity="error" sx={{ mb: 2 }}>
    {error}
  </Alert>
)}
```

### Empty States

Provide clear empty state messaging:

```javascript
{data.length === 0 ? (
  <Box textAlign="center" py={4}>
    <Typography variant="h6" color="text.secondary">
      No items found
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
      Add some items to get started!
    </Typography>
  </Box>
) : (
  // Render data
)}
```

## Accessibility

### ARIA Labels

Always provide appropriate ARIA labels:

```javascript
<Button
  onClick={() => handleDelete(item.id)}
  aria-label={`Delete ${item.name}`}
  startIcon={<DeleteIcon />}
>
  Delete
</Button>
```

### Keyboard Navigation

Ensure all interactive elements are keyboard accessible. MUI components handle this by default, but test with keyboard navigation.

### Color Contrast

Use MUI's theme colors which are designed to meet accessibility standards:

```javascript
// Good contrast ratios
<Typography color="text.primary">Primary text</Typography>
<Typography color="text.secondary">Secondary text</Typography>
```

## Performance Considerations

### Tree Shaking

Import only the components you need:

```javascript
// Good - tree shaking friendly
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

// Avoid - imports entire library
import * from '@mui/material';
```

### Bundle Size

Monitor bundle size when adding MUI components. Use tools like webpack-bundle-analyzer to track impact.

## Migration Strategy

When migrating existing components to MUI:

1. **Start with layout components** (Container, Box, Paper)
2. **Replace custom buttons** with MUI Button components
3. **Convert tables** to MUI Table components
4. **Update forms** to use MUI form components
5. **Add consistent spacing** using MUI's spacing system
6. **Remove custom CSS** that duplicates MUI functionality

## Testing with MUI

### Component Testing

When testing MUI components, use appropriate queries:

```javascript
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

test('renders button with correct text', () => {
  renderWithTheme(<Button>Click me</Button>);
  expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
});
```

## Best Practices

1. **Use MUI components instead of custom CSS** when possible
2. **Leverage the theme system** for consistent styling
3. **Follow Material Design principles** for user experience
4. **Test accessibility** with screen readers and keyboard navigation
5. **Keep components simple** and compose complex UIs from simple parts
6. **Use semantic HTML** through MUI's component prop
7. **Provide loading and error states** for better user experience
8. **Follow the established import organization** patterns

## Common Pitfalls

1. **Don't mix MUI styles with custom CSS** unnecessarily
2. **Avoid inline styles** when sx prop or theme values work
3. **Don't override MUI component internals** unless absolutely necessary
4. **Remember to wrap with ThemeProvider** for consistent theming
5. **Don't forget CssBaseline** for consistent base styles

For more detailed information, refer to the [official MUI documentation](https://mui.com/).
