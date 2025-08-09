import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
    
    // Log error to monitoring service in production
    if (import.meta.env.VITE_APP_ENVIRONMENT === 'production') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
      // TODO: Send to error monitoring service (Sentry, etc.)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            maxWidth: '500px',
            width: '100%'
          }}>
            <h2 style={{ color: '#dc2626', marginBottom: '16px' }}>
              တစ်ခုခု မှားနေပါတယ်
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              ကျွန်တော်တို့ရဲ့ system မှာ ပြဿနာ တစ်ခု ဖြစ်နေပါတယ်။ ကျေးဇူးပြုပြီး page ကို refresh လုပ်ကြည့်ပါ။
            </p>
            
            {import.meta.env.VITE_APP_ENVIRONMENT === 'development' && (
              <details style={{ 
                marginTop: '20px', 
                textAlign: 'left',
                backgroundColor: '#fef2f2',
                padding: '16px',
                borderRadius: '8px',
                fontSize: '14px'
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#dc2626' }}>
                  Developer Info (Development Mode Only)
                </summary>
                <pre style={{ 
                  marginTop: '12px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: '#991b1b'
                }}>
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              Page ကို ပြန်လည် Load လုပ်ရန်
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary