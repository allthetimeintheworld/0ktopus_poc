// HomeDebug.tsx - Minimal test version
import { useState } from 'react'

const HomeDebug = () => {
  const [count, setCount] = useState(0)

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#000', 
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>
        0KTOPUS Debug Page
      </h1>
      <p style={{ fontSize: '24px', marginBottom: '20px' }}>
        If you can see this, React is working!
      </p>
      <button 
        onClick={() => setCount(count + 1)}
        style={{
          padding: '10px 20px',
          fontSize: '18px',
          background: '#5B3DD6',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Click Count: {count}
      </button>
      <div style={{ marginTop: '40px', textAlign: 'left', maxWidth: '600px' }}>
        <h2 style={{ marginBottom: '10px' }}>Checklist:</h2>
        <ul style={{ lineHeight: '2' }}>
          <li>✅ React is rendering</li>
          <li>✅ State management works</li>
          <li>✅ Event handlers work</li>
          <li>✅ Basic styling works</li>
        </ul>
      </div>
    </div>
  )
}

export default HomeDebug
