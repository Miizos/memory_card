import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const Card = ({ value, isFlipped, isMatched, onClick }) => (
  <div 
  className={`card ${isFlipped || isMatched ? 'flipped' : ''}`}
  onClick={!isMatched ? onClick : null}
>

    <div className="card-front">{value}</div>
    <div className="card-back"></div>
  </div>
);

const GameBoard = ({ cards, onCardClick, gameMode }) => {
  const getColumns = () => {
    switch(gameMode) {
      case 4: return 2;
      case 16: return 4;
      case 32: return 8;
      default: return 4;
    }
  };

  return (
    <div 
      className="game-board"
      style={{
        gridTemplateColumns: `repeat(${getColumns()}, 100px)`,
        maxWidth: `${getColumns() * 100 + (getColumns() - 1) * 10}px`
      }}
      
    >
      {cards.map((card) => (
        <Card
          key={card.id}
          value={card.value}
          isFlipped={card.isFlipped}
          isMatched={card.isMatched}
          onClick={() => onCardClick(card.id)}
        />
      ))}
    </div>
  );
};

const SettingsModal = ({ isOpen, onClose, gameMode, setGameMode, setBackground }) => (
  <div className={`modal ${isOpen ? 'open' : ''}`}>
    <div className="modal-content">
      <h3>Paramètres</h3>
      <label>
        Mode de jeu :
        <select value={gameMode} onChange={(e) => setGameMode(parseInt(e.target.value))}>
          <option value={4}>4 cartes</option>
          <option value={16}>16 cartes</option>
          <option value={32}>32 cartes</option>
        </select>
      </label>
      <label>
        Couleur de fond :
        <input type="color" onChange={(e) => setBackground(e.target.value)} />
      </label>
      <button onClick={onClose}>Fermer</button>
    </div>
  </div>
);

const HistoryModal = ({ isOpen, onClose, history }) => (
  <div className={`modal ${isOpen ? 'open' : ''}`}>
    <div className="modal-content">
      <h3>Historique</h3>
      <ul>
        {history.map((game, index) => (
          <li key={index}>
            {new Date(game.date).toLocaleString()} - {game.time}s - {game.moves} coups - {game.mode} cartes
          </li>
        ))}
      </ul>
      <button onClick={onClose}>Fermer</button>
    </div>
  </div>
);

function App() {
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameMode, setGameMode] = useState(16);
  const [background, setBackground] = useState('#ffffff');
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);

  const generateCards = useCallback(() => {
    const values = Array.from({ length: gameMode / 2 }, (_, i) => i + 1);
    const duplicated = [...values, ...values];
    return duplicated
      .sort(() => Math.random() - 0.5)
      .map((value, id) => ({ id, value, isFlipped: false, isMatched: false }));
  }, [gameMode]);

  useEffect(() => {
    if (isGameStarted && !isGameOver) {
      const timer = setInterval(() => setTime(t => t + 1), 1000);
      return () => clearInterval(timer);
    }
  }, [isGameStarted, isGameOver]);

  useEffect(() => {
    if (matchedCards.length === gameMode) {
      setIsGameOver(true);
      saveGameToHistory();
    }
  }, [matchedCards, gameMode]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('memoryGameHistory');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    startNewGame();
  }, []);

  const startNewGame = () => {
    setCards(generateCards());
    setFlippedCards([]);
    setMatchedCards([]);
    setMoves(0);
    setTime(0);
    setIsGameStarted(false);
    setIsGameOver(false);
  };

  const saveGameToHistory = () => {
    const newHistory = [
      { date: new Date(), time, moves, mode: gameMode },
      ...history.slice(0, 9)
    ];
    localStorage.setItem('memoryGameHistory', JSON.stringify(newHistory));
    setHistory(newHistory);
  };

  const handleCardClick = (id) => {
    if (!isGameStarted) setIsGameStarted(true);
    if (flippedCards.length < 2 && !flippedCards.includes(id)) {
      const newFlippedCards = [...flippedCards, id];
      setFlippedCards(newFlippedCards);

      if (newFlippedCards.length === 2) {
        setMoves(m => m + 1);
        const [firstId, secondId] = newFlippedCards;
        const firstCard = cards.find(c => c.id === firstId);
        const secondCard = cards.find(c => c.id === secondId);

        if (firstCard.value === secondCard.value) {
          setMatchedCards([...matchedCards, firstId, secondId]);
          setFlippedCards([]);
        } else {
          setTimeout(() => setFlippedCards([]), 1000);
        }
      }
    }
  };

  const updatedCards = cards.map(card => ({
    ...card,
    isFlipped: flippedCards.includes(card.id),
    isMatched: matchedCards.includes(card.id)
  }));

  return (
    <div className="app" style={{ backgroundColor: background }}>
      <div className="menu">
        <button onClick={() => setShowSettings(true)}>Paramètres</button>
        <button onClick={() => setShowHistory(true)}>Historique</button>
      </div>

      <div className="game-info">
        <div>Temps : {time}s</div>
        <div>Coups : {moves}</div>
        <button onClick={startNewGame}>Nouvelle partie</button>
      </div>

      <GameBoard cards={updatedCards} onCardClick={handleCardClick} />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        gameMode={gameMode}
        setGameMode={setGameMode}
        setBackground={setBackground}
      />

      <HistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={history}
      />

      {isGameOver && (
        <div className="game-over">
          <h2>Félicitations !</h2>
          <p>Temps : {time}s</p>
          <p>Coups : {moves}</p>
        </div>
      )}
    </div>
  );
}

export default App;