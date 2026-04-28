const express = require('express')
const axios = require('axios')
const cors = require('cors')
require('dotenv').config()

const app = express()

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

const PORT = process.env.PORT || 3000

app.get('/', (req, res) => {
  res.send('Rank Tracker server chal raha hai')
})

app.post('/analyze-bulk', async (req, res) => {
  const { keywords, location, website, businessName } = req.body
  try {
    const results = await Promise.all(
      keywords.map(async (keyword) => {
        try {
          let result = { keyword, type: null, position: null, found: false }

          // Regular search — organic + top 3 local pack
          const [regularResp, localResp] = await Promise.all([
            axios.get('https://serpapi.com/search', {
              params: { q: keyword, location, hl: 'en', gl: 'us', num: 100, api_key: process.env.SERPAPI_KEY }
            }),
            businessName
              ? axios.get('https://serpapi.com/search', {
                  params: { q: keyword, location, hl: 'en', gl: 'us', tbm: 'lcl', api_key: process.env.SERPAPI_KEY }
                })
              : Promise.resolve(null)
          ])

          const organicResults = regularResp.data.organic_results || []
          const localPackPlaces = regularResp.data.local_results?.places || []
          const extendedLocal = localResp?.data?.local_results || []

          // Step 1: GMB — pehle top 3 pack check, phir extended local (up to 20)
          if (businessName) {
            const nameLower = businessName.toLowerCase()
            for (let place of localPackPlaces) {
              if (place.title?.toLowerCase().includes(nameLower)) {
                result.type = 'gmb'
                result.position = place.position
                result.found = true
                break
              }
            }
            if (!result.found) {
              for (let place of extendedLocal) {
                if (place.title?.toLowerCase().includes(nameLower)) {
                  result.type = 'gmb'
                  result.position = place.position
                  result.found = true
                  break
                }
              }
            }
          }

          // Step 2: Organic check — website domain dhundho
          if (website && !result.found) {
            for (let item of organicResults) {
              if (item.link?.includes(website)) {
                result.type = 'organic'
                result.position = item.position
                result.found = true
                break
              }
            }
          }

          // Step 3: BusinessName only, GMB mein nahi mila → organic titles check
          if (businessName && !website && !result.found) {
            const nameLower = businessName.toLowerCase()
            for (let item of organicResults) {
              if (item.title?.toLowerCase().includes(nameLower)) {
                result.type = 'organic'
                result.position = item.position
                result.found = true
                break
              }
            }
          }

          // Step 4: Kuch bhi nahi diya → top 3 GMB listings dikhao
          if (!website && !businessName) {
            result.type = 'gmb'
            result.found = localPackPlaces.length > 0
            result.gmb_listings = localPackPlaces.map(p => ({ position: p.position, name: p.title }))
          }

          return result
        } catch (err) {
          console.log('Error for keyword:', keyword, err.response?.data)
          return { keyword, found: false, error: err.response?.data }
        }
      })
    )
    res.json({ total: keywords.length, results })
  } catch (err) {
    res.status(500).json({ error: 'Bulk analyze fail ho gaya' })
  }
})

app.listen(PORT, () => {
  console.log(`Server port ${PORT} me running hai!! balle balle!!`)
})
