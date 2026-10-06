import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CareSync Global Error caught:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.removeItem('careSync_user');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#020617', color: 'white', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif', textAlign: 'center' }}>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '24px', padding: '36px', maxWidth: '480px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '24px', fontWeight: 'bold' }}>
              !
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#f8fafc', marginBottom: '8px' }}>Application Encountered an Error</h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.5', marginBottom: '24px' }}>
              {this.state.error?.message || 'A client-side rendering issue occurred.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{ background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', padding: '10px 18px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                style={{ background: 'linear-gradient(to right, #059669, #0d9488)', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)' }}
              >
                Reset Session & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)

