import { useState, useEffect, useRef } from 'react'

const Game = ({ onBack }) => {
  const canvasRef = useRef(null)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [highScore, setHighScore] = useState(parseInt(localStorage.getItem('capyScore')) || 0)
  const scoreRef = useRef(0)
  
  const audioCtxRef = useRef(null)
  const [dims, setDims] = useState({ w: 800, h: 400 })

  const gameState = useRef({
    player: {
      x: 80,
      y: 0,
      width: 70,
      height: 70,
      dy: 0,
      jumpForce: 15,
      gravity: 0.45,
      isGrounded: false,
    },
    obstacles: [],
    clouds: [],
    frame: 0,
    speed: 3,
    gameActive: true,
    isReady: false,
    level: 1
  })

  const playSound = (freq, type, duration, vol = 0.05) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    const ctx = audioCtxRef.current
    if (ctx.state === 'suspended') ctx.resume()
    
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    gain.gain.setValueAtTime(vol, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  }

  useEffect(() => {
    const isMobile = window.innerWidth < 768
    const newDims = isMobile ? { w: 500, h: 600 } : { w: 800, h: 400 }
    setDims(newDims)
    
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationId

    const capyImg = new Image()
    capyImg.src = '/cap.gif'

    const handleJump = (e) => {
      if (e) e.preventDefault()
      if (!gameState.current.gameActive) return

      if (!gameState.current.isReady) {
        setIsReady(true)
        gameState.current.isReady = true
        return
      }

      const { player } = gameState.current
      if (player.isGrounded) {
        player.dy = -player.jumpForce
        player.isGrounded = false
        playSound(400, 'square', 0.1)
      }
    }

    const onKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        handleJump(e)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    canvas.addEventListener('mousedown', handleJump)
    canvas.addEventListener('touchstart', handleJump, { passive: false })

    const update = () => {
      if (!gameState.current.gameActive || !gameState.current.isReady) return

      const { player, obstacles, clouds, speed } = gameState.current

      // Gravity
      player.dy += player.gravity
      player.y += player.dy

      const groundY = newDims.h - player.height - 20
      if (player.y > groundY) {
        player.y = groundY
        player.dy = 0
        player.isGrounded = true
      }

      // Leveling Logic
      const currentScore = scoreRef.current
      let newLevel = 1
      if (currentScore >= 60) newLevel = 4
      else if (currentScore >= 30) newLevel = 3
      else if (currentScore >= 10) newLevel = 2
      
      if (newLevel !== gameState.current.level) {
        gameState.current.level = newLevel
        setLevel(newLevel)
        playSound(600, 'sine', 0.3, 0.1)
      }

      // Spawn Decorations
      if (gameState.current.frame % 120 === 0) {
        clouds.push({
          x: newDims.w,
          y: Math.random() * (newDims.h * 0.4) + 20,
          speed: Math.random() * 0.4 + 0.3,
          width: 50 + Math.random() * 50
        })
      }
      clouds.forEach((c, i) => {
        c.x -= c.speed
        if (c.x + c.width < 0) clouds.splice(i, 1)
      })

      // Spawn Obstacles
      const spawnInterval = Math.max(50, 140 - Math.floor(speed * 10) - (newLevel * 5))
      if (gameState.current.frame % spawnInterval === 0) {
        const canBird = newLevel >= 2
        const type = canBird && Math.random() > (newLevel === 2 ? 0.8 : 0.6) ? 'bird' : 'rock'
        obstacles.push({
          x: newDims.w,
          y: type === 'bird' ? newDims.h - (120 + Math.random() * 80) : newDims.h - 60,
          width: type === 'bird' ? 45 : 45,
          height: type === 'bird' ? 30 : 45,
          type: type,
          speedMod: type === 'bird' ? 1.2 : 1
        })
      }

      // Move & Collide
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i]
        obs.x -= speed * obs.speedMod

        const padding = 22
        if (
          player.x + padding < obs.x + obs.width &&
          player.x + player.width - padding > obs.x &&
          player.y + padding < obs.y + obs.height &&
          player.y + player.height - padding > obs.y
        ) {
          gameState.current.gameActive = false
          setGameOver(true)
          playSound(150, 'sawtooth', 0.5, 0.15) // Louder hit sound
          return
        }

        if (obs.x + obs.width < 0) {
          obstacles.splice(i, 1)
          scoreRef.current += 1
          setScore(scoreRef.current)
          gameState.current.speed += (newLevel >= 3 ? 0.04 : 0.02)
        }
      }

      gameState.current.frame++
    }

    const draw = () => {
      ctx.clearRect(0, 0, newDims.w, newDims.h)

      if (gameState.current.level === 4) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.05)'
        ctx.fillRect(0, 0, newDims.w, newDims.h)
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
      gameState.current.clouds.forEach(c => {
        ctx.beginPath()
        ctx.ellipse(c.x, c.y, c.width/2, 12, 0, 0, Math.PI * 2)
        ctx.fill()
      })

      ctx.strokeStyle = gameState.current.level === 4 ? '#ff4d4d' : 'rgba(255, 183, 3, 0.4)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(0, newDims.h - 20)
      ctx.lineTo(newDims.w, newDims.h - 20)
      ctx.stroke()

      const { player } = gameState.current
      ctx.save()
      ctx.translate(player.x + player.width, player.y)
      ctx.scale(-1, 1)
      ctx.drawImage(capyImg, 0, 0, player.width, player.height)
      ctx.restore()

      gameState.current.obstacles.forEach(obs => {
        if (obs.type === 'bird') {
          ctx.strokeStyle = '#ff4d4d'
          ctx.lineWidth = 3
          ctx.beginPath()
          const wingY = Math.sin(gameState.current.frame * 0.2) * 10
          ctx.moveTo(obs.x, obs.y + 15 + wingY)
          ctx.lineTo(obs.x + 20, obs.y + 5)
          ctx.lineTo(obs.x + 40, obs.y + 15 + wingY)
          ctx.stroke()
        } else {
          ctx.fillStyle = gameState.current.level === 4 ? '#ff4d4d' : '#fb8500'
          ctx.beginPath()
          ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 10)
          ctx.fill()
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
          ctx.fillRect(obs.x + 12, obs.y + 8, 4, 10)
        }
      })
    }

    const loop = () => {
      update()
      draw()
      animationId = requestAnimationFrame(loop)
    }

    loop()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score)
      localStorage.setItem('capyScore', score)
    }
  }, [gameOver, score])

  const handleMobileJump = (e) => {
    e.preventDefault()
    if (!gameState.current.gameActive) return
    
    if (!gameState.current.isReady) {
      setIsReady(true)
      gameState.current.isReady = true
      return
    }

    const { player } = gameState.current
    if (player.isGrounded) {
      player.dy = -player.jumpForce
      player.isGrounded = false
      playSound(400, 'square', 0.1)
    }
  }

  return (
    <div className="w-full flex flex-col items-center gap-4 max-w-4xl mx-auto">
      <div className="glass-card w-full relative overflow-hidden flex flex-col items-center">
        {/* Header Stats */}
        <div className="grid grid-cols-3 gap-2 md:gap-8 w-full mb-4">
          <div className="bg-black/40 px-2 py-2 md:px-6 rounded-xl md:rounded-2xl border border-white/10 text-center">
            <p className="text-[8px] md:text-[10px] text-light uppercase tracking-widest font-bold">Level</p>
            <p className="text-lg md:text-2xl font-black text-secondary">{level}</p>
          </div>
          <div className="bg-black/40 px-2 py-2 md:px-6 rounded-xl md:rounded-2xl border border-white/10 text-center">
            <p className="text-[8px] md:text-[10px] text-light uppercase tracking-widest font-bold">Score</p>
            <p className="text-lg md:text-2xl font-black text-white">{score}</p>
          </div>
          <div className="bg-black/40 px-2 py-2 md:px-6 rounded-xl md:rounded-2xl border border-white/10 text-center">
            <p className="text-[8px] md:text-[10px] text-light uppercase tracking-widest font-bold">High</p>
            <p className="text-lg md:text-2xl font-black text-primary">{highScore}</p>
          </div>
        </div>

        {/* Canvas Area */}
        <div 
          className="relative w-full bg-gradient-to-b from-dark/80 to-accent/20 rounded-2xl border border-white/10 overflow-hidden shadow-inner transition-all duration-500"
          style={{ aspectRatio: `${dims.w} / ${dims.h}` }}
        >
          <canvas ref={canvasRef} width={dims.w} height={dims.h} className="w-full h-full block" />
          
          {gameOver && (
            <div className="absolute inset-0 bg-dark/95 backdrop-blur-md flex flex-col items-center justify-center p-4 z-50 text-center animate-in fade-in zoom-in duration-300">
              <h1 className="text-3xl md:text-6xl font-black text-white mb-2 drop-shadow-lg tracking-tighter">MASBRO NABRAK!</h1>
              <p className="text-light tracking-[0.3em] text-xs md:text-base font-bold mb-6 md:mb-8">SKOR: {score}</p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full max-w-[200px] sm:max-w-md">
                <button className="btn-beast py-3 md:py-4 flex-1 text-sm md:text-base" onClick={() => window.location.reload()}>MAIN LAGI</button>
                <button className="btn-ghost py-3 md:py-4 flex-1 text-sm md:text-base" onClick={onBack}>KEMBALI</button>
              </div>
            </div>
          )}

          {!gameOver && !isReady && (
            <div className="absolute inset-0 bg-dark/70 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-40 text-center">
              <h1 className="text-5xl md:text-8xl font-black text-secondary animate-pulse mb-2 md:mb-4 tracking-tighter leading-none">SIAP?</h1>
              <p className="text-white/60 mb-6 md:mb-8 font-medium text-xs md:text-sm">Lompat dengan Space atau Klik</p>
              <button className="btn-beast max-w-[200px] md:max-w-xs py-3 md:py-4 text-sm md:text-base" onClick={() => {
                setIsReady(true)
                gameState.current.isReady = true
              }}>MULAI SEKARANG!</button>
            </div>
          )}
        </div>

        {/* Mobile Jump Button */}
        {!gameOver && isReady && (
          <div className="mt-4 sm:hidden w-full">
            <button 
              className="w-full h-24 bg-gradient-to-b from-secondary/40 to-primary/40 border-2 border-secondary rounded-2xl text-white font-black text-xl active:scale-95 transition-all shadow-lg active:shadow-inner"
              onTouchStart={handleMobileJump}
            >
              LOMPAT!
            </button>
          </div>
        )}
      </div>

      <div className="text-white/30 text-[10px] font-bold tracking-widest uppercase pb-8">
        Designed for Masbro lovers • 2026
      </div>
    </div>
  )
}

export default Game
