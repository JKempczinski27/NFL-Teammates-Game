import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Blue
    },
    secondary: {
      main: '#dc004e', // Red
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Grid container spacing={2} justifyContent="center" alignItems="center" style={{ height: '100vh' }}>
        <Grid item>
          <Button variant="contained" color="primary">Hand-off</Button>
        </Grid>
        <Grid item>
          <Button variant="contained" color="secondary">Check-Down</Button>
        </Grid>
        <Grid item>
          <Button variant="contained" color="primary">Hail-Mary</Button>
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}

export default App;