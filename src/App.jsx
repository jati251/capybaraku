import { useState, useEffect } from 'react'
import Game from './Game'
import './index.css'

function App() {
  const [name, setName] = useState('')
  const [inputName, setInputName] = useState('')
  const [page, setPage] = useState('home')
  const [error, setError] = useState(false)

  useEffect(() => {
    const savedName = localStorage.getItem('nama')
    if (savedName) {
      setName(savedName)
    }

    const startMusic = () => {
      const music = document.getElementById('bg-music')
      if (music) music.play().catch(() => {})
    }

    window.addEventListener('click', startMusic, { once: true })
    window.addEventListener('keydown', startMusic, { once: true })

    return () => {
      window.removeEventListener('click', startMusic)
      window.removeEventListener('keydown', startMusic)
    }
  }, [])

  const handleStart = (e) => {
    e.preventDefault()
    if (!inputName.trim()) {
      setError(true)
      return
    }
    localStorage.setItem('nama', inputName)
    setName(inputName)
    setPage('greeting')
    setError(false)
  }

  return (
    <div className="flex items-center justify-center min-h-svh w-full p-2 md:p-4">
      {page === 'home' ? (
        <div className="glass-card max-w-lg w-full text-center animate-float">
          <h2 className="text-light text-xl md:text-2xl font-light mb-2">Ayo bermain bersama</h2>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4 bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
            Masbro.
          </h1>
          <p className="text-light/80 mb-8">Si capybara yang selalu ceria!</p>
          
          <form onSubmit={handleStart} className="space-y-6">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Masukan nama kamu disini" 
                className="w-full bg-white/10 border border-white/20 rounded-xl px-6 py-4 text-lg outline-none focus:ring-2 focus:ring-secondary focus:bg-white/20 transition-all placeholder:text-white/40"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
              />
              {error && <p className="text-red-400 text-sm mt-2 text-left px-2">Nama harus diisi!</p>}
            </div>
            <button type="submit" className="btn-beast">
              Mulai bermain
            </button>
          </form>
        </div>
      ) : page === 'greeting' ? (
        <div className="glass-card max-w-lg w-full text-center animate-float">
          <div className="rounded-2xl overflow-hidden shadow-2xl mb-8 border border-white/10">
            <img src="/cap.gif" alt="Capybara" className="w-full" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Haloo {name}!</h1>
          <h2 className="text-light text-xl mb-8">Sudah siap main belum??</h2>
          
          <div className="space-y-4">
            <button className="btn-beast" onClick={() => setPage('game')}>
              SUDAH SIAP!
            </button>
            <button className="btn-ghost" onClick={() => setPage('home')}>
              Kembali
            </button>
          </div>
        </div>
      ) : (
        <Game onBack={() => setPage('home')} />
      )}

      <audio id="bg-music" autoPlay loop src="/audio.mp3" style={{ display: 'none' }} />
    </div>
  )
}

export default App
