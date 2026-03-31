import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

import logoFD from './assets/LogoBB.png';
import api from "./services/api";

function App() {
  const [count, setCount] = useState(0)
  const [restaurants, setRestaurants] = useState([])

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await api.get('/restaurants')
        const transformedData = response.data.map((restaurant) => ({
          id: restaurant.id,
          name: restaurant.emertimi,
          image: restaurant.logo || 'https://via.placeholder.com/150?text=No+Image',
        }))
        setRestaurants(transformedData)
      } catch (error) {
        console.error('Error fetching restaurants:', error)
        // Fallback to hardcoded data if backend not available
        setRestaurants([
          { id: 1, name: 'Burger King', image: 'https://via.placeholder.com/150?text=BK' },
          { id: 2, name: 'KFC', image: 'https://via.placeholder.com/150?text=KFC' },
          { id: 3, name: 'Proper Pizza', image: 'https://via.placeholder.com/150?text=PP' },
          { id: 4, name: 'Sushi Co', image: 'https://via.placeholder.com/150?text=SC' },
          { id: 5, name: 'Agusholli', image: 'https://via.placeholder.com/150?text=AG' },
          { id: 6, name: 'Maqa', image: 'https://via.placeholder.com/150?text=MA' },
        ])
      }
    }
    fetchRestaurants()
  }, [])

  return (
    <main style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #fffbe6 0%, #f7e7c4 60%, #bfa76a 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      fontFamily: 'Poppins, sans-serif'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem', marginTop: '3.5rem', marginBottom: '2.5rem' }}>
        <img src={logoFD} alt="Blink Bite Logo" width="160" height="160" style={{ borderRadius: '50%', boxShadow: '0 4px 24px #bfa76a55', background: '#fff' }} />
        <h1 style={{ fontWeight: 700, fontSize: '2.8rem', color: '#4e3c1e', letterSpacing: '2px', margin: 0 }}>Blink Bite</h1>
        <p style={{ fontSize: '1.15rem', color: '#7a5c2e', margin: 0, fontWeight: 500, textAlign: 'center', maxWidth: 420 }}>
          Shijoni ushqimin tuaj të preferuar, shpejt dhe lehtë! Porosit tani nga restorantet më të mira në qytet.
        </p>
        <div style={{ marginTop: '1.5rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
          <input
            type="text"
            placeholder="Kërko restorant ose ushqim..."
            style={{
              padding: '14px 22px',
              borderRadius: '30px',
              border: '1.5px solid #bfa76a',
              fontSize: '1.1rem',
              width: 320,
              outline: 'none',
              boxShadow: '0 2px 10px #e0c3a355',
              marginRight: 0,
              background: '#fffbe6',
              color: '#4e3c1e'
            }}
          />
        </div>
        <button style={{
          background: 'linear-gradient(90deg, #bfa76a 0%, #7a5c2e 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: '30px',
          padding: '14px 38px',
          fontSize: '1.1rem',
          fontWeight: 600,
          marginTop: '1.2rem',
          cursor: 'pointer',
          boxShadow: '0 2px 12px #bfa76a55',
          transition: 'background 0.2s'
        }}
        onClick={() => alert('Porosit tani!')}
        >Porosit tani</button>
      </div>

      {/* Kategorite */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '1.5rem',
        marginTop: '1.5rem',
        marginBottom: '2.5rem',
        width: '90%'
      }}>
        {[
          { name: 'Pizza', color: '#bfa76a' },
          { name: 'Burger', color: '#7a5c2e' },
          { name: 'Sallatë', color: '#4e6a3e' },
          { name: 'Sushi', color: '#bfa76a' },
          { name: 'Pasta', color: '#7a5c2e' },
          { name: 'Ëmbëlsira', color: '#4e6a3e' },
        ].map((cat) => (
          <div key={cat.name} style={{
            background: cat.color,
            color: '#fff',
            borderRadius: '18px',
            padding: '18px 32px',
            fontWeight: 600,
            fontSize: '1.1rem',
            boxShadow: '0 2px 10px #bfa76a33',
            minWidth: 110,
            textAlign: 'center',
            letterSpacing: '1px',
            cursor: 'pointer',
            transition: 'transform 0.15s',
          }}
          onClick={() => alert(`Zgjodhe: ${cat.name}`)}
          >{cat.name}</div>
        ))}
      </div>

      {/* Restorantet */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: '2rem',
        width: '90%'
      }}>
        <h2 style={{ fontWeight: 700, fontSize: '2rem', color: '#4e3c1e', marginBottom: '1.5rem' }}>Restorantet Popullore</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          width: '100%',
          maxWidth: '1200px'
        }}>
          {restaurants.map((restaurant) => (
            <div key={restaurant.id} style={{
              background: '#fff',
              borderRadius: '15px',
              padding: '1rem',
              boxShadow: '0 4px 15px #bfa76a33',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              border: '1px solid #f7e7c4'
            }}
            onClick={() => alert(`Zgjodhe: ${restaurant.name}`)}
            >
              <img src={restaurant.image} alt={restaurant.name} style={{
                width: '100%',
                height: '120px',
                objectFit: 'cover',
                borderRadius: '10px',
                marginBottom: '0.5rem'
              }} />
              <h3 style={{ fontSize: '1.2rem', color: '#4e3c1e', margin: 0 }}>{restaurant.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

export default App
