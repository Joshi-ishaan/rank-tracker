import { useState } from 'react'
import axios from 'axios'

function App() {
  const [keywords, setKeywords] = useState('')
  const [location, setLocation] = useState('')
  const [website, setWebsite] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    setResults(null)

    const cleanLocation = location.trim().replace(/\s*,\s*/g, ', ')
    const keywordArray = keywords.split('\n').map(k => k.trim()).filter(k => k !== '')

    try {
      const response = await axios.post('http://localhost:3000/analyze-bulk', {
        keywords: keywordArray,
        location: cleanLocation,
        website: website.trim().replace(/^https?:\/\//, '').replace(/\/$/, ''),
        businessName: businessName.trim()
      })
      setResults(response.data.results)
    } catch (err) {
      alert('Server error: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>

      <h1>🔍 Rank Tracker</h1>

      <div style={{ marginBottom: '15px' }}>
        <label>Location</label><br />
        <input
          type="text"
          placeholder="New York, NY"
          value={location}
          onChange={e => setLocation(e.target.value)}
          style={{ width: '100%', padding: '8px', marginTop: '5px' }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>Website <small style={{ color: '#f0a500' }}>⚠️ Recommended for accurate organic rankings. Without a website URL, only GMB/local pack results will be reliable.</small></label><br />
        <input
          type="text"
          placeholder="rotorooter.com"
          value={website}
          onChange={e => setWebsite(e.target.value)}
          style={{ width: '100%', padding: '8px', marginTop: '5px' }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>Business Name</label><br />
        <input
          type="text"
          placeholder="Pizza Villa"
          value={businessName}
          onChange={e => setBusinessName(e.target.value)}
          style={{ width: '100%', padding: '8px', marginTop: '5px' }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>Keywords (one keyword per line)</label><br />
        <textarea
          rows={8}
          placeholder={"plumber in new york\nelectrician in new york\nac repair new york"}
          value={keywords}
          onChange={e => setKeywords(e.target.value)}
          style={{ width: '100%', padding: '8px', marginTop: '5px' }}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{ padding: '10px 30px', fontSize: '16px', cursor: 'pointer' }}
      >
        {loading ? 'Checking...' : 'Check Rankings'}
      </button>

      {results && (
        <div style={{ marginTop: '30px' }}>
          <h2>Results</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Keyword</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Position</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Found</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{r.keyword}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{r.type || '-'}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{r.position || 'Not Found'}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    {r.error ? '⚠️ ' + JSON.stringify(r.error) : r.found ? '✅' : '❌'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}

export default App
