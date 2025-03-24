import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Disable console logging in production if configured
if (process.env.REACT_APP_DISABLE_LOGGING === 'true') {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.error = () => {};
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Use strict mode in development only
if (process.env.NODE_ENV === 'production') {
  root.render(<App />);
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Measure performance in development
if (process.env.NODE_ENV !== 'production') {
  reportWebVitals(console.log);
} else {
  reportWebVitals();
}
